#!/usr/bin/env bash
set -euo pipefail

ROOT=/workspace
SRC=$ROOT/packages/pdfium/pdfium-src
OUT=$SRC/out/wasm
PDFIUM=$ROOT/packages/pdfium
LOG=$PDFIUM/build.log

mkdir -p $OUT

export ROOT SRC OUT PDFIUM
export PATH="$HOME/.cargo/bin:$PATH"

step() { echo "[$(date '+%H:%M:%S')] >>> $*" | tee -a "$LOG"; }
log()  { echo "[$(date '+%H:%M:%S')]     $*" | tee -a "$LOG"; }

: > "$LOG"   # reset log each run
step "Build started"

###############################################################################
# step 0 - make sure tool-chain & GN args exist (same logic as dev.sh)
###############################################################################
if [[ ! -d "$SRC/third_party/llvm-build" ]]; then
  step "gclient sync (first time - may take 10-30 min)..."
  cat > "$ROOT/.gclient" <<'EOF'
solutions = [
  { "name": "packages/pdfium/pdfium-src",
    "url":  "https://pdfium.googlesource.com/pdfium.git",
    "deps_file": "DEPS",
    "managed": False,
    "custom_deps": {},
  },
]
EOF
  ( cd "$SRC" && gclient sync --no-history --shallow --nohooks --deps=builder ) 2>&1 | tee -a "$LOG"
  rm "$ROOT/.gclient"
  log "gclient sync done"
else
  log "Skipping gclient sync (toolchain already present)"
fi

###############################################################################
# 0.5 Apply our local build-system patches (always, before gn gen)
###############################################################################
step "Patching PDFium build files..."
cp -f "$PDFIUM/build/patch/build/config/BUILDCONFIG.gn" \
      "$SRC/build/config/BUILDCONFIG.gn"

cp -f "$PDFIUM/build/patch/build/toolchain/wasm/BUILD.gn" \
      "$SRC/build/toolchain/wasm/BUILD.gn"

cp -f "$PDFIUM/build/patch/fpdfsdk/fpdf_annot.cpp" \
      "$SRC/fpdfsdk/fpdf_annot.cpp"

cp -f "$PDFIUM/build/patch/public/fpdf_annot.h" \
      "$SRC/public/fpdf_annot.h"

cp -f "$PDFIUM/build/patch/constants/annotation_common.h" \
      "$SRC/constants/annotation_common.h"

cp -f "$PDFIUM/build/patch/third_party/libpng/visibility.gni" \
      "$SRC/third_party/libpng/visibility.gni"

if [[ ! -f "$OUT/build.ninja" ]]; then
  step "gn gen (configuring wasm build)..."
  ( cd "$SRC" && gn gen out/wasm \
      --args='is_debug=false treat_warnings_as_errors=false pdf_use_skia=false pdf_enable_xfa=false pdf_enable_v8=false is_component_build=false clang_use_chrome_plugins=false pdf_is_standalone=true use_debug_fission=false use_custom_libcxx=false use_sysroot=false pdf_is_complete_lib=true pdf_use_partition_alloc=false is_clang=false symbol_level=0 target_os="wasm" target_cpu="wasm"' ) 2>&1 | tee -a "$LOG"
  log "gn gen done"
else
  log "Skipping gn gen (build.ninja already exists)"
fi

###############################################################################
# helper - same exporter as in dev.sh
###############################################################################
gen_exports() {
  local WS=$ROOT/packages/pdfium/build/wasm
  rm -rf "$WS" && mkdir -p "$WS"

  ( cd "$SRC" &&
    find public -path public/cpp -prune -o -name '*.h' -print |
    sort | sed 's|^|#include "|;s|$|"|' ) > "$WS/all.h"

  echo '#include "../build/code/cpp/ext_api.h"' >> "$WS/all.h"

  clang -std=c11 -I"$SRC" -I"$ROOT/build/code/cpp" \
        -fsyntax-only -Xclang -ast-dump=json "$WS/all.h" > "$WS/ast.json"

  node "$PDFIUM/build/generate-functions.mjs"       "$WS/ast.json" "$WS"
  node "$PDFIUM/build/generate-runtime-methods.mjs" "$WS"
}

cd "$SRC"
###############################################################################
# real build (no watcher)
###############################################################################
step "ninja compile (jobs=${NINJA_JOBS:-4}) - this is the long step..."
ninja -j${NINJA_JOBS:-4} -C "$OUT" pdfium 2>&1 | tee -a "$LOG"
log "ninja done"

step "Generating exports..."
gen_exports
log "gen_exports done"

cd "$PDFIUM/build"
step "Compiling ESM bundle..."
bash ./compile.esm.sh 2>&1 | tee -a "$LOG"
step "Compiling CJS bundle..."
bash ./compile.sh 2>&1 | tee -a "$LOG"

cp -f ./wasm/{runtime-methods.ts,functions.ts,pdfium.wasm,pdfium.js,pdfium.cjs} "$PDFIUM/src/vendor/"

step "Done - pdfium.wasm (ESM + CJS) ready"
log "Full log saved to $LOG"

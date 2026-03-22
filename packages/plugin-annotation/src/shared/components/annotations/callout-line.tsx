import { useMemo, MouseEvent } from '@framework';
import { Rect, Position, PdfAnnotationLineEnding, PdfRectDifferences } from '@embedpdf/models';
import { patching } from '@embedpdf/plugin-annotation';

const MIN_HIT_AREA_SCREEN_PX = 20;

interface CalloutLineProps {
  rect: Rect;
  calloutLine: Position[];
  strokeColor?: string;
  strokeWidth: number;
  lineEnding?: PdfAnnotationLineEnding;
  scale: number;
  isSelected: boolean;
  onClick?: (e: MouseEvent<SVGElement>) => void;
  appearanceActive?: boolean;
  rectangleDifferences?: PdfRectDifferences;
  fillColor?: string;
}

export function CalloutLine({
  rect,
  calloutLine,
  strokeColor = '#000000',
  strokeWidth,
  lineEnding,
  scale,
  isSelected,
  onClick,
  appearanceActive = false,
  rectangleDifferences,
  fillColor = '#FFFFFF',
}: CalloutLineProps): JSX.Element | null {
  if (calloutLine.length < 2) return null;

  const localPts = useMemo(
    () =>
      calloutLine.map(({ x, y }) => ({
        x: x - rect.origin.x,
        y: y - rect.origin.y,
      })),
    [calloutLine, rect],
  );

  const pathData = useMemo(() => {
    const [first, ...rest] = localPts;
    return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
  }, [localPts]);

  const arrowEnding = useMemo(() => {
    if (lineEnding == null || lineEnding === (PdfAnnotationLineEnding.None as number)) return null;
    const [tip, next] = localPts;
    const angle = Math.atan2(next.y - tip.y, next.x - tip.x);
    return patching.createEnding(lineEnding, strokeWidth, angle + Math.PI, tip.x, tip.y);
  }, [localPts, lineEnding, strokeWidth]);

  const width = rect.size.width * scale;
  const height = rect.size.height * scale;
  const hitStrokeWidth = Math.max(strokeWidth, MIN_HIT_AREA_SCREEN_PX / scale);

  return (
    <svg
      style={{
        position: 'absolute',
        width,
        height,
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'visible',
      }}
      width={width}
      height={height}
      viewBox={`0 0 ${rect.size.width} ${rect.size.height}`}
    >
      {/* Hit area */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        onPointerDown={onClick}
        style={{
          cursor: isSelected ? 'move' : 'pointer',
          pointerEvents: isSelected ? 'none' : 'visibleStroke',
          strokeLinecap: 'butt',
        }}
      />
      {arrowEnding && (
        <path
          d={arrowEnding.d}
          transform={arrowEnding.transform}
          fill="transparent"
          stroke="transparent"
          strokeWidth={hitStrokeWidth}
          onPointerDown={onClick}
          style={{
            cursor: isSelected ? 'move' : 'pointer',
            pointerEvents: isSelected
              ? 'none'
              : arrowEnding.filled
                ? 'visible'
                : 'visibleStroke',
            strokeLinecap: 'butt',
          }}
        />
      )}

      {/* Visual */}
      {!appearanceActive && (
        <>
          {rectangleDifferences && (
            <rect
              x={rectangleDifferences.left}
              y={rectangleDifferences.top}
              width={rect.size.width - rectangleDifferences.left - rectangleDifferences.right}
              height={rect.size.height - rectangleDifferences.top - rectangleDifferences.bottom}
              fill={fillColor}
              stroke="none"
              style={{ pointerEvents: 'none' }}
            />
          )}
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{ pointerEvents: 'none', strokeLinecap: 'butt' }}
          />
          {arrowEnding && (
            <path
              d={arrowEnding.d}
              transform={arrowEnding.transform}
              stroke={strokeColor}
              fill={arrowEnding.filled ? strokeColor : 'none'}
              style={{
                pointerEvents: 'none',
                strokeWidth,
                strokeLinecap: 'butt',
              }}
            />
          )}
        </>
      )}
    </svg>
  );
}

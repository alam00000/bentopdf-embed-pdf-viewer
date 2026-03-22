import { PdfFreeTextAnnoObject } from '@embedpdf/models';

import { PatchFunction } from '../patch-registry';
import {
  baseRotateChanges,
  baseMoveChanges,
  baseResizeScaling,
  basePropertyRotationChanges,
} from '../base-patch';

export const patchCallout: PatchFunction<PdfFreeTextAnnoObject> = (orig, ctx) => {
  switch (ctx.type) {
    case 'move': {
      if (!ctx.changes.rect) return ctx.changes;
      const { dx, dy, rects } = baseMoveChanges(orig, ctx.changes.rect);

      const calloutLine = orig.calloutLine?.map((p) => ({
        x: p.x + dx,
        y: p.y + dy,
      }));

      return {
        ...rects,
        ...(calloutLine && { calloutLine }),
      };
    }

    case 'resize': {
      if (!ctx.changes.rect) return ctx.changes;
      return baseResizeScaling(orig, ctx.changes.rect, ctx.metadata).rects;
    }

    case 'vertex-edit': {
      if (ctx.changes.calloutLine) {
        return { calloutLine: ctx.changes.calloutLine };
      }
      return ctx.changes;
    }

    case 'rotate':
      return baseRotateChanges(orig, ctx) ?? ctx.changes;

    case 'property-update':
      if (ctx.changes.rotation !== undefined) {
        return { ...ctx.changes, ...basePropertyRotationChanges(orig, ctx.changes.rotation) };
      }
      return ctx.changes;

    default:
      return ctx.changes;
  }
};

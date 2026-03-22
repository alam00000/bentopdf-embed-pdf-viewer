import {
  PdfAnnotationLineEnding,
  PdfAnnotationSubtype,
  PdfFreeTextAnnoObject,
  PdfStandardFont,
  PdfTextAlignment,
  PdfVerticalAlignment,
  Position,
  Rect,
  uuidV4,
} from '@embedpdf/models';
import { HandlerFactory, PreviewState } from './types';
import { useState } from '../utils/use-state';
import { clamp } from '@embedpdf/core';

const DEFAULT_TEXT_BOX_HEIGHT = 40;

function computeCalloutLine(
  arrowTip: Position,
  textBoxRect: Rect,
): Position[] {
  const boxLeft = textBoxRect.origin.x;
  const boxRight = textBoxRect.origin.x + textBoxRect.size.width;
  const boxTop = textBoxRect.origin.y;
  const boxBottom = textBoxRect.origin.y + textBoxRect.size.height;

  // Determine which edge of the text box is closest to the arrow tip
  const distLeft = Math.abs(arrowTip.x - boxLeft);
  const distRight = Math.abs(arrowTip.x - boxRight);
  const connectsLeft = distLeft <= distRight;

  // The text box edge point is on the nearest vertical edge,
  // vertically clamped to the text box bounds.
  const edgeX = connectsLeft ? boxLeft : boxRight;
  const edgeY = clamp(arrowTip.y, boxTop, boxBottom);

  // The knee sits at the same Y as the edge point, offset horizontally
  // toward the arrow tip to create the characteristic L-bend.
  const kneePad = Math.min(20, Math.abs(arrowTip.x - edgeX) * 0.3);
  const kneeX = connectsLeft ? edgeX - kneePad : edgeX + kneePad;

  return [
    arrowTip,
    { x: kneeX, y: edgeY },
    { x: edgeX, y: edgeY },
  ];
}

function computeBounds(arrowTip: Position, textBoxRect: Rect, strokeWidth: number): Rect {
  const pad = strokeWidth * 5;
  const minX = Math.min(arrowTip.x, textBoxRect.origin.x) - pad;
  const minY = Math.min(arrowTip.y, textBoxRect.origin.y) - pad;
  const maxX = Math.max(arrowTip.x, textBoxRect.origin.x + textBoxRect.size.width) + pad;
  const maxY = Math.max(arrowTip.y, textBoxRect.origin.y + textBoxRect.size.height) + pad;

  return {
    origin: { x: minX, y: minY },
    size: { width: maxX - minX, height: maxY - minY },
  };
}

export const calloutHandlerFactory: HandlerFactory<PdfFreeTextAnnoObject> = {
  annotationType: PdfAnnotationSubtype.FREETEXT,
  create(context) {
    const { pageIndex, onCommit, onPreview, getTool, pageSize } = context;
    const [getArrowTip, setArrowTip] = useState<Position | null>(null);
    const [getDragging, setDragging] = useState(false);

    const clampToPage = (pos: Position) => ({
      x: clamp(pos.x, 0, pageSize.width),
      y: clamp(pos.y, 0, pageSize.height),
    });

    const getDefaults = () => {
      const tool = getTool();
      if (!tool) return null;
      return {
        ...tool.defaults,
        fontColor: tool.defaults.fontColor ?? '#000000',
        opacity: tool.defaults.opacity ?? 1,
        fontSize: tool.defaults.fontSize ?? 12,
        fontFamily: tool.defaults.fontFamily ?? PdfStandardFont.Helvetica,
        color: tool.defaults.color ?? tool.defaults.backgroundColor ?? '#FFFFFF',
        textAlign: tool.defaults.textAlign ?? PdfTextAlignment.Left,
        verticalAlign: tool.defaults.verticalAlign ?? PdfVerticalAlignment.Top,
        contents: tool.defaults.contents ?? 'Insert text',
        strokeColor: tool.defaults.strokeColor ?? '#E44234',
        strokeWidth: tool.defaults.strokeWidth ?? 1,
        lineEnding: tool.defaults.lineEnding ?? PdfAnnotationLineEnding.OpenArrow,
        flags: tool.defaults.flags ?? ['print'],
      };
    };

    // Text box is placed at the cursor position, NOT spanning from arrow tip.
    // The cursor defines one corner; the box extends in the direction away from arrow tip.
    const buildTextBoxRect = (arrowTip: Position, cursor: Position): Rect => {
      const width = Math.max(Math.abs(cursor.x - arrowTip.x) * 0.6, 100);
      const height = DEFAULT_TEXT_BOX_HEIGHT;

      // Place text box so it sits at the cursor end, away from the arrow tip
      const boxX = arrowTip.x < cursor.x ? cursor.x - width : cursor.x;
      const boxY = cursor.y - height / 2;

      return {
        origin: { x: boxX, y: boxY },
        size: { width, height },
      };
    };

    const getPreview = (
      current: Position,
    ): PreviewState<PdfAnnotationSubtype.FREETEXT> | null => {
      const arrowTip = getArrowTip();
      if (!arrowTip) return null;

      const defaults = getDefaults();
      if (!defaults) return null;

      const dist = Math.sqrt(
        (current.x - arrowTip.x) ** 2 + (current.y - arrowTip.y) ** 2,
      );
      if (dist < 10) return null;

      const textBoxRect = buildTextBoxRect(arrowTip, current);
      const calloutLine = computeCalloutLine(arrowTip, textBoxRect);
      const bounds = computeBounds(arrowTip, textBoxRect, defaults.strokeWidth);

      return {
        type: PdfAnnotationSubtype.FREETEXT,
        bounds,
        data: {
          rect: textBoxRect,
          fontColor: defaults.fontColor,
          opacity: defaults.opacity,
          fontSize: defaults.fontSize,
          fontFamily: defaults.fontFamily,
          backgroundColor: defaults.color,
          textAlign: defaults.textAlign,
          verticalAlign: defaults.verticalAlign,
          contents: defaults.contents,
          calloutLine,
          lineEnding: defaults.lineEnding,
          strokeColor: defaults.strokeColor,
          strokeWidth: defaults.strokeWidth,
        },
      };
    };

    return {
      onPointerDown: (pos, evt) => {
        const clampedPos = clampToPage(pos);
        setArrowTip(clampedPos);
        setDragging(true);
        evt.setPointerCapture?.();
      },
      onPointerMove: (pos) => {
        if (!getDragging()) return;
        const clampedPos = clampToPage(pos);
        onPreview(getPreview(clampedPos));
      },
      onPointerUp: (pos, evt) => {
        const arrowTip = getArrowTip();
        if (!arrowTip || !getDragging()) return;

        const defaults = getDefaults();
        if (!defaults) return;

        const clampedPos = clampToPage(pos);
        const dist = Math.sqrt(
          (clampedPos.x - arrowTip.x) ** 2 + (clampedPos.y - arrowTip.y) ** 2,
        );

        if (dist > 10) {
          const textBoxRect = buildTextBoxRect(arrowTip, clampedPos);
          const calloutLine = computeCalloutLine(arrowTip, textBoxRect);
          const bounds = computeBounds(arrowTip, textBoxRect, defaults.strokeWidth);

          const anno: PdfFreeTextAnnoObject = {
            ...defaults,
            type: PdfAnnotationSubtype.FREETEXT,
            intent: 'FreeTextCallout',
            rect: bounds,
            calloutLine,
            lineEnding: defaults.lineEnding,
            rectangleDifferences: {
              left: textBoxRect.origin.x - bounds.origin.x,
              top: textBoxRect.origin.y - bounds.origin.y,
              right: (bounds.origin.x + bounds.size.width) - (textBoxRect.origin.x + textBoxRect.size.width),
              bottom: (bounds.origin.y + bounds.size.height) - (textBoxRect.origin.y + textBoxRect.size.height),
            },
            pageIndex,
            id: uuidV4(),
            created: new Date(),
          };

          onCommit(anno);
        }

        setArrowTip(null);
        setDragging(false);
        onPreview(null);
        evt.releasePointerCapture?.();
      },
      onPointerLeave: (_, evt) => {
        setArrowTip(null);
        setDragging(false);
        onPreview(null);
        evt.releasePointerCapture?.();
      },
      onPointerCancel: (_, evt) => {
        setArrowTip(null);
        setDragging(false);
        onPreview(null);
        evt.releasePointerCapture?.();
      },
    };
  },
};

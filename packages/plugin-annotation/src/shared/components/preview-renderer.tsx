import { AnyPreviewState } from '@embedpdf/plugin-annotation';
import { Circle } from './annotations/circle';
import { Square } from './annotations/square';
import { Polygon } from './annotations/polygon';
import { blendModeToCss, PdfAnnotationSubtype, PdfBlendMode } from '@embedpdf/models';
import { Polyline } from './annotations/polyline';
import { Line } from './annotations/line';
import { Ink } from './annotations/ink';
import { CalloutLine } from './annotations/callout-line';

interface Props {
  preview: AnyPreviewState;
  scale: number;
}

export function PreviewRenderer({ preview, scale }: Props) {
  const { bounds } = preview;

  const style = {
    position: 'absolute' as const,
    left: bounds.origin.x * scale,
    top: bounds.origin.y * scale,
    width: bounds.size.width * scale,
    height: bounds.size.height * scale,
    pointerEvents: 'none' as const,
    zIndex: 10,
  };

  // Use type guards for proper type narrowing
  if (preview.type === PdfAnnotationSubtype.CIRCLE) {
    return (
      <div style={style}>
        <Circle isSelected={false} scale={scale} {...preview.data} />
      </div>
    );
  }

  if (preview.type === PdfAnnotationSubtype.SQUARE) {
    return (
      <div style={style}>
        <Square isSelected={false} scale={scale} {...preview.data} />
      </div>
    );
  }

  if (preview.type === PdfAnnotationSubtype.POLYGON) {
    return (
      <div style={style}>
        <Polygon isSelected={false} scale={scale} {...preview.data} />
      </div>
    );
  }

  if (preview.type === PdfAnnotationSubtype.POLYLINE) {
    return (
      <div style={style}>
        <Polyline isSelected={false} scale={scale} {...preview.data} />
      </div>
    );
  }

  if (preview.type === PdfAnnotationSubtype.LINE) {
    return (
      <div style={style}>
        <Line isSelected={false} scale={scale} {...preview.data} />
      </div>
    );
  }

  if (preview.type === PdfAnnotationSubtype.INK) {
    return (
      <div
        style={{
          ...style,
          mixBlendMode: blendModeToCss(preview.data.blendMode ?? PdfBlendMode.Normal),
        }}
      >
        <Ink isSelected={false} scale={scale} {...preview.data} />
      </div>
    );
  }

  if (preview.type === PdfAnnotationSubtype.FREETEXT) {
    const data = preview.data;
    if (data.calloutLine && data.calloutLine.length >= 2) {
      return (
        <div style={style}>
          <CalloutLine
            rect={bounds}
            calloutLine={data.calloutLine}
            strokeColor={data.strokeColor ?? data.fontColor ?? '#000000'}
            strokeWidth={data.strokeWidth ?? 1}
            lineEnding={data.lineEnding}
            scale={scale}
            isSelected={false}
          />
          {data.rect && (
            <div
              style={{
                position: 'absolute',
                left: (data.rect.origin.x - bounds.origin.x) * scale,
                top: (data.rect.origin.y - bounds.origin.y) * scale,
                width: data.rect.size.width * scale,
                height: data.rect.size.height * scale,
                border: `1px solid ${data.strokeColor ?? data.fontColor ?? '#000000'}`,
                backgroundColor: data.backgroundColor ?? '#FFFFFF',
                opacity: data.opacity ?? 1,
              }}
            />
          )}
        </div>
      );
    }
    return (
      <div style={style}>
        <div
          style={{
            width: '100%',
            height: '100%',
            border: `1px dashed ${data.fontColor || '#000000'}`,
            backgroundColor: 'transparent',
          }}
        />
      </div>
    );
  }

  return null;
}

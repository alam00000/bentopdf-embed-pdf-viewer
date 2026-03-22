import {
  PdfAnnotationSubtype,
  PdfAnnotationObject,
  PdfInkAnnoObject,
  PdfSquareAnnoObject,
  PdfCircleAnnoObject,
  PdfLineAnnoObject,
  PdfPolylineAnnoObject,
  PdfPolygonAnnoObject,
  PdfTextAnnoObject,
  PdfFreeTextAnnoObject,
  PdfStampAnnoObject,
  PdfLinkAnnoObject,
  PdfHighlightAnnoObject,
  PdfUnderlineAnnoObject,
  PdfStrikeOutAnnoObject,
  PdfSquigglyAnnoObject,
  PdfCaretAnnoObject,
  PdfBlendMode,
} from '@embedpdf/models';
import { Fragment } from '@framework';
import { BoxedAnnotationRenderer, createRenderer } from './types';
import { Ink } from './annotations/ink';
import { Square } from './annotations/square';
import { Circle } from './annotations/circle';
import { Line } from './annotations/line';
import { Polyline } from './annotations/polyline';
import { Polygon } from './annotations/polygon';
import { Text } from './annotations/text';
import { FreeText } from './annotations/free-text';
import { CalloutLine } from './annotations/callout-line';
import { Stamp } from './annotations/stamp';
import { Link } from './annotations/link';
import { Highlight } from './text-markup/highlight';
import { Underline } from './text-markup/underline';
import { Strikeout } from './text-markup/strikeout';
import { Squiggly } from './text-markup/squiggly';
import { Caret } from './annotations/caret';

export const builtInRenderers: BoxedAnnotationRenderer[] = [
  // --- Drawing ---

  createRenderer<PdfInkAnnoObject>({
    id: 'ink',
    matches: (a): a is PdfInkAnnoObject => a.type === PdfAnnotationSubtype.INK,
    render: ({ currentObject, isSelected, scale, onClick, appearanceActive }) => (
      <Ink
        {...currentObject}
        isSelected={isSelected}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    interactionDefaults: { isDraggable: true, isResizable: true, isRotatable: true },
  }),

  // --- Shapes ---

  createRenderer<PdfSquareAnnoObject>({
    id: 'square',
    matches: (a): a is PdfSquareAnnoObject => a.type === PdfAnnotationSubtype.SQUARE,
    render: ({ currentObject, isSelected, scale, onClick, appearanceActive }) => (
      <Square
        {...currentObject}
        isSelected={isSelected}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    interactionDefaults: { isDraggable: true, isResizable: true, isRotatable: true },
  }),

  createRenderer<PdfCircleAnnoObject>({
    id: 'circle',
    matches: (a): a is PdfCircleAnnoObject => a.type === PdfAnnotationSubtype.CIRCLE,
    render: ({ currentObject, isSelected, scale, onClick, appearanceActive }) => (
      <Circle
        {...currentObject}
        isSelected={isSelected}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    interactionDefaults: { isDraggable: true, isResizable: true, isRotatable: true },
  }),

  // --- Lines & Vertex-based ---

  createRenderer<PdfLineAnnoObject>({
    id: 'line',
    matches: (a): a is PdfLineAnnoObject => a.type === PdfAnnotationSubtype.LINE,
    render: ({ currentObject, isSelected, scale, onClick, appearanceActive }) => (
      <Fragment>
        <Line
          {...currentObject}
          isSelected={isSelected}
          scale={scale}
          onClick={onClick}
          appearanceActive={appearanceActive}
        />
      </Fragment>
    ),
    vertexConfig: {
      extractVertices: (a) => [a.linePoints.start, a.linePoints.end],
      transformAnnotation: (a, v) => ({
        ...a,
        linePoints: { start: v[0], end: v[1] },
      }),
    },
    interactionDefaults: { isDraggable: true, isResizable: false, isRotatable: true },
  }),

  createRenderer<PdfPolylineAnnoObject>({
    id: 'polyline',
    matches: (a): a is PdfPolylineAnnoObject => a.type === PdfAnnotationSubtype.POLYLINE,
    render: ({ currentObject, isSelected, scale, onClick, appearanceActive }) => (
      <Fragment>
        <Polyline
          {...currentObject}
          isSelected={isSelected}
          scale={scale}
          onClick={onClick}
          appearanceActive={appearanceActive}
        />
      </Fragment>
    ),
    vertexConfig: {
      extractVertices: (a) => a.vertices,
      transformAnnotation: (a, vertices) => ({ ...a, vertices }),
    },
    interactionDefaults: { isDraggable: true, isResizable: false, isRotatable: true },
  }),

  createRenderer<PdfPolygonAnnoObject>({
    id: 'polygon',
    matches: (a): a is PdfPolygonAnnoObject => a.type === PdfAnnotationSubtype.POLYGON,
    render: ({ currentObject, isSelected, scale, onClick, appearanceActive }) => (
      <Fragment>
        <Polygon
          {...currentObject}
          isSelected={isSelected}
          scale={scale}
          onClick={onClick}
          appearanceActive={appearanceActive}
        />
      </Fragment>
    ),
    vertexConfig: {
      extractVertices: (a) => a.vertices,
      transformAnnotation: (a, vertices) => ({ ...a, vertices }),
    },
    interactionDefaults: { isDraggable: true, isResizable: false, isRotatable: true },
  }),

  // --- Text Markup ---

  createRenderer<PdfHighlightAnnoObject>({
    id: 'highlight',
    matches: (a): a is PdfHighlightAnnoObject => a.type === PdfAnnotationSubtype.HIGHLIGHT,
    render: ({ currentObject, scale, onClick, appearanceActive }) => (
      <Highlight
        {...currentObject}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    zIndex: 0,
    interactionDefaults: { isDraggable: false, isResizable: false, isRotatable: false },
    defaultBlendMode: PdfBlendMode.Multiply,
  }),

  createRenderer<PdfUnderlineAnnoObject>({
    id: 'underline',
    matches: (a): a is PdfUnderlineAnnoObject => a.type === PdfAnnotationSubtype.UNDERLINE,
    render: ({ currentObject, scale, onClick, appearanceActive }) => (
      <Underline
        {...currentObject}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    zIndex: 0,
    interactionDefaults: { isDraggable: false, isResizable: false, isRotatable: false },
  }),

  createRenderer<PdfStrikeOutAnnoObject>({
    id: 'strikeout',
    matches: (a): a is PdfStrikeOutAnnoObject => a.type === PdfAnnotationSubtype.STRIKEOUT,
    render: ({ currentObject, scale, onClick, appearanceActive }) => (
      <Strikeout
        {...currentObject}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    zIndex: 0,
    interactionDefaults: { isDraggable: false, isResizable: false, isRotatable: false },
  }),

  createRenderer<PdfSquigglyAnnoObject>({
    id: 'squiggly',
    matches: (a): a is PdfSquigglyAnnoObject => a.type === PdfAnnotationSubtype.SQUIGGLY,
    render: ({ currentObject, scale, onClick, appearanceActive }) => (
      <Squiggly
        {...currentObject}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    zIndex: 0,
    interactionDefaults: { isDraggable: false, isResizable: false, isRotatable: false },
  }),

  // --- Text Comment ---

  createRenderer<PdfTextAnnoObject>({
    id: 'text',
    matches: (a): a is PdfTextAnnoObject => a.type === PdfAnnotationSubtype.TEXT && !a.inReplyToId,
    render: ({ currentObject, isSelected, onClick, appearanceActive }) => (
      <Text
        isSelected={isSelected}
        color={currentObject.strokeColor ?? currentObject.color}
        opacity={currentObject.opacity}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    interactionDefaults: { isDraggable: true, isResizable: false, isRotatable: false },
  }),

  // --- Caret ---

  createRenderer<PdfCaretAnnoObject>({
    id: 'caret',
    matches: (a): a is PdfCaretAnnoObject => a.type === PdfAnnotationSubtype.CARET,
    render: ({ currentObject, isSelected, scale, onClick, appearanceActive }) => (
      <Caret
        {...currentObject}
        isSelected={isSelected}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    interactionDefaults: { isDraggable: false, isResizable: false, isRotatable: false },
  }),

  // --- FreeText Callout ---

  createRenderer<PdfFreeTextAnnoObject>({
    id: 'callout',
    matches: (a): a is PdfFreeTextAnnoObject =>
      a.type === PdfAnnotationSubtype.FREETEXT &&
      a.intent === 'FreeTextCallout' &&
      !!a.calloutLine &&
      a.calloutLine.length >= 2,
    render: ({
      annotation,
      currentObject,
      isSelected,
      isEditing,
      scale,
      pageIndex,
      documentId,
      onClick,
      appearanceActive,
    }) => {
      // Compute inner text box from outer rect + rectangleDifferences
      const rd = currentObject.rectangleDifferences;
      const outerRect = currentObject.rect;
      const innerRect = rd
        ? {
            origin: {
              x: outerRect.origin.x + rd.left,
              y: outerRect.origin.y + rd.top,
            },
            size: {
              width: outerRect.size.width - rd.left - rd.right,
              height: outerRect.size.height - rd.top - rd.bottom,
            },
          }
        : outerRect;

      const calloutStrokeColor = currentObject.strokeColor ?? currentObject.fontColor ?? '#000000';
      const calloutStrokeWidth = currentObject.strokeWidth ?? 1;

      return (
        <Fragment>
          <CalloutLine
            rect={outerRect}
            calloutLine={currentObject.calloutLine!}
            strokeColor={calloutStrokeColor}
            strokeWidth={calloutStrokeWidth}
            lineEnding={currentObject.lineEnding}
            scale={scale}
            isSelected={isSelected}
            onClick={onClick}
            appearanceActive={appearanceActive}
          />
          <div
            style={{
              position: 'absolute',
              left: rd ? rd.left * scale : 0,
              top: rd ? rd.top * scale : 0,
              width: innerRect.size.width * scale,
              height: innerRect.size.height * scale,
              zIndex: 2,
              boxSizing: 'border-box',
              border: appearanceActive ? 'none' : `${calloutStrokeWidth * scale}px solid ${calloutStrokeColor}`,
            }}
          >
            <FreeText
              documentId={documentId}
              isSelected={isSelected}
              isEditing={isEditing}
              annotation={{
                ...annotation,
                object: { ...currentObject, rect: innerRect, color: 'transparent', backgroundColor: 'transparent' },
              }}
              pageIndex={pageIndex}
              scale={scale}
              onClick={onClick}
              appearanceActive={appearanceActive}
            />
          </div>
        </Fragment>
      );
    },
    vertexConfig: {
      extractVertices: (a) => {
        const cl = a.calloutLine;
        if (!cl || cl.length < 2) return [];
        // Only expose arrow tip and knee as draggable vertices.
        // The text box edge point (index 2) is auto-computed.
        return cl.length >= 3 ? [cl[0], cl[1]] : [cl[0]];
      },
      transformAnnotation: (a, vertices) => {
        const cl = a.calloutLine;
        if (!cl || cl.length < 2) return { ...a, calloutLine: vertices };
        // Preserve the text box edge point, only update arrow tip + knee
        const textBoxEdge = cl[cl.length - 1];
        return {
          ...a,
          calloutLine:
            vertices.length >= 2
              ? [vertices[0], vertices[1], textBoxEdge]
              : [vertices[0], textBoxEdge],
        };
      },
    },
    interactionDefaults: { isDraggable: true, isResizable: false, isRotatable: false },
    isDraggable: (toolDraggable, { isEditing }) => toolDraggable && !isEditing,
    onDoubleClick: (id, setEditingId) => setEditingId(id),
  }),

  // --- FreeText ---

  createRenderer<PdfFreeTextAnnoObject>({
    id: 'freeText',
    matches: (a): a is PdfFreeTextAnnoObject => a.type === PdfAnnotationSubtype.FREETEXT,
    render: ({
      annotation,
      currentObject,
      isSelected,
      isEditing,
      scale,
      pageIndex,
      documentId,
      onClick,
      appearanceActive,
    }) => (
      <FreeText
        documentId={documentId}
        isSelected={isSelected}
        isEditing={isEditing}
        annotation={{ ...annotation, object: currentObject }}
        pageIndex={pageIndex}
        scale={scale}
        onClick={onClick}
        appearanceActive={appearanceActive}
      />
    ),
    interactionDefaults: { isDraggable: true, isResizable: true, isRotatable: true },
    isDraggable: (toolDraggable, { isEditing }) => toolDraggable && !isEditing,
    onDoubleClick: (id, setEditingId) => setEditingId(id),
  }),

  // --- Stamp ---

  createRenderer<PdfStampAnnoObject>({
    id: 'stamp',
    matches: (a): a is PdfStampAnnoObject => a.type === PdfAnnotationSubtype.STAMP,
    render: ({ annotation, isSelected, documentId, pageIndex, scale, onClick }) => (
      <Stamp
        isSelected={isSelected}
        annotation={annotation}
        documentId={documentId}
        pageIndex={pageIndex}
        scale={scale}
        onClick={onClick}
      />
    ),
    useAppearanceStream: false,
    interactionDefaults: { isDraggable: true, isResizable: true, isRotatable: true },
  }),

  // --- Link ---

  createRenderer<PdfLinkAnnoObject>({
    id: 'link',
    matches: (a): a is PdfLinkAnnoObject => a.type === PdfAnnotationSubtype.LINK,
    render: ({ currentObject, isSelected, scale, onClick }) => (
      <Link
        {...currentObject}
        isSelected={isSelected}
        scale={scale}
        onClick={onClick}
        hasIRT={!!currentObject.inReplyToId}
      />
    ),
    interactionDefaults: {
      isDraggable: false,
      isResizable: false,
      isRotatable: false,
    },
    useAppearanceStream: false,
    selectOverride: (e, annotation, helpers) => {
      e.stopPropagation();
      helpers.clearSelection();
      if (annotation.object.inReplyToId) {
        const parent = helpers.allAnnotations.find(
          (a) => a.object.id === annotation.object.inReplyToId,
        );
        if (parent) {
          helpers.selectAnnotation(parent.object.pageIndex, parent.object.id);
          return;
        }
      }
      helpers.selectAnnotation(helpers.pageIndex, annotation.object.id);
    },
    hideSelectionMenu: (a) => !!a.inReplyToId,
  }),
];

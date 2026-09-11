import { useCallback, useEffect, useRef, type PointerEvent, type RefObject } from "react";

import { drawGraphiteSegment, interpolatePoints, type DrawingPoint } from "@/lib/canvas";

const DRAWING_DEBOUNCE_MS = 450;

type UseDrawingSurfaceOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onDrawingIdle: () => void;
  onDrawingStart: () => void;
};

export function useDrawingSurface({
  canvasRef,
  onDrawingIdle,
  onDrawingStart,
}: UseDrawingSurfaceOptions) {
  const drawingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<DrawingPoint | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelIdle = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleIdle = useCallback(() => {
    cancelIdle();
    idleTimerRef.current = setTimeout(onDrawingIdle, DRAWING_DEBOUNCE_MS);
  }, [cancelIdle, onDrawingIdle]);

  const drawTo = useCallback(
    (point: DrawingPoint) => {
      const context = canvasRef.current?.getContext("2d");

      if (!context) {
        return;
      }

      const previous = lastPointRef.current;

      if (!previous) {
        lastPointRef.current = point;
        drawGraphiteSegment(context, point, { ...point, x: point.x + 0.01, y: point.y + 0.01 });
        return;
      }

      for (const next of interpolatePoints(previous, point)) {
        drawGraphiteSegment(context, lastPointRef.current ?? previous, next);
        lastPointRef.current = next;
      }
    },
    [canvasRef],
  );

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>): DrawingPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      pressure: event.pressure || 0.5,
      time: event.timeStamp,
    };
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    onDrawingStart();
    drawTo(pointFromEvent(event));
    scheduleIdle();
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || event.pointerId !== pointerIdRef.current) {
      return;
    }

    drawTo(pointFromEvent(event));
    scheduleIdle();
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerId !== pointerIdRef.current) {
      return;
    }

    drawingRef.current = false;
    pointerIdRef.current = null;
    lastPointRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => cancelIdle, [cancelIdle]);

  return { cancelIdle, onPointerDown, onPointerMove, stopDrawing };
}

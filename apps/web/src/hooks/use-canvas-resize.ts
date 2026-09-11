import { useCallback, useEffect, type RefObject } from "react";

import { resizeCanvas } from "@/lib/canvas";

export function useCanvasResize(canvasRef: RefObject<HTMLCanvasElement | null>, enabled: boolean) {
  const resize = useCallback(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      resizeCanvas(canvas);
    }
  }, [canvasRef]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    resize();

    const observer = new ResizeObserver(resize);
    const canvas = canvasRef.current;

    if (canvas) {
      observer.observe(canvas);
    }

    return () => observer.disconnect();
  }, [canvasRef, enabled, resize]);
}

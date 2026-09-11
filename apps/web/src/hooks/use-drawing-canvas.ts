import type { NeuralNetwork } from "@mnist-playground/neural-network";
import { useCallback, useEffect, useRef, useState } from "react";

import { preprocessDigit } from "@/lib/canvas";

import { useCanvasResize } from "./use-canvas-resize";
import { useDigitAnalysis } from "./use-digit-analysis";
import { useDrawingSurface } from "./use-drawing-surface";

const CLEAR_DELAY_MS = 140;

export function useDrawingCanvas(network: NeuralNetwork) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [processedDigit, setProcessedDigit] = useState<Float32Array | null>(null);
  const { analysis, analysisFailed, isAnalyzing, reset, schedule } = useDigitAnalysis(network);

  const processDrawing = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const digit = preprocessDigit(canvas);
    setProcessedDigit(digit);
    schedule(digit);
  }, [schedule]);

  const startDrawing = useCallback(() => {
    setHasDrawing(true);
    setProcessedDigit(null);
    reset();
  }, [reset]);

  const { cancelIdle, onPointerDown, onPointerMove, stopDrawing } = useDrawingSurface({
    canvasRef,
    onDrawingIdle: processDrawing,
    onDrawingStart: startDrawing,
  });

  useCanvasResize(canvasRef, processedDigit === null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const clear = useCallback(() => {
    if (isClearing) {
      return;
    }

    cancelIdle();
    setProcessedDigit(null);
    reset();

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      setHasDrawing(false);
      return;
    }

    setIsClearing(true);
    clearTimerRef.current = setTimeout(() => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawing(false);
      setIsClearing(false);
    }, CLEAR_DELAY_MS);
  }, [cancelIdle, isClearing, reset]);

  return {
    analysis,
    analysisFailed,
    canvasRef,
    clear,
    hasDrawing,
    isAnalyzing,
    isClearing,
    onPointerDown,
    onPointerMove,
    processedDigit,
    stopDrawing,
  };
}

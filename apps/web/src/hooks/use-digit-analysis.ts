import {
  analyzeDigit,
  type DigitAnalysis,
  type NeuralNetwork,
} from "@mnist-playground/neural-network";
import { useCallback, useEffect, useRef, useState } from "react";

const ANALYSIS_START_DELAY_MS = 700;
const RESULT_REVEAL_DELAY_MS = 550;

export function useDigitAnalysis(network: NeuralNetwork) {
  const requestIdRef = useRef(0);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [analysis, setAnalysis] = useState<DigitAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);

  const cancelPending = useCallback(() => {
    requestIdRef.current++;

    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cancelPending();
    setAnalysis(null);
    setIsAnalyzing(false);
    setAnalysisFailed(false);
  }, [cancelPending]);

  const runAnalysis = useCallback(
    async (input: Float32Array) => {
      const requestId = ++requestIdRef.current;
      setAnalysis(null);
      setAnalysisFailed(false);
      setIsAnalyzing(true);

      try {
        const result = analyzeDigit(network, Array.from(input));

        await new Promise((resolve) => setTimeout(resolve, RESULT_REVEAL_DELAY_MS));

        if (requestId === requestIdRef.current) {
          setAnalysis(result);
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setAnalysisFailed(true);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsAnalyzing(false);
        }
      }
    },
    [network],
  );

  const schedule = useCallback(
    (input: Float32Array) => {
      cancelPending();
      startTimerRef.current = setTimeout(() => {
        startTimerRef.current = null;
        void runAnalysis(input);
      }, ANALYSIS_START_DELAY_MS);
    },
    [cancelPending, runAnalysis],
  );

  useEffect(() => cancelPending, [cancelPending]);

  return { analysis, analysisFailed, isAnalyzing, reset, schedule };
}

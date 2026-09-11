import type { DigitAnalysis } from "@mnist-playground/neural-network";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/cn";

type ProcessedPreviewProps = {
  analysis: DigitAnalysis | null;
  analysisFailed: boolean;
  isAnalyzing: boolean;
  onDrawAnother: () => void;
  pixels: Float32Array | null;
};

type PreviewState = "processing" | "error" | "result";

const PIXEL_COUNT = 28 * 28;

function createPixelRevealDelays() {
  const order = Array.from({ length: PIXEL_COUNT }, (_, index) => index);
  let seed = 7_841;

  for (let index = order.length - 1; index > 0; index--) {
    seed = (seed * 16_807) % 2_147_483_647;
    const nextIndex = seed % (index + 1);
    [order[index], order[nextIndex]] = [order[nextIndex]!, order[index]!];
  }

  const delays = Array<number>(PIXEL_COUNT);
  const immediatePixels = Math.floor(PIXEL_COUNT * 0.55);

  for (let rank = 0; rank < order.length; rank++) {
    const delay =
      rank < immediatePixels
        ? 0
        : 0.04 + ((rank - immediatePixels) / (PIXEL_COUNT - immediatePixels)) * 0.28;

    delays[order[rank]!] = delay;
  }

  return delays;
}

const pixelRevealDelays = createPixelRevealDelays();

function PixelGrid({
  pixels,
  showScan = true,
  animateCells = true,
}: {
  pixels: Float32Array;
  showScan?: boolean;
  animateCells?: boolean;
}) {
  return (
    <div className="relative grid size-full grid-cols-28 gap-px">
      {Array.from(pixels, (pixel, index) => (
        <span
          key={index}
          className={cn("block", {
            "animate-[pixel-reveal_120ms_ease-out_both]": animateCells,
          })}
          style={{
            animationDelay: animateCells ? `${pixelRevealDelays[index]}s` : undefined,
            backgroundColor: `rgb(${Math.round(pixel * 255)} ${Math.round(pixel * 255)} ${Math.round(pixel * 255)})`,
          }}
        />
      ))}
      {showScan && (
        <motion.div
          initial={{ opacity: 0.7, x: "-20%" }}
          animate={{ opacity: [0.7, 0.9, 0.9, 0], x: "110%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="via-chalk/35 pointer-events-none absolute inset-y-0 z-10 w-1/3 bg-gradient-to-r from-transparent to-transparent"
        />
      )}
    </div>
  );
}

function PixelGridFrame({ pixels, isFinal = false }: { pixels: Float32Array; isFinal?: boolean }) {
  return (
    <motion.div
      layout
      className={cn("relative aspect-square overflow-hidden rounded-lg border", {
        "border-outline/35 bg-frame/25": isFinal,
        "border-outline/55 bg-frame/55 p-2": !isFinal,
      })}
    >
      <PixelGrid pixels={pixels} showScan={!isFinal} animateCells={!isFinal} />
    </motion.div>
  );
}

function PredictionResult({
  analysis,
  onDrawAnother,
}: {
  analysis: DigitAnalysis;
  onDrawAnother: () => void;
}) {
  const confidence = Math.round(analysis.confidence * 1000) / 10;
  const confidenceLabel = Number.isInteger(confidence) ? `${confidence}` : confidence.toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      transition={{ delay: 0.16, duration: 0.32, ease: "easeOut" }}
      className="absolute top-1/2 right-0 flex w-1/2 -translate-y-[calc(50%+0.5rem)] flex-col items-center text-center"
    >
      <p className="font-display text-chalk-muted text-xs sm:text-sm">I think you drew</p>
      <motion.p
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.22, type: "spring", stiffness: 260, damping: 20 }}
        className="text-chalk font-mono text-[clamp(4.25rem,14vw,9rem)] leading-[0.82] font-semibold"
      >
        {analysis.prediction}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.58, duration: 0.3 }}
        className="text-chalk-muted font-display mt-1 text-xs sm:mt-1.5 sm:text-sm"
      >
        {confidenceLabel}% sure
      </motion.p>
      <motion.button
        type="button"
        onClick={onDrawAnother}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.72, duration: 0.24 }}
        className="border-outline/60 bg-control/45 text-chalk-muted hover:border-outline hover:bg-control/70 hover:text-chalk font-display pointer-events-auto mt-2 min-h-11 cursor-pointer rounded-full border px-3 py-2 text-xs transition-colors sm:mt-3 sm:px-4"
      >
        draw another ↻
      </motion.button>
    </motion.div>
  );
}

function ProcessingMessage({ isAnalyzing }: { isAnalyzing: boolean }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      className="text-chalk-muted font-display absolute top-[calc(100%+0.65rem)] left-0 w-full px-2 text-center text-xs"
    >
      {isAnalyzing ? "reading the network's little guesses…" : "turning graphite into pixels…"}
    </motion.p>
  );
}

function PreviewStatus({ isAnalyzing, state }: { isAnalyzing: boolean; state: PreviewState }) {
  if (state === "processing") {
    return <ProcessingMessage isAnalyzing={isAnalyzing} />;
  }

  if (state === "error") {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-drawing/90 text-chalk-muted font-display absolute inset-x-5 bottom-3 rounded-md px-3 py-2 text-center text-sm"
      >
        the tiny brain lost the signal — try again ✎
      </motion.p>
    );
  }

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.24, duration: 0.2 }}
      className="text-chalk-muted relative left-1/2 mt-2 w-max max-w-none -translate-x-1/2 text-center font-mono text-[0.58rem] leading-tight tracking-[0.12em] whitespace-nowrap"
    >
      what the network saw
      <br />
      <span className="text-chalk-muted/90">28 × 28 · 784 inputs</span>
    </motion.p>
  );
}

export function ProcessedPreview({
  analysis,
  analysisFailed,
  isAnalyzing,
  onDrawAnother,
  pixels,
}: ProcessedPreviewProps) {
  if (!pixels) {
    return null;
  }

  const state: PreviewState = analysis ? "result" : analysisFailed ? "error" : "processing";

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "pointer-events-none absolute top-1/2 right-4 left-4 z-30 mx-auto aspect-square -translate-y-1/2",
        {
          "max-w-[36rem]": state === "result",
          "max-w-[20rem]": state !== "result",
        },
      )}
    >
      <motion.div
        layout
        transition={{ layout: { duration: 0.42, ease: "easeInOut" } }}
        className={cn({
          "absolute top-1/2 left-0 w-1/2 -translate-y-1/2": state === "result",
          "absolute inset-0": state !== "result",
        })}
      >
        <PixelGridFrame pixels={pixels} isFinal={state === "result"} />
        <PreviewStatus isAnalyzing={isAnalyzing} state={state} />
      </motion.div>
      <AnimatePresence>
        {analysis && <PredictionResult analysis={analysis} onDrawAnother={onDrawAnother} />}
      </AnimatePresence>
    </motion.div>
  );
}

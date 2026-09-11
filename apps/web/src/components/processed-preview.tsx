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

const pixelCount = 28 * 28;

function createPixelRevealDelays() {
  const order = Array.from({ length: pixelCount }, (_, index) => index);
  let seed = 7_841;

  for (let index = order.length - 1; index > 0; index--) {
    seed = (seed * 16_807) % 2_147_483_647;
    const nextIndex = seed % (index + 1);
    [order[index], order[nextIndex]] = [order[nextIndex]!, order[index]!];
  }

  const delays = Array<number>(pixelCount);
  const immediatePixels = Math.floor(pixelCount * 0.45);

  for (let rank = 0; rank < order.length; rank++) {
    const delay =
      rank < immediatePixels
        ? 0
        : 0.08 + ((rank - immediatePixels) / (pixelCount - immediatePixels)) * 0.4;

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
        <motion.span
          key={index}
          initial={animateCells ? { opacity: 0, scale: 0.72 } : false}
          animate={animateCells ? { opacity: 1, scale: 1 } : undefined}
          transition={
            animateCells ? { delay: pixelRevealDelays[index], duration: 0.18 } : undefined
          }
          className="block"
          style={{
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

function PixelGridFrame({ pixels, final = false }: { pixels: Float32Array; final?: boolean }) {
  return (
    <motion.div
      layoutId="processed-pixels"
      layout
      className={cn("relative aspect-square overflow-hidden rounded-lg border", {
        "border-outline/35 bg-frame/25": final,
        "border-outline/55 bg-frame/55 p-2": !final,
      })}
    >
      <PixelGrid pixels={pixels} showScan={!final} animateCells={!final} />
    </motion.div>
  );
}

function ResultDetails({
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
      className="absolute top-1/2 right-2 flex w-[52%] -translate-y-[calc(50%+0.5rem)] flex-col items-center text-center sm:right-7 sm:w-[48%]"
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "pointer-events-none absolute top-1/2 left-1/2 z-30 h-[min(78vw,18rem)] -translate-x-1/2 -translate-y-1/2 sm:h-[min(70vw,18rem)]",
        {
          "w-[min(90vw,34rem)]": Boolean(analysis),
          "w-[min(70vw,18rem)]": !analysis,
        },
      )}
    >
      <motion.div
        layout
        transition={{ layout: { duration: 0.42, ease: "easeInOut" } }}
        className={cn({
          "absolute top-1/2 left-3 w-[38%] -translate-y-1/2 sm:left-7 sm:w-[40%]":
            Boolean(analysis),
          "absolute inset-0": !analysis,
        })}
      >
        <PixelGridFrame pixels={pixels} final={Boolean(analysis)} />
        <AnimatePresence mode="wait">
          {analysis ? (
            <motion.p
              key="network-saw"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.24, duration: 0.2 }}
              className="text-chalk-muted mt-2 text-center font-mono text-[0.65rem] leading-tight tracking-[0.1em]"
            >
              what the network saw
              <br />
              <span className="text-chalk-muted/90">28 × 28 · 784 inputs</span>
            </motion.p>
          ) : analysisFailed ? (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-drawing/90 text-chalk-muted font-display absolute inset-x-5 bottom-3 rounded-md px-3 py-2 text-center text-sm"
            >
              the tiny brain lost the signal — try again ✎
            </motion.p>
          ) : (
            <ProcessingMessage key="processing-message" isAnalyzing={isAnalyzing} />
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {analysis && <ResultDetails analysis={analysis} onDrawAnother={onDrawAnother} />}
      </AnimatePresence>
    </motion.div>
  );
}

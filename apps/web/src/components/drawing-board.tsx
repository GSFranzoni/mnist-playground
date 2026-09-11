import type { NeuralNetwork } from "@mnist-playground/neural-network";
import { AnimatePresence, motion } from "motion/react";

import { ProcessedPreview } from "@/components/processed-preview";
import { useDrawingCanvas } from "@/hooks/use-drawing-canvas";
import { cn } from "@/lib/cn";

export function DrawingBoard({ network }: { network: NeuralNetwork }) {
  const {
    analysis,
    analysisFailed,
    canvasRef,
    clear,
    hasDrawing,
    isClearing,
    isAnalyzing,
    onPointerDown,
    onPointerMove,
    processedDigit,
    stopDrawing,
  } = useDrawingCanvas(network);
  const showSupport = !hasDrawing && !processedDigit;

  return (
    <>
      <section className="relative aspect-square w-full max-w-3xl justify-self-center sm:aspect-4/3">
        <AnimatePresence>
          {!processedDigit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <span
                aria-hidden
                className="font-display text-chalk-muted absolute -top-10 -left-5 hidden rotate-[-8deg] text-xl sm:block"
              >
                ✦ start here
              </span>
              <span
                aria-hidden
                className="font-display text-chalk-muted absolute top-[17%] -right-1 hidden rotate-[12deg] text-lg sm:block"
              >
                28 × 28
              </span>
              <span
                aria-hidden
                className="text-chalk-faint absolute right-[9%] -bottom-8 hidden rotate-[-5deg] font-mono text-xs tracking-[0.3em] sm:block"
              >
                0 1 2 3 4 5 6 7 8 9
              </span>
              <span
                aria-hidden
                className="text-chalk-muted absolute -bottom-2 -left-7 hidden rotate-[-16deg] text-2xl sm:block"
              >
                ∑
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!processedDigit && (
            <motion.div
              initial={{ opacity: 0.7, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.34, ease: "easeOut" } }}
              className="border-frame bg-drawing shadow-board absolute top-1/2 left-1/2 aspect-square w-[min(88vw,21rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.55rem] border p-2 sm:w-[68%] sm:rounded-[1.8rem] sm:p-3"
            >
              <p className="text-chalk-faint absolute top-5 left-6 z-20 font-mono text-[0.55rem] font-semibold tracking-[0.14em] sm:top-6 sm:left-7 sm:text-[0.58rem] sm:tracking-[0.16em]">
                01 · DRAW
              </p>
              <div
                aria-hidden
                className="border-frame-faint absolute inset-1 rotate-[-0.35deg] rounded-[1.3rem] border sm:rounded-[1.55rem]"
              />
              <div
                aria-hidden
                className="border-frame-faint absolute inset-[-3px] rotate-[0.25deg] rounded-[1.65rem] border sm:rounded-[1.9rem]"
              />
              <motion.div className="relative z-10 size-full">
                <canvas
                  ref={canvasRef}
                  className={cn(
                    "block size-full cursor-crosshair touch-none rounded-[1.1rem] transition-all duration-150 sm:rounded-[1.35rem]",
                    {
                      "scale-[0.985] opacity-0": isClearing,
                      "opacity-100": !isClearing,
                    },
                  )}
                  aria-label="Drawing surface for a handwritten digit"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                />
              </motion.div>
              <p
                className={cn(
                  "font-display text-chalk-muted pointer-events-none absolute inset-0 z-20 grid place-items-center text-xl transition-all duration-300 sm:text-2xl",
                  {
                    "translate-y-2 opacity-0": hasDrawing,
                    "opacity-100": !hasDrawing,
                  },
                )}
              >
                draw something <span className="text-chalk ml-2 rotate-[-12deg]">✎</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <ProcessedPreview
          analysis={analysis}
          analysisFailed={analysisFailed}
          isAnalyzing={isAnalyzing}
          onDrawAnother={clear}
          pixels={processedDigit}
        />
      </section>
      <div className="mt-5 min-h-11 sm:mt-7">
        <a
          href="https://buymeacoffee.com/gsfranzoni"
          target="_blank"
          rel="noreferrer"
          aria-hidden={!showSupport}
          tabIndex={showSupport ? undefined : -1}
          className={cn(
            "border-outline/55 text-chalk-muted hover:border-outline hover:text-chalk focus-visible:outline-chalk font-display inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-4",
            {
              "pointer-events-none invisible": !showSupport,
            },
          )}
        >
          <span aria-hidden className="text-sm text-[#ffdd00]">
            ☕
          </span>
          Buy me a coffee
        </a>
      </div>
    </>
  );
}

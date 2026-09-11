import type { NeuralNetwork } from "@mnist-playground/neural-network";

import { DrawingBoard } from "@/components/drawing-board";
import { PlaygroundHeader } from "@/components/playground-header";

export function Playground({ network }: { network: NeuralNetwork }) {
  return (
    <main className="bg-canvas text-ink selection:bg-chalk/30 relative min-h-dvh overflow-x-hidden px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8 md:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,var(--color-canvas-light)_0%,transparent_54%)]"
      />
      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl flex-col items-center justify-center sm:min-h-[calc(100dvh-4rem)]">
        <PlaygroundHeader />
        <DrawingBoard network={network} />
      </div>
    </main>
  );
}

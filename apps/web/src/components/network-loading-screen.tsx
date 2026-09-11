import { motion } from "motion/react";

import { cn } from "@/lib/cn";

export function NetworkLoadingScreen() {
  return (
    <main className="bg-canvas text-ink relative grid min-h-dvh place-items-center overflow-x-hidden px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,var(--color-canvas-light)_0%,transparent_54%)]"
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col items-center text-center"
      >
        <motion.div
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="border-frame bg-drawing grid size-[4.5rem] grid-cols-4 gap-1 rounded-2xl border p-2.5 shadow-[0_18px_50px_rgb(0_0_0/35%)] sm:size-20 sm:p-3"
        >
          {Array.from({ length: 16 }, (_, index) => (
            <span
              key={index}
              className={cn("rounded-xs", {
                "bg-chalk-muted": index === 5 || index === 6 || index === 9,
                "bg-frame-faint": index !== 5 && index !== 6 && index !== 9,
              })}
            />
          ))}
        </motion.div>
        <p className="font-display text-chalk mt-5 text-lg sm:mt-6 sm:text-xl">
          waking up the tiny brain…
        </p>
        <p className="text-chalk-faint mt-2 font-mono text-[0.56rem] tracking-[0.1em] sm:text-[0.62rem] sm:tracking-[0.14em]">
          loading trained weights · 784 inputs
        </p>
      </motion.div>
    </main>
  );
}

export function PlaygroundHeader() {
  return (
    <header className="relative z-10 mb-5 text-center sm:mb-10">
      <p className="text-chalk-muted mb-2 font-mono text-[0.58rem] font-medium tracking-[0.22em] sm:text-[0.65rem] sm:tracking-[0.28em]">
        MNIST / LITTLE LAB
      </p>
      <h1 className="font-display text-chalk text-3xl leading-none tracking-tight sm:text-6xl">
        draw me a number
      </h1>
      <p className="font-display text-chalk-muted mt-2 rotate-[-2deg] text-base sm:mt-3 sm:text-lg">
        a scribble from 0–9 will do ✦
      </p>
    </header>
  );
}

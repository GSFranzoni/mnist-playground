import process from "node:process";

export type TrainingMetrics = {
  samples: number;
  loss: number;
  accuracy: number;
};

const ESC = "\u001B[";

const PROGRESS_WIDTH = 50;

/**
 * A small, portable terminal dashboard.
 *
 * It intentionally uses only standard ANSI screen control sequences. Unlike the
 * previous renderer, it does not enable raw mode or ask the terminal for color
 * capabilities, both of which can leave unread control responses in the shell.
 */
export class TrainingPresenter {
  private readonly interactive = Boolean(process.stdout.isTTY);

  private epoch = 0;

  private metrics: TrainingMetrics = { samples: 0, loss: Number.NaN, accuracy: 0 };

  private testMetrics?: TrainingMetrics;

  private destroyed = false;

  static async create() {
    const presenter = new TrainingPresenter();
    presenter.start();
    return presenter;
  }

  update(epoch: number, metrics: TrainingMetrics) {
    this.epoch = Math.max(1, Math.trunc(epoch));
    this.metrics = metrics;

    if (!this.interactive) {
      console.log(
        [
          `epoch ${this.epoch}`,
          `${metrics.samples.toLocaleString("en-US")} samples`,
          `loss ${formatMetric(metrics.loss)}`,
          `accuracy ${(clamp(metrics.accuracy, 0, 1) * 100).toFixed(2)}%`,
        ].join(" · "),
      );
      return;
    }

    this.render();
  }

  updateTest(metrics: TrainingMetrics) {
    this.testMetrics = metrics;

    if (!this.interactive) {
      console.log(
        `test set · loss ${formatMetric(metrics.loss)} · accuracy ${(clamp(metrics.accuracy, 0, 1) * 100).toFixed(2)}%\n`,
      );
      return;
    }

    this.render();
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    if (this.interactive) {
      process.stdout.write(`${ESC}0m${ESC}?25h${ESC}?1049l`);
    }
  }

  private start() {
    if (!this.interactive) {
      console.log("MNIST / NEURAL NETWORK");
      console.log("Training started. Press Ctrl+C to save the current weights and stop.\n");
      return;
    }

    process.stdout.write(`${ESC}?1049h${ESC}2J${ESC}H${ESC}?25l`);
    this.render();
  }

  private render() {
    if (!this.interactive || this.destroyed) {
      return;
    }

    const accuracy = clamp(this.metrics.accuracy, 0, 1);
    const percent = accuracy * 100;
    const filled = Math.round(accuracy * PROGRESS_WIDTH);
    const bar = `${"█".repeat(filled)}${"░".repeat(PROGRESS_WIDTH - filled)}`;
    const accuracyColor = percent >= 90 ? "92" : percent >= 70 ? "93" : "91";
    const testSummary = this.testMetrics
      ? `${(clamp(this.testMetrics.accuracy, 0, 1) * 100).toFixed(2)}% · loss ${formatMetric(this.testMetrics.loss)}`
      : "—";

    const lines = [
      color("95", "MNIST  /  NEURAL NETWORK"),
      "",
      color(
        "90",
        this.epoch
          ? `● TRAINING  Epoch ${this.epoch} · Learning from sample ${this.metrics.samples.toLocaleString("en-US")}`
          : "● TRAINING  Waiting for the first batch…",
      ),
      "",
      color("95", "╭──────────────────── LIVE METRICS ────────────────────╮"),
      color("95", boxLine(metricLine("EPOCH", this.epoch ? String(this.epoch) : "—"))),
      color(
        "37",
        boxLine(metricLine("SAMPLES PROCESSED", this.metrics.samples.toLocaleString("en-US"))),
      ),
      color("93", boxLine(metricLine("LOSS", formatMetric(this.metrics.loss)))),
      color(accuracyColor, boxLine(metricLine("ACCURACY", `${percent.toFixed(2)}%`))),
      color(accuracyColor, boxLine(`[${bar}]`)),
      color("95", boxLine(metricLine("TEST SET", testSummary))),
      color("95", "╰──────────────────────────────────────────────────────╯"),
      "",
      color("90", "Ctrl+C to stop training and save the current weights"),
    ];

    process.stdout.write(`${ESC}H${ESC}2J${lines.join("\n")}\n`);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function color(code: string, value: string) {
  return `${ESC}${code}m${value}${ESC}0m`;
}

function formatMetric(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : "—";
}

function metricLine(label: string, value: string) {
  return `${label.padEnd(26)}${value.padStart(26)}`;
}

function boxLine(value: string) {
  return `│ ${value.padEnd(52)} │`;
}

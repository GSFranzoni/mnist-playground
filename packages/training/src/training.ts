import { mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

import {
  NeuralNetwork,
  SGD,
  softmaxCrossEntropy,
  TrainingAudit,
} from "@mnist-playground/neural-network";

import { streamMNIST } from "./mnist";
import { ARTIFACTS_DIR, createNetwork, MNIST_DATASET_DIR, WEIGHTS_PATH } from "./model";
import { TrainingPresenter } from "./presenter";
import { test } from "./testing";

const TRAINING_PATH = resolve(MNIST_DATASET_DIR, "train.csv");

const checkpointPath = `${WEIGHTS_PATH}.tmp`;

export async function train(network: NeuralNetwork, epochs = 10) {
  let stopped = false;

  const stop = () => {
    if (stopped) {
      return;
    }

    stopped = true;
  };

  const presenter = await TrainingPresenter.create();

  process.on("SIGINT", stop);

  const save = async () => {
    await mkdir(ARTIFACTS_DIR, { recursive: true });
    await Bun.write(checkpointPath, `${JSON.stringify(network.export(), null, 2)}\n`);
    await rename(checkpointPath, WEIGHTS_PATH);
  };

  try {
    const optimizer = new SGD(0.01);

    for (let epoch = 0; epoch < epochs && !stopped; epoch++) {
      const audit = new TrainingAudit();

      for await (const sample of streamMNIST(TRAINING_PATH)) {
        if (stopped) {
          break;
        }

        const logits = network.forward(sample.input);

        const { loss, gradient } = softmaxCrossEntropy(logits, sample.label);

        network.backward(gradient);
        optimizer.step(network.parameters());
        audit.record(logits, sample.label, loss);

        if (audit.shouldReport()) {
          presenter.update(epoch + 1, audit.snapshot());
        }
      }

      await save();

      if (!stopped) {
        const { metrics } = await test(network);

        presenter.updateTest(metrics);
      }
    }
  } finally {
    process.off("SIGINT", stop);
    await save();
    presenter.destroy();
  }

  if (stopped) {
    process.exitCode = 130;
  }
}

if (import.meta.main) {
  await train(await createNetwork());
}

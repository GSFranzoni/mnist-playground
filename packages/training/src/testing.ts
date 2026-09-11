import { resolve } from "node:path";

import {
  NeuralNetwork,
  softmaxCrossEntropy,
  TrainingAudit,
} from "@mnist-playground/neural-network";

import { streamMNIST } from "./mnist";
import { createNetwork, MNIST_DATASET_DIR } from "./model";

const testPath = resolve(MNIST_DATASET_DIR, "test.csv");

export async function test(network: NeuralNetwork) {
  const audit = new TrainingAudit();

  for await (const sample of streamMNIST(testPath)) {
    const logits = network.forward(sample.input);

    const { loss } = softmaxCrossEntropy(logits, sample.label);

    audit.record(logits, sample.label, loss);
  }

  const metrics = audit.snapshot();

  return {
    metrics,
  };
}

if (import.meta.main) {
  await test(await createNetwork());
}

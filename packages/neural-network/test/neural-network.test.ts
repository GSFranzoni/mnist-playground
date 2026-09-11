import { describe, expect, test } from "bun:test";

import { analyzeDigit, DenseLayer, NeuralNetwork, softmax, softmaxCrossEntropy } from "../src";

describe("neural network primitives", () => {
  test("computes a dense layer forward pass and gradients", () => {
    const layer = new DenseLayer(2, 2);
    layer.weights[0] = [1, 2];
    layer.weights[1] = [3, 4];
    layer.biases[0] = 1;
    layer.biases[1] = -1;

    expect(layer.forward([2, 1])).toEqual([5, 9]);
    expect(layer.backward([1, -2])).toEqual([-5, -6]);
    expect(layer.weightGradients).toEqual([
      [2, 1],
      [-4, -2],
    ]);
    expect(layer.biasGradients).toEqual([1, -2]);
  });

  test("round-trips exported weights into an equivalent network", () => {
    const source = new NeuralNetwork([new DenseLayer(2, 1)]);
    const target = new NeuralNetwork([new DenseLayer(2, 1)]);

    source.layers[0]!.parameters()[0]!.values.splice(0, 2, 0.25, -0.5);
    source.layers[0]!.parameters()[1]!.values.splice(0, 1, 0.75);
    target.load(source.export());

    expect(target.export()).toEqual(source.export());
    expect(target.forward([2, 4])).toEqual([-0.75]);
  });

  test("returns normalized probabilities and a prediction", () => {
    const probabilities = softmax([1, 2, 3]);
    const result = softmaxCrossEntropy([1, 2, 3], 2);
    const network = new NeuralNetwork([new DenseLayer(2, 2)]);
    network.layers[0]!.parameters()[0]!.values.splice(0, 2, 1, 0);
    network.layers[0]!.parameters()[1]!.values.splice(0, 2, 0, 1);
    network.layers[0]!.parameters()[2]!.values.splice(0, 2, 0, 0);

    expect(probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(result.loss).toBeGreaterThan(0);
    expect(analyzeDigit(network, [3, 1]).prediction).toBe(0);
  });
});

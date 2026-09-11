import { DenseLayer, NeuralNetwork, ReLULayer } from "./neural-network";

export function getMnistNetwork() {
  return new NeuralNetwork([
    new DenseLayer(784, 128),
    new ReLULayer(),
    new DenseLayer(128, 64),
    new ReLULayer(),
    new DenseLayer(64, 10),
  ]);
}

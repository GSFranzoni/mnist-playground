import { createReadStream } from "node:fs";

import { parse } from "csv-parse";

type MNISTSample = {
  input: number[];
  label: number;
};

export async function* streamMNIST(path: string): AsyncGenerator<MNISTSample> {
  const parser = createReadStream(path).pipe(
    parse({
      cast: true,
    }),
  );

  for await (const row of parser) {
    const [label, ...pixels] = row as number[];

    yield {
      label,
      input: pixels.map((pixel) => pixel / 255),
    };
  }
}

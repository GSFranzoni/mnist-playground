import { describe, expect, test } from "vitest";

import { canvasToGrayscale, interpolatePoints } from "./canvas";

describe("drawing preprocessing helpers", () => {
  test("converts canvas red-channel pixels to normalized grayscale", () => {
    const image = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([0, 10, 20, 255, 255, 0, 0, 255]),
    } as ImageData;

    expect(Array.from(canvasToGrayscale(image))).toEqual([0, 1]);
  });

  test("interpolates enough points to cover a long drawing segment", () => {
    const points = interpolatePoints(
      { x: 0, y: 0, pressure: 0.5, time: 0 },
      { x: 8, y: 0, pressure: 1, time: 8 },
    );

    expect(points).toHaveLength(3);
    expect(points.at(-1)).toEqual({ x: 8, y: 0, pressure: 1, time: 8 });
  });
});

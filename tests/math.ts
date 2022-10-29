import { Degrees, Radians, rad, deg, sin, asin, atan2 } from "../src/math";

describe("unary functions", () => {
  const x: Degrees = 90;
  const sinx = sin(rad(x));
  const sin_1x = deg(asin(sinx));
  it("computes sine", () => {
    expect(sinx).toEqual(Math.sin((x * Math.PI) / 180));
  });
  it("computes inverse sine", () => {
    expect(sin_1x).toEqual(x);
  });
});

describe("binary functions", () => {
  const at = deg(atan2(1, 1));
  it("computes arctan", () => expect(at).toEqual(45));
});

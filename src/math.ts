/*
  Hurrah Typescript! Use the type "flavor" concept from here:
  https://spin.atomicobject.com/2018/01/15/typescript-flexible-nominal-typing/

  This way I can't mix up degrees and radians by accident!
*/

interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

export type Degrees = Flavor<number, "degrees">;
export type Radians = Flavor<number, "radians">;

export function deg(x: Radians): Degrees {
  return (x * 180) / Math.PI;
}

export function rad(x: Degrees): Radians {
  return (x * Math.PI) / 180;
}

export function sin(x: Radians): number {
  return Math.sin(x);
}

export function cos(x: Radians): number {
  return Math.cos(x);
}

export function tan(x: Radians): number {
  return Math.tan(x);
}

export function asin(x: number): Radians {
  return Math.asin(x);
}

export function acos(x: number): Radians {
  return Math.acos(x);
}

export function atan2(y: number, x: number): Radians {
  return Math.atan2(y, x);
}

export function mod(m, n: number): number {
  // This is fun, JavaScript "modulo"... isn't. It's actually a remainder operator.
  // https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm
  // This only matters when m is negative, which is *tada* any timestamp before the epoch.
  return ((m % n) + n) % n;
}

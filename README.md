# sun-sector

## Overview

This very smol TypeScript library implements rough calculations for the azimuth
and elevation of the sun for any location on Earth at a particular time, as well
as providing times for rise, set, and noon.

## Usage

```
import {SunSector} from 'sun-sector';

const sun = SunSector.from(31.34635, -93.82015)
                     .at("2003-02-01T08:59:00-06:00");

console.log("Azimuth º:", sun.azimuth);
console.log("Elevation º:", sun.elevation);

console.log("Sunrise:", sun.rise);
console.log("Noon:", sun.noon);
console.log("Sunset:", sun.set);
```

`SunSector.from()` takes two arguments, a _latitude_ and a _longitude_. Both
should be in decimal degrees, with latitude south and longitude west given as
negative numbers. This function returns a `View` object for the given location
at the current time.

`.at(date)` returns another `View` for the same location at the given date and
time. It takes a single argument that can be a Date object, or any string that
the built-in `Date` constructor accepts.

The `.elevation` property returns the number of degrees above the horizon.
`.azimuth` returns degrees, clockwise from due north (0º).

The `.rise`, `.noon`, and `.set` properties all return `Date` objects.

## Notes

This code basically implements Louis Strous's excellent tutorial on computing
the position of the Sun from his [Astronomy
Answers](https://www.aa.quae.nl/en/reken/zonpositie.html) site.

When compared to online solar position calculators like
[nrel.gov](https://midcdmz.nrel.gov/solpos/spa.html) or
[gml.noaa.gov](https://gml.noaa.gov/grad/solcalc/), this code returns azimuth
and elevation that are within 0.5º, noon within a minute, and rise/set times
that are within 2 minutes. So it's not perfect, but it's close enough for my
purposes.

You should probably check out [Volodymyr
Agafonkin](https://twitter.com/mourner)'s more fully-featured
[SunCalc](https://github.com/mourner/suncalc) library. Slava Ukraini! 🇺🇦

## License

(c) Copyright 2022 Schuyler Erle.

It's Free Software, yo. See [LICENSE.md](LICENSE.md) for the full (3-clause BSD)
license.

/* sun-sector */

import {
  Degrees,
  deg,
  rad,
  sin,
  cos,
  tan,
  asin,
  acos,
  atan2,
  mod,
} from "./math";
const { abs, round } = Math;

type JulianDate = number;

type ObserverAngles = {
  azimuth: Degrees;
  elevation: Degrees;
};

type Times = {
  rise: Date;
  set: Date;
  noon: Date;
};

class View {
  latitude: Degrees;
  longitude: Degrees;
  date: Date;

  constructor(data: Partial<View>) {
    Object.assign(this, data, { date: data.date ?? new Date() });
  }

  at(when: Date | string): View {
    const child = new View(this);
    child.date = new Date(when);
    return child;
  }

  atJulianDate(when: JulianDate): View {
    const msSinceEpoch = (when - View.unixEpochJulianDate) * View.msPerDay;
    return this.at(new Date(msSinceEpoch));
  }

  static msPerDay = 8.64e7;
  static unixEpochJulianDate = 2440587.5;
  static y2kJulianDate = 2451545.0;
  static terrestrialTime = 69184 / this.msPerDay;

  get unixTime(): number {
    return +this.date;
  }

  get julianDate(): JulianDate {
    return this.unixTime / View.msPerDay + View.unixEpochJulianDate;
  }

  get ephemerisDay(): JulianDate {
    // Days since the Jan 1 2000
    return this.julianDate - View.y2kJulianDate + View.terrestrialTime;
  }

  get meanAnomaly(): Degrees {
    // https://www.aa.quae.nl/en/reken/zonpositie.html#2
    const epochMeanAnomaly = 357.5291;
    const meanAngularMotion = 0.98560028;
    const totalAnomaly =
      epochMeanAnomaly + meanAngularMotion * this.ephemerisDay;
    return mod(totalAnomaly, 360);
  }

  get equationOfCenter(): Degrees {
    // https://www.aa.quae.nl/en/reken/zonpositie.html#3
    const m = rad(this.meanAnomaly);
    const C = [1.9148, 0.02, 0.0003]; // coefficients of the equation of the center in degrees
    const q = C[0] * sin(m) + C[1] * sin(2 * m) + C[2] * sin(3 * m); // so this entire sum is also degrees

    // https://farside.ph.utexas.edu/books/Syntaxis/Almagest/node34.html gives
    // the equation of center as a function of Earth's orbital eccentricity. The
    // results are functionally the same.
    // const e = 0.0167086;
    // const q = deg(2 * e * sin(m) + (5 / 4) * e ** 2 * sin(2 * m));
    return q;
  }

  get trueAnomaly(): Degrees {
    return mod(this.meanAnomaly + this.equationOfCenter, 360);
  }

  get eclipticLongitude(): Degrees {
    // https://www.aa.quae.nl/en/reken/zonpositie.html#5
    const argumentOfPerihelion = 102.9373;
    // the constant 180º rotates the perspective from Sun to Earth
    return mod(argumentOfPerihelion + this.trueAnomaly + 180, 360);

    // https://aa.usno.navy.mil/faq/sun_approx
    // const meanSolarLongitude = 280.459 + 0.98564736 * this.ephemerisDay;
    // return mod(meanSolarLongitude + this.equationOfCenter, 360);
  }

  get sun(): { declination: Degrees; rightAscension: Degrees } {
    // https://www.aa.quae.nl/en/reken/zonpositie.html#6
    const axialTilt = rad(23.4393);
    const l = rad(this.eclipticLongitude);
    const declination = asin(sin(axialTilt) * sin(l));
    const rightAscension = atan2(sin(l) * cos(axialTilt), cos(l));
    return {
      declination: deg(declination),
      rightAscension: deg(rightAscension),
    };
  }

  get declination(): Degrees {
    return this.sun.declination;
  }

  get rightAscension(): Degrees {
    return this.sun.rightAscension;
  }

  get siderealTime(): Degrees {
    // https://www.aa.quae.nl/en/reken/zonpositie.html#7
    const siderealTimeAtEpoch = 280.147;
    const siderealRotationPerDay = 360.9856235;
    return mod(
      siderealTimeAtEpoch +
        siderealRotationPerDay * this.ephemerisDay +
        this.longitude,
      360
    );
  }

  get hourAngle(): Degrees {
    // https://www.aa.quae.nl/en/reken/zonpositie.html#7
    const ha = this.siderealTime - this.sun.rightAscension;
    // Sometimes this is given as sun angle from _previous_ noon but here angle
    // from noon _today_ (which could be negative) is more useful here.
    return ha < 180 ? ha : ha - 360;
  }

  get angles(): ObserverAngles {
    const ha = rad(this.hourAngle);
    const lat = rad(this.latitude);
    const dec = rad(this.sun.declination);
    /* https://www.aa.quae.nl/en/reken/zonpositie.html#7 note "The azimuth is
     the direction along the horizon, which we measure from south to west. South
     has azimuth 0°..." which is why the addition of 180º to make North be up */
    const azimuth = mod(
      180 + deg(atan2(sin(ha), cos(ha) * sin(lat) - tan(dec) * cos(lat))),
      360
    );
    const elevation = deg(
      asin(sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(ha))
    );
    return { azimuth, elevation };
  }

  get azimuth(): Degrees {
    return this.angles.azimuth;
  }

  get elevation(): Degrees {
    return this.angles.elevation;
  }

  get equationOfTime(): number {
    /* this is actually used in (35) to refine the transit estimate, but is
      explained in https://www.aa.quae.nl/en/reken/zonpositie.html#9 */
    const j1 = 0.0053472;
    const j2 = -0.006875;
    const m = rad(this.meanAnomaly);
    const l = rad(this.eclipticLongitude);
    return j1 * sin(m) + j2 * sin(2 * l); // days
  }

  /* This somewhat bonkers bit of code implements the method described in
  https://www.aa.quae.nl/en/reken/zonpositie.html#10 by progressively refining a
  candidate view until the computed hour angle matches the value returned by
  hourAngleTarget(). hourAngleTarget() needs to return 0 for noon,
  +horizonHourAngle() for sunset, and -horizonHourAngle() for sunrise...
  but *punch line* it doesn't seem to do much to improve things. */

  private atHourAngle(
    estimate: JulianDate,
    hourAngleTarget: (v: View) => Degrees
  ): View {
    const tolerance = 1e-7;
    let candidate = this.atJulianDate(estimate);
    let delta = (hourAngleTarget(candidate) - candidate.hourAngle) / 360;
    while (abs(delta) > tolerance) {
      candidate = this.atJulianDate(candidate.julianDate + delta);
      delta = (hourAngleTarget(candidate) - candidate.hourAngle) / 360;
    }
    return candidate;
  }

  get solarTransit(): View {
    // https://www.aa.quae.nl/en/reken/zonpositie.html#8
    const localTime = this.ephemerisDay + this.longitude / 360;
    const nearest = Math.round(localTime);
    const estimate =
      View.y2kJulianDate +
      this.ephemerisDay +
      (nearest - localTime) +
      this.equationOfTime;
    return this.atJulianDate(estimate);
  }

  get horizonHourAngle(): Degrees {
    /* https://www.aa.quae.nl/en/reken/zonpositie.html#10 */
    const h0 = rad(-0.83);
    const lat = rad(this.latitude);
    const dec = rad(this.sun.declination);
    const ht = deg(
      acos((sin(h0) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec)))
    );
    return ht;
  }

  get times(): Times {
    const noon = this.solarTransit;
    const ht = noon.horizonHourAngle;
    /*
    const rise = this.atHourAngle(
      noon.julianDate - ht / 360,
      (v) => -v.horizonHourAngle
    );
    const set = this.atHourAngle(
      noon.julianDate + ht / 360,
      (v) => v.horizonHourAngle
    );
    */
    const rise = this.atJulianDate(noon.julianDate - ht / 360);
    const set = this.atJulianDate(noon.julianDate + ht / 360);

    return {
      rise: rise.date,
      set: set.date,
      noon: noon.date,
    };
  }

  get rise(): Date {
    return this.times.rise;
  }

  get noon(): Date {
    return this.times.noon;
  }

  get set(): Date {
    return this.times.set;
  }
}

const SunSector = {
  from: (latitude: Degrees, longitude: Degrees, date?: Date): View => {
    return new View({ latitude, longitude, date });
  },
  View: View,
};

export { SunSector, View };

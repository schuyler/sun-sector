import { SunSector } from "../src/index";
const { abs } = Math;
import { mod } from "../src/math";

const expectedPrecision = {
  julianDate: 1e-4,
  ephemerisDay: 1e-4,
  meanAnomaly: 1e-2,
  equationOfTime: 1e-3,
  eclipticLongitude: 0.5,
  solarTransit: 1e-5,
  declination: 0.2,
  rightAscension: 0.5,
  siderealTime: 0.2,
  hourAngle: 0.5,
  azimuth: 0.5,
  elevation: 0.5,
  noon: 6e4,
  rise: 9e4,
  set: 9e4,
};

const places = {
  // expected values from https://midcdmz.nrel.gov/solpos/spa.html
  "Hemphill, TX": {
    latitude: 31.34635, // 31º20'46.8"
    longitude: -93.82015, // -93º29'12.5"
    when: new Date("2003-02-01T08:59:00-06:00"),
    times: {
      rise: new Date("2003-02-01T07:08:00-06:00"), // 7.131432
      noon: new Date("2003-02-01T12:28:00-06:00"), // 12.481033
      set: new Date("2003-02-01T17:50:00-06:00"), // 17.836307
    },
    tz: -6,
    internal: {
      julianDate: 2452672.124305,
      ephemerisDay: 1127.125106,
      meanAnomaly: mod(1468.422494, 360),
      equationOfTime: 0.00941,
      eclipticLongitude: 312.33087,
      declination: -17.103528,
      siderealTime: 356.157722 - 93.82015,
      hourAngle: 307.539449 - 360,
      azimuth: 126.171556,
      elevation: 20.19,
    },
  },
  "Philadelphia, PA": {
    latitude: 39.949444,
    longitude: -75.150278,
    when: new Date("1976-07-04T12:00:00-04:00"),
    times: {
      rise: new Date("1976-07-04T05:37:13-04:00"), // 5.620365
      noon: new Date("1976-07-04T13:05:00-04:00"), // 13.083555
      set: new Date("1976-07-04T20:32:46-04:00"), // 20.546170
    },
    internal: {
      julianDate: 2442964.166667,
      ephemerisDay: -8580.83253,
      meanAnomaly: mod(-8099.743312, 360),
      eclipticLongitude: 102.781967,
      equationOfTime: 4.400671 / 1440,
      declination: 22.82522,
      rightAscension: 103.889441,
      siderealTime: 162.784864 - 75.150278,
      hourAngle: 343.748087 - 360, // topocentric local hour angle
      elevation: 68.044698, // topocentric elevation angle
      azimuth: 136.392115, // topocentric azimuth angle
    },
  },
  /*
    Date (M/D/YYYY),Time (H:MM:SS),Top. azimuth angle (eastward from N),Local sunrise time,Local sun transit time,Local sunset time,Julian day,Julian ephemeris day,Mean anomaly (sun),Apparent sun longitude,Greenwich mean sidereal time,Topocentric sun declination,Topocentric sun right ascension,Topocentric local hour angle,Top. elevation angle (uncorrected),Equation of time
    8/24/2022,12:00:00,157.239910,5.995393,13.005222,19.997578,2459815.875000,2459815.875750,8509.305192,151.194254,107.626799,11.048136,153.228887,344.918450,48.693250,-2.414949
    */
  "Kyiv, Ukraine": {
    latitude: 50.4501,
    longitude: 30.5234,
    when: new Date("2022-08-24T12:00:00+03:00"),
    times: {
      rise: new Date("2022-08-24T05:59:43+03:00"), // 5.995393
      noon: new Date("2022-08-24T13:00:19+03:00"), // 13.005222
      set: new Date("2022-08-24T19:59:51+03:00"), // 19.997578
    },
    internal: {
      julianDate: 2459815.875,
      ephemerisDay: 2459815.87575 - 2451545.0,
      meanAnomaly: mod(8509.305192, 360),
      eclipticLongitude: 151.194254,
      equationOfTime: 2.414949 / 1440,
      declination: 11.048136,
      rightAscension: 153.228887,
      siderealTime: 107.626799 + 30.4324,
      hourAngle: 344.91845 - 360, // topocentric local hour angle
      elevation: 48.69325, // topocentric elevation angle
      azimuth: 157.23991, // topocentric azimuth angle
    },
  },
};

Object.keys(places).forEach((name) => {
  const place = places[name];
  const view = SunSector.from(place.latitude, place.longitude).at(place.when);
  const r = (n) => n.toFixed(4);
  describe(`Calculation for ${name}`, () => {
    Object.keys(place.internal).forEach((fn) => {
      const calc = view[fn];
      const exp = place.internal[fn];
      it(`computes a value for ${fn}`, () => expect(calc).toBeDefined());
      it(`yields ${fn} ${r(calc)} ≅ ${r(exp)}`, () =>
        expect(abs(calc - exp)).toBeLessThan(expectedPrecision[fn]));
    });
    Object.keys(place.times).forEach((fn) => {
      const calc = view.times[fn];
      const exp = place.times[fn];
      it(`yields correct time ${calc} ≅ ${exp} for ${fn}`, () =>
        expect(abs(calc - exp)).toBeLessThan(expectedPrecision[fn]));
    });
  });
});

import memoize from 'fast-memoize';

const divideBy255 = memoize((val) => val / 255);
const plus0055divideBy1055 = (val) => (val + 0.055) / 1.055;
const step1Pow =  (val) => Math.pow(plus0055divideBy1055(val), 2.4);
const divideBy1292 = memoize((val) => val / 12.92);
const sixteenDivideBy116 = 16/116;

export default function rgb2lab(rgb){
  let r = divideBy255(rgb[0]),
      g = divideBy255(rgb[1]),
      b = divideBy255(rgb[2]),
      x, y, z;

  r = (r > 0.04045) ? step1Pow(r) : divideBy1292(r);
  g = (g > 0.04045) ? step1Pow(g) : divideBy1292(g);
  b = (b > 0.04045) ? step1Pow(b) : divideBy1292(b);

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + sixteenDivideBy116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + sixteenDivideBy116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + sixteenDivideBy116;

  return { l: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z) }
}

export function lab2rgb(lab){
  let y = (lab[0] + 16) / 116,
      x = lab[1] / 500 + y,
      z = y - lab[2] / 200,
      r, g, b;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return [Math.max(0, Math.min(1, r)) * 255,
          Math.max(0, Math.min(1, g)) * 255,
          Math.max(0, Math.min(1, b)) * 255]
}
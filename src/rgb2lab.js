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
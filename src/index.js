import ciede2000 from "./dE00";
import KMeansCluster from './cluster';
import rgb2lab  from './rgb2lab';

function disableSmoothRendering(ctx) {
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function centroidsConverged(delta) {
    /**
     * determine if two consecutive set of centroids are converged given a maximum delta.
     *
     * @param [[number]] centroids - list of vectors with same dimension as observations
     * @param [[number]] newCentroids - list of vectors with same dimension as observations
     * @param number delta - the maximum difference between each centroid in consecutive runs for convergence
     */
    return function(model, newModel) {
        const centroids = model.centroids;
        const newCentroids = newModel.centroids;

        const k = centroids.length; // number of clusters/centroids
        for(let i = 0; i < k; i += 1) {
            if(distance(centroids[i], newCentroids[i]) > delta) {
                return false;
            }
        }

        return true;
    }
}

export function distance(p, q) {
  const [ l1, a1, b1 ] = [p[0], p[1], p[2]];
  const [ l2, a2, b2 ] = [q[0], q[1], q[2]];

  return ciede2000({ L: l1, a: a1, b: b1}, { L: l2, a: a2, b: b2})
}

export default class MajorColors {
  constructor(originalImage) {
    this.originalImage = originalImage;
    this.canvas = document.createElement('canvas');
  }

  getMajorColors = ({ k: numberOfColors = 5, quality = 1 }) => {
    const { width, height } = this.originalImage;
    const ratio = Math.min(1, quality);
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.originalImage, 0, 0, width * ratio, height * ratio);
    const imageData = ctx.getImageData(0, 0, width * ratio, height * ratio);
    const pixelData = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      // convert to lab
      const {l, a, b} = rgb2lab([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]]);
      pixelData.push([l, a, b])
    }
    // use a lab special diff function
    const cluster = new KMeansCluster({ distanceFn: distance, maximumIterations: 20, convergedFn: centroidsConverged(1.5) });
    return cluster.cluster(pixelData, numberOfColors);
  };

  toPixelatedDataUrlSync = ({ percentage }) => {
    const { width, height } = this.originalImage;
    const w = width * (percentage <= 0 ? 0.01 : percentage);
    const h = height * (percentage <= 0 ? 0.01 : percentage);
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = disableSmoothRendering(this.canvas.getContext('2d'));
    // render smaller image
    ctx.drawImage(this.originalImage, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    ctx.putImageData(imageData, 0, 0);
    // stretch the smaller image
    ctx.drawImage(this.canvas, 0, 0, w, h, 0, 0, width, height);
    return this.canvas.toDataURL('image/png');
  };

  toPixelatedDataUrl = ({ percentage }) => {
    return this.toPixelatedDataUrlSync({ percentage })
  };
}
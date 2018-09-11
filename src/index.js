import ciede2000 from "./dE00";
import KMeansCluster from 'k-means-plus';
import rgb2lab, { lab2rgb }  from './rgb2lab';
import countBy from 'lodash/countBy';
import sortBy from 'lodash/sortBy';

// https://en.wikipedia.org/wiki/Just-noticeable_difference
const JND = 2.3;

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

  getMajorColors = ({ numberOfColors = 5, quality = 1 }) => {
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
    const cluster = new KMeansCluster({ distanceFn: distance, maximumIterations: 20, convergedFn: centroidsConverged(JND) });
    const { model: { centroids, assignments } } = cluster.cluster(pixelData, numberOfColors);
    let order = countBy(assignments);
    order = sortBy(Object.entries(order), i => -i[1]);
    return order.map(o => {
      return lab2rgb(centroids[o[0]]);
    });
  };
}
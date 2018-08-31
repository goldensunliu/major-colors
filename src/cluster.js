/**
 * given a set of n weights,
 * choose a value in the range 0..n-1
 * at random using weights as a distribution.
 *
 * @param {*} weights
 * @param normalizationWeight
 */
function weightedRandomIndex(weights, normalizationWeight) {
  const n = weights.length;
  if(typeof normalizationWeight !== 'number') {
    normalizationWeight = 0.0;
    for(let i = 0; i < n; i += 1) {
      normalizationWeight += weights[i];
    }
  }


  const r = Math.random();  // uniformly random number 0..1 (a probability)
  let cumulativeWeight = 0.0;
  for(let i = 0; i < n; i += 1) {
    //
    // use the uniform probability to search
    // within the normalized weighting (we divide by totalWeight to normalize).
    // once we hit the probability, we have found our index.
    //
    cumulativeWeight += weights[i] / normalizationWeight;
    if(cumulativeWeight > r) {
      return i;
    }
  }

  throw Error("algorithmic failure choosing weighted random index");
}

/**

 * determine if two consecutive set of clusters are converged;
 * the clusters are converged if the cluster assignments are the same.
 *
 * @param {*} model - object with observations, centroids, assignments
 * @param {*} newModel - object with observations, centroids, assignments
 */
function assignmentsConverged(model, newModel) {
  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a === undefined || b === undefined) return false;
    if (a === null || b === null) return false;
    if (a.length !== b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  return arraysEqual(model.assignments, newModel.assignments);
}

function distanceSquared(p, q) {
  const d = p.length; // dimension of vectors

  if(d !== q.length) throw Error("p and q vectors must be the same length");

  let sum = 0;
  for(let i = 0; i < d; i += 1) {
    sum += (p[i] - q[i])**2
  }
  return sum;
}

function distance(p, q) {
  return Math.sqrt(distanceSquared(p, q));
}

/**
 * Calculate the centroid for the given observations.
 * This takes the average of all observations (at each dimension).
 * This average vector is the centroid for those observations.
 *
 * @return [number] centroid for given observations (vector of same dimension as observations)
 * @param observations
 */
function calculateCentroid(observations) {
  const n = observations.length;      // number of observations
  const d = observations[0].length;   // dimension of vectors

  // create zero vector of same dimension as observation
  let centroid = [];
  for(let i = 0; i < d; i += 1) {
    centroid.push(0.0);
  }

  //
  // sum all observations at each dimension
  //
  for(let i = 0; i < n; i += 1) {
    //
    // add the observation to the sum vector, element by element
    // to prepare to calculate the average at each dimension.
    //
    for(let j = 0; j < d; j += 1) {
      centroid[j] += observations[i][j];
    }
  }

  //
  // divide each dimension by the number of observations
  // to create the average vector.
  //
  for(let j = 0; j < d; j += 1) {
    centroid[j] /= n;
  }

  return centroid;
}

export default class Cluster {
  constructor(options) {
    this.distanceFn = options.distanceFn || distance;
    this.convergedFn = options.convergedFn || assignmentsConverged;
    this.maximumIterations = options.maximumIterations || 200;
    this.debug = options.debug || false;
  }

  findClosestCentroid = (centroids, observation) => {
    const k = centroids.length; // number of clusters/centroids

    let centroid = 0;
    let minDistance = this.distanceFn(centroids[0], observation);
    for(let i = 1; i < k; i += 1) {
      const dist = this.distanceFn(centroids[i], observation);
      if(dist < minDistance) {
        centroid = i;
        minDistance = dist;
      }
    }
    return centroid;
  };

  assignClusters = (centroids, observations) => {
    const n = observations.length;  // number of observations

    const assignments = [];
    for(let i = 0; i < n; i += 1) {
      assignments.push(this.findClosestCentroid(centroids, observations[i]));
    }

    return assignments; // centroid index for each observation
  };

  kmeansStep = (centroids, observations) => {
    const k = centroids.length; // number of clusters/centroids

    // assign each observation to the nearest centroid to create clusters
    const assignments = this.assignClusters(centroids, observations); // array of cluster indices that correspond observations

    // calculate a new centroid for each cluster given the observations in the cluster
    const newCentroids = [];
    for(let i = 0; i < k; i += 1) {
      // get the observations for this cluster/centroid
      const clusteredObservations = observations.filter((v, j) => assignments[j] === i);

      // calculate a new centroid for the observations
      newCentroids.push(calculateCentroid(clusteredObservations));
    }
    return {'observations': observations, 'centroids': newCentroids, 'assignments': assignments }
  };

  clusterModel = (model) => {
    const start = new Date();
    // calculate new centroids and cluster assignments
    let newModel = this.kmeansStep(model.centroids, model.observations);

    // continue until centroids do not change (within given delta)
    let i = 0;
    while((i < this.maximumIterations) && !this.convergedFn(model, newModel)) {
      model = newModel;   // new model is our model now
      // calculate new centroids and cluster assignments
      newModel = this.kmeansStep(model.centroids, model.observations);
      i += 1;
    }
    const finish = new Date();
    return {'model': newModel, 'iterations': i, 'durationMs': (finish.getTime() - start.getTime())};
  };

  cluster = (observations, k) => {
    const model = this.init(observations, k);
    return this.clusterModel(model)
  };

  init = (observations, k) => {

    const n = observations.length;
    const distanceToCloseCentroid = []; // distance D(x) to closest centroid for each observation
    const centroids = [];   // indices of observations that are chosen as centroids

    //
    // keep list of all observations' indices so
    // we can remove centroids as they are created
    // so they can't be chosen twice
    //
    const index = [];
    for(let i = 0; i < n; i += 1) {
      index[i] = i;
    }

    //
    //  1. Choose one center uniformly at random from among the data points.
    //
    let centroidIndex = Math.floor(Math.random() * n);
    centroids.push(centroidIndex);

    for(let c = 1; c < k; c += 1) {
      index.slice(centroids[c - 1], 1);    // remove previous centroid from further consideration
      distanceToCloseCentroid[centroids[c - 1]] = 0;  // this effectively removes it from the probability distribution

      //
      // 2. For each data point x, compute D(x), the distance between x and
      //    the nearest center that has already been chosen.
      //
      // NOTE: we used the distance squared (L2 norm)
      //
      let totalWeight = 0.0;
      for(let i = 0; i < index.length; i += 1) {
        //
        // if this is the first time through, the distance is undefined, so just set it.
        // Otherwise, choose the minimum of the prior closest and this new centroid
        //
        const distanceToCentroid = this.distanceFn(observations[index[i]], observations[centroids[c - 1]]);
        distanceToCloseCentroid[index[i]] =
          (typeof distanceToCloseCentroid[index[i]] === 'number')
            ? Math.min(distanceToCloseCentroid[index[i]], distanceToCentroid)
            : distanceToCentroid;
        totalWeight += distanceToCloseCentroid[index[i]];
      }

      //
      //  3. Choose one new data point at random as a new center,
      //     using a weighted probability distribution where a point x is chosen with probability proportional to D(x)^2.
      //
      centroidIndex = index[weightedRandomIndex(distanceToCloseCentroid, totalWeight)];
      centroids.push(centroidIndex);

      //  4. Repeat Steps 2 and 3 until k centers have been chosen.
    }

    //
    //  5. Now that the initial centers have been chosen, proceed using
    //     standard k-means clustering. Return the model so that
    //     kmeans can continue.
    //
    return {
      observations,
      centroids: centroids.map(x => observations[x]), // map centroid index to centroid value
      assignments: observations.map((x, i) => i % centroids.length) // distribute among centroids
    }
  }
}
# major-colors
Color segmentation using kmeans+++ for clustering and CIEDE2000 algorithm for color distance.
Attempt to generate the optimal color palette given an image

[Blog Post](https://medium.com/@sitianliu_57680/how-to-pick-the-optimal-color-palette-from-any-image-ef1342da8b4f)

## Client-only!
This implementation relies on the canvas api to process the image

### Install
```
npm i major-colors
yarn add major-colors
```
### Usage
```javascript
import MajorColors from 'major-colors'

const majorColors = new MajorColors(imageDomNode);
const { clusterResult, colors } =
  majorColors.getMajorColors({ numberOfColors: 5, quality: .10});
```
### Outputs
#### colors `[[number]]` 
an array of arrays which represent the colors in RGB vector
#### clusterResult - raw cluster ouput from [k-means-plus](https://github.com/goldensunliu/k-means-plus#outputs)
```flow js
type result = {
  model: {
    observations: [[number]], // the original vectors: colors in Lab space
    centroids: [[number]], // vectors of final cluster centers: colors in Lab space
    assignments: [number] // mapping from index of original vector to the index of cluter center it belongs to
  },
  iterations: number, // number of iterations ran before converging
  durationMs: number // the duration of the algorithm
}
```

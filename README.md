# major-colors
Color segmentation using kmeans+++ for clustering and CIEDE2000 algorithm for color distance.
Attempt to generate the optimal color palette given an image

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
const rGBcolorsInSortedOrder = 
  majorColors.getMajorColors({ numberOfColors: 5, quality: .10});
```

![](./badge.svg)

# SpikeMap

A configurable spike map with optional voronoi mouseover events.

See the [demo page](https://reuters-graphics.github.io/chart-module-spike-map/).

### Install

```bash
yarn add https://github.com/reuters-graphics/chart-module-spike-map.git
```

### Use

```javascript
import SpikeMap from '@reuters-graphics/chart-module-spike-map';

const chart = new SpikeMap();

// To create your chart, pass a selector string to the chart's selection method,
// as well as any props or data to their respective methods. Then call draw.
chart
  .selection('#chart')
  // Must pass topojson to this chart!
  .geoData(someTopojson)
  // ... AND an array of data objects, each with at least one prop that can be tied
  // to an id or property in the topojson
  .data([{ /* ... */ }, { /* ... */ }])
  .props({
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    aspectHeight: 0.7,
    // Any d3-geo projection
    projection: 'geoNaturalEarth1',
    // Array of 2 [lat, lon] points to clip the map
    clipExtent: null, 
    geometries: {
      // Get objects from topojson
      getObjects: objects => objects[Object.keys(objects)[0]],
      // Can pass a filter function to filter topojson features
      filter: null,
      // Explicitly set centroid if that data is in topojson,
      // otherwise it will be automatically calculated
      getCentroid: null,
      // Getter for the ID that will tie topojson to data
      getId: d => d.id,
      // Getter to add additional classes to svg paths based on feature properties
      addClass: d => '',
      fill: '#ddd',
      stroke: '#fff',
      strokeWidth: 1,
    },
    spikes: {
      // Getter for the ID that matches toposon ID
      getFeatureId: d => d,
      // Getter for numeric value spikes will represent
      getValue: d => d.value,
      // Range in height of spikes in pixels
      range: [0, 40],
      // Pixel width of base of spike
      base: 4,
      // Getter to add additional classes to svg paths based on data properties
      addClass: d => '',
      fill: 'transparent',
      stroke: '#333',
      strokeWidth: 1,
    },
    voronoi: {
      draw: true,
      // See Voronoi mouse events and tooltips below...
      mouseover: (mouseEvent, datum, selections) => null,
      mouseout: (mouseEvent, datum, selections) => null,
    },
  })
  .draw();

```

To apply this chart's default styles when using SCSS, simply define the variable `$SpikeMap-container` to represent the ID or class of the chart's container(s) and import the `_chart.scss` partial.

```CSS
$SpikeMap-container: '#chart';

@import '~@reuters-graphics/chart-module-spike-map/src/scss/chart';
```

### Data

This chart requires two datasets: a topojson whose geometry features match to a data collection with at least one numeric value which will be used to determine the height of the spikes. They are passed to the `.geoData` and `.data` methods on your chart, respectively.

You **must** tie those two datasets together with a single ID in the `geometries.getId` and `spikes.getFeatureId` getters in props in order for this map to associate a spike with the correct geometry.

So say your topojson included features like this:

```javascript
[
  {
    type: 'Feature',
    properties: {
      id: 'USA',
      name: 'United States'
    },
    geometry: { /* ... */ }
  },
  // ...
]
```

... and your data looked like this:

```javascript
[
  {
    country: 'USA',
    gdp: 21.43,
  },
  // ...
]
```

... then you should pass props to your chart like this:

```javascript
chart
  .geoData(myTopojson)
  .data(myData)
  .props({
    geometries: {
      getId: d => d.properties.id
    },
    spikes: {
      getFeatureId: d => d.country,
      getValue: d => d.gdp,
    },
    // ...
  })
  .draw();
```

### B. Y. O. Legend

Bring your own map legends. This chart expects you to draw your own.

Remember you can always hook into the chart's svg using the API like this:

```javascript
chart.selection()
  .select('svg')
  .appendSelect('g.legend')
  // Add your legend...
```

### Voronoi mouse events and tooltips

This chart will draw a voronoi layer and provide callbacks for mousevents you can configure to do things like add tooltips to your map or update other parts of your page. Callbacks will be passed arguments including the mouse event, properties of the datapoint the user has selected and d3 selections representing the spikes and geometries/paths.

For example:

```javascript
{
  voronoi: {
    mouseover: (mouseEvent, datum, selections) => {
      const { selected, spikes, geometries } = selections;
      const { spike, geometry } = selected;
      // do stuff on mouseover like...
      spike.style('fill', 'red');
    }
    mouseout: (mouseEvent, datum, selections) => {
      const { spikes, geometries } = selections;
      // do stuff on mouseout like...
      spikes.style('fill', 'transparent');
    }
  }
}
```

## Developing chart modules

Read more in the [DEVELOPING docs](./DEVELOPING.md) about how to write your chart module.

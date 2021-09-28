import 'd3-transition';

import * as d3 from 'd3-selection';
import * as d3Geo from 'd3-geo';
import * as topojson from 'topojson-client';

import { appendSelect } from 'd3-appendselect';
import { extent } from 'd3-array';
import { geoVoronoi } from 'd3-geo-voronoi';
import makeClipBox from './utils/makeClipBox';
import { merge } from 'lodash-es';
import { scaleLinear } from 'd3-scale';
import slugify from '@sindresorhus/slugify';

d3.selection.prototype.appendSelect = appendSelect;

/**
 * Write your chart as a class with a single draw method that draws
 * your chart! This component inherits from a base class you can
 * see and customize in the baseClasses folder.
 */
class SpikeMap {
  selection(selector) {
    if (!selector) return this._selection;
    this._selection = d3.select(selector);
    return this;
  }

  geoData(topojson) {
    if (!topojson && !this._geoData) {
      throw new Error('Must pass topojson to chart.geoData()');
    }
    if (!topojson) return this._geoData;
    this._geoData = topojson;
    return this;
  }

  data(newData) {
    if (!newData && !this._data) {
      throw new Error('Must pass data to chart.data()');
    }
    if (!newData) return this._data;
    this._data = newData;
    return this;
  }

  props(newProps) {
    if (!newProps) return this._props || this.defaultProps;
    this._props = merge(this._props || this.defaultProps, newProps);
    return this;
  }

  /**
   * Default props are the built-in styles your chart comes with
   * that you want to allow a user to customize. Remember, you can
   * pass in complex data here, like default d3 axes or accessor
   * functions that can get properties from your data.
   */
  defaultProps = {
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    aspectHeight: 0.7,
    projection: 'geoNaturalEarth1',
    clipExtent: null,
    geometries: {
      getObjects: (objects) => objects[Object.keys(objects)[0]],
      filter: null,
      getCentroid: null,
      getId: (d) => d.id,
      addClass: (d) => '',
      fill: '#ddd',
      stroke: '#fff',
      strokeWidth: 1,
    },
    spikes: {
      getFeatureId: (d) => d,
      getValue: (d) => d.value,
      range: [0, 40],
      base: 4,
      addClass: (d) => '',
      fill: 'transparent',
      stroke: '#333',
      strokeWidth: 1,
    },
    voronoi: {
      draw: true,
      mouseover: (e, d, s) => null,
      mouseout: (e, d, s) => null,
    },
  };

  /**
   * Write all your code to draw your chart in this function!
   * Remember to use appendSelect!
   */
  draw() {
    const data = this.data();
    const props = this.props();
    const geoData = this.geoData();

    const { margin } = props;

    const container = this.selection().node();
    const { width: containerWidth } = container.getBoundingClientRect();

    const width = containerWidth - margin.left - margin.right;
    const height =
      containerWidth * props.aspectHeight - margin.top - margin.bottom;

    const yScale = scaleLinear()
      .domain(extent(data, props.spikes.getValue))
      .range(props.spikes.range);

    if (!d3Geo[props.projection]) props.projection = 'geoNaturalEarth1';

    const projection = d3Geo[props.projection]();

    const geoFeatures = topojson.feature(
      geoData,
      props.geometries.getObjects(geoData.objects)
    );

    if (props.geometries.filter) {
      geoFeatures.features = geoFeatures.features.filter(
        props.geometries.filter
      );
    }

    if (props.clipExtent) {
      projection.fitSize([width, height], makeClipBox(props.clipExtent));
    } else {
      projection.fitSize([width, height], geoFeatures);
    }

    const path = d3Geo.geoPath().projection(projection);

    const centroids = geoFeatures.features.map((d) => ({
      id: props.geometries.getId(d),
      centroid: props.geometries.getCentroid ?
          props.geometries.getCentroid(d) :
        projection.invert(path.centroid(d)),
    }));

    const voronoiCentroids = centroids.map(({ id, centroid }) => ({
      type: 'Feature',
      properties: {
        datum: data.find((d) => props.spikes.getFeatureId(d) === id),
      },
      geometry: { type: 'Point', coordinates: centroid },
    }));

    const plot = this.selection()
      .appendSelect('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .appendSelect('g.plot')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const transition = plot.transition().duration(500);

    const geometries = plot.appendSelect('g.geometries');

    geometries
      .selectAll('path')
      .data(geoFeatures.features)
      .join('path')
      .attr('id', (d) => `geometry-${slugify(props.geometries.getId(d))}`)
      .attr('class', (d) => props.geometries.addClass(d))
      .attr('d', path)
      .style('fill', props.geometries.fill)
      .style('stroke', props.geometries.stroke)
      .style('stroke-width', props.geometries.strokeWidth);

    const spikes = plot.appendSelect('g.spikes');

    spikes
      .selectAll('path')
      // Ensure every data point has a corresponding geometry...
      .data(
        data.filter((d) =>
          centroids.find((c) => c.id === props.spikes.getFeatureId(d))
        )
      )
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('id', (d) => `spike-${slugify(props.spikes.getFeatureId(d))}`)
            .attr('class', (d) => props.spikes.addClass(d))
            .attr('d', function(d) {
              const featureId = props.spikes.getFeatureId(d);
              const { centroid } = centroids.find((c) => c.id === featureId);
              const c = projection(centroid);
              const y = yScale(props.spikes.getValue(d));
              const b = props.spikes.base / 2;
              return `M${
                c[0] - b
              } ${c[1]} L${c[0]} ${c[1] - y} L${c[0] + b} ${c[1]}`;
            }),
        (update) =>
          update.call((update) =>
            update.transition(transition).attr('d', function(d) {
              const featureId = props.spikes.getFeatureId(d);
              const { centroid } = centroids.find((c) => c.id === featureId);
              const c = projection(centroid);
              const y = yScale(props.spikes.getValue(d));
              const b = props.spikes.base / 2;
              return `M${
                c[0] - b
              } ${c[1]} L${c[0]} ${c[1] - y} L${c[0] + b} ${c[1]}`;
            })
          ),
        (exit) => exit.remove()
      )
      .style('pointer-events', 'none')
      .style('fill', props.spikes.fill)
      .style('stroke', props.spikes.stroke)
      .style('stroke-width', props.spikes.strokeWidth);

    if (!props.voronoi.draw) return this;

    plot
      .appendSelect('g.voronoi')
      .style('pointer-events', 'all')
      .selectAll('path')
      .data(geoVoronoi().polygons(voronoiCentroids).features)
      .join('path')
      .style('fill', 'transparent')
      .attr('d', path)
      .on('mouseover', (event, voronoi) => {
        const { datum } = voronoi.properties.site.properties;
        const spike = spikes.select(
          `#spike-${slugify(props.spikes.getFeatureId(datum))}`
        );
        const geometry = geometries.select(
          `#geometry-${slugify(props.spikes.getFeatureId(datum))}`
        );
        geometry.raise();
        props.voronoi.mouseover(event, datum, {
          selected: { spike, geometry },
          spikes: spikes.selectAll('path'),
          geometries: geometries.selectAll('path'),
        });
      })
      .on('mouseout', (event, voronoi) => {
        const { datum } = voronoi.properties.site.properties;
        props.voronoi.mouseout(event, datum, {
          spikes: spikes.selectAll('path'),
          geometries: geometries.selectAll('path'),
        });
      });

    return this;
  }
}

export default SpikeMap;

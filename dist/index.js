import 'd3-transition';
import { selection, select } from 'd3-selection';
import * as d3Geo from 'd3-geo';
import { geoPath } from 'd3-geo';
import { appendSelect } from 'd3-appendselect';
import { extent } from 'd3-array';
import { geoVoronoi } from 'd3-geo-voronoi';
import { merge } from 'lodash-es';
import { scaleLinear } from 'd3-scale';
import slugify from '@sindresorhus/slugify';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function identity(x) {
  return x;
}

function transform(transform) {
  if (transform == null) return identity;
  var x0,
      y0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(input, i) {
    if (!i) x0 = y0 = 0;
    var j = 2, n = input.length, output = new Array(n);
    output[0] = (x0 += input[0]) * kx + dx;
    output[1] = (y0 += input[1]) * ky + dy;
    while (j < n) output[j] = input[j], ++j;
    return output;
  };
}

function reverse(array, n) {
  var t, j = array.length, i = j - n;
  while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
}

function feature(topology, o) {
  return o.type === "GeometryCollection"
      ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
      : feature$1(topology, o);
}

function feature$1(topology, o) {
  var id = o.id,
      bbox = o.bbox,
      properties = o.properties == null ? {} : o.properties,
      geometry = object(topology, o);
  return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
      : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
      : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
}

function object(topology, o) {
  var transformPoint = transform(topology.transform),
      arcs = topology.arcs;

  function arc(i, points) {
    if (points.length) points.pop();
    for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
      points.push(transformPoint(a[k], k));
    }
    if (i < 0) reverse(points, n);
  }

  function point(p) {
    return transformPoint(p);
  }

  function line(arcs) {
    var points = [];
    for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
    if (points.length < 2) points.push(points[0]); // This should never happen per the specification.
    return points;
  }

  function ring(arcs) {
    var points = line(arcs);
    while (points.length < 4) points.push(points[0]); // This may happen if an arc has only two points.
    return points;
  }

  function polygon(arcs) {
    return arcs.map(ring);
  }

  function geometry(o) {
    var type = o.type, coordinates;
    switch (type) {
      case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
      case "Point": coordinates = point(o.coordinates); break;
      case "MultiPoint": coordinates = o.coordinates.map(point); break;
      case "LineString": coordinates = line(o.arcs); break;
      case "MultiLineString": coordinates = o.arcs.map(line); break;
      case "Polygon": coordinates = polygon(o.arcs); break;
      case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
      default: return null;
    }
    return {type: type, coordinates: coordinates};
  }

  return geometry(o);
}

var makeClipBox = (function (opts) {
  var lon0 = opts[0][0];
  var lon1 = opts[1][0];
  var lat0 = opts[0][1];
  var lat1 = opts[1][1]; // to cross antimeridian w/o ambiguity

  if (lon0 > 0 && lon1 < 0) {
    lon1 += 360;
  } // to make lat span unambiguous


  if (lat0 > lat1) {
    var tmp = lat0;
    lat0 = lat1;
    lat1 = tmp;
  }

  var dlon4 = (lon1 - lon0) / 4;
  return {
    type: 'Polygon',
    coordinates: [[[lon0, lat0], [lon0, lat1], [lon0 + dlon4, lat1], [lon0 + 2 * dlon4, lat1], [lon0 + 3 * dlon4, lat1], [lon1, lat1], [lon1, lat0], [lon1 - dlon4, lat0], [lon1 - 2 * dlon4, lat0], [lon1 - 3 * dlon4, lat0], [lon0, lat0]]]
  };
});

selection.prototype.appendSelect = appendSelect;
/**
 * Write your chart as a class with a single draw method that draws
 * your chart! This component inherits from a base class you can
 * see and customize in the baseClasses folder.
 */

var SpikeMap = /*#__PURE__*/function () {
  function SpikeMap() {
    _classCallCheck(this, SpikeMap);

    _defineProperty(this, "defaultProps", {
      margin: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      aspectHeight: 0.7,
      projection: 'geoNaturalEarth1',
      clipExtent: null,
      geometries: {
        getObjects: function getObjects(objects) {
          return objects[Object.keys(objects)[0]];
        },
        filter: null,
        getCentroid: null,
        getId: function getId(d) {
          return d.id;
        },
        addClass: function addClass(d) {
          return '';
        },
        fill: '#ddd',
        stroke: '#fff',
        strokeWidth: 1
      },
      spikes: {
        getFeatureId: function getFeatureId(d) {
          return d;
        },
        getValue: function getValue(d) {
          return d.value;
        },
        range: [0, 40],
        base: 4,
        addClass: function addClass(d) {
          return '';
        },
        fill: 'transparent',
        stroke: '#333',
        strokeWidth: 1
      },
      voronoi: {
        draw: true,
        mouseover: function mouseover(e, d, s) {
          return null;
        },
        mouseout: function mouseout(e, d, s) {
          return null;
        }
      }
    });
  }

  _createClass(SpikeMap, [{
    key: "selection",
    value: function selection(selector) {
      if (!selector) return this._selection;
      this._selection = select(selector);
      return this;
    }
  }, {
    key: "geoData",
    value: function geoData(topojson) {
      if (!topojson && !this._geoData) {
        throw new Error('Must pass topojson to chart.geoData()');
      }

      if (!topojson) return this._geoData;
      this._geoData = topojson;
      return this;
    }
  }, {
    key: "data",
    value: function data(newData) {
      if (!newData && !this._data) {
        throw new Error('Must pass data to chart.data()');
      }

      if (!newData) return this._data;
      this._data = newData;
      return this;
    }
  }, {
    key: "props",
    value: function props(newProps) {
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

  }, {
    key: "draw",

    /**
     * Write all your code to draw your chart in this function!
     * Remember to use appendSelect!
     */
    value: function draw() {
      var data = this.data();
      var props = this.props();
      var geoData = this.geoData();
      var margin = props.margin;
      var container = this.selection().node();

      var _container$getBoundin = container.getBoundingClientRect(),
          containerWidth = _container$getBoundin.width;

      var width = containerWidth - margin.left - margin.right;
      var height = containerWidth * props.aspectHeight - margin.top - margin.bottom;
      var yScale = scaleLinear().domain(extent(data, props.spikes.getValue)).range(props.spikes.range);
      if (!d3Geo[props.projection]) props.projection = 'geoNaturalEarth1';
      var projection = d3Geo[props.projection]();
      var geoFeatures = feature(geoData, props.geometries.getObjects(geoData.objects));

      if (props.geometries.filter) {
        geoFeatures.features = geoFeatures.features.filter(props.geometries.filter);
      }

      if (props.clipExtent) {
        projection.fitSize([width, height], makeClipBox(props.clipExtent));
      } else {
        projection.fitSize([width, height], geoFeatures);
      }

      var path = geoPath().projection(projection);
      var centroids = geoFeatures.features.map(function (d) {
        return {
          id: props.geometries.getId(d),
          centroid: props.geometries.getCentroid ? props.geometries.getCentroid(d) : projection.invert(path.centroid(d))
        };
      });
      var voronoiCentroids = centroids.map(function (_ref) {
        var id = _ref.id,
            centroid = _ref.centroid;
        return {
          type: 'Feature',
          properties: {
            datum: data.find(function (d) {
              return props.spikes.getFeatureId(d) === id;
            })
          },
          geometry: {
            type: 'Point',
            coordinates: centroid
          }
        };
      });
      var plot = this.selection().appendSelect('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).appendSelect('g.plot').attr('transform', "translate(".concat(margin.left, ",").concat(margin.top, ")"));
      var transition = plot.transition().duration(500);
      var geometries = plot.appendSelect('g.geometries');
      geometries.selectAll('path').data(geoFeatures.features).join('path').attr('id', function (d) {
        return "geometry-".concat(slugify(props.geometries.getId(d)));
      }).attr('class', function (d) {
        return props.geometries.addClass(d);
      }).attr('d', path).style('fill', props.geometries.fill).style('stroke', props.geometries.stroke).style('stroke-width', props.geometries.strokeWidth);
      var spikes = plot.appendSelect('g.spikes');
      spikes.selectAll('path') // Ensure every data point has a corresponding geometry...
      .data(data.filter(function (d) {
        return centroids.find(function (c) {
          return c.id === props.spikes.getFeatureId(d);
        });
      })).join(function (enter) {
        return enter.append('path').attr('id', function (d) {
          return "spike-".concat(slugify(props.spikes.getFeatureId(d)));
        }).attr('class', function (d) {
          return props.spikes.addClass(d);
        }).attr('d', function (d) {
          var featureId = props.spikes.getFeatureId(d);

          var _centroids$find = centroids.find(function (c) {
            return c.id === featureId;
          }),
              centroid = _centroids$find.centroid;

          var c = projection(centroid);
          var y = yScale(props.spikes.getValue(d));
          var b = props.spikes.base / 2;
          return "M".concat(c[0] - b, " ").concat(c[1], " L").concat(c[0], " ").concat(c[1] - y, " L").concat(c[0] + b, " ").concat(c[1]);
        });
      }, function (update) {
        return update.call(function (update) {
          return update.transition(transition).attr('d', function (d) {
            var featureId = props.spikes.getFeatureId(d);

            var _centroids$find2 = centroids.find(function (c) {
              return c.id === featureId;
            }),
                centroid = _centroids$find2.centroid;

            var c = projection(centroid);
            var y = yScale(props.spikes.getValue(d));
            var b = props.spikes.base / 2;
            return "M".concat(c[0] - b, " ").concat(c[1], " L").concat(c[0], " ").concat(c[1] - y, " L").concat(c[0] + b, " ").concat(c[1]);
          });
        });
      }, function (exit) {
        return exit.remove();
      }).style('pointer-events', 'none').style('fill', props.spikes.fill).style('stroke', props.spikes.stroke).style('stroke-width', props.spikes.strokeWidth);
      if (!props.voronoi.draw) return this;
      plot.appendSelect('g.voronoi').style('pointer-events', 'all').selectAll('path').data(geoVoronoi().polygons(voronoiCentroids).features).join('path').style('fill', 'transparent').attr('d', path).on('mouseover', function (event, voronoi) {
        var datum = voronoi.properties.site.properties.datum;
        var spike = spikes.select("#spike-".concat(slugify(props.spikes.getFeatureId(datum))));
        var geometry = geometries.select("#geometry-".concat(slugify(props.spikes.getFeatureId(datum))));
        geometry.raise();
        props.voronoi.mouseover(event, datum, {
          selected: {
            spike: spike,
            geometry: geometry
          },
          spikes: spikes.selectAll('path'),
          geometries: geometries.selectAll('path')
        });
      }).on('mouseout', function (event, voronoi) {
        var datum = voronoi.properties.site.properties.datum;
        props.voronoi.mouseout(event, datum, {
          spikes: spikes.selectAll('path'),
          geometries: geometries.selectAll('path')
        });
      });
      return this;
    }
  }]);

  return SpikeMap;
}();

export default SpikeMap;

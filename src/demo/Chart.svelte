<!-- ⭐ Write an interactive DEMO of your chart in this component.
Follow the notes below! -->
<script>
  export let responsive; // eslint-disable-line
  import { afterUpdate } from 'svelte';
  import Docs from './App/Docs.svelte';
  import Explorer from './App/Explorer.svelte';
  import SpikeMap from '../js/index';
  import AtlasMetadataClient from '@reuters-graphics/graphics-atlas-client';
  import geoData from './countries-110m.json';

  const client = new AtlasMetadataClient();
  const getCountriesByRegion = (region) =>
    client
      .getCountriesByRegion(region)
      .filter((d) => d.name !== 'Russia')
      .filter(
        (d) => d.dataProfile.population && d.dataProfile.population.d > 1000000
      );

  let countries = getCountriesByRegion('Asia and the Middle East');

  let chart = new SpikeMap();
  let chartContainer;

  let tooltipCountry = null;
  let tooltipPop = null;

  // 🎚️ Create variables for any data or props you want users to be able
  // to update in the demo. (And write buttons to update them below!)
  const tallSpikes = [20, 80];
  const shortSpikes = [10, 30];
  let spikeRange = shortSpikes;

  const fatBase = 16;
  const skinyBase = 8;
  let base = skinyBase;

  const interactiveVoronoi = {
    mouseover: (e, d, selections) => {
      tooltipCountry = d.name;
      tooltipPop = d.dataProfile.population.d.toLocaleString('en');
    },
  };
  const staticVoronoi = { mouseover: (d) => d, mouseout: (d) => d };
  let voronoi = staticVoronoi;

  const spikeClearFill = 'transparent';
  const spikeClearStroke = '#333';
  const spikeColourFill = '#FD9162';
  const spikeColourStroke = '#E73B41';
  let spikeFill = spikeClearFill;
  let spikeStroke = spikeClearStroke;
  // ...

  // 🎈 Tie your custom props back together into one chartProps object.
  $: chartProps = {
    geometries: {
      filter: (feature) =>
        countries
          .map((d) => d.isoNumeric.padStart(3, '0'))
          .includes(feature.id),
      fill: tooltipCountry
        ? (d) =>
            client.getCountry(parseInt(d.id).toString()).name === tooltipCountry
              ? '#bbb'
              : '#ddd'
        : '#ddd',
    },
    spikes: {
      getFeatureId: (d) => d.isoNumeric.padStart(3, '0'),
      getValue: (d) => d.dataProfile.population.d,
      range: spikeRange,
      base,
      fill: spikeFill,
      stroke: spikeStroke,
    },
    voronoi,
  };

  chart = new SpikeMap();

  afterUpdate(() => {
    chart
      .selection(chartContainer)
      .geoData(geoData)
      .data(countries) // Pass your chartData
      .props(chartProps) // Pass your chartProps
      .draw();

    chart
      .selection()
      .select('svg')
      .on('mouseleave', () => {
        tooltipCountry = null;
        tooltipPop = null;
      });
  });
</script>

<div
  id="spike-map-container"
  class:interactive={tooltipCountry}
  bind:this={chartContainer}
>
  {#if tooltipCountry}
    <div class="tooltip">
      <h4>{tooltipCountry}</h4>
      <p>{tooltipPop}</p>
    </div>
  {/if}
</div>

<div class="chart-options">
  <!-- ✏️ Create buttons that update your data/props variables when they're clicked! -->
  <button
    on:click={() => {
      countries = getCountriesByRegion('Asia and the Middle East');
    }}>Asia</button
  >
  <button
    on:click={() => {
      countries = getCountriesByRegion('Africa');
    }}>Africa</button
  >
  <button
    on:click={() => {
      spikeStroke =
        spikeStroke === spikeClearStroke ? spikeColourStroke : spikeClearStroke;
      spikeFill =
        spikeFill === spikeClearFill ? spikeColourFill : spikeClearFill;
    }}>{spikeStroke === spikeClearStroke ? 'Colour' : 'Black'}</button
  >
  <button
    on:click={() => {
      spikeRange = spikeRange === tallSpikes ? shortSpikes : tallSpikes;
    }}>{spikeRange === tallSpikes ? 'Shorter' : 'Taller'}</button
  >
  <button
    on:click={() => {
      base = base === skinyBase ? fatBase : skinyBase;
    }}>{base === skinyBase ? 'Fat' : 'Skinny'}</button
  >
  <button
    on:click={() => {
      voronoi = voronoi === staticVoronoi ? interactiveVoronoi : staticVoronoi;
    }}>{voronoi === staticVoronoi ? 'Voronoi On' : 'Voronoi Off'}</button
  >
</div>

<!-- ⚙️ These components will automatically create interactive documentation for you chart! -->
<Docs />
<Explorer title="Data" data={chart.selection() ? chart.data() : {}} />
<Explorer title="Props" data={chart.props()} />

<!-- 🖌️ Style your demo page here -->
<style lang="scss" global>
  .chart-options {
    button {
      padding: 5px 15px;
    }
  }
  #spike-map-container {
    position: relative;

    g.voronoi {
      path {
        cursor: default;
      }
    }

    &.interactive {
      g.voronoi {
        path {
          cursor: crosshair;
        }
      }
    }

    .tooltip {
      position: absolute;
      top: 0;
      left: 0;
      padding: 5px;
      background-color: rgba(255, 255, 255, 0.4);
      h4 {
        font-size: 14px;
        margin: 0 0 -5px;
      }
      p {
        font-family: monospace;
        font-size: 12px;
        margin: 0;
      }
    }
  }
</style>

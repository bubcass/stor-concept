<script lang="ts">
  import { base } from '$app/paths';
  import type { ChartStoryBlock } from '$lib/content/types';
  import * as Plot from '@observablehq/plot';
  import * as d3 from 'd3';
  import { onMount } from 'svelte';

  type CountRow = {
    name: string;
    votes: number;
    allocation: number;
    count: number;
    status: string;
    URI: string;
    party: string;
    election_year: number;
    quota: number;
    surname: string;
  };

  const PARTY_COLORS: Record<string, string> = {
    'Fianna Fáil': '#40b34e',
    'Sinn Féin': '#088460',
    'Fine Gael': '#303591',
    Independent: '#666666',
    'Labour Party': '#c82832',
    'Social Democrats': '#782b81',
    'Green Party': '#b4d143'
  };

  const STATUS_COLORS = {
    Continuing: '#8b816d',
    Eliminated: '#cfc6b8',
    Elected: '#1a1a1a'
  } as const;

  let { block }: { block: ChartStoryBlock } = $props();

  let rows = $state<CountRow[]>([]);
  let selectedCount = $state<number | null>(null);
  let errorMessage = $state<string | null>(null);
  let plotHost = $state<HTMLDivElement | null>(null);
  let plotElement = $state<ChildNode | null>(null);

  let availableCounts = $derived(
    [...new Set(rows.map((row) => row.count))].sort((a, b) => a - b)
  );

  let finalCount = $derived(
    selectedCount === null
      ? []
      : rows
          .filter((row) => row.count === selectedCount)
          .sort((a, b) => d3.descending(a.votes, b.votes))
  );

  let quota = $derived(finalCount[0]?.quota ?? 0);
  let fxDomain = $derived(finalCount.map((row) => row.surname || row.name));

  function memberImage(uri: string) {
    return `https://www.oireachtas.ie/en/members/member/${encodeURI(uri)}/image/`;
  }

  function partyColor(party: string) {
    return PARTY_COLORS[party] ?? '#8b816d';
  }

  onMount(() => {
    async function loadData() {
      try {
        const loaded = await d3.csv(`${base}${block.data}`, d3.autoType);
        rows = loaded as CountRow[];
        selectedCount = d3.max(rows, (row: CountRow) => row.count) ?? null;
      } catch (error) {
        console.error(error);
        errorMessage = 'Unable to load chart data.';
      }
    }

    loadData();

    return () => {
      if (plotElement) {
        plotElement.remove();
      }
    };
  });

  $effect(() => {
    if (!plotHost || !finalCount.length || selectedCount === null) return;

    if (plotElement) {
      plotElement.remove();
      plotElement = null;
    }

    const maxVotes = d3.max(finalCount, (row: CountRow) => row.votes) ?? 0;
    const yTop = Math.max(quota, maxVotes) + 20;
    const plotWidth = Math.max(640, fxDomain.length * 150);

    const plot = Plot.plot({
      width: plotWidth,
      height: 560,
      marginTop: 96,
      marginRight: 24,
      marginBottom: 72,
      marginLeft: 56,
      style: {
        background: 'transparent',
        fontFamily: 'var(--font-sans)',
        fontSize: '14px'
      },
      x: {
        domain: fxDomain,
        label: null,
        tickSize: 0
      },
      y: {
        domain: [0, yTop],
        grid: true,
        label: 'Votes'
      },
      color: {
        domain: ['Continuing', 'Eliminated', 'Elected'],
        range: [
          STATUS_COLORS.Continuing,
          STATUS_COLORS.Eliminated,
          STATUS_COLORS.Elected
        ],
        legend: true,
        label: 'Status'
      },
      marks: [
        Plot.ruleY([0], { stroke: '#d8d1c4' }),
        Plot.ruleY([quota], { stroke: '#9f9689', strokeDasharray: '4,4' }),
        Plot.waffleY(finalCount, {
          x: (row) => row.surname || row.name,
          y: 'votes',
          fill: 'status',
          unit: 1,
          gap: 1.5,
          rx: 1.5,
          title: (row) =>
            `${row.name}\nParty: ${row.party}\nCount: ${row.count}\nVotes: ${row.votes}\nStatus: ${row.status}`,
          tip: true
        }),
        Plot.text(finalCount, {
          x: (row) => row.surname || row.name,
          y: (row) => Math.max(row.votes, 2),
          text: (row) => String(row.votes),
          dy: -10,
          fontWeight: 600,
          fontSize: 12
        }),
        Plot.dot(finalCount, {
          x: (row) => row.surname || row.name,
          y: () => yTop - 7,
          r: 21,
          fill: '#f9f7f1',
          stroke: (row) => partyColor(row.party),
          strokeWidth: 3
        }),
        Plot.image(
          finalCount,
          {
            x: (row: CountRow) => row.surname || row.name,
            y: () => yTop - 7,
            src: (row: CountRow) => memberImage(row.URI),
            width: 34,
            height: 34,
            preserveAspectRatio: 'xMidYMid slice',
            clip: 'circle'
          } as any
        ),
        Plot.text(
          [{ label: `Quota ${quota}`, x: fxDomain[0], y: quota }],
          {
            x: 'x',
            y: 'y',
            text: 'label',
            textAnchor: 'start',
            dx: 8,
            dy: -8,
            fill: '#5c564e',
            fontSize: 12
          }
        )
      ]
    });

    plotHost.append(plot);
    plotElement = plot;
  });
</script>

<section class="chart-block">
  {#if block.title || block.caption}
    <div class="chart-block__intro">
      {#if block.title}
        <h2>{block.title}</h2>
      {/if}
      {#if block.caption}
        <p class="caption">{block.caption}</p>
      {/if}
    </div>
  {/if}

  <div class="chart-control">
    <label for="count-select">Count</label>
    <select
      id="count-select"
      bind:value={selectedCount}
      disabled={availableCounts.length < 2}
    >
      {#each availableCounts as count}
        <option value={count}>Count {count}</option>
      {/each}
    </select>
  </div>

  {#if errorMessage}
    <p class="chart-block__status">{errorMessage}</p>
  {:else if !rows.length}
    <p class="chart-block__status">Loading chart…</p>
  {:else}
    <div class="plot-container">
      <div bind:this={plotHost} class="plot-host"></div>
    </div>
  {/if}
</section>

<style>
  .chart-block {
    margin: var(--block-space) auto;
    max-width: min(var(--wide), calc(100vw - (var(--gutter) * 2)));
  }

  .chart-block__intro {
    margin: 0 auto var(--space-4);
    max-width: var(--measure);
  }

  .chart-block__intro h2 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
    text-wrap: balance;
  }

  .chart-block__intro .caption {
    margin: 0;
  }

  .chart-control {
    align-items: center;
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
    margin: 0 0 var(--space-3);
  }

  .chart-control label {
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: var(--font-size-small);
    line-height: var(--line-height-small);
  }

  .chart-control select {
    appearance: none;
    background: transparent;
    border: 1px solid var(--color-line);
    border-radius: 0;
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: var(--font-size-small);
    line-height: var(--line-height-small);
    padding: 0.5rem 2rem 0.5rem 0.75rem;
  }

  .chart-control select:disabled {
    color: var(--color-faint);
  }

  .plot-container {
    overflow-x: auto;
    padding-bottom: var(--space-2);
  }

  .plot-host {
    min-width: min(42rem, 100%);
  }

  .plot-host :global(svg) {
    height: auto;
    max-width: none;
  }

  .plot-host :global(.plot) {
    color: var(--color-ink);
  }

  .plot-host :global(.plot text),
  .plot-host :global(.plot legend) {
    font-family: var(--font-sans);
  }

  .plot-host :global(.plot .domain) {
    stroke: var(--color-line);
  }

  .plot-host :global(.plot .tick line),
  .plot-host :global(.plot .grid line) {
    stroke: #ded7cb;
  }

  .plot-host :global(.plot .tick text),
  .plot-host :global(.plot .label),
  .plot-host :global(.plot .legend text) {
    fill: var(--color-muted);
  }

  .chart-block__status {
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: var(--font-size-small);
    margin: 0;
  }

  @media (max-width: 700px) {
    .chart-control {
      justify-content: flex-start;
    }

    .plot-host {
      min-width: 40rem;
    }
  }
</style>

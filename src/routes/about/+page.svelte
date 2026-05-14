<svelte:head>
    <title>About | Stór | Oireachtas Research Repository</title>
    <meta name="description" content="About the Stór prototype." />
</svelte:head>

<section class="page-shell about">
    <p class="eyebrow">About</p>
    <h1>
        A prototype for a reworked research repository on <em
            >www.oireachtas.ie</em
        >
    </h1>
    <p class="lede">
        Stór demonstrates a clean static architecture for repository content,
        with typed articles, reusable blocks, local media and a build path for
        deployment.
    </p>
</section>

<style>
    .about {
        max-width: var(--measure-prose);
        padding-top: clamp(var(--space-7), 7vw, 4.75rem);
    }

    h1 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: var(--font-size-h1);
        font-weight: var(--font-weight-heading);
        line-height: var(--line-height-heading);
        margin: 0 0 var(--space-4);
    }
</style>

<script lang="ts">
    import "../styles.css";
    import { base } from "$app/paths";
    import { page } from "$app/state";

    let { children } = $props();
    const publisherPath = `${base}/publisher`;
    const isPublisherRoute = $derived(
        page.url.pathname === publisherPath ||
            page.url.pathname.startsWith(`${publisherPath}/`),
    );
</script>

<svelte:head>
    <title>Stór | Oireachtas Research Repository</title>
    <meta
        name="description"
        content="Research, committee and budget repository content from the Houses of the Oireachtas."
    />
</svelte:head>

<a class="skip-link" href="#content">Skip to content</a>

{#if isPublisherRoute}
    <header class="studio-header" aria-label="Publishing studio header">
        <div class="studio-header__inner">
            <span class="studio-header__mark" aria-hidden="true">
                <svg viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg" fill="none" role="presentation" focusable="false">
                    <path d="M12 9H26L32 5L38 9H52" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
                    <line x1="12" y1="10.5" x2="52" y2="10.5" stroke="currentColor" stroke-width="1.2" />
                    <rect x="12" y="10.5" width="40" height="13.5" stroke="currentColor" stroke-width="1.2" />
                    <line x1="27.5" y1="10.5" x2="27.5" y2="24" stroke="currentColor" stroke-width="1.1" />
                    <line x1="30" y1="10.5" x2="30" y2="24" stroke="currentColor" stroke-width="1.1" />
                    <line x1="34" y1="10.5" x2="34" y2="24" stroke="currentColor" stroke-width="1.1" />
                    <line x1="36.5" y1="10.5" x2="36.5" y2="24" stroke="currentColor" stroke-width="1.1" />
                    <line x1="26.5" y1="24" x2="37.5" y2="24" stroke="currentColor" stroke-width="1.2" />
                    <rect x="30.7" y="18.2" width="2.6" height="5.8" fill="currentColor" />
                    <rect x="15" y="13" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="19" y="13" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="23" y="13" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="39.3" y="13" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="43.3" y="13" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="47.3" y="13" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="15" y="18" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="19" y="18" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="23" y="18" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="39.3" y="18" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="43.3" y="18" width="1.7" height="1.7" fill="currentColor" />
                    <rect x="47.3" y="18" width="1.7" height="1.7" fill="currentColor" />
                    <line x1="12" y1="24" x2="52" y2="24" stroke="currentColor" stroke-width="1.2" />
                </svg>
            </span>
            <span class="studio-header__title">Oireachtas Digital Publishing Studio</span>
        </div>
    </header>
{:else}
    <header class="site-header" aria-label="Site header">
        <nav class="site-nav" aria-label="Primary navigation">
            <a class="brand" href="{base}/" aria-label="Stór | Oireachtas Research Repository home">
                <span class="brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg" fill="none" role="presentation" focusable="false">
                        <path d="M12 9H26L32 5L38 9H52" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
                        <line x1="12" y1="10.5" x2="52" y2="10.5" stroke="currentColor" stroke-width="1.2" />
                        <rect x="12" y="10.5" width="40" height="13.5" stroke="currentColor" stroke-width="1.2" />
                        <line x1="27.5" y1="10.5" x2="27.5" y2="24" stroke="currentColor" stroke-width="1.1" />
                        <line x1="30" y1="10.5" x2="30" y2="24" stroke="currentColor" stroke-width="1.1" />
                        <line x1="34" y1="10.5" x2="34" y2="24" stroke="currentColor" stroke-width="1.1" />
                        <line x1="36.5" y1="10.5" x2="36.5" y2="24" stroke="currentColor" stroke-width="1.1" />
                        <line x1="26.5" y1="24" x2="37.5" y2="24" stroke="currentColor" stroke-width="1.2" />
                        <rect x="30.7" y="18.2" width="2.6" height="5.8" fill="currentColor" />
                        <rect x="15" y="13" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="19" y="13" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="23" y="13" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="39.3" y="13" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="43.3" y="13" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="47.3" y="13" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="15" y="18" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="19" y="18" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="23" y="18" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="39.3" y="18" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="43.3" y="18" width="1.7" height="1.7" fill="currentColor" />
                        <rect x="47.3" y="18" width="1.7" height="1.7" fill="currentColor" />
                        <line x1="12" y1="24" x2="52" y2="24" stroke="currentColor" stroke-width="1.2" />
                    </svg>
                </span>
                <span class="brand-copy">
                    <span class="brand-title">Stór</span>
                    <span class="brand-subtitle">Oireachtas Research Repository</span>
                </span>
            </a>
            <div class="nav-links">
                <a href="{base}/committees/">Committees</a>
                <a href="{base}/parliamentary-budget-office/">Parliamentary Budget Office</a>
                <a href="{base}/library-research-service/">Library & Research Service</a>
                <a href="{base}/my-stor/">My Stór</a>
            </div>
        </nav>
    </header>
{/if}

<main id="content">
    {@render children()}
</main>

{#if !isPublisherRoute}
    <footer class="site-footer">
        <p>Stór | Oireachtas Research Repository</p>
    </footer>
{/if}

<style>
    .studio-header {
        background: #fafaf8;
        border-bottom: 1px solid #d7d7d2;
        color: #303030;
    }

    .studio-header__inner {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 0 auto;
        max-width: 1320px;
        padding: 1.9rem 1.1rem 1.8rem;
    }

    .studio-header__mark {
        display: inline-flex;
        width: 3.5rem;
    }

    .studio-header__mark :global(svg) {
        height: auto;
        width: 100%;
    }

    .studio-header__title {
        font-family:
            "IBM Plex Sans",
            system-ui,
            sans-serif;
        font-size: clamp(1.2rem, 2vw, 1.7rem);
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    @media (max-width: 640px) {
        .studio-header__inner {
            gap: 0.75rem;
            padding: 1.4rem 0.9rem;
        }

        .studio-header__mark {
            width: 2.9rem;
        }

        .studio-header__title {
            font-size: 1rem;
        }
    }
</style>

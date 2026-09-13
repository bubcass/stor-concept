<script lang="ts">
    import "../styles.css";
    import { base } from "$app/paths";
    import { page } from "$app/state";
    import { onMount } from "svelte";
    import BackToTop from "$lib/components/BackToTop.svelte";

    let { children } = $props();
    let theme = $state<'light' | 'dark'>('light');
    let isMobileViewport = $state(false);
    let mobileMastheadHidden = $state(false);
    let mobileSectionMenuOpen = $state(false);
    let mobileSectionActionsOpen = $state(false);
    let headerActionsOpen = $state(false);
    let mobileSectionMenu: HTMLDivElement | undefined = $state();
    let mobileSectionActions: HTMLDivElement | undefined = $state();
    let headerActions: HTMLDivElement | undefined = $state();
    const publisherPath = `${base}/publisher`;
    const proofOfConceptPath = `${base}/proof-of-concept`;
    const isPublisherRoute = $derived(
        page.url.pathname === publisherPath ||
            page.url.pathname.startsWith(`${publisherPath}/`),
    );
    const isProofOfConceptRoute = $derived(
        page.url.pathname === proofOfConceptPath ||
            page.url.pathname.startsWith(`${proofOfConceptPath}/`),
    );
    const isResourceRoute = $derived(
        (page.url.pathname.startsWith(`${base}/articles/`) && page.url.pathname !== `${base}/articles/`) ||
            (page.url.pathname.startsWith(`${base}/stories/`) && page.url.pathname !== `${base}/stories/`),
    );
    const activeSection = $derived.by(() => {
        const pathname = page.url.pathname.replace(/\/+$/, "") || "/";
        if (pathname.startsWith(`${base}/committees`)) return "committees";
        if (pathname.startsWith(`${base}/parliamentary-budget-office`)) return "pbo";
        if (pathname.startsWith(`${base}/library-research-service`)) return "lrs";
        if (pathname.startsWith(`${base}/my-stor`)) return "my-stor";
        return null;
    });
    const mobileSectionLabel = $derived.by(() => {
        if (activeSection === "committees") return "Committees";
        if (activeSection === "pbo") return "Parliamentary Budget Office";
        if (activeSection === "lrs") return "Library & Research Service";
        if (activeSection === "my-stor") return "My Stór";
        return "Stór";
    });
    const mobileSectionItems = [
        { href: `${base}/committees/`, label: "Committees" },
        { href: `${base}/parliamentary-budget-office/`, label: "Parliamentary Budget Office" },
        { href: `${base}/library-research-service/`, label: "Library & Research Service" },
        { href: `${base}/my-stor/`, label: "My Stór" },
    ];

    function isCurrentMobileSection(href: string) {
        const current = page.url.pathname.replace(/\/+$/, "") || "/";
        const target = href.replace(/\/+$/, "") || "/";
        return current === target;
    }

    function closeMobileTools() {
        mobileSectionMenuOpen = false;
        mobileSectionActionsOpen = false;
        headerActionsOpen = false;
    }

    function toggleTheme() {
        theme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = theme;
        window.dispatchEvent(new CustomEvent('stor:theme-changed', { detail: theme }));
        try {
            localStorage.setItem('stor-theme', theme);
        } catch {
            // The selected theme remains active for this visit when storage is unavailable.
        }
    }

    onMount(() => {
        theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        const syncHeader = () => {
            isMobileViewport = window.matchMedia("(max-width: 860px)").matches;
            mobileMastheadHidden = isMobileViewport && window.scrollY > 16;
        };
        const closeOnOutsideClick = (event: PointerEvent) => {
            if ((mobileSectionMenuOpen || mobileSectionActionsOpen || headerActionsOpen) && !mobileSectionMenu?.contains(event.target as Node) && !mobileSectionActions?.contains(event.target as Node) && !headerActions?.contains(event.target as Node)) closeMobileTools();
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeMobileTools();
        };
        syncHeader();
        window.addEventListener("scroll", syncHeader, { passive: true });
        window.addEventListener("pointerdown", closeOnOutsideClick);
        window.addEventListener("keydown", closeOnEscape);
        window.addEventListener('stor:toggle-theme', toggleTheme);
        return () => {
            window.removeEventListener("scroll", syncHeader);
            window.removeEventListener("pointerdown", closeOnOutsideClick);
            window.removeEventListener("keydown", closeOnEscape);
            window.removeEventListener('stor:toggle-theme', toggleTheme);
        };
    });
</script>

<svelte:head>
    <title>Stór | Independent Parliamentary Research</title>
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
                <svg
                    viewBox="0 0 64 28"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    role="presentation"
                    focusable="false"
                >
                    <path
                        d="M12 9H26L32 5L38 9H52"
                        stroke="currentColor"
                        stroke-width="1.2"
                        stroke-linejoin="round"
                    />
                    <line
                        x1="12"
                        y1="10.5"
                        x2="52"
                        y2="10.5"
                        stroke="currentColor"
                        stroke-width="1.2"
                    />
                    <rect
                        x="12"
                        y="10.5"
                        width="40"
                        height="13.5"
                        stroke="currentColor"
                        stroke-width="1.2"
                    />
                    <line
                        x1="27.5"
                        y1="10.5"
                        x2="27.5"
                        y2="24"
                        stroke="currentColor"
                        stroke-width="1.1"
                    />
                    <line
                        x1="30"
                        y1="10.5"
                        x2="30"
                        y2="24"
                        stroke="currentColor"
                        stroke-width="1.1"
                    />
                    <line
                        x1="34"
                        y1="10.5"
                        x2="34"
                        y2="24"
                        stroke="currentColor"
                        stroke-width="1.1"
                    />
                    <line
                        x1="36.5"
                        y1="10.5"
                        x2="36.5"
                        y2="24"
                        stroke="currentColor"
                        stroke-width="1.1"
                    />
                    <line
                        x1="26.5"
                        y1="24"
                        x2="37.5"
                        y2="24"
                        stroke="currentColor"
                        stroke-width="1.2"
                    />
                    <rect
                        x="30.7"
                        y="18.2"
                        width="2.6"
                        height="5.8"
                        fill="currentColor"
                    />
                    <rect
                        x="15"
                        y="13"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="19"
                        y="13"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="23"
                        y="13"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="39.3"
                        y="13"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="43.3"
                        y="13"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="47.3"
                        y="13"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="15"
                        y="18"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="19"
                        y="18"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="23"
                        y="18"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="39.3"
                        y="18"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="43.3"
                        y="18"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <rect
                        x="47.3"
                        y="18"
                        width="1.7"
                        height="1.7"
                        fill="currentColor"
                    />
                    <line
                        x1="12"
                        y1="24"
                        x2="52"
                        y2="24"
                        stroke="currentColor"
                        stroke-width="1.2"
                    />
                </svg>
            </span>
            <span class="studio-header__title"
                >Oireachtas Digital Publishing Studio</span
            >
        </div>
    </header>
{:else if isProofOfConceptRoute}
    <header class="proof-header" aria-label="Proof of concept header">
        <nav class="proof-nav" aria-label="Proof of concept navigation">
            <a
                class="brand proof-brand-lockup"
                href="{base}/proof-of-concept/"
                aria-label="Committee report wireframe home"
            >
                <span class="brand-mark" aria-hidden="true">
                    <svg
                        viewBox="0 0 64 28"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        role="presentation"
                        focusable="false"
                    >
                        <path
                            d="M12 9H26L32 5L38 9H52"
                            stroke="currentColor"
                            stroke-width="1.2"
                            stroke-linejoin="round"
                        />
                        <line
                            x1="12"
                            y1="10.5"
                            x2="52"
                            y2="10.5"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                        <rect
                            x="12"
                            y="10.5"
                            width="40"
                            height="13.5"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                        <line
                            x1="27.5"
                            y1="10.5"
                            x2="27.5"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <line
                            x1="30"
                            y1="10.5"
                            x2="30"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <line
                            x1="34"
                            y1="10.5"
                            x2="34"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <line
                            x1="36.5"
                            y1="10.5"
                            x2="36.5"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <line
                            x1="26.5"
                            y1="24"
                            x2="37.5"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                        <rect
                            x="30.7"
                            y="18.2"
                            width="2.6"
                            height="5.8"
                            fill="currentColor"
                        />
                        <rect
                            x="15"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="19"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="23"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="39.3"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="43.3"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="47.3"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="15"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="19"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="23"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="39.3"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="43.3"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="47.3"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <line
                            x1="12"
                            y1="24"
                            x2="52"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                    </svg>
                </span>
                <span class="brand-copy proof-brand-copy">
                    <span class="proof-brand-title">Committee report wireframe</span>
                </span>
            </a>
            <div class="nav-links proof-nav-links">
                <a href="{base}/proof-of-concept/committees/">All reports</a>
            </div>
        </nav>
    </header>
{:else}
    <header class="site-header" class:site-header--resource={isResourceRoute} class:site-header--mobile-hidden={mobileMastheadHidden} aria-label="Site header" aria-hidden={mobileMastheadHidden ? "true" : undefined} inert={mobileMastheadHidden ? true : undefined}>
        <nav class="site-nav" aria-label="Primary navigation">
            <a
                class="oireachtas-home"
                href="https://www.oireachtas.ie/"
                aria-label="Return to oireachtas.ie"
                title="Return to oireachtas.ie"
            >
                <img src="{base}/brand/oireachtas-logo.svg" alt="" />
            </a>
            <a
                class="brand"
                href="{base}/"
                aria-label="Stór | Independent Parliamentary Research home"
            >
                <span class="brand-mark" aria-hidden="true">
                    <svg
                        viewBox="0 0 64 28"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        role="presentation"
                        focusable="false"
                    >
                        <path
                            d="M12 9H26L32 5L38 9H52"
                            stroke="currentColor"
                            stroke-width="1.2"
                            stroke-linejoin="round"
                        />
                        <line
                            x1="12"
                            y1="10.5"
                            x2="52"
                            y2="10.5"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                        <rect
                            x="12"
                            y="10.5"
                            width="40"
                            height="13.5"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                        <line
                            x1="27.5"
                            y1="10.5"
                            x2="27.5"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <line
                            x1="30"
                            y1="10.5"
                            x2="30"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <line
                            x1="34"
                            y1="10.5"
                            x2="34"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <line
                            x1="36.5"
                            y1="10.5"
                            x2="36.5"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.1"
                        />
                        <line
                            x1="26.5"
                            y1="24"
                            x2="37.5"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                        <rect
                            x="30.7"
                            y="18.2"
                            width="2.6"
                            height="5.8"
                            fill="currentColor"
                        />
                        <rect
                            x="15"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="19"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="23"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="39.3"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="43.3"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="47.3"
                            y="13"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="15"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="19"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="23"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="39.3"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="43.3"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <rect
                            x="47.3"
                            y="18"
                            width="1.7"
                            height="1.7"
                            fill="currentColor"
                        />
                        <line
                            x1="12"
                            y1="24"
                            x2="52"
                            y2="24"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                    </svg>
                </span>
                <span class="brand-copy">
                    <span class="brand-title">Stór</span>
                    <span class="brand-subtitle"
                        >Independent Parliamentary Research</span
                    >
                </span>
            </a>
            <div class="site-header-actions" bind:this={headerActions}>
                <button
                    class="masthead-overflow"
                    type="button"
                    aria-label="More site actions"
                    aria-expanded={headerActionsOpen}
                    aria-controls="masthead-actions-menu"
                    onclick={() => (headerActionsOpen = !headerActionsOpen)}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="19" cy="12" r="1.8"></circle></svg>
                </button>
                {#if headerActionsOpen}
                    <div id="masthead-actions-menu" class="masthead-actions-menu"><button type="button" onclick={() => { toggleTheme(); headerActionsOpen = false; }}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button></div>
                {/if}
            </div>
        </nav>
        <nav class="section-nav" aria-label="Stór sections">
            {#if isResourceRoute}
            <a
                class="resource-home-crumb"
                href="{base}/"
                aria-label="Return to Stór home"
                title="Return to Stór home"
            >
                <svg viewBox="0 0 64 28" aria-hidden="true" focusable="false">
                    <path d="M12 9H26L32 5L38 9H52" />
                    <line x1="12" y1="10.5" x2="52" y2="10.5" />
                    <rect x="12" y="10.5" width="40" height="13.5" />
                    <line x1="27.5" y1="10.5" x2="27.5" y2="24" />
                    <line x1="30" y1="10.5" x2="30" y2="24" />
                    <line x1="34" y1="10.5" x2="34" y2="24" />
                    <line x1="36.5" y1="10.5" x2="36.5" y2="24" />
                    <line x1="26.5" y1="24" x2="37.5" y2="24" />
                    <rect class="resource-home-crumb__door" x="30.7" y="18.2" width="2.6" height="5.8" />
                    <rect class="resource-home-crumb__window" x="15" y="13" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="19" y="13" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="23" y="13" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="39.3" y="13" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="43.3" y="13" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="47.3" y="13" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="15" y="18" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="19" y="18" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="23" y="18" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="39.3" y="18" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="43.3" y="18" width="1.7" height="1.7" />
                    <rect class="resource-home-crumb__window" x="47.3" y="18" width="1.7" height="1.7" />
                </svg>
            </a>
            {/if}
            <div class="nav-links">
                <a href="{base}/committees/" aria-current={activeSection === "committees" ? "page" : undefined}>Committees</a>
                <a href="{base}/parliamentary-budget-office/" aria-current={activeSection === "pbo" ? "page" : undefined}
                    >Parliamentary Budget Office</a
                >
                <a href="{base}/library-research-service/" aria-current={activeSection === "lrs" ? "page" : undefined}
                    >Library & Research Service</a
                >
                <a class="my-stor-link" href="{base}/my-stor/" aria-current={activeSection === "my-stor" ? "page" : undefined}>
                    <span class="my-stor-link__icon" aria-hidden="true">
                        <svg
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            role="presentation"
                            focusable="false"
                        >
                            <circle cx="12" cy="7.2" r="3.4" fill="currentColor" />
                            <path
                                d="M4 20c0-3.7 3.6-6 8-6s8 2.3 8 6"
                                fill="currentColor"
                            />
                        </svg>
                    </span>
                    <span>My Stór</span>
                </a>
            </div>
        </nav>
    </header>
{/if}

{#if !isPublisherRoute && !isProofOfConceptRoute}
    <div class="mobile-section-tools" class:mobile-section-tools--visible={mobileMastheadHidden} aria-label="Stór navigation">
        <button class="mobile-back" type="button" aria-label="Go back" onclick={() => history.length > 1 ? history.back() : window.location.assign(`${base}/`)}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7" /></svg></button>
        <div class="resource-mobile-nav" bind:this={mobileSectionMenu}>
            <button class="resource-mobile-nav__toggle" type="button" aria-expanded={mobileSectionMenuOpen} aria-controls="mobile-section-menu" onclick={() => (mobileSectionMenuOpen = !mobileSectionMenuOpen)}>
                <span>{mobileSectionLabel}</span><i aria-hidden="true"></i>
            </button>
            {#if mobileSectionMenuOpen}
                <nav id="mobile-section-menu" class="resource-mobile-nav__menu" aria-label="Stór sections">
                    {#each mobileSectionItems as item}
                        <a href={item.href} aria-current={isCurrentMobileSection(item.href) ? "page" : undefined} onclick={() => (mobileSectionMenuOpen = false)}>{item.label}</a>
                    {/each}
                </nav>
            {/if}
        </div>
        <div class="mobile-section-actions" bind:this={mobileSectionActions}>
            <button class="mobile-section-actions__toggle" type="button" aria-label="More page actions" aria-expanded={mobileSectionActionsOpen} aria-controls="mobile-section-actions-menu" onclick={() => (mobileSectionActionsOpen = !mobileSectionActionsOpen)}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="19" cy="12" r="1.8"></circle></svg>
            </button>
            {#if mobileSectionActionsOpen}
                <div id="mobile-section-actions-menu" class="mobile-section-actions__menu">
                    {#if isResourceRoute}
                        <button type="button" onclick={() => { window.dispatchEvent(new CustomEvent("article-action", { detail: "listen" })); mobileSectionActionsOpen = false; }}><span>Listen</span></button>
                        <button type="button" onclick={() => { window.dispatchEvent(new CustomEvent("article-action", { detail: "share" })); mobileSectionActionsOpen = false; }}><span>Share article</span></button>
                        <button type="button" onclick={() => { window.dispatchEvent(new CustomEvent("article-action", { detail: "save" })); mobileSectionActionsOpen = false; }}><span>Save article</span></button>
                        <button type="button" onclick={() => { window.dispatchEvent(new CustomEvent("article-action", { detail: "cite" })); mobileSectionActionsOpen = false; }}><span>Copy citation</span></button>
                        <button type="button" onclick={() => { window.dispatchEvent(new CustomEvent("article-action", { detail: "print" })); mobileSectionActionsOpen = false; }}><span>Print article</span></button>
                    {/if}
                    <button type="button" onclick={() => { toggleTheme(); mobileSectionActionsOpen = false; }}>
                        <span class="mobile-section-action-icon" aria-hidden="true">
                            {#if theme === 'dark'}
                                <svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
                            {:else}
                                <svg viewBox="0 0 24 24" focusable="false"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" /></svg>
                            {/if}
                        </span>
                        <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<main id="content">
    {@render children()}
</main>

{#if !isPublisherRoute}
    <BackToTop />
{/if}

{#if !isPublisherRoute && !isProofOfConceptRoute}
    <footer class="site-footer">
        <p>Stór | Independent Parliamentary Research</p>
    </footer>
{:else if isProofOfConceptRoute}
    <footer class="site-footer">
        <p>Wireframe site</p>
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
        font-family: "IBM Plex Sans", system-ui, sans-serif;
        font-size: clamp(1.2rem, 2vw, 1.7rem);
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .proof-header {
        background: var(--color-paper);
        border-bottom: 1px solid var(--color-line);
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .proof-nav {
        align-items: center;
        display: flex;
        margin: 0 auto;
        max-width: var(--wide);
        min-height: 3.25rem;
        padding: 0 var(--gutter);
    }

    .proof-brand-lockup {
        align-items: center;
        gap: 0.85rem;
        padding: 0;
    }

    .proof-brand-lockup :global(.brand-mark) {
        width: 3rem;
    }

    .proof-brand-copy {
        gap: 0;
    }

    .proof-brand-title {
        color: var(--color-muted);
        font-family: inherit;
        font-size: 0.68rem;
        font-weight: 500;
        letter-spacing: 0.04em;
        line-height: 1.15;
        text-transform: none;
    }

    .proof-nav-links {
        margin-left: auto;
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

        .proof-nav {
            align-items: center;
            flex-wrap: wrap;
            gap: 0.8rem 1rem;
            padding: 0 var(--gutter);
        }

        .proof-brand-lockup :global(.brand-mark) {
            width: 2.7rem;
        }

        .proof-brand-title {
            font-size: 0.68rem;
            line-height: 1.2;
        }

        .proof-nav-links {
            margin-left: 0;
            width: 100%;
        }

    }
</style>

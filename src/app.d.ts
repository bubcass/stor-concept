declare global {
  namespace App {}

  namespace svelteHTML {
    interface IntrinsicElements {
      'arcgis-embedded-map': {
        'item-id'?: string;
        theme?: string;
        style?: string;
        class?: string;
        title?: string;
        'aria-label'?: string;
        'legend-enabled'?: boolean | '' | undefined;
        'heading-enabled'?: boolean | '' | undefined;
        'information-enabled'?: boolean | '' | undefined;
      };
    }
  }
}

export {};

export const DEFAULT_PRODUCT_HIGHLIGHTS = Object.freeze({
  artistSpotlight: false,
  artistSpotlightOrder: null,
  hideFromRecentWorks: false,
});

export const createDefaultProductHighlights = () => ({
  ...DEFAULT_PRODUCT_HIGHLIGHTS,
});

export const normalizeProductHighlights = (highlights) => ({
  artistSpotlight: highlights?.artistSpotlight === true,
  artistSpotlightOrder: Number.isInteger(highlights?.artistSpotlightOrder)
    ? highlights.artistSpotlightOrder
    : null,
  hideFromRecentWorks: highlights?.hideFromRecentWorks === true,
});

export const DISPLAY_CATEGORY = 'Display';

export const PRODUCT_CATEGORIES = [
  'Hand-painted needlepoint canvas',
  'Crocheted products',
  'Sample portraitures',
  'Painting on Canvas',
  DISPLAY_CATEGORY,
];

export const isDisplayProduct = (product) => product?.category === DISPLAY_CATEGORY;

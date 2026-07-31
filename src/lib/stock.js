const toWholeNumber = (value, fallback = 0) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.floor(parsed));
};

export const getAvailableStock = (product) => {
  if (!product || product.inStock === false) {
    return 0;
  }

  return toWholeNumber(product.stockQuantity);
};

export const isPurchasable = (product) => getAvailableStock(product) > 0;

export const clampQuantityToStock = (product, quantity) => {
  const requestedQuantity = toWholeNumber(quantity);

  return Math.min(requestedQuantity, getAvailableStock(product));
};

export const getStockLabel = (product) => {
  const availableStock = getAvailableStock(product);

  if (availableStock === 0) {
    return 'Sold out';
  }

  if (availableStock <= 5) {
    return `${availableStock} left`;
  }

  return `${availableStock} available`;
};

export const getStockValidationMessage = ({ name, availableStock }) => {
  const productName = name || 'This product';

  if (availableStock === 0) {
    return `${productName} is currently sold out. You can request a custom order instead.`;
  }

  return `${productName} has ${availableStock} available. Request a custom order for additional pieces.`;
};

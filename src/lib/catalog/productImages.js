export const getProductImageUrl = (product) => {
  const primaryImage = typeof product?.imageUrl === 'string' ? product.imageUrl.trim() : '';
  if (primaryImage) return primaryImage;

  if (!Array.isArray(product?.imageUrls)) return '';

  return product.imageUrls.find((imageUrl) => (
    typeof imageUrl === 'string' && imageUrl.trim().length > 0
  ))?.trim() || '';
};

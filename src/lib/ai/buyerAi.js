const MAX_CONVERSATION_MESSAGES = 6;
const MAX_CATALOG_PRODUCTS = 40;

const safeText = (value, maxLength = 240) => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

const safeNumber = (...values) => {
  for (const value of values) {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }

  return null;
};

const getProductName = (product) =>
  safeText(product?.name || product?.productName || product?.title, 100) || 'Unnamed product';

const getProductCategory = (product) =>
  safeText(product?.category || product?.type || product?.productType, 80);

const getProductDescription = (product) =>
  safeText(product?.description || product?.details || product?.caption, 240);

const getProductPrice = (product) =>
  safeNumber(product?.price, product?.unitPrice, product?.amount);

const getProductStock = (product) => {
  if (product?.inStock === false) return 0;

  return safeNumber(
    product?.stockQuantity,
    product?.stock,
    product?.stocks,
    product?.quantity,
    product?.inventory,
    product?.inventoryCount,
    product?.stockLeft,
    product?.availableStocks
  );
};

export const buildBuyerAiCatalog = (products = []) =>
  products
    .slice(0, MAX_CATALOG_PRODUCTS)
    .map((product) => ({
      id: safeText(product?.id, 100),
      name: getProductName(product),
      category: getProductCategory(product),
      description: getProductDescription(product),
      price: getProductPrice(product),
      stock: getProductStock(product),
    }));

export const requestBuyerAiReply = async ({ accessToken, question, messages, products }) => {
  const endpoint = import.meta.env.VITE_BUYER_AI_PROXY_URL?.trim();

  if (!endpoint) {
    const error = new Error('Buyer AI is not configured.');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      question: safeText(question, 600),
      messages: (messages || [])
        .slice(-MAX_CONVERSATION_MESSAGES)
        .map((message) => ({
          role: message?.role === 'assistant' ? 'assistant' : 'user',
          content: safeText(message?.content, 600),
        }))
        .filter((message) => message.content),
      products: buildBuyerAiCatalog(products),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !safeText(payload?.reply, 1200)) {
    const error = new Error(safeText(payload?.message, 180) || 'Buyer AI is unavailable.');
    error.code = payload?.code || `HTTP_${response.status}`;
    throw error;
  }

  return safeText(payload.reply, 1200);
};

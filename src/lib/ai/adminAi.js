const MAX_CONVERSATION_MESSAGES = 6;
const MAX_PRODUCTS = 40;
const MAX_STATUS_ENTRIES = 20;
const MAX_BEST_SELLERS = 8;

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

const getOrderItems = (order) => {
  const candidates = [order?.items, order?.cartItems, order?.products, order?.orderItems];
  return candidates.find(Array.isArray) || [];
};

const getOrderItemName = (item) =>
  safeText(item?.name || item?.productName || item?.title || item?.product?.name, 100);

const getOrderItemQuantity = (item) =>
  Math.max(1, safeNumber(item?.quantity, item?.qty, item?.count, 1) || 1);

const buildStatusCounts = (orders) => {
  const counts = new Map();

  orders.forEach((order) => {
    const status = safeText(order?.status, 60) || 'Unspecified';
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  return [...counts.entries()]
    .sort(([, leftCount], [, rightCount]) => rightCount - leftCount)
    .slice(0, MAX_STATUS_ENTRIES)
    .map(([status, count]) => ({ status, count }));
};

const buildBestSellers = (orders) => {
  const quantities = new Map();

  orders.forEach((order) => {
    getOrderItems(order).forEach((item) => {
      const name = getOrderItemName(item);
      if (!name) return;

      quantities.set(name, (quantities.get(name) || 0) + getOrderItemQuantity(item));
    });
  });

  return [...quantities.entries()]
    .sort(([, leftQuantity], [, rightQuantity]) => rightQuantity - leftQuantity)
    .slice(0, MAX_BEST_SELLERS)
    .map(([name, quantity]) => ({ name, quantity }));
};

/**
 * Creates a privacy-safe dashboard summary. Raw order records and customer data
 * never leave the browser for the Admin AI request.
 */
export const buildAdminAiDashboard = ({ products = [], orders = [], isMainAdmin = false }) => {
  const safeProducts = Array.isArray(products) ? products.slice(0, MAX_PRODUCTS) : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const outOfStock = [];
  const lowStock = [];

  safeProducts.forEach((product) => {
    const stock = getProductStock(product);
    const name = getProductName(product);

    if (stock === 0) outOfStock.push({ name });
    if (stock !== null && stock > 0 && stock <= 5) lowStock.push({ name, stock });
  });

  const dashboard = {
    orderWindowLabel: `Latest ${safeOrders.length} orders, capped at 100`,
    orderCount: safeOrders.length,
    statusCounts: buildStatusCounts(safeOrders),
    productCount: safeProducts.length,
    outOfStock: outOfStock.slice(0, 10),
    lowStock: lowStock.slice(0, 10),
    bestSellers: buildBestSellers(safeOrders),
  };

  if (isMainAdmin) {
    const completedOrders = safeOrders.filter((order) => order?.status === 'completed');
    const completedRevenue = completedOrders.reduce(
      (total, order) => total + (safeNumber(order?.total, order?.totalAmount, order?.amount) || 0),
      0
    );

    dashboard.completedRevenue = completedRevenue;
    dashboard.completedOrderCount = completedOrders.length;
    dashboard.averageOrderValue = completedOrders.length
      ? completedRevenue / completedOrders.length
      : 0;
  }

  return dashboard;
};

export const requestAdminAiReply = async ({ accessToken, question, messages, dashboard }) => {
  const endpoint = import.meta.env.VITE_BUYER_AI_PROXY_URL?.trim();

  if (!endpoint) {
    const error = new Error('Admin AI is not configured.');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const response = await fetch(`${endpoint.replace(/\/$/, '')}/admin-chat`, {
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
      dashboard,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !safeText(payload?.reply, 1200)) {
    const error = new Error(safeText(payload?.message, 180) || 'Admin AI is unavailable.');
    error.code = payload?.code || `HTTP_${response.status}`;
    throw error;
  }

  return safeText(payload.reply, 1200);
};

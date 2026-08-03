import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const CATALOG_PAGE_SIZE = 5;
const REVIEW_PRODUCT_ID_BATCH_SIZE = 30;

const SORT_OPTIONS = {
  newest: { field: 'createdAt', direction: 'desc' },
  oldest: { field: 'createdAt', direction: 'asc' },
  lowToHigh: { field: 'price', direction: 'asc' },
  highToLow: { field: 'price', direction: 'desc' },
  topSellers: { field: 'totalSold', direction: 'desc' },
};

const toMillis = (value) => {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();

  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const splitIntoChunks = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
};

export const normalizeCatalogProduct = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    inStock: data.inStock !== false,
    stockQuantity: data.stockQuantity || 0,
    totalSold: data.totalSold || 0,
  };
};

export const sortCatalogProducts = (products, sortOrder) => {
  const sortedProducts = [...products];

  if (sortOrder === 'newest') return sortedProducts.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  if (sortOrder === 'oldest') return sortedProducts.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
  if (sortOrder === 'lowToHigh') return sortedProducts.sort((a, b) => a.price - b.price);
  if (sortOrder === 'highToLow') return sortedProducts.sort((a, b) => b.price - a.price);
  if (sortOrder === 'topSellers') return sortedProducts.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));

  return sortedProducts;
};

export const filterCatalogProducts = (products, { category = 'all', searchQuery = '' } = {}) => {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory = category === 'all' || product.category === category;
    if (!matchesCategory || !normalizedSearch) return matchesCategory;

    return [product.name, product.description, product.category]
      .some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  });
};

const getCatalogConstraints = ({ category, sortOrder, cursor }) => {
  const sortOption = SORT_OPTIONS[sortOrder] || SORT_OPTIONS.newest;
  const constraints = [];

  if (category && category !== 'all') constraints.push(where('category', '==', category));
  constraints.push(orderBy(sortOption.field, sortOption.direction));
  if (cursor) constraints.push(startAfter(cursor));

  return constraints;
};

export const fetchCatalogPage = async ({
  category = 'all',
  sortOrder = 'newest',
  cursor = null,
  pageSize = CATALOG_PAGE_SIZE,
}) => {
  const productQuery = query(
    collection(db, 'pricelists'),
    ...getCatalogConstraints({ category, sortOrder, cursor }),
    limit(pageSize + 1),
  );
  const snapshot = await getDocs(productQuery);
  const pageDocuments = snapshot.docs.slice(0, pageSize);

  return {
    products: pageDocuments.map(normalizeCatalogProduct),
    nextCursor: pageDocuments.at(-1) || null,
    hasNextPage: snapshot.docs.length > pageSize,
  };
};

export const getCatalogPageCount = async ({ category = 'all', sortOrder = 'newest' } = {}) => {
  const productQuery = query(
    collection(db, 'pricelists'),
    ...getCatalogConstraints({ category, sortOrder, cursor: null }),
  );
  const snapshot = await getCountFromServer(productQuery);
  return Math.max(1, Math.ceil(snapshot.data().count / CATALOG_PAGE_SIZE));
};

export const fetchSearchCatalog = async () => {
  const snapshot = await getDocs(collection(db, 'pricelists'));
  return snapshot.docs.map(normalizeCatalogProduct);
};

export const getReviewSummaries = async (products) => {
  if (!products.length) return [];

  const reviewTotals = new Map();
  const reviewBatches = splitIntoChunks(products.map((product) => product.id), REVIEW_PRODUCT_ID_BATCH_SIZE);
  const reviewSnapshots = await Promise.all(
    reviewBatches.map((productIds) => getDocs(query(
      collection(db, 'reviews'),
      where('productId', 'in', productIds),
    ))),
  );

  reviewSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((reviewDocument) => {
      const review = reviewDocument.data();
      if (!Number.isFinite(review.rating) || !review.productId) return;

      const previous = reviewTotals.get(review.productId) || { totalRating: 0, reviewCount: 0 };
      reviewTotals.set(review.productId, {
        totalRating: previous.totalRating + Number(review.rating),
        reviewCount: previous.reviewCount + 1,
      });
    });
  });

  return products.map((product) => {
    const summary = reviewTotals.get(product.id);
    if (!summary) return { ...product, averageRating: 0, reviewCount: 0 };
    return {
      ...product,
      averageRating: Number((summary.totalRating / summary.reviewCount).toFixed(1)),
      reviewCount: summary.reviewCount,
    };
  });
};

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeProductHighlights } from '@/lib/highlights/productHighlights';

const SPOTLIGHT_SLOT_COUNT = 4;

const isValidSpotlightOrder = (order) => (
  Number.isInteger(order) && order >= 1 && order <= SPOTLIGHT_SLOT_COUNT
);

/**
 * Watches the small curated set so the management UI can show which slots are
 * currently occupied without loading a second full catalog.
 */
export const subscribeToArtistSpotlight = (onChange, onError) => onSnapshot(
  query(collection(db, 'pricelists'), where('highlights.artistSpotlight', '==', true)),
  (snapshot) => {
    const products = snapshot.docs
      .map((productDocument) => ({ id: productDocument.id, ...productDocument.data() }))
      .sort((first, second) => (
        (first.highlights?.artistSpotlightOrder || Number.MAX_SAFE_INTEGER) -
        (second.highlights?.artistSpotlightOrder || Number.MAX_SAFE_INTEGER)
      ));
    onChange(products);
  },
  onError,
);

/** Adds a product to the next available Artist's Spotlight place. */
export const addToArtistSpotlight = async ({ productId, currentHighlights }) => {
  const productReference = doc(db, 'pricelists', productId);
  const spotlightSnapshot = await getDocs(
    query(collection(db, 'pricelists'), where('highlights.artistSpotlight', '==', true)),
  );
  const currentProduct = spotlightSnapshot.docs.find((productDocument) => productDocument.id === productId);
  if (currentProduct) return;

  const usedOrders = new Set(
    spotlightSnapshot.docs
      .map((productDocument) => productDocument.data().highlights?.artistSpotlightOrder)
      .filter(isValidSpotlightOrder),
  );
  const nextOrder = [1, 2, 3, 4].find((order) => !usedOrders.has(order));
  if (!nextOrder) throw new Error('Artist’s Spotlight is full. Remove one product before adding another.');

  const batch = writeBatch(db);
  batch.update(productReference, {
    highlights: {
      ...normalizeProductHighlights(currentHighlights),
      artistSpotlight: true,
      artistSpotlightOrder: nextOrder,
    },
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
};

export const moveArtistSpotlight = async ({ productId, direction }) => {
  if (!['earlier', 'later'].includes(direction)) {
    throw new Error('Choose a valid Artist Spotlight movement.');
  }

  const spotlightSnapshot = await getDocs(
    query(collection(db, 'pricelists'), where('highlights.artistSpotlight', '==', true)),
  );
  const spotlightProducts = spotlightSnapshot.docs
    .map((productDocument) => ({
      document: productDocument,
      highlights: normalizeProductHighlights(productDocument.data().highlights),
    }))
    .sort((first, second) => first.highlights.artistSpotlightOrder - second.highlights.artistSpotlightOrder);
  const currentIndex = spotlightProducts.findIndex(({ document }) => document.id === productId);
  if (currentIndex < 0) throw new Error('This product is not in Artist’s Spotlight.');

  const adjacentIndex = direction === 'earlier' ? currentIndex - 1 : currentIndex + 1;
  if (adjacentIndex < 0 || adjacentIndex >= spotlightProducts.length) return;

  const current = spotlightProducts[currentIndex];
  const adjacent = spotlightProducts[adjacentIndex];
  const batch = writeBatch(db);
  batch.update(current.document.ref, {
    highlights: {
      ...current.highlights,
      artistSpotlightOrder: adjacent.highlights.artistSpotlightOrder,
    },
    updatedAt: serverTimestamp(),
  });
  batch.update(adjacent.document.ref, {
    highlights: {
      ...adjacent.highlights,
      artistSpotlightOrder: current.highlights.artistSpotlightOrder,
    },
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
};

export const removeFromArtistSpotlight = async ({ productId, currentHighlights }) => {
  await updateDoc(doc(db, 'pricelists', productId), {
    highlights: {
      ...normalizeProductHighlights(currentHighlights),
      artistSpotlight: false,
      artistSpotlightOrder: null,
    },
    updatedAt: serverTimestamp(),
  });
};

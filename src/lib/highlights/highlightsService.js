import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const EMPTY_HIGHLIGHTS_DATA = Object.freeze({
  artistSpotlight: [],
  collectorFavorites: [],
  recentWorks: [],
});

const HIGHLIGHT_CARD_COUNT = 4;
const RECENT_WORKS_FETCH_LIMIT = 16;

const toMillis = (value) => {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();

  const parsed = new Date(value || 0).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toProduct = (document) => ({ id: document.id, ...document.data() });

const sortArtistSpotlight = (products) => products
  .filter((product) => product.highlights?.artistSpotlight === true)
  .sort((first, second) => (
    (first.highlights.artistSpotlightOrder || Number.MAX_SAFE_INTEGER) -
    (second.highlights.artistSpotlightOrder || Number.MAX_SAFE_INTEGER)
  ))
  .slice(0, HIGHLIGHT_CARD_COUNT);

const selectCollectorFavorites = (products) => products
  .filter((product) => Number(product.totalSold || 0) > 0)
  .sort((first, second) => {
    const soldDifference = Number(second.totalSold || 0) - Number(first.totalSold || 0);
    return soldDifference || toMillis(second.createdAt) - toMillis(first.createdAt);
  })
  .slice(0, HIGHLIGHT_CARD_COUNT);

const selectRecentWorks = (products) => products
  .sort((first, second) => toMillis(second.createdAt) - toMillis(first.createdAt))
  .slice(0, HIGHLIGHT_CARD_COUNT);

/**
 * Keeps the public Highlights sections synchronized with the catalog.
 * Product records remain the single source of truth; no image or price data
 * is duplicated in a separate curated collection.
 */
export const subscribeToHighlights = ({ onChange, onError }) => {
  const productCollection = collection(db, 'pricelists');
  const sourceData = {
    artistSpotlight: [],
    collectorFavorites: [],
    recentWorks: [],
  };
  const sourceErrors = {};
  const pendingSources = new Set(['artistSpotlight', 'collectorFavorites', 'recentWorks']);

  const publish = () => {
    onChange({
      data: {
        artistSpotlight: sourceData.artistSpotlight,
        collectorFavorites: sourceData.collectorFavorites,
        recentWorks: sourceData.recentWorks,
      },
      isLoading: pendingSources.size > 0,
      errors: { ...sourceErrors },
    });
  };

  const observe = (source, sourceQuery, selectProducts) => onSnapshot(
    sourceQuery,
    (snapshot) => {
      sourceData[source] = selectProducts(snapshot.docs.map(toProduct));
      delete sourceErrors[source];
      pendingSources.delete(source);
      publish();
    },
    (error) => {
      sourceData[source] = [];
      sourceErrors[source] = true;
      pendingSources.delete(source);
      publish();
      onError?.({ source, error });
    },
  );

  const unsubscribeArtistSpotlight = observe(
    'artistSpotlight',
    query(productCollection, where('highlights.artistSpotlight', '==', true)),
    sortArtistSpotlight,
  );
  const unsubscribeCollectorFavorites = observe(
    'collectorFavorites',
    query(productCollection, orderBy('totalSold', 'desc'), limit(HIGHLIGHT_CARD_COUNT * 2)),
    selectCollectorFavorites,
  );
  const unsubscribeRecentWorks = observe(
    'recentWorks',
    query(productCollection, orderBy('createdAt', 'desc'), limit(RECENT_WORKS_FETCH_LIMIT)),
    selectRecentWorks,
  );

  return () => {
    unsubscribeArtistSpotlight();
    unsubscribeCollectorFavorites();
    unsubscribeRecentWorks();
  };
};

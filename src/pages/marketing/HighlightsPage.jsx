// src/pages/marketing/HighlightsPage.jsx
// Design A — Artisan Canvas reskin. All Firebase listeners preserved.
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowRight, ArrowUp, Palette, Search, Star, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { fetchSearchCatalog } from '@/lib/catalog/productCatalog';
import { EMPTY_HIGHLIGHTS_DATA, subscribeToHighlights } from '@/lib/highlights/highlightsService';
import {
  addToArtistSpotlight,
  moveArtistSpotlight,
  removeFromArtistSpotlight,
} from '@/lib/highlights/highlightsManagement';

const HighlightsPage = () => {
  const { isProductManager } = useUserRole();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const [highlights, setHighlights] = useState(EMPTY_HIGHLIGHTS_DATA);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [highlightErrors, setHighlightErrors] = useState({});
  const [isManagingSpotlight, setIsManagingSpotlight] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [spotlightActionId, setSpotlightActionId] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToHighlights({
      onChange: ({ data, isLoading, errors }) => {
        setHighlights(data);
        setHighlightsLoading(isLoading);
        setHighlightErrors(errors);
      },
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isProductManager || !isManagingSpotlight) return undefined;

    let isMounted = true;
    setCatalogLoading(true);
    fetchSearchCatalog()
      .then((products) => {
        if (isMounted) setCatalogProducts(products);
      })
      .catch((error) => {
        console.error('Unable to load products for Artist’s Spotlight', error);
        if (isMounted) {
          toast({
            title: 'Products could not be loaded',
            description: 'Please refresh and try again.',
            variant: 'destructive',
          });
        }
      })
      .finally(() => {
        if (isMounted) setCatalogLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isManagingSpotlight, isProductManager, toast]);

  const normalizedCatalogSearch = catalogSearch.trim().toLowerCase();
  const matchingCatalogProducts = catalogProducts
    .filter((product) => (
      !normalizedCatalogSearch || [product.name, product.category, product.description]
        .some((value) => String(value || '').toLowerCase().includes(normalizedCatalogSearch))
    ))
    .slice(0, 12);

  const getPrimaryImageUrl = (product) => (
    product.imageUrls?.find((imageUrl) => typeof imageUrl === 'string' && imageUrl.trim()) || product.imageUrl
  );

  const handleArtistSpotlightMembership = async (product) => {
    if (spotlightActionId) return;

    const actionId = `membership:${product.id}`;
    const isSelected = highlights.artistSpotlight.some((item) => item.id === product.id);
    setSpotlightActionId(actionId);
    try {
      if (isSelected) {
        await removeFromArtistSpotlight({
          productId: product.id,
          currentHighlights: product.highlights,
        });
        toast({ title: 'Removed from Artist’s Spotlight', description: `${product.name || 'Product'} is no longer featured.` });
      } else {
        await addToArtistSpotlight({
          productId: product.id,
          currentHighlights: product.highlights,
        });
        toast({ title: 'Added to Artist’s Spotlight', description: `${product.name || 'Product'} is now featured.` });
      }
    } catch (error) {
      console.error('Unable to update Artist’s Spotlight', error);
      toast({
        title: 'Artist’s Spotlight could not be updated',
        description: error.message?.includes('full') ? error.message : 'Please refresh and try again.',
        variant: 'destructive',
      });
    } finally {
      setSpotlightActionId('');
    }
  };

  const handleArtistSpotlightMove = async (product, direction) => {
    if (spotlightActionId) return;

    setSpotlightActionId(`move:${product.id}`);
    try {
      await moveArtistSpotlight({ productId: product.id, direction });
    } catch (error) {
      console.error('Unable to reorder Artist’s Spotlight', error);
      toast({
        title: 'Artist’s Spotlight order could not be updated',
        description: 'Please refresh and try again.',
        variant: 'destructive',
      });
    } finally {
      setSpotlightActionId('');
    }
  };

  const renderStars = (rating) => {
    const r = Number(rating || 0);
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} size={16} className={i <= r ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
        ))}
      </div>
    );
  };

  const EmptyState = ({ text, hasError = false }) => (
    <p className="col-span-full border-y border-artisan-primary/15 py-10 text-center text-artisan-text-mid md:py-12">
      {hasError ? 'This section is unavailable right now. Please try again later.' : text}
    </p>
  );

  const LoadingState = () => (
    <div className="col-span-full grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading highlights">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl border border-artisan-primary/10 bg-artisan-primary-wash/50" />
      ))}
    </div>
  );

  const ProductCard = ({ item }) => {
    const primaryImageUrl = getPrimaryImageUrl(item);

    return (
    <Link to={`/product/${item.id}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-lg backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-artisan-primary/35 hover:shadow-2xl">
        <div className="aspect-square relative overflow-hidden bg-artisan-primary-wash/30">
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Palette size={56} className="text-artisan-primary" />
          </div>
          {primaryImageUrl && (
            <img
              src={primaryImageUrl}
              alt={item.name || 'Handmade product'}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
              className="relative h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-3 min-h-[3.5rem] font-artisan-display text-xl font-bold text-artisan-text line-clamp-2 transition-colors group-hover:text-artisan-primary">
            {item.name}
          </h3>

          <div className="mb-4 flex min-h-5 items-center gap-2">
            {item.averageRating > 0 && (
              <>{renderStars(item.averageRating)}<span className="text-xs text-artisan-text-muted">({item.reviewCount || 0})</span></>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between">
            <span className="text-2xl font-bold text-artisan-primary">{formatPrice(item.price)}</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-artisan-primary to-artisan-primary-mid flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <ArrowRight size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
    );
  };

  const SectionHeading = ({ id, title, action }) => (
    <div id={id} className="mb-8 flex scroll-mt-28 flex-col gap-4 border-t border-artisan-primary/20 pt-6 sm:flex-row sm:items-center sm:justify-between md:mb-10 md:pt-8">
      <h2 className="font-artisan-display text-4xl font-bold tracking-[-0.035em] text-artisan-primary md:text-5xl">{title}</h2>
      {action}
    </div>
  );

  return (
    <>
      <Helmet><title>Highlights - DABS Co.</title></Helmet>

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10">
          {/* Hero section */}
          <section className="pb-10 pt-16 md:pb-14 md:pt-20">
            <header className="container mx-auto max-w-7xl px-4">
              <h1 className="max-w-3xl font-artisan-display text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-artisan-primary md:text-7xl">
                Highlights
              </h1>
              <p className="mt-4 max-w-xl text-artisan-text-mid md:text-lg">
                Selected work, collector favorites, and new arrivals.
              </p>
            </header>
          </section>

          {/* Artist's Spotlight */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading
                id="spotlight"
                title="Artist's Spotlight"
                action={isProductManager ? (
                  <Button
                    type="button"
                    variant={isManagingSpotlight ? 'outline' : 'default'}
                    onClick={() => setIsManagingSpotlight((value) => !value)}
                    className="h-11 w-full sm:w-auto"
                    aria-expanded={isManagingSpotlight}
                  >
                    {isManagingSpotlight ? <X size={17} className="mr-2" /> : <Palette size={17} className="mr-2" />}
                    {isManagingSpotlight ? 'Done curating' : 'Manage Artist’s Spotlight'}
                  </Button>
                ) : null}
              />

              {isProductManager && isManagingSpotlight && (
                <aside className="mb-8 border-y border-artisan-primary/20 bg-white/95 p-4 shadow-[0_16px_35px_rgba(36,16,31,0.08)] sm:p-6" aria-label="Artist’s Spotlight management">
                  <div className="flex flex-col gap-3 border-b border-artisan-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-artisan-text">Artist’s Spotlight</p>
                      <p className="mt-1 text-sm text-artisan-text-muted">Choose up to four products and arrange their public order.</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-artisan-primary">{highlights.artistSpotlight.length} of 4 selected</span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {highlights.artistSpotlight.length > 0 ? highlights.artistSpotlight.map((product, index) => {
                      const productImage = getPrimaryImageUrl(product);
                      const isUpdating = spotlightActionId.endsWith(`:${product.id}`);

                      return (
                        <article key={product.id} className="flex items-center gap-3 border border-artisan-primary/15 bg-[#FAF8F1] p-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden bg-artisan-primary-wash/40">
                            {productImage ? <img src={productImage} alt="" className="h-full w-full object-cover" /> : <Palette className="m-4 text-artisan-primary" size={24} />}
                          </div>
                          <p className="min-w-0 flex-1 truncate font-semibold text-artisan-text">{product.name || 'Untitled product'}</p>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => handleArtistSpotlightMove(product, 'earlier')}
                              disabled={Boolean(spotlightActionId) || index === 0}
                              aria-label={`Move ${product.name || 'product'} earlier`}
                              className="grid h-9 w-9 place-items-center border border-artisan-primary/20 text-artisan-primary transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArtistSpotlightMove(product, 'later')}
                              disabled={Boolean(spotlightActionId) || index === highlights.artistSpotlight.length - 1}
                              aria-label={`Move ${product.name || 'product'} later`}
                              className="grid h-9 w-9 place-items-center border border-artisan-primary/20 text-artisan-primary transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArtistSpotlightMembership(product)}
                              disabled={Boolean(spotlightActionId)}
                              aria-label={`Remove ${product.name || 'product'} from Artist’s Spotlight`}
                              className="grid h-9 w-9 place-items-center border border-artisan-primary/20 text-artisan-primary transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              {isUpdating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-artisan-primary border-t-transparent" /> : <X size={16} />}
                            </button>
                          </div>
                        </article>
                      );
                    }) : (
                      <p className="border border-dashed border-artisan-primary/20 p-5 text-sm text-artisan-text-muted md:col-span-2">No product is selected yet.</p>
                    )}
                  </div>

                  <div className="mt-6 border-t border-artisan-primary/10 pt-5">
                    <label htmlFor="spotlight-product-search" className="text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-muted">Find a product</label>
                    <div className="relative mt-2 max-w-xl">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-artisan-text-muted" size={17} />
                      <input
                        id="spotlight-product-search"
                        value={catalogSearch}
                        onChange={(event) => setCatalogSearch(event.target.value)}
                        placeholder="Search products to add…"
                        className="h-11 w-full border border-artisan-primary/20 bg-white pl-10 pr-4 text-sm text-artisan-text outline-none transition focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                      />
                    </div>

                    {catalogLoading ? (
                      <p className="mt-5 text-sm text-artisan-text-muted">Loading products…</p>
                    ) : matchingCatalogProducts.length > 0 ? (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {matchingCatalogProducts.map((product) => {
                          const isSelected = highlights.artistSpotlight.some((item) => item.id === product.id);
                          const productImage = getPrimaryImageUrl(product);
                          const isUpdating = spotlightActionId.endsWith(`:${product.id}`);
                          const cannotAdd = !isSelected && highlights.artistSpotlight.length >= 4;

                          return (
                            <article key={product.id} className="flex min-w-0 items-center gap-3 border border-artisan-primary/10 bg-white p-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden bg-artisan-primary-wash/40">
                                {productImage ? <img src={productImage} alt="" className="h-full w-full object-cover" /> : <Palette className="m-3 text-artisan-primary" size={22} />}
                              </div>
                              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-artisan-text">{product.name || 'Untitled product'}</p>
                              <button
                                type="button"
                                onClick={() => handleArtistSpotlightMembership(product)}
                                disabled={Boolean(spotlightActionId) || cannotAdd}
                                className={`min-h-9 shrink-0 border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? 'border-artisan-primary bg-artisan-primary text-white' : 'border-artisan-primary/30 text-artisan-primary hover:bg-artisan-primary/5'}`}
                              >
                                {isUpdating ? 'Saving…' : isSelected ? 'Remove' : 'Add'}
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-artisan-text-muted">No products match that search.</p>
                    )}
                  </div>
                </aside>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {highlightsLoading ? <LoadingState /> : highlights.artistSpotlight.length > 0 ? highlights.artistSpotlight.map((item) => <ProductCard key={item.id} item={item} />) : <EmptyState hasError={highlightErrors.artistSpotlight} text="No artist spotlight has been selected yet." />}
              </div>
            </div>
          </section>

          {/* Collector's Favorites */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading id="favorites" title="Collector's Favorites" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {highlightsLoading ? <LoadingState /> : highlights.collectorFavorites.length > 0 ? highlights.collectorFavorites.map((item) => <ProductCard key={item.id} item={item} />) : <EmptyState hasError={highlightErrors.collectorFavorites} text="No collector favorites yet." />}
              </div>
            </div>
          </section>

          {/* Recent Works */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto max-w-7xl px-4">
              <SectionHeading id="recent" title="Recent Works" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {highlightsLoading ? <LoadingState /> : highlights.recentWorks.length > 0 ? highlights.recentWorks.map((item) => <ProductCard key={item.id} item={item} />) : <EmptyState hasError={highlightErrors.recentWorks} text="No recent work yet." />}
              </div>
            </div>
          </section>

          {/* Commission CTA (buyers only) */}
          {!isProductManager && (
            <section id="commission" className="scroll-mt-28 py-12 md:py-16">
              <div className="container mx-auto max-w-7xl border-t border-artisan-primary/20 px-4 pt-8 md:pt-10">
                <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
                  <div>
                    <h2 className="font-artisan-display text-4xl font-bold tracking-[-0.035em] text-artisan-primary md:text-5xl">
                      Commission a canvas
                    </h2>
                    <p className="mt-3 max-w-xl text-artisan-text-mid md:text-lg">
                      Share your design and we&apos;ll prepare a quote.
                    </p>
                  </div>
                  <div className="grid w-full gap-3 sm:grid-cols-2 md:w-[31rem]">
                    <Link to="/pricelists" className="w-full">
                      <Button size="lg" className="h-14 w-full bg-artisan-primary font-semibold text-white hover:bg-[#4A247B]">
                        Start Commission
                      </Button>
                    </Link>
                    <Link to="/gallery" className="w-full">
                      <Button size="lg" variant="outline" className="h-14 w-full border-2 border-artisan-primary/40 bg-white/70 px-6 py-0 font-semibold text-artisan-primary hover:bg-white">
                        View Gallery
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default HighlightsPage;

// src/pages/marketing/GalleryPage.jsx
// Design A — Artisan Canvas reskin. All Firebase + filter/sort/pagination logic preserved.
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Search, ArrowUpDown, ChevronLeft, ChevronRight, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClearSearchButton } from '@/components/ui/clear-search-button';
import { useCurrency } from '@/context/CurrencyContext';
import { db } from '@/lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { getAvailableStock, getStockLabel } from '@/lib/stock';
import {
  CATALOG_PAGE_SIZE,
  fetchCatalogPage,
  fetchSearchCatalog,
  filterCatalogProducts,
  getCatalogPageCount,
  getReviewSummaries,
  sortCatalogProducts,
} from '@/lib/catalog/productCatalog';

const GalleryPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [imageIndices, setImageIndices] = useState({});
  const catalogCacheRef = useRef({ key: '', cursors: new Map(), pages: new Map() });
  const searchCatalogRef = useRef(null);
  const searchResultsRef = useRef([]);
  const requestVersionRef = useRef(0);
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { isAdmin, isProductManager } = useUserRole();
  const { toast } = useToast();
  const [isManagingProducts, setIsManagingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isDeletingProducts, setIsDeletingProducts] = useState(false);
  const hasSearchQuery = Boolean(searchQuery.trim());
  const usesClientCatalog = hasSearchQuery || sortOrder === 'topSellers';

  const sourceKey = `${activeTab}:${sortOrder}`;

  const getServerPage = async (page, key = sourceKey) => {
    const cache = catalogCacheRef.current;
    if (cache.key !== key) return null;
    if (cache.pages.has(page)) return cache.pages.get(page);

    let cursor = cache.cursors.get(page);
    if (page > 1 && cursor === undefined) {
      const previousPage = await getServerPage(page - 1, key);
      if (!previousPage || cache.key !== key) return null;
      cursor = cache.cursors.get(page);
    }

    const result = await fetchCatalogPage({ category: activeTab, sortOrder, cursor });
    const enrichedProducts = await getReviewSummaries(result.products);
    const pageData = { ...result, products: enrichedProducts };

    if (cache.key === key) {
      cache.pages.set(page, pageData);
      if (result.hasNextPage) cache.cursors.set(page + 1, result.nextCursor);
    }

    return pageData;
  };

  const getSearchPage = async (page, productsForSearch) => {
    const start = (page - 1) * CATALOG_PAGE_SIZE;
    return getReviewSummaries(productsForSearch.slice(start, start + CATALOG_PAGE_SIZE));
  };

  useEffect(() => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const normalizedSearch = searchQuery.trim();

    setCurrentPage(1);
    setLoading(true);
    setLoadError('');

    const loadCatalog = async () => {
      try {
        if (normalizedSearch || sortOrder === 'topSellers') {
          const catalog = searchCatalogRef.current || await fetchSearchCatalog();
          searchCatalogRef.current = catalog;
          const matchingProducts = sortCatalogProducts(
            filterCatalogProducts(catalog, { category: activeTab, searchQuery: normalizedSearch }),
            sortOrder,
          );
          searchResultsRef.current = matchingProducts;
          const totalPages = Math.max(1, Math.ceil(matchingProducts.length / CATALOG_PAGE_SIZE));
          const currentProducts = await getSearchPage(1, matchingProducts);

          if (requestVersionRef.current !== requestVersion) return;
          setProducts(currentProducts);
          setPageCount(totalPages);
          return;
        }

        searchResultsRef.current = [];
        catalogCacheRef.current = {
          key: sourceKey,
          cursors: new Map([[1, null]]),
          pages: new Map(),
        };

        const [totalPages, firstPage] = await Promise.all([
          getCatalogPageCount({ category: activeTab, sortOrder }),
          getServerPage(1, sourceKey),
        ]);

        if (requestVersionRef.current !== requestVersion || !firstPage) return;
        setProducts(firstPage.products);
        setPageCount(totalPages);
      } catch (error) {
        if (requestVersionRef.current !== requestVersion) return;
        console.error('Unable to load gallery products', error);
        setProducts([]);
        setPageCount(1);
        setLoadError('We could not load the gallery. Please try again.');
      } finally {
        if (requestVersionRef.current === requestVersion) setLoading(false);
      }
    };

    loadCatalog();
  }, [activeTab, reloadKey, searchQuery, sortOrder]);

  const changePage = async (nextPage) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), pageCount);
    if (boundedPage === currentPage || pageLoading) return;

    setPageLoading(true);
    try {
      const nextProducts = usesClientCatalog
        ? await getSearchPage(boundedPage, searchResultsRef.current)
        : (await getServerPage(boundedPage))?.products;

      if (!nextProducts) return;
      setProducts(nextProducts);
      setCurrentPage(boundedPage);
    } catch (error) {
      console.error('Unable to load gallery page', error);
      setLoadError('We could not load that page. Please try again.');
    } finally {
      setPageLoading(false);
    }
  };

  const selectedProducts = products.filter((product) => selectedProductIds.includes(product.id));
  const areAllVisibleProductsSelected = products.length > 0 && selectedProducts.length === products.length;

  useEffect(() => {
    setSelectedProductIds((previous) => previous.filter((id) => products.some((product) => product.id === id)));
  }, [products]);

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((previous) => (
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId]
    ));
  };

  const toggleAllVisibleProducts = () => {
    setSelectedProductIds(areAllVisibleProductsSelected ? [] : products.map((product) => product.id));
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) return;

    const namedProducts = selectedProducts
      .slice(0, 3)
      .map((product) => product.name || 'Unnamed product')
      .join(', ');
    const remainingCount = selectedProducts.length - 3;
    const productSummary = remainingCount > 0 ? `${namedProducts}, and ${remainingCount} more` : namedProducts;
    const confirmed = window.confirm(
      `Remove ${selectedProducts.length} product${selectedProducts.length === 1 ? '' : 's'} from the gallery?\n\n${productSummary}\n\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    setIsDeletingProducts(true);
    try {
      const batch = writeBatch(db);
      selectedProducts.forEach((product) => batch.delete(doc(db, 'pricelists', product.id)));
      await batch.commit();
      setImageIndices((previous) => {
        const next = { ...previous };
        selectedProductIds.forEach((id) => delete next[id]);
        return next;
      });
      setSelectedProductIds([]);
      setReloadKey((value) => value + 1);
      toast({
        title: `${selectedProducts.length} product${selectedProducts.length === 1 ? '' : 's'} removed`,
        description: 'The Gallery has been refreshed.',
      });
    } catch (error) {
      console.error('Unable to remove selected products', error);
      toast({
        title: 'Products could not be removed',
        description: 'Please refresh and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingProducts(false);
    }
  };

  const getPaginationItems = (pageCount) => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

    const items = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(pageCount - 1, currentPage + 1);
    if (start > 2) items.push('start-ellipsis');
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < pageCount - 1) items.push('end-ellipsis');
    items.push(pageCount);
    return items;
  };

  const getStockText = (product) => {
    const availableStock = getAvailableStock(product);

    if (availableStock === 0) return <span className="font-semibold text-[#9F1239]">{getStockLabel(product)}</span>;
    if (availableStock <= 5) return <span className="font-semibold text-[#88538C]">{getStockLabel(product)}</span>;
    return <span className="font-semibold text-[#1D5C54]">{getStockLabel(product)}</span>;
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => <Star key={i} size={14} className={i <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'} />)}
    </div>
  );

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'Hand-painted needlepoint canvas', label: 'Needlepoint Canvas' },
    { id: 'Crocheted products', label: 'Crochet' },
    { id: 'Sample portraitures', label: 'Portraiture' },
    { id: 'Painting on Canvas', label: 'Canvas Paintings' },
  ];

  return (
    <>
      <Helmet><title>Gallery - D.A.B.S. Co.</title></Helmet>

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="py-4 md:py-8">
            <motion.header initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }} className="mb-10 max-w-none md:mb-12">
              <h1 className="font-artisan-display text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-artisan-primary md:text-6xl">
                Gallery
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-artisan-text-mid sm:text-base lg:whitespace-nowrap">
                Browse handmade pieces designed with care — from needlepoint and crochet to portraits and canvas paintings.
              </p>
            </motion.header>

            {/* Search + Sort bar */}
            <div className="mb-8 border-y border-artisan-primary/15 py-4 md:py-5">
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-5 xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-muted" size={18} />
                  <input type="text" placeholder="Search products, categories, or descriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 w-full rounded-lg border border-artisan-primary-wash bg-white pl-11 pr-12 text-sm outline-none transition focus:border-artisan-primary-light focus:ring-4 focus:ring-artisan-primary/10 md:text-base" />
                  <ClearSearchButton value={searchQuery} onClear={() => setSearchQuery('')} label="Clear product search" />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto xl:justify-end">
                  <div className="flex h-12 w-full items-center gap-2 rounded-lg border border-artisan-primary-wash bg-white px-3 sm:w-auto">
                    <ArrowUpDown size={17} className="text-artisan-text-muted shrink-0" />
                    <label htmlFor="gallery-sort" className="shrink-0 text-xs font-bold uppercase tracking-wide text-artisan-text-muted">
                      Sort
                    </label>
                    <select
                      id="gallery-sort"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full bg-transparent text-sm text-artisan-text outline-none sm:w-auto md:text-base"
                    >
                      <option value="newest">Newest to Oldest</option>
                      <option value="oldest">Oldest to Newest</option>
                      <option value="lowToHigh">Price: Low to High</option>
                      <option value="highToLow">Price: High to Low</option>
                      <option value="topSellers">Top Sellers</option>
                    </select>
                  </div>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant={isManagingProducts ? 'outline' : 'default'}
                      onClick={() => {
                        setIsManagingProducts((value) => !value);
                        setSelectedProductIds([]);
                      }}
                      className="h-12 px-5 font-semibold shadow-sm"
                      aria-pressed={isManagingProducts}
                    >
                      {isManagingProducts ? 'Done managing' : 'Manage products'}
                    </Button>
                  )}
                  {isProductManager && !isAdmin && (
                    <Button onClick={() => navigate('/add-product')} className="h-12 px-5 font-semibold shadow-sm">
                      <Plus size={17} className="mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && isManagingProducts && (
              <div className="sticky top-3 z-30 mb-6 flex flex-col gap-3 border border-artisan-primary/20 bg-white/95 p-3 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-artisan-primary/20 bg-white px-3">
                    <label htmlFor="manage-products-category" className="text-xs font-bold uppercase tracking-wide text-artisan-text-muted">
                      Category
                    </label>
                    <select
                      id="manage-products-category"
                      value={activeTab}
                      onChange={(event) => {
                        setActiveTab(event.target.value);
                        setSelectedProductIds([]);
                      }}
                      className="bg-transparent text-sm font-medium text-artisan-text outline-none"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAllVisibleProducts}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-artisan-text transition hover:text-artisan-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"
                    aria-label={areAllVisibleProductsSelected ? 'Deselect filtered products on this page' : 'Select filtered products on this page'}
                  >
                    {areAllVisibleProductsSelected ? <CheckSquare size={19} className="text-artisan-primary" /> : <Square size={19} className="text-artisan-text-muted" />}
                    {areAllVisibleProductsSelected ? 'Deselect filtered products' : 'Select filtered products'}
                  </button>
                  <span className="text-sm text-artisan-text-muted">{selectedProducts.length} selected on this page</span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => navigate('/add-product')} className="h-10">
                    <Plus size={16} className="mr-2" /> Add product
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBulkDeleteProducts}
                    disabled={selectedProducts.length === 0 || isDeletingProducts}
                    className="h-10 bg-artisan-primary text-white hover:bg-[#4A247B]"
                  >
                    <Trash2 size={16} className="mr-2" />
                    {isDeletingProducts ? 'Removing…' : `Remove selected${selectedProducts.length ? ` (${selectedProducts.length})` : ''}`}
                  </Button>
                </div>
              </div>
            )}

            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="mb-8 border-b border-artisan-primary/15 md:mb-10">
                <TabsList variant="underline" className="flex h-auto w-full justify-start gap-5 overflow-x-auto bg-transparent p-0 shadow-none md:justify-center">
                  {categories.map((cat) => (
                    <TabsTrigger variant="underline" key={cat.id} value={cat.id}
                      className="shrink-0 px-0 py-3 text-sm font-semibold md:text-[15px]">
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                  {loading ? (
                    <div className="text-center py-24">
                      <div className="w-14 h-14 border-4 border-artisan-primary/20 border-t-artisan-primary rounded-full animate-spin mx-auto" />
                       <p className="mt-4 text-artisan-text-mid">Loading gallery...</p>
                    </div>
                  ) : loadError ? (
                    <div className="py-24 text-center">
                      <p className="text-lg text-artisan-text-mid">{loadError}</p>
                      <Button type="button" variant="outline" className="mt-5" onClick={() => setReloadKey((value) => value + 1)}>
                        Retry gallery
                      </Button>
                    </div>
                  ) : products.length > 0 ? (
                    <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-6 xl:grid-cols-5">
                      {products.map((item, index) => {
                        const isTopSeller = item.totalSold > 0 && sortOrder === 'topSellers';
                        const showBadge = isTopSeller || item.totalSold >= 5;
                        const allImages = item.imageUrls?.length > 0 ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
                        const currentIndex = imageIndices[item.id] || 0;
                        const currentImage = allImages[currentIndex] || null;
                        const nextImage = (e) => { e.stopPropagation(); setImageIndices((prev) => ({ ...prev, [item.id]: (currentIndex + 1) % allImages.length })); };
                        const prevImage = (e) => { e.stopPropagation(); setImageIndices((prev) => ({ ...prev, [item.id]: (currentIndex - 1 + allImages.length) % allImages.length })); };

                        return (
                          <motion.article key={item.id} initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay: index*0.04 }}
                            onClick={() => {
                              if (isManagingProducts) {
                                toggleProductSelection(item.id);
                                return;
                              }
                              navigate(`/product/${item.id}`, { state: { ids: products.map((product) => product.id), fromTab: activeTab } });
                            }}
                            className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-[#E7DED3] bg-[#FAF8F1]/95 shadow-[0_8px_24px_rgba(36,16,31,0.06)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-[#88538C]/60 hover:shadow-[0_14px_28px_rgba(36,16,31,0.12)]">
                            <div className="relative">
                              {showBadge && (
                                <span className="absolute left-0 top-4 z-20 bg-artisan-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">Best seller</span>
                              )}
                              <div className="relative h-56 overflow-hidden bg-[#E7DED3]/45 sm:h-52 md:h-56 lg:h-60">
                                {isManagingProducts && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleProductSelection(item.id);
                                    }}
                                    aria-label={`${selectedProductIds.includes(item.id) ? 'Deselect' : 'Select'} ${item.name || 'product'}`}
                                    className={`absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-artisan-primary ${selectedProductIds.includes(item.id) ? 'bg-artisan-primary' : 'bg-[#01243A]/80 hover:bg-[#01243A]'}`}
                                  >
                                    {selectedProductIds.includes(item.id) ? <CheckSquare size={17} /> : <Square size={17} />}
                                  </button>
                                )}
                                {currentImage ? (
                                  <img src={currentImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={42} className="text-artisan-primary" /></div>
                                )}
                                {allImages.length > 1 && (
                                  <>
                                    <button type="button" onClick={prevImage} aria-label={`Show previous image of ${item.name}`} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-artisan-primary shadow-md opacity-0 transition duration-300 group-hover:opacity-100 hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"><ChevronLeft size={18} /></button>
                                    <button type="button" onClick={nextImage} aria-label={`Show next image of ${item.name}`} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-artisan-primary shadow-md opacity-0 transition duration-300 group-hover:opacity-100 hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"><ChevronRight size={18} /></button>
                                  </>
                                )}
                                {allImages.length > 1 && (
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                    {allImages.map((_, idx) => (
                                      <span key={idx} aria-hidden="true" className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/70'}`} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="min-h-[3.5rem] font-artisan-display text-lg font-semibold leading-snug text-[#01243A] line-clamp-2 md:text-xl">{item.name}</h3>
                                <span className="shrink-0 text-lg font-bold tabular-nums text-artisan-primary md:text-xl">{formatPrice(item.price)}</span>
                              </div>
                              <p className="mb-3 min-h-5 text-sm text-artisan-text-muted line-clamp-1">{item.category || 'Handmade Product'}</p>
                              <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
                                {item.reviewCount > 0 ? (
                                  <div className="flex items-center gap-2 min-w-0">{renderStars(item.averageRating)}<span className="text-sm text-artisan-text-muted whitespace-nowrap">({item.reviewCount})</span></div>
                                ) : (
                                  <span className="text-sm text-artisan-text-faint">No reviews yet</span>
                                )}
                                <div className="text-xs md:text-sm text-right">{getStockText(item)}</div>
                              </div>
                              <p className="mb-4 min-h-12 text-sm leading-relaxed text-artisan-text-muted line-clamp-2">{item.description || 'No description provided.'}</p>
                              <Button className="mt-auto h-12 w-full rounded-xl bg-artisan-primary font-semibold text-white hover:bg-[#4A247B]">View Product</Button>
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                    {pageCount > 1 && (() => {
                      const page = Math.min(currentPage, pageCount);
                      return (
                        <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Gallery pages">
                          <span className="mr-2 text-sm font-semibold tabular-nums text-artisan-text-muted" aria-live="polite">
                            Page {page} of {pageCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => changePage(page - 1)}
                            disabled={page === 1 || pageLoading}
                            className="grid h-10 w-10 place-items-center rounded-lg text-artisan-primary transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"
                            aria-label="Previous page"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          {getPaginationItems(pageCount).map((pageItem) => typeof pageItem === 'number' ? (
                            <button
                              type="button"
                              key={pageItem}
                              onClick={() => changePage(pageItem)}
                              disabled={pageLoading}
                            className={`grid h-10 min-w-10 place-items-center rounded-lg px-2 text-sm font-bold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary disabled:cursor-wait disabled:opacity-60 ${pageItem === page ? 'bg-artisan-primary text-white shadow-[0_6px_16px_rgba(92,45,145,0.18)]' : 'text-artisan-primary hover:bg-white'}`}
                              aria-current={pageItem === page ? 'page' : undefined}
                            >
                              {pageItem}
                            </button>
                          ) : (
                            <span key={pageItem} className="grid h-10 w-7 place-items-center text-artisan-text-muted" aria-hidden="true">…</span>
                          ))}
                          <button
                            type="button"
                            onClick={() => changePage(page + 1)}
                            disabled={page === pageCount || pageLoading}
                            className="grid h-10 w-10 place-items-center rounded-lg text-artisan-primary transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"
                            aria-label="Next page"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </nav>
                      );
                    })()}
                    </div>
                  ) : (
                    <div className="text-center py-24">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-artisan-primary/15 bg-white/85"><ShoppingBag size={30} className="text-artisan-primary" /></div>
                       <p className="text-lg text-artisan-text-mid">{searchQuery ? 'No products found matching your search.' : 'No items in this category yet.'}</p>
                    </div>
                  )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default GalleryPage;

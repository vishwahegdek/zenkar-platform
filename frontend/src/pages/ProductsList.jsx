import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Grid, 
  List, 
  Camera, 
  Calculator, 
  Box, 
  Tag, 
  Pencil, 
  Trash2, 
  Eye, 
  Layers, 
  CheckCircle2, 
  SlidersHorizontal,
  X,
  Package,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

import ManageCategoriesModal from './ManageCategoriesModal';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductEstimateModal from '../components/ProductEstimateModal';
import { isFurnitureCategory, sortCategoriesWithPriority } from '../utils/productEstimateHelpers';

export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [filterWithPhotos, setFilterWithPhotos] = useState(false);
  const [filterWithEstimate, setFilterWithEstimate] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [estimateProduct, setEstimateProduct] = useState(null);

  const queryClient = useQueryClient();
  const activeTabRef = useRef(null);

  // Sync URL searchParam to local searchTerm on back/forward
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Debounce URL update for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchParam) {
        const next = new URLSearchParams(searchParams);
        if (searchTerm) next.set('search', searchTerm);
        else next.delete('search');
        setSearchParams(next, { replace: true });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParam, setSearchParams]);

  // Fetch Categories
  const {
    data: categories = [],
    isSuccess: isCategoriesSuccess,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => api.get('/product-categories'),
  });

  // Prioritize doors/frames and furniture categories
  const prioritizedCategories = useMemo(() => {
    return sortCategoriesWithPriority(categories);
  }, [categories]);

  const furnitureCategory = useMemo(() => {
    return categories.find((c) => isFurnitureCategory(c));
  }, [categories]);

  // If category is explicitly specified in URL ('all' or specific id), use it.
  // Otherwise, default to Furniture tab once we enter product catalogue.
  const activeCategoryId = useMemo(() => {
    if (categoryParam !== null && categoryParam !== undefined && categoryParam !== '') {
      return categoryParam;
    }
    if (furnitureCategory) {
      return String(furnitureCategory.id);
    }
    return '';
  }, [categoryParam, furnitureCategory]);

  const targetCategoryId = activeCategoryId && activeCategoryId !== 'all' ? activeCategoryId : undefined;

  // Auto-scroll the active tab into view for smooth mobile navigation
  useEffect(() => {
    if (typeof activeTabRef.current?.scrollIntoView === 'function') {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeCategoryId]);

  // Update URL for category
  const handleCategoryChange = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'all') {
      next.set('category', 'all');
    } else if (val) {
      next.set('category', String(val));
    } else {
      next.set('category', 'all');
    }
    setSearchParams(next, { replace: true });
  };

  const isCategoryReady =
    categoryParam !== null ||
    categories.length > 0 ||
    isCategoriesError ||
    (isCategoriesSuccess && categories.length === 0);

  // Infinite query for products
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch: refetchProducts,
  } = useInfiniteQuery({
    queryKey: ['products', searchParam, targetCategoryId],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        query: searchParam,
        page: pageParam,
        limit: 24,
        categoryId: targetCategoryId,
      };
      const res = await api.get('/products', { params });
      return res;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: isCategoryReady,
  });

  const rawProducts = data?.pages.flatMap((page) => page.data) || [];

  // Client-side quick filter toggles
  const products = rawProducts.filter((p) => {
    if (filterWithPhotos && (!p.images || p.images.length === 0)) return false;
    if (filterWithEstimate && !p.estimateData) return false;
    if (filterInStock && (!p.isPurchasable || p.stockQuantity <= 0)) return false;
    return true;
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product deleted from catalog');
      if (detailProduct) setDetailProduct(null);
    },
    onError: (err) => toast.error('Failed to delete: ' + err.message),
  });

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenWoodEstimator = (product) => {
    navigate('/wood-estimator', {
      state: {
        returnToProduct: {
          productId: product.id,
          productName: product.name,
          product: product,
          returnUrl: '/products',
          quotedAmount: product.estimateData?.quotedAmount || product.defaultUnitPrice || null,
          notes: product.notes || product.estimateData?.notes || ''
        },
        loadEstimate: product.estimateData ? {
          name: product.name,
          data: product.estimateData,
          id: product.savedEstimateId || null
        } : null
      }
    });
  };

  const formatTemplateBadge = (tmpl) => {
    if (tmpl === 'door_frame') return 'Door Frame';
    if (tmpl === 'custom') return 'Custom Blocks';
    return 'Estimate';
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Product Catalogue
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Designs, estimate copies, photo galleries & pricing
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-2xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-gray-500" />
            Categories
          </button>

          <Link
            to="/products/new"
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Product
          </Link>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-gray-200/80 space-y-3">
        {/* Search Input & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog by name or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle (Grid vs Table) */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Catalogue Cards"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 touch-pan-x scroll-smooth -mx-1 px-1 sm:mx-0 sm:px-0">
          <button
            ref={activeCategoryId === 'all' ? activeTabRef : null}
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] flex items-center justify-center shrink-0 ${
              activeCategoryId === 'all'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 active:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {prioritizedCategories.map((cat) => {
            const isSelected = String(activeCategoryId) === String(cat.id);
            return (
              <button
                key={cat.id}
                ref={isSelected ? activeTabRef : null}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 active:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setFilterWithPhotos(!filterWithPhotos)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-all ${
              filterWithPhotos
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Camera className="w-3 h-3" />
            With Photos
          </button>

          <button
            type="button"
            onClick={() => setFilterWithEstimate(!filterWithEstimate)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-all ${
              filterWithEstimate
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Calculator className="w-3 h-3" />
            With Estimate Copy
          </button>

          <button
            type="button"
            onClick={() => setFilterInStock(!filterInStock)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-all ${
              filterInStock
                ? 'bg-purple-50 text-purple-700 border-purple-300'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Box className="w-3 h-3" />
            In Stock
          </button>

          {(filterWithPhotos || filterWithEstimate || filterInStock) && (
            <button
              type="button"
              onClick={() => {
                setFilterWithPhotos(false);
                setFilterWithEstimate(false);
                setFilterInStock(false);
              }}
              className="text-[11px] text-gray-400 hover:text-gray-600 underline ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading catalog...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">No products found</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm || (activeCategoryId && activeCategoryId !== 'all') || filterWithPhotos || filterWithEstimate
                ? 'Try adjusting your search query or filters'
                : 'Get started by creating your first product in the catalogue'}
            </p>
          </div>
          <Link
            to="/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Product
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* CATALOGUE CARDS GRID (Mobile & Desktop) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const images = product.images || [];
            const primaryImage = images[0];
            const estimate = product.estimateData;
            const quotePrice = estimate?.quotedAmount ?? product.defaultUnitPrice;

            return (
              <div
                key={product.id}
                onClick={() => setDetailProduct(product)}
                className="group bg-white rounded-2xl border border-gray-200/80 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Product Photo Banner */}
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden flex items-center justify-center">
                  {primaryImage ? (
                    <img
                      src={primaryImage.keyOptimized || primaryImage.keyThumbnail || primaryImage.keyRaw}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-blue-50/40 flex flex-col items-center justify-center text-gray-300 gap-1.5 group-hover:bg-blue-50/60 transition-colors">
                      <Camera className="w-8 h-8 text-gray-300 group-hover:text-blue-400 transition-colors" />
                      <span className="text-[11px] font-medium text-gray-400">Add Photo</span>
                    </div>
                  )}

                  {/* Badges on Photo */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                    {product.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-blue-800 shadow-xs backdrop-blur-xs">
                        {product.category.name}
                      </span>
                    )}
                    {estimate && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/95 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                        <Calculator className="w-2.5 h-2.5" />
                        {formatTemplateBadge(estimate.activeTemplate)}
                      </span>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {images.length}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    {/* Stock indicator */}
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      {product.isPurchasable ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                          In Stock: {product.stockQuantity}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium">Made to Order</span>
                      )}
                      <span className="text-gray-400">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB') : ''}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {product.name}
                    </h3>

                    {/* Estimate Specs snippet if present */}
                    {estimate && (
                      <div className="mt-2 text-[11px] text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100 space-y-0.5">
                        {estimate.dfThicknessOption && (
                          <div className="truncate">
                            <span className="text-gray-400">Spec:</span> {estimate.dfThicknessOption}" {estimate.dfWidth && `• ${estimate.dfWidth}${estimate.dfWidthUnit || 'ft'}×${estimate.dfHeight}${estimate.dfHeightUnit || 'ft'}`}
                          </div>
                        )}
                        {estimate.totalVolumeCft && (
                          <div className="truncate">
                            <span className="text-gray-400">Vol:</span> {Number(estimate.totalVolumeCft).toFixed(2)} CFT
                          </div>
                        )}
                      </div>
                    )}

                    {product.notes && !estimate && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1 italic">
                        {product.notes}
                      </p>
                    )}
                  </div>

                  {/* Price & Actions Row */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">
                        {estimate?.quotedAmount ? 'Quote' : 'Price'}
                      </div>
                      <div className="text-base font-extrabold text-gray-900 leading-tight">
                        ₹{Number(quotePrice || 0).toLocaleString()}
                      </div>
                      {estimate?.finalCost && (
                        <div className="text-[10px] text-gray-400">
                          Est: ₹{Number(estimate.finalCost).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenWoodEstimator(product)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          estimate
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                        title={estimate ? 'Edit in Wood Estimator' : 'Attach Estimate (Wood Estimator)'}
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        to={`/products/${product.id}/edit`}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit product"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(product.id, e)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SPREADSHEET TABLE VIEW (Desktop alternative) */
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-16">Photo</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Estimate Copy</th>
                  <th className="px-4 py-3 text-right">Price (₹)</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const img = product.images?.[0];
                  const estimate = product.estimateData;
                  const quotePrice = estimate?.quotedAmount ?? product.defaultUnitPrice;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => setDetailProduct(product)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                          {img ? (
                            <img
                              src={img.keyThumbnail || img.keyOptimized}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-gray-900">
                        {product.name}
                        {product.notes && (
                          <div className="text-[10px] text-gray-400 font-normal truncate max-w-xs">
                            {product.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {product.category && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700">
                            {product.category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {estimate ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <Calculator className="w-3 h-3" />
                            {formatTemplateBadge(estimate.activeTemplate)}
                            {estimate.dfThicknessOption && ` (${estimate.dfThicknessOption}")`}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-extrabold text-gray-900">
                        ₹{Number(quotePrice || 0).toLocaleString()}
                        {estimate?.finalCost && (
                          <div className="text-[10px] text-gray-400 font-normal">
                            Est: ₹{Number(estimate.finalCost).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {product.isPurchasable ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {product.stockQuantity}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Made to order</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenWoodEstimator(product)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title={estimate ? 'Edit in Wood Estimator' : 'Attach Estimate (Wood Estimator)'}
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(product.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more products...' : 'Load More Products'}
          </button>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {detailProduct && (
        <ProductDetailModal
          isOpen={Boolean(detailProduct)}
          onClose={() => setDetailProduct(null)}
          product={detailProduct}
          onEditProduct={(p) => navigate(`/products/${p.id}/edit`)}
          onDeleteProduct={(id) => handleDelete(id)}
          onOpenEstimateModal={(p) => {
            setDetailProduct(null);
            handleOpenWoodEstimator(p);
          }}
          onProductUpdated={(updated) => {
            setDetailProduct(updated);
            refetchProducts();
          }}
        />
      )}

      {/* PRODUCT ESTIMATE MODAL */}
      {estimateProduct && (
        <ProductEstimateModal
          isOpen={Boolean(estimateProduct)}
          onClose={() => setEstimateProduct(null)}
          product={estimateProduct}
          onEstimateSaved={() => {
            refetchProducts();
            if (detailProduct && detailProduct.id === estimateProduct.id) {
              api.get(`/products/${estimateProduct.id}`).then((res) => setDetailProduct(res));
            }
          }}
        />
      )}

      {/* CATEGORIES MODAL */}
      {isManageModalOpen && (
        <ManageCategoriesModal onClose={() => setIsManageModalOpen(false)} />
      )}
    </div>
  );
}

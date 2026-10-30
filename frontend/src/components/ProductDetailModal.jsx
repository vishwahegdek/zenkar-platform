import React, { useState } from 'react';
import { 
  X, 
  Pencil, 
  Trash2, 
  Calculator, 
  Camera, 
  Box, 
  Layers, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  Clock,
  User,
  Plus,
  PackageCheck,
  FileText
} from 'lucide-react';
import ProductPhotoUploader from './ProductPhotoUploader';

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onEditProduct,
  onDeleteProduct,
  onOpenEstimateModal,
  onProductUpdated,
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  if (!isOpen || !product) return null;

  const images = product.images || [];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[activePhotoIndex] || images[0] : null;
  const estimateData = product.estimateData;

  const nextPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % images.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatTemplateName = (tmpl) => {
    if (tmpl === 'door_frame') return 'Door Frame';
    if (tmpl === 'custom') return 'Custom Blocks';
    return tmpl || 'Estimate';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        
        {/* Top Floating Close Button on Mobile / Header Bar */}
        <div className="relative">
          {/* Main Photo Gallery Banner */}
          {hasImages ? (
            <div className="relative aspect-video sm:aspect-21/9 bg-gray-950 flex items-center justify-center overflow-hidden group">
              <img
                src={currentImage?.keyOptimized || currentImage?.keyRaw}
                alt={product.name}
                className="w-full h-full object-contain cursor-zoom-in"
                onClick={() => setIsPhotoZoomed(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              {/* Navigation Arrows (if > 1 image) */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-white text-[11px] font-semibold tracking-wider">
                    {activePhotoIndex + 1} / {images.length}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsPhotoZoomed(true)}
                className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                title="Zoom photo"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100 flex flex-col items-center justify-center text-gray-400 gap-2 relative">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-blue-500">
                <Box className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-500">No product photos yet</span>
            </div>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md backdrop-blur-xs transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Title and Category */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {product.category && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {product.category.name}
                  </span>
                )}
                {product.isPurchasable ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    In Stock: {product.stockQuantity}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Made to Order
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Badge */}
            <div className="sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-gray-200/80">
              <span className="text-[11px] text-gray-500 uppercase font-bold block">
                {estimateData?.quotedAmount ? 'Customer Quote' : 'Catalog Price'}
              </span>
              <span className="text-2xl font-extrabold text-gray-900">
                ₹{Number(estimateData?.quotedAmount || product.defaultUnitPrice || 0).toLocaleString()}
              </span>
              {estimateData?.finalCost && (
                <div className="text-xs text-gray-500">
                  Estimated Cost: <span className="font-semibold text-gray-700">₹{Number(estimateData.finalCost).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* ESTIMATE COPY CARD */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs bg-white">
            <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/40 p-3.5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Estimate Copy & Specs
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    {estimateData ? `${formatTemplateName(estimateData.activeTemplate)} configured` : 'No estimate copy attached'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenEstimateModal(product)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                {estimateData ? 'Edit Estimate' : 'Attach Estimate'}
              </button>
            </div>

            {estimateData ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {estimateData.dfThicknessOption && (
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Thickness</span>
                      <span className="font-semibold text-gray-900 text-sm">{estimateData.dfThicknessOption}"</span>
                    </div>
                  )}

                  {estimateData.dfWidth && estimateData.dfHeight && (
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Dimensions</span>
                      <span className="font-semibold text-gray-900 text-sm">
                        {estimateData.dfWidth}{estimateData.dfWidthUnit || 'ft'} × {estimateData.dfHeight}{estimateData.dfHeightUnit || 'ft'}
                      </span>
                    </div>
                  )}

                  {estimateData.totalVolumeCft && (
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Volume</span>
                      <span className="font-semibold text-gray-900 text-sm">
                        {Number(estimateData.totalVolumeCft).toFixed(2)} CFT
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional Spec Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {estimateData.hasBorder && (
                    <span className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                      Border: {estimateData.borderThicknessOption || 'Yes'}
                    </span>
                  )}
                  {estimateData.hasCarving && (
                    <span className="px-2.5 py-1 rounded-lg text-xs bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                      Carving: ₹{estimateData.carvingRateOption || 5}/sq in
                    </span>
                  )}
                  {estimateData.fittingLabour && (
                    <span className="px-2.5 py-1 rounded-lg text-xs bg-gray-100 text-gray-800 font-medium">
                      Fitting: ₹{Number(estimateData.fittingLabour).toLocaleString()}
                    </span>
                  )}
                  {estimateData.excludeBottomPiece !== undefined && (
                    <span className="px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                      {estimateData.excludeBottomPiece ? '3-Piece (No Sill)' : '4-Piece Frame'}
                    </span>
                  )}
                </div>

                {estimateData.notes && (
                  <div className="mt-2 text-xs bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-blue-900">
                    <span className="font-bold block mb-0.5">Notes:</span>
                    {estimateData.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 space-y-2">
                <p className="text-xs">
                  Attach an estimate copy to automatically calculate wood volume CFT, carving, border, and pricing for this product.
                </p>
              </div>
            )}
          </div>

          {/* PHOTO MANAGEMENT SECTION */}
          <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-xs">
            <ProductPhotoUploader
              productId={product.id}
              existingImages={product.images || []}
              onImagesUploaded={(newImages) => {
                if (onProductUpdated) {
                  onProductUpdated({
                    ...product,
                    images: [...(product.images || []), ...newImages],
                  });
                }
              }}
              onImageDeleted={(deletedId) => {
                if (onProductUpdated) {
                  onProductUpdated({
                    ...product,
                    images: (product.images || []).filter((img) => img.id !== deletedId),
                  });
                }
              }}
            />
          </div>

          {/* NOTES & METADATA */}
          {product.notes && (
            <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-200 text-xs">
              <span className="font-bold text-gray-700 block mb-1">General Notes</span>
              <p className="text-gray-600 whitespace-pre-wrap">{product.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-blue-400" />
              {product.createdBy?.username ? `Created by ${product.createdBy.username}` : 'Catalog item'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-GB') : ''}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onDeleteProduct) onDeleteProduct(product.id);
            }}
            className="p-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEditProduct) onEditProduct(product);
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Product
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {isPhotoZoomed && currentImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsPhotoZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsPhotoZoomed(false)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentImage.keyRaw || currentImage.keyOptimized}
              alt={product.name}
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

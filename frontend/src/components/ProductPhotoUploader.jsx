import React, { useState, useRef } from 'react';
import { Camera, Plus, Trash2, X, ZoomIn, Loader2, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';
import toast from 'react-hot-toast';

export default function ProductPhotoUploader({
  productId,
  existingImages = [],
  pendingFiles = [],
  onPendingFilesChange,
  onImageDeleted,
  onImagesUploaded,
  readOnly = false,
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset input so same file can be selected again if needed
    e.target.value = '';

    // If product exists, upload immediately to backend
    if (productId) {
      setIsUploading(true);
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      try {
        const res = await api.post(`/products/${productId}/images`, formData);
        toast.success(
          files.length === 1 ? 'Photo uploaded successfully' : `${files.length} photos uploaded`,
        );
        if (onImagesUploaded) {
          onImagesUploaded(res);
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
        toast.error(err.response?.data?.message || 'Failed to upload photo');
      } finally {
        setIsUploading(false);
      }
    } else {
      // New product mode: buffer files locally before product creation
      if (onPendingFilesChange) {
        const newFiles = [...pendingFiles, ...files];
        onPendingFilesChange(newFiles);
        toast.success(`${files.length} photo(s) selected`);
      }
    }
  };

  const handleDeleteExisting = async (imageId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/products/${productId}/images/${imageId}`);
      toast.success('Photo removed');
      if (onImageDeleted) {
        onImageDeleted(imageId);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
      toast.error('Failed to delete photo');
    }
  };

  const handleDeletePending = (index, e) => {
    e.stopPropagation();
    if (onPendingFilesChange) {
      const updated = pendingFiles.filter((_, i) => i !== index);
      onPendingFilesChange(updated);
    }
  };

  const totalCount = existingImages.length + pendingFiles.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-blue-600" />
          Product Photos
          {totalCount > 0 && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-1">
              {totalCount}
            </span>
          )}
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add Photo
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Photos Grid / Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {/* Existing uploaded images */}
        {existingImages.map((img, idx) => (
          <div
            key={img.id || idx}
            onClick={() => setSelectedPhoto(img.keyRaw || img.keyOptimized)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer shadow-xs hover:shadow-md transition-all"
          >
            <img
              src={img.keyThumbnail || img.keyOptimized || img.keyRaw}
              alt="Product photo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="p-1.5 bg-white/90 text-gray-700 rounded-full shadow hover:bg-white">
                <ZoomIn className="w-3.5 h-3.5" />
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteExisting(img.id, e)}
                  className="p-1.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition-colors"
                  title="Delete photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Pending files for new product */}
        {pendingFiles.map((file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div
              key={`pending-${idx}`}
              onClick={() => setSelectedPhoto(previewUrl)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-amber-50 border border-amber-200 cursor-pointer shadow-xs"
            >
              <img
                src={previewUrl}
                alt="Selected photo"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1 left-1 bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                New
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => handleDeletePending(idx, e)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Upload Button Tile */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/80 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-blue-600 transition-all cursor-pointer group p-2 text-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-[11px] font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-white shadow-xs group-hover:shadow flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium leading-tight">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      {totalCount === 0 && readOnly && (
        <div className="text-xs text-gray-400 italic flex items-center gap-1.5 py-1">
          <ImageIcon className="w-3.5 h-3.5" />
          No photos attached
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Enlarged product photo"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

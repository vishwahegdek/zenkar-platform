import React, { useState } from 'react';
import { X, Download, Maximize2 } from 'lucide-react';

const ImageGallery = ({ images = [] }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Images</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {images.map((img) => (
          <div 
            key={img.id} 
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
            onClick={() => setSelectedImage(img)}
          >
            <img 
              src={img.thumbnailUrl} 
              alt="Thumbnail" 
              className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
            />
          </div>
        ))}
      </div>

      {/* Lightbox / Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
          >
            <X size={32} />
          </button>

          <div className="relative max-w-4xl w-full max-h-screen flex flex-col items-center">
            <img 
              src={selectedImage.optimizedUrl} 
              alt="Full View" 
              className="max-h-[80vh] w-auto object-contain rounded-md shadow-2xl"
            />
            
            <div className="mt-4 flex gap-4">
              <a 
                href={selectedImage.rawUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
              >
                <Download size={18} />
                <span className="text-sm font-medium">Download Original</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

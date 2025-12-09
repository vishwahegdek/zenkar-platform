import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ImageUploader = ({ uploadUrl, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        // No Content-Type header needed for FormData, browser sets it with boundary
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setSuccess(true);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(data);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Add Image</h4>
      
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer"
          disabled={uploading}
        />
        
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <CheckCircle size={14} />
          Upload Successful!
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

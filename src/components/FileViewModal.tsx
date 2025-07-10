import React, { useState } from 'react';
import { Document } from '../types';
import { documentsAPI } from '../services/api';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface FileViewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

const FileViewModal: React.FC<FileViewModalProps> = ({ document, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !document) return null;

  const token = localStorage.getItem('token');
  const viewUrl = `${documentsAPI.getViewUrl(document._id)}?token=${token}`;
  const isImage = document.mimeType.startsWith('image/');
  const isPDF = document.mimeType === 'application/pdf';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => { setZoom(100); setRotation(0); };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{document.originalName}</h2>
          <div className="flex items-center gap-2">
            {isImage && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={handleZoomOut} className="p-1 hover:bg-gray-200 rounded" title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-sm font-medium">{zoom}%</span>
                <button onClick={handleZoomIn} className="p-1 hover:bg-gray-200 rounded" title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={handleRotate} className="p-1 hover:bg-gray-200 rounded" title="Rotate">
                  <RotateCw className="w-4 h-4" />
                </button>
                <button onClick={handleReset} className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded" title="Reset">
                  Reset
                </button>
              </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50">
          {isImage ? (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                src={viewUrl}
                alt={document.originalName}
                className="max-w-none transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
              />
            </div>
          ) : isPDF ? (
            <div className="h-full">
              <iframe
                src={viewUrl}
                className="w-full h-full border-0"
                title={document.originalName}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Preview not available for this file type</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewModal;
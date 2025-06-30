import React from 'react';
import { Document } from '../types';
import { documentsAPI } from '../services/api';
import { X } from 'lucide-react';

interface FileViewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

const FileViewModal: React.FC<FileViewModalProps> = ({ document, isOpen, onClose }) => {
  if (!isOpen || !document) return null;

  const token = localStorage.getItem('token');
  const viewUrl = `${documentsAPI.getViewUrl(document._id)}?token=${token}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{document.originalName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-4">
          <iframe
            src={viewUrl}
            className="w-full h-full border-0 rounded"
            title={document.originalName}
          />
        </div>
      </div>
    </div>
  );
};

export default FileViewModal;
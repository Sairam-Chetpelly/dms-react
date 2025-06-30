import React from 'react';
import { Document } from '../types';
import { Star, Download, Trash2, FileText, Image, Video, Music, Share, Eye } from 'lucide-react';

interface DocumentGridProps {
  documents: Document[];
  onStar: (id: string, starred: boolean) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (document: Document) => void;
  onView: (document: Document) => void;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onStar,
  onDelete,
  onDownload,
  onShare,
  onView,
}) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading a document.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((document) => (
        <div
          key={document._id}
          className="relative group bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400">
              {getFileIcon(document.mimeType)}
            </div>
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onStar(document._id, !document.isStarred)}
                className={`p-1 rounded hover:bg-gray-100 ${
                  document.isStarred ? 'text-yellow-500' : 'text-gray-400'
                }`}
              >
                <Star className="w-4 h-4" fill={document.isStarred ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => onView(document)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onShare(document)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <Share className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDownload(document._id)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(document._id)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="min-h-0">
            <h3 
              className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-indigo-600" 
              title={document.originalName}
              onClick={() => onView(document)}
            >
              {document.originalName}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(document.size)} • {formatDate(document.createdAt)}
            </p>
            
            {document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {document.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag._id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
                {document.tags.length > 2 && (
                  <span className="text-xs text-gray-500">+{document.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentGrid;
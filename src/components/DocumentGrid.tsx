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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: '10px' }}>
      {documents.map((document) => (
        <div
          key={document._id}
          className="relative group p-6 rounded-xl card-hover glass-effect card-gradient overflow-hidden"
        >
          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="text-indigo-600 icon-bounce p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-2xl border-2 border-indigo-200 shadow-md">
              {getFileIcon(document.mimeType)}
            </div>
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10">
              <button
                onClick={() => onStar(document._id, !document.isStarred)}
                className={`p-2 rounded-full hover:bg-gray-100 transition-all ${
                  document.isStarred ? 'text-yellow-500 pulse-animation' : 'text-gray-400'
                }`}
              >
                <Star className="w-4 h-4" fill={document.isStarred ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => onView(document)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-all"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onShare(document)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-all"
              >
                <Share className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDownload(document._id)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(document._id)}
                className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="min-h-0 relative z-10">
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
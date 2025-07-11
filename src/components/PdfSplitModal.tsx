import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { documentsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { X, Scissors, FileText, Eye, Plus } from 'lucide-react';

interface PdfSplitModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSplit: () => void;
}

const PdfSplitModal: React.FC<PdfSplitModalProps> = ({ document, isOpen, onClose, onSplit }) => {
  const { showToast } = useToast();
  const [splitRanges, setSplitRanges] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageRanges, setPageRanges] = useState<string[]>([]);

  const handleSplit = async () => {
    if (!document || !splitRanges.trim()) return;

    setLoading(true);
    try {
      await documentsAPI.splitPdf(document._id, splitRanges);
      onSplit();
      onClose();
      showToast('success', 'PDF split successfully');
    } catch (error: any) {
      console.error('Error splitting PDF:', error);
      showToast('error', error.response?.data?.message || 'Failed to split PDF');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && document) {
      setSplitRanges('');
      setSelectedPages([]);
      setPageRanges([]);
      setShowPreview(false);
    }
  }, [isOpen, document]);

  const addPageRange = () => {
    if (selectedPages.length === 0) return;
    
    const sortedPages = [...selectedPages].sort((a, b) => a - b);
    let ranges = [];
    let start = sortedPages[0];
    let end = sortedPages[0];
    
    for (let i = 1; i < sortedPages.length; i++) {
      if (sortedPages[i] === end + 1) {
        end = sortedPages[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = end = sortedPages[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    
    const newRange = ranges.join(', ');
    setPageRanges([...pageRanges, newRange]);
    setSplitRanges([...pageRanges, newRange].join('\n'));
    setSelectedPages([]);
  };

  const removePageRange = (index: number) => {
    const newRanges = pageRanges.filter((_, i) => i !== index);
    setPageRanges(newRanges);
    setSplitRanges(newRanges.join('\n'));
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNum) 
        ? prev.filter(p => p !== pageNum)
        : [...prev, pageNum]
    );
  };

  if (!isOpen || !document) return null;

  const token = localStorage.getItem('token');
  const viewUrl = `${documentsAPI.getViewUrl(document._id)}?token=${token}#toolbar=0`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 w-full ${showPreview ? 'max-w-6xl h-5/6' : 'max-w-md'} flex flex-col`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Scissors className="w-5 h-5 mr-2" />
            Split PDF
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <FileText className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{document.originalName}</span>
          </div>
        </div>

        {showPreview ? (
          <div className="flex-1 flex gap-4 overflow-hidden">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">PDF Preview - Select Pages</h3>
                <div className="flex gap-2">
                  <button
                    onClick={addPageRange}
                    disabled={selectedPages.length === 0}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Add Range ({selectedPages.length})
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded"
                  >
                    Text Mode
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
                <iframe
                  src={viewUrl}
                  className="w-full h-full border-0"
                  title={document.originalName}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Click pages in the PDF above, then click "Add Range" to create split ranges
              </div>
            </div>
            
            <div className="w-80 flex flex-col">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Split Ranges</h3>
              <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
                {pageRanges.map((range, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm">Pages: {range}</span>
                    <button
                      onClick={() => removePageRange(index)}
                      className="text-red-600 text-xs hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {pageRanges.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No ranges added yet
                  </p>
                )}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manual Entry
                </label>
                <textarea
                  value={splitRanges}
                  onChange={(e) => {
                    setSplitRanges(e.target.value);
                    setPageRanges(e.target.value.split('\n').filter(r => r.trim()));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                  rows={3}
                  placeholder="1-3&#10;5-7&#10;10"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Page Ranges (e.g., 1-3, 5-7, 10)
              </label>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview Mode
              </button>
            </div>
            <textarea
              value={splitRanges}
              onChange={(e) => setSplitRanges(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="1-3&#10;5-7&#10;10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter each range on a new line. Use format: start-end or single page number
            </p>
          </div>
        )}

        {!showPreview && (
          <div className="flex space-x-3">
            <button
              onClick={handleSplit}
              disabled={loading || !splitRanges.trim()}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Splitting...' : 'Split PDF'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
        
        {showPreview && (
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleSplit}
              disabled={loading || !splitRanges.trim()}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Splitting...' : `Split into ${pageRanges.length} PDFs`}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfSplitModal;
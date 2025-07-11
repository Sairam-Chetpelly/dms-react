import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { documentsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { X, Merge, FileText, GripVertical, Eye, Grid, ChevronUp, ChevronDown } from 'lucide-react';

interface PdfMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
  currentFolder?: string | null;
  currentFilter?: string;
}

const PdfMergeModal: React.FC<PdfMergeModalProps> = ({ isOpen, onClose, onMerge, currentFolder, currentFilter }) => {
  const { showToast } = useToast();
  const [availablePdfs, setAvailablePdfs] = useState<Document[]>([]);
  const [selectedPdfs, setSelectedPdfs] = useState<Document[]>([]);
  const [mergedFileName, setMergedFileName] = useState('merged-document.pdf');
  const [loading, setLoading] = useState(false);
  const [splitGroups, setSplitGroups] = useState<{[key: string]: Document[]}>({});
  const [showSplitGroups, setShowSplitGroups] = useState(false);
  const [showPagePreview, setShowPagePreview] = useState(false);
  const [pdfPages, setPdfPages] = useState<{pdfId: string, pageNum: number, pdfName: string}[]>([]);
  const [draggedPage, setDraggedPage] = useState<{pdfId: string, pageNum: number} | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPdfs();
      // Reset modal state when opening
      setSelectedPdfs([]);
      setShowPreview(false);
      setMergedFileName('merged-document.pdf');
    }
  }, [isOpen, currentFolder, currentFilter]);

  const loadPdfs = async () => {
    try {
      const params: any = {};
      
      // Apply same filtering logic as main document view
      if (currentFilter === 'starred') {
        params.starred = 'true';
      } else if (currentFilter === 'shared') {
        params.shared = 'true';
      } else if (currentFilter === 'mydrives') {
        params.mydrives = 'true';
      } else {
        // For 'all' filter or specific folder
        if (currentFolder) {
          params.folder = currentFolder;
        }
      }
      
      const response = await documentsAPI.getAll(params);
      const pdfs = response.data.filter((doc: Document) => doc.mimeType === 'application/pdf');
      setAvailablePdfs(pdfs);
      
      // Group split PDFs by base name
      const groups: {[key: string]: Document[]} = {};
      pdfs.forEach(pdf => {
        const match = pdf.originalName.match(/^(.+)_part\d+\.pdf$/);
        if (match) {
          const baseName = match[1];
          if (!groups[baseName]) groups[baseName] = [];
          groups[baseName].push(pdf);
        }
      });
      
      // Only keep groups with multiple parts
      Object.keys(groups).forEach(key => {
        if (groups[key].length < 2) delete groups[key];
        else groups[key].sort((a, b) => a.originalName.localeCompare(b.originalName));
      });
      
      setSplitGroups(groups);
    } catch (error) {
      console.error('Error loading PDFs:', error);
    }
  };

  const handleAddPdf = (pdf: Document) => {
    if (!selectedPdfs.find(p => p._id === pdf._id)) {
      setSelectedPdfs([...selectedPdfs, pdf]);
    }
  };

  const handleAddSplitGroup = (groupName: string) => {
    const groupPdfs = splitGroups[groupName];
    const newPdfs = groupPdfs.filter(pdf => !selectedPdfs.find(p => p._id === pdf._id));
    setSelectedPdfs([...selectedPdfs, ...newPdfs]);
    setMergedFileName(`${groupName}_merged.pdf`);
  };

  const handleRemovePdf = (pdfId: string) => {
    setSelectedPdfs(selectedPdfs.filter(p => p._id !== pdfId));
  };

  const handleMerge = async () => {
    if (showPagePreview) {
      if (pdfPages.length === 0) {
        showToast('warning', 'Please add pages to merge');
        return;
      }
      setLoading(true);
      try {
        await documentsAPI.mergePages(pdfPages, mergedFileName, currentFolder);
        onMerge();
        onClose();
        showToast('success', 'Pages merged successfully');
      } catch (error: any) {
        console.error('Error merging pages:', error);
        showToast('error', error.response?.data?.message || 'Failed to merge pages');
      } finally {
        setLoading(false);
      }
    } else {
      if (selectedPdfs.length < 2) {
        showToast('warning', 'Please select at least 2 PDFs to merge');
        return;
      }
      setLoading(true);
      try {
        const pdfIds = selectedPdfs.map(pdf => pdf._id);
        await documentsAPI.mergePdfs(pdfIds, mergedFileName, currentFolder);
        onMerge();
        onClose();
        showToast('success', 'PDFs merged successfully');
      } catch (error: any) {
        console.error('Error merging PDFs:', error);
        showToast('error', error.response?.data?.message || 'Failed to merge PDFs');
      } finally {
        setLoading(false);
      }
    }
  };

  const addPageToMerge = (pdf: Document, pageNum: number) => {
    const newPage = { pdfId: pdf._id, pageNum, pdfName: pdf.originalName };
    setPdfPages([...pdfPages, newPage]);
  };

  const removePageFromMerge = (index: number) => {
    setPdfPages(pdfPages.filter((_, i) => i !== index));
  };

  const handleDragStart = (page: {pdfId: string, pageNum: number}) => {
    setDraggedPage(page);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedPage) return;
    
    const dragIndex = pdfPages.findIndex(p => p.pdfId === draggedPage.pdfId && p.pageNum === draggedPage.pageNum);
    if (dragIndex === -1) return;
    
    const newPages = [...pdfPages];
    const [draggedItem] = newPages.splice(dragIndex, 1);
    newPages.splice(dropIndex, 0, draggedItem);
    setPdfPages(newPages);
    setDraggedPage(null);
  };

  const movePdfUp = (index: number) => {
    if (index === 0) return;
    const newPdfs = [...selectedPdfs];
    [newPdfs[index], newPdfs[index - 1]] = [newPdfs[index - 1], newPdfs[index]];
    setSelectedPdfs(newPdfs);
  };

  const movePdfDown = (index: number) => {
    if (index === selectedPdfs.length - 1) return;
    const newPdfs = [...selectedPdfs];
    [newPdfs[index], newPdfs[index + 1]] = [newPdfs[index + 1], newPdfs[index]];
    setSelectedPdfs(newPdfs);
  };

  const handlePdfDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePdfDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;
    
    const newPdfs = [...selectedPdfs];
    const [draggedItem] = newPdfs.splice(dragIndex, 1);
    newPdfs.splice(dropIndex, 0, draggedItem);
    setSelectedPdfs(newPdfs);
  };

  useEffect(() => {
    if (!isOpen) {
      // Clear state when modal closes
      setSelectedPdfs([]);
      setShowPreview(false);
      setShowSplitGroups(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Merge className="w-8 h-8 mr-4 text-blue-600" />
            Merge PDFs Together
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <X className="w-8 h-8" />
          </button>
        </div>
        
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
              <span className="font-medium">Choose PDFs</span>
            </div>
            <div className="text-blue-300">→</div>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
              <span className="font-medium">Set Order</span>
            </div>
            <div className="text-blue-300">→</div>
            <div className="flex items-center space-x-2">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">✓</div>
              <span className="font-medium">Merge!</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-8 min-h-0">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📁 Available PDFs</h3>
              {Object.keys(splitGroups).length > 0 && (
                <button
                  onClick={() => setShowSplitGroups(!showSplitGroups)}
                  className={`px-4 py-2 rounded-lg font-medium ${showSplitGroups ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {showSplitGroups ? '✓ Split Groups' : `Split Groups (${Object.keys(splitGroups).length})`}
                </button>
              )}
            </div>
            <div className="flex-1 border border-gray-300 rounded-lg p-4 overflow-y-auto bg-white">
              {showPreview ? (
                <div className="py-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-green-700 mb-2">📋 Merged PDF Preview</h3>
                    <p className="text-gray-600">This is how your merged PDF will look:</p>
                  </div>
                  
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {selectedPdfs.map((pdf, index) => {
                      const token = localStorage.getItem('token');
                      const viewUrl = `${documentsAPI.getViewUrl(pdf._id)}?token=${token}#toolbar=0&navpanes=0`;
                      return (
                        <div key={pdf._id} className="border border-gray-300 rounded-lg overflow-hidden">
                          <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                            <div className="flex items-center">
                              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                                {index + 1}
                              </div>
                              <span className="font-medium text-gray-800">{pdf.originalName}</span>
                            </div>
                          </div>
                          <div className="h-48 bg-gray-100">
                            <iframe
                              src={viewUrl}
                              className="w-full h-full border-0"
                              title={`Preview of ${pdf.originalName}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
                    >
                      ← Back to Edit
                    </button>
                    <button
                      onClick={handleMerge}
                      disabled={loading}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      {loading ? '🔄 Merging...' : '🚀 Create Merged PDF'}
                    </button>
                  </div>
                </div>
              ) : showSplitGroups ? (
                Object.keys(splitGroups).length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No split PDF groups found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(splitGroups).map(([groupName, pdfs]) => (
                      <div key={groupName} className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800">📄 {groupName}</h4>
                            <p className="text-gray-600">{pdfs.length} parts available</p>
                          </div>
                          <button
                            onClick={() => handleAddSplitGroup(groupName)}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                          >
                            ✨ Add All Parts
                          </button>
                        </div>
                        <div className="space-y-2">
                          {pdfs.map(pdf => (
                            <div key={pdf._id} className="flex items-center p-3 bg-white rounded border">
                              <FileText className="w-5 h-5 mr-3 text-red-500" />
                              <span className="text-gray-700">{pdf.originalName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                availablePdfs.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No PDFs found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availablePdfs.map(pdf => (
                      <div
                        key={pdf._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                        onClick={() => handleAddPdf(pdf)}
                      >
                        <div className="flex items-center">
                          <FileText className="w-8 h-8 text-red-500 mr-4" />
                          <div>
                            <div className="font-medium text-gray-800">{pdf.originalName}</div>
                            <div className="text-sm text-gray-500">PDF Document</div>
                          </div>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
          
          <div className="w-96 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">🔄 Merge Order</h3>
              <p className="text-gray-600">{selectedPdfs.length} PDFs selected</p>
            </div>
            <div className="flex-1 border border-gray-300 rounded-lg p-4 overflow-y-auto bg-gray-50">
              {selectedPdfs.length === 0 ? (
                <div className="text-center py-12">
                  <Merge className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selected PDFs will appear here</p>
                  <p className="text-sm text-gray-400 mt-2">Drag to reorder</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {selectedPdfs.map((pdf, index) => (
                      <div 
                        key={pdf._id} 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => handlePdfDragStart(e, index)}
                        onDragOver={handlePdfDragOver}
                        onDrop={(e) => handlePdfDrop(e, index)}
                      >
                        <div className="flex items-center flex-1">
                          <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <GripVertical className="w-4 h-4 text-gray-400 mr-3 cursor-move" />
                          <FileText className="w-5 h-5 text-red-500 mr-3" />
                          <span className="font-medium text-gray-800 flex-1">{pdf.originalName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => movePdfUp(index)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => movePdfDown(index)}
                            disabled={index === selectedPdfs.length - 1}
                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemovePdf(pdf._id)}
                            className="p-1 text-red-600 hover:text-red-800 ml-2"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                    >
                      👁️ Preview & Continue ({selectedPdfs.length} PDFs)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {!showPreview && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              📝 File Name
            </label>
            <input
              type="text"
              value={mergedFileName}
              onChange={(e) => setMergedFileName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="merged-document.pdf"
            />
          </div>
        )}
        
        {!showPreview && (
          <div className="flex space-x-4 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              Cancel
            </button>
            <div className="flex-1 px-4 py-3 text-center text-gray-500">
              {selectedPdfs.length < 2 ? 'Select at least 2 PDFs to continue' : `${selectedPdfs.length} PDFs selected`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfMergeModal;
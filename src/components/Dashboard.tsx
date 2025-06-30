import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { documentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import DocumentGrid from './DocumentGrid';
import UploadModal from './UploadModal';
import ShareModal from './ShareModal';
import FileViewModal from './FileViewModal';
import InvoiceTable from './InvoiceTable';
import { Search, Upload, LogOut, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'starred' | 'shared' | 'mydrives' | 'invoices'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [shareDocument, setShareDocument] = useState<Document | null>(null);
  const [viewDocument, setViewDocument] = useState<Document | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (currentFolder) params.folder = currentFolder;
      if (currentFilter === 'starred') params.starred = 'true';
      if (currentFilter === 'shared') params.shared = 'true';
      if (currentFilter === 'mydrives') {
        params.mydrives = 'true';
        params.folder = null;
      }
      if (currentFilter === 'invoices') params.invoices = 'true';
      if (searchQuery) params.search = searchQuery;

      const response = await documentsAPI.getAll(params);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [currentFolder, currentFilter, searchQuery]);



  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolder) {
          formData.append('folder', currentFolder);
        }
        await documentsAPI.upload(formData);
      }
      loadDocuments();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleStar = async (id: string, starred: boolean) => {
    try {
      await documentsAPI.star(id, starred);
      loadDocuments();
    } catch (error) {
      console.error('Error starring document:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentsAPI.delete(id);
        loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await documentsAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleShare = (document: Document) => {
    setShareDocument(document);
  };

  const handleView = (document: Document) => {
    setViewDocument(document);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentFolder={currentFolder}
        onFolderChange={setCurrentFolder}
        onFilterChange={setCurrentFilter}
        currentFilter={currentFilter}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                DMS
              </h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
              
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">


          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : currentFilter === 'invoices' ? (
            <InvoiceTable onViewDocument={handleView} />
          ) : (
            <DocumentGrid
              documents={documents}
              onStar={handleStar}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onShare={handleShare}
              onView={handleView}
            />
          )}
        </main>
      </div>
      
      {shareDocument && (
        <ShareModal
          document={shareDocument}
          isOpen={!!shareDocument}
          onClose={() => setShareDocument(null)}
          onShare={loadDocuments}
        />
      )}
      
      <FileViewModal
        document={viewDocument}
        isOpen={!!viewDocument}
        onClose={() => setViewDocument(null)}
      />
      
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={loadDocuments}
        currentFolder={currentFolder}
      />
    </div>
  );
};

export default Dashboard;
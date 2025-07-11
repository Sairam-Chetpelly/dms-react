import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { documentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Sidebar from './Sidebar';
import DocumentGrid from './DocumentGrid';
import UploadModal from './UploadModal';
import ShareModal from './ShareModal';
import FileViewModal from './FileViewModal';
import InvoiceTable from './InvoiceTable';
import AdminPanel from './AdminPanel';
import Chatbot from './Chatbot';
import FolderCreateModal from './FolderCreateModal';
import FolderShareModal from './FolderShareModal';
import PdfSplitModal from './PdfSplitModal';
import PdfMergeModal from './PdfMergeModal';
import { Search, Upload, LogOut, User, Settings, Menu, MoreVertical, Merge } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(() => {
    return localStorage.getItem('currentFolder') || null;
  });
  const [currentFilter, setCurrentFilter] = useState<'all' | 'starred' | 'shared' | 'mydrives' | 'invoices' | 'admin'>(() => {
    return (localStorage.getItem('currentFilter') as any) || 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [shareDocument, setShareDocument] = useState<Document | null>(null);
  const [viewDocument, setViewDocument] = useState<Document | null>(null);
  const [showFolderCreateModal, setShowFolderCreateModal] = useState(false);
  const [shareFolderData, setShareFolderData] = useState<any>(null);
  const [splitPdfDocument, setSplitPdfDocument] = useState<Document | null>(null);
  const [showPdfMergeModal, setShowPdfMergeModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [folderRefreshTrigger, setFolderRefreshTrigger] = useState(0);
  const [accessRestricted, setAccessRestricted] = useState(false);
  const [canUploadToCurrentFolder, setCanUploadToCurrentFolder] = useState(true);

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
      setAccessRestricted(false);
      setCanUploadToCurrentFolder(true);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      // If access is denied to folder contents, show empty state
      if (error.response?.status === 403) {
        setDocuments([]);
        setAccessRestricted(true);
        setCanUploadToCurrentFolder(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleFolderChange = (folderId: string | null) => {
    setCurrentFolder(folderId);
    // Reset to 'all' filter when changing folders to ensure proper loading
    if (currentFilter !== 'all') {
      setCurrentFilter('all');
    }
  };
  
  const handleFilterChange = (filter: 'all' | 'starred' | 'shared' | 'mydrives' | 'invoices' | 'admin') => {
    setCurrentFilter(filter);
    // Reset folder when switching to shared or mydrives
    if (filter === 'shared' || filter === 'mydrives' || filter === 'starred' || filter === 'admin' || filter === 'invoices') {
      setCurrentFolder(null);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [currentFolder, currentFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem('currentFilter', currentFilter);
  }, [currentFilter]);

  useEffect(() => {
    if (currentFolder) {
      localStorage.setItem('currentFolder', currentFolder);
    } else {
      localStorage.removeItem('currentFolder');
    }
  }, [currentFolder]);





  const handleStar = async (id: string, starred: boolean) => {
    try {
      await documentsAPI.star(id, starred);
      loadDocuments();
      showToast('success', starred ? 'Document starred' : 'Document unstarred');
    } catch (error) {
      console.error('Error starring document:', error);
      showToast('error', 'Failed to update document');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentsAPI.delete(id);
        loadDocuments();
        showToast('success', 'Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        showToast('error', 'Failed to delete document');
      }
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const doc = documents.find(doc => doc._id === id);
      const response = await documentsAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: doc?.mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc?.originalName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast('error', 'Failed to download document');
    }
  };

  const handleShare = (document: Document) => {
    setShareDocument(document);
  };

  const handleView = (document: Document) => {
    setViewDocument(document);
  };

  const handleSplitPdf = (document: Document) => {
    setSplitPdfDocument(document);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}
      
      {/* Sidebar - Desktop: static, Mobile: fixed overlay */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar
          currentFolder={currentFolder}
          onFolderChange={handleFolderChange}
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
          onCreateFolder={() => setShowFolderCreateModal(true)}
          onShareFolder={setShareFolderData}
          onFolderCreated={() => {
            setFolderRefreshTrigger(prev => prev + 1);
            loadDocuments();
          }}
        />
      </div>
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          currentFolder={currentFolder}
          onFolderChange={handleFolderChange}
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
          onCreateFolder={() => setShowFolderCreateModal(true)}
          onShareFolder={setShareFolderData}
          onFolderCreated={() => {
            setFolderRefreshTrigger(prev => prev + 1);
            loadDocuments();
          }}
        />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden bg-white/80 backdrop-blur-sm min-w-0">
        {/* Header */}
        <header className="modern-card border-b border-white/20 px-4 sm:px-6 py-4 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">
                📄 DMS
              </h1>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-48 lg:w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Upload Button - Hide for certain filters and restricted folders */}
              {!['starred', 'shared', 'admin', 'invoices'].includes(currentFilter) && canUploadToCurrentFolder && (
                <>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Upload className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Upload</span>
                  </button>
                  <button
                    onClick={() => setShowPdfMergeModal(true)}
                    className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Merge className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Merge PDFs</span>
                  </button>
                </>
              )}
              
              {/* Desktop Menu Items */}
              <div className="hidden lg:flex items-center space-x-4">
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setCurrentFilter('admin')}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-colors ${
                      currentFilter === 'admin'
                        ? 'text-white bg-blue-600 shadow-sm'
                        : 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Panel
                  </button>
                )}
                
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div className="text-sm text-gray-700">
                    <div>{user?.name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user?.role} - {user?.department?.displayName}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Mobile/Tablet Menu */}
              <div className="lg:hidden relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                
                {mobileMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[9998]" 
                      onClick={() => setMobileMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-[9999] border">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          <div className="font-medium">{user?.name}</div>
                          <div className="text-xs text-gray-500 capitalize">
                            {user?.role} - {user?.department?.displayName}
                          </div>
                        </div>
                        
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => {
                              setCurrentFilter('admin');
                              setMobileMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Admin Panel
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">


          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : currentFilter === 'admin' ? (
            <AdminPanel />
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
              onSplitPdf={handleSplitPdf}
              accessRestricted={accessRestricted}
              currentUserId={user?._id || user?.id}
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
        currentFolder={currentFilter === 'mydrives' ? null : currentFolder}
      />
      
      <FolderCreateModal
        isOpen={showFolderCreateModal}
        onClose={() => setShowFolderCreateModal(false)}
        onCreate={() => {
          loadDocuments();
          setFolderRefreshTrigger(prev => prev + 1);
        }}
        currentFolder={currentFolder}
      />
      
      <FolderShareModal
        folder={shareFolderData}
        isOpen={!!shareFolderData}
        onClose={() => setShareFolderData(null)}
        onShare={() => {
          loadDocuments();
          setFolderRefreshTrigger(prev => prev + 1);
        }}
      />
      
      <PdfSplitModal
        document={splitPdfDocument}
        isOpen={!!splitPdfDocument}
        onClose={() => setSplitPdfDocument(null)}
        onSplit={loadDocuments}
      />
      
      <PdfMergeModal
        isOpen={showPdfMergeModal}
        onClose={() => setShowPdfMergeModal(false)}
        onMerge={loadDocuments}
        currentFolder={currentFolder}
        currentFilter={currentFilter}
      />
      
      <Chatbot />
    </div>
  );
};

export default Dashboard;
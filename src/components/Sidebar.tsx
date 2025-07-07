import React, { useState, useEffect } from 'react';
import { Folder, Tag } from '../types';
import { foldersAPI, tagsAPI, adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FolderIcon, Star, Share, Plus, ChevronRight, ChevronDown, HardDrive, FileText, Users, Settings } from 'lucide-react';

interface SidebarProps {
  currentFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
  onFilterChange: (filter: 'all' | 'starred' | 'shared' | 'mydrives' | 'invoices' | 'admin') => void;
  currentFilter: 'all' | 'starred' | 'shared' | 'mydrives' | 'invoices' | 'admin';
  onCreateFolder: () => void;
  onShareFolder: (folder: any) => void;
  onFolderCreated?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onFolderChange,
  onFilterChange,
  currentFilter,
  onCreateFolder,
  onShareFolder,
  onFolderCreated,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  
  useEffect(() => {
    loadAllDepartments();
  }, []);
  
  const loadAllDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments();
      setAllDepartments(response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  useEffect(() => {
    loadFolders();
    loadTags();
  }, []);

  useEffect(() => {
    if (onFolderCreated) {
      loadFolders();
    }
  }, [onFolderCreated]);

  const loadFolders = async () => {
    try {
      const response = await foldersAPI.getAll();
      setFolders(response.data);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getAll();
      setTags(response.data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };


  


  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderTree = (parentId: string | null = null, level: number = 0) => {
    const childFolders = folders.filter(folder => 
      (folder.parent?._id || null) === parentId
    );

    return childFolders.map(folder => {
      const hasAccess = (folder as any).hasAccess !== false;
      const canViewContent = (folder as any).canViewContent !== false;
      
      return (
        <div key={folder._id}>
          <div className="flex items-center justify-between group">
            <div
              className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 flex-1 ${
                currentFolder === folder._id ? 'bg-indigo-100 text-indigo-700' : 
                canViewContent ? 'text-gray-700' : 'text-gray-400'
              } ${!canViewContent ? 'opacity-60' : ''}`}
              style={{ paddingLeft: `${(level + 1) * 12}px` }}
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder._id);
                onFolderChange(folder._id);
              }}
              title={!canViewContent ? 'Access restricted - folder visible due to subfolder permissions' : ''}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder._id);
                }}
                className="mr-1 p-0.5 hover:bg-gray-200 rounded"
              >
                {expandedFolders.has(folder._id) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
              <FolderIcon className={`w-4 h-4 mr-2 ${!canViewContent ? 'text-gray-300' : ''}`} />
              <span className="truncate">{folder.name}</span>
              {!canViewContent && (
                <span className="ml-1 text-xs text-gray-400">🔒</span>
              )}
              {((folder.departmentAccess && folder.departmentAccess.length > 0) || 
                (folder.sharedWith && folder.sharedWith.length > 0)) && (
                <div title={`Shared with: ${[
                  ...(folder.departmentAccess?.map(d => typeof d === 'object' ? d.displayName : d) || []),
                  ...(folder.sharedWith?.map(u => typeof u === 'object' ? u.name : u) || [])
                ].join(', ')}`}>
                  <Users className="w-3 h-3 ml-1 text-blue-500" />
                </div>
              )}
            </div>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShareFolder(folder);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                title="Share with departments"
              >
                <Share className="w-3 h-3" />
              </button>
            )}
          </div>

          {expandedFolders.has(folder._id) && renderFolderTree(folder._id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="w-64 glass-card h-full overflow-y-auto border-r border-white/20 backdrop-blur-xl">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold gradient-text animate-pulse-slow">📁 Documents</h2>
        </div>
        
        {/* Quick Filters */}
        <div className="space-y-1 mb-8">
          <div
            className={`flex items-center px-4 py-3 text-sm rounded-xl cursor-pointer transition-all duration-300 hover-lift ${
              currentFilter === 'all' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'text-gray-700 hover:bg-white/50'
            }`}
            onClick={() => onFilterChange('all')}
          >
            <FolderIcon className="w-4 h-4 mr-2" />
            <span>All Documents</span>
          </div>
          <div
            className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
              currentFilter === 'starred' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onFilterChange('starred')}
          >
            <Star className="w-4 h-4 mr-2" />
            <span>Starred</span>
          </div>
          <div
            className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
              currentFilter === 'shared' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onFilterChange('shared')}
          >
            <Share className="w-4 h-4 mr-2" />
            <span>Shared</span>
          </div>
          <div
            className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
              currentFilter === 'mydrives' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onFilterChange('mydrives')}
          >
            <HardDrive className="w-4 h-4 mr-2" />
            <span>My Drives</span>
          </div>
          <div
            className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
              currentFilter === 'invoices' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => onFilterChange('invoices')}
          >
            <FileText className="w-4 h-4 mr-2" />
            <span>Invoice Records</span>
          </div>
          {user?.role === 'admin' && (
            <div
              className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                currentFilter === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => onFilterChange('admin')}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span>Admin Panel</span>
            </div>
          )}
        </div>

        {/* Folders */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Folders</h3>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <button
                onClick={onCreateFolder}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 animate-float"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          


          <div className="space-y-1">
            <div
              className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 ${
                currentFolder === null ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
              }`}
              onClick={() => onFolderChange(null)}
            >
              <FolderIcon className="w-4 h-4 mr-2" />
              <span>Data Bases</span>
            </div>
            {renderFolderTree()}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
          <div className="space-y-1">
            {tags.map(tag => (
              <div
                key={tag._id}
                className="flex items-center px-2 py-1 text-sm text-gray-700"
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">{tag.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      

    </div>
  );
};

export default Sidebar;
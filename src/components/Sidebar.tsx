import React, { useState, useEffect } from 'react';
import { Folder, Tag } from '../types';
import { foldersAPI, tagsAPI } from '../services/api';
import { FolderIcon, Star, Share, Plus, ChevronRight, ChevronDown, HardDrive } from 'lucide-react';

interface SidebarProps {
  currentFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
  onFilterChange: (filter: 'all' | 'starred' | 'shared' | 'mydrives') => void;
  currentFilter: 'all' | 'starred' | 'shared' | 'mydrives';
}

const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onFolderChange,
  onFilterChange,
  currentFilter,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadFolders();
    loadTags();
  }, []);

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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await foldersAPI.create(newFolderName, currentFolder || undefined);
      setNewFolderName('');
      setShowNewFolderForm(false);
      loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
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

    return childFolders.map(folder => (
      <div key={folder._id}>
        <div
          className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 ${
            currentFolder === folder._id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
          onClick={() => onFolderChange(folder._id)}
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
          <FolderIcon className="w-4 h-4 mr-2" />
          <span className="truncate">{folder.name}</span>
        </div>
        {expandedFolders.has(folder._id) && renderFolderTree(folder._id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
        
        {/* Quick Filters */}
        <div className="space-y-1 mb-6">
          <button
            onClick={() => onFilterChange('all')}
            className={`w-full flex items-center px-2 py-2 text-sm rounded ${
              currentFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FolderIcon className="w-4 h-4 mr-2" />
            All Documents
          </button>
          <button
            onClick={() => onFilterChange('starred')}
            className={`w-full flex items-center px-2 py-2 text-sm rounded ${
              currentFilter === 'starred' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Star className="w-4 h-4 mr-2" />
            Starred
          </button>
          <button
            onClick={() => onFilterChange('shared')}
            className={`w-full flex items-center px-2 py-2 text-sm rounded ${
              currentFilter === 'shared' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Share className="w-4 h-4 mr-2" />
            Shared
          </button>
          <button
            onClick={() => onFilterChange('mydrives')}
            className={`w-full flex items-center px-2 py-2 text-sm rounded ${
              currentFilter === 'mydrives' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <HardDrive className="w-4 h-4 mr-2" />
            My Drives
          </button>
        </div>

        {/* Folders */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Folders</h3>
            <button
              onClick={() => setShowNewFolderForm(true)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {showNewFolderForm && (
            <form onSubmit={handleCreateFolder} className="mb-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex space-x-1 mt-1">
                <button
                  type="submit"
                  className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFolderForm(false);
                    setNewFolderName('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

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
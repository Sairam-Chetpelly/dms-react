import React, { useState, useEffect } from 'react';
import { Folder, Tag } from '../types';
import { foldersAPI, tagsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FolderIcon, Star, Share, Plus, ChevronRight, ChevronDown, HardDrive, FileText, Users, Settings } from 'lucide-react';

interface SidebarProps {
  currentFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
  onFilterChange: (filter: 'all' | 'starred' | 'shared' | 'mydrives' | 'invoices' | 'admin') => void;
  currentFilter: 'all' | 'starred' | 'shared' | 'mydrives' | 'invoices' | 'admin';
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
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [showDepartmentShare, setShowDepartmentShare] = useState<string | null>(null);
  const { user } = useAuth();
  
  const departments = ['hr', 'finance', 'it', 'marketing', 'operations'];

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
      await foldersAPI.create(newFolderName, currentFolder || undefined, selectedDepartments);
      setNewFolderName('');
      setSelectedDepartments([]);
      setShowNewFolderForm(false);
      loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };
  
  const handleShareDepartment = async (folderId: string, departments: string[]) => {
    try {
      await foldersAPI.shareDepartment(folderId, departments);
      setShowDepartmentShare(null);
      loadFolders();
    } catch (error) {
      console.error('Error sharing folder:', error);
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
        <div className="flex items-center justify-between group">
          <div
            className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 flex-1 ${
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
            {folder.departmentAccess && folder.departmentAccess.length > 0 && (
              <div title={`Shared with: ${folder.departmentAccess.join(', ')}`}>
                <Users className="w-3 h-3 ml-1 text-blue-500" />
              </div>
            )}
          </div>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDepartmentShare(showDepartmentShare === folder._id ? null : folder._id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
              title="Share with departments"
            >
              <Share className="w-3 h-3" />
            </button>
          )}
        </div>
        {showDepartmentShare === folder._id && (
          <div className="ml-4 p-2 bg-gray-50 rounded text-xs">
            <div className="mb-2">Share with departments:</div>
            {departments.map(dept => (
              <label key={dept} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={folder.departmentAccess?.includes(dept) || false}
                  onChange={(e) => {
                    const newDepts = e.target.checked 
                      ? [...(folder.departmentAccess || []), dept]
                      : (folder.departmentAccess || []).filter(d => d !== dept);
                    handleShareDepartment(folder._id, newDepts);
                  }}
                  className="mr-1"
                />
                <span className="capitalize">{dept}</span>
              </label>
            ))}
          </div>
        )}
        {expandedFolders.has(folder._id) && renderFolderTree(folder._id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 h-full overflow-y-auto shadow-lg">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Documents</h2>
        </div>
        
        {/* Quick Filters */}
        <div className="space-y-1 mb-8">
          <div
            className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 ${
              currentFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
            }`}
            onClick={() => onFilterChange('all')}
          >
            <FolderIcon className="w-4 h-4 mr-2" />
            <span>All Documents</span>
          </div>
          <div
            className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 ${
              currentFilter === 'starred' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
            }`}
            onClick={() => onFilterChange('starred')}
          >
            <Star className="w-4 h-4 mr-2" />
            <span>Starred</span>
          </div>
          <div
            className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 ${
              currentFilter === 'shared' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
            }`}
            onClick={() => onFilterChange('shared')}
          >
            <Share className="w-4 h-4 mr-2" />
            <span>Shared</span>
          </div>
          <div
            className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 ${
              currentFilter === 'mydrives' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
            }`}
            onClick={() => onFilterChange('mydrives')}
          >
            <HardDrive className="w-4 h-4 mr-2" />
            <span>My Drives</span>
          </div>
          <div
            className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 ${
              currentFilter === 'invoices' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
            }`}
            onClick={() => onFilterChange('invoices')}
          >
            <FileText className="w-4 h-4 mr-2" />
            <span>Invoice Records</span>
          </div>
          {user?.role === 'admin' && (
            <div
              className={`flex items-center px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 ${
                currentFilter === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'
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
            <button
              onClick={() => setShowNewFolderForm(true)}
              className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-black hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
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
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">Share with departments:</div>
                  <div className="space-y-1">
                    {departments.map(dept => (
                      <label key={dept} className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(dept)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDepartments([...selectedDepartments, dept]);
                            } else {
                              setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="capitalize">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex space-x-1 mt-2">
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
                    setSelectedDepartments([]);
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
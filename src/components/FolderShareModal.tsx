import React, { useState, useEffect } from 'react';
import { Folder, User } from '../types';
import { adminAPI, foldersAPI, usersAPI } from '../services/api';
import { X, Users, UserCheck } from 'lucide-react';

interface FolderShareModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
}

const FolderShareModal: React.FC<FolderShareModalProps> = ({
  folder,
  isOpen,
  onClose,
  onShare,
}) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'departments' | 'users'>('departments');

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      loadUsers();
      if (folder) {
        setSelectedDepartments(folder.departmentAccess?.map(d => typeof d === 'string' ? d : d._id) || []);
        setSelectedUsers(folder.sharedWith?.map(u => u._id || u.id).filter(Boolean) || []);
      }
    }
  }, [isOpen, folder]);

  const loadDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments({ page: 1, limit: 100 });
      setDepartments(response.data.departments || response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      // Filter out the folder owner
      const filteredUsers = response.data.filter((u: User) => 
        (u.id || u._id) !== (folder?.owner?.id || folder?.owner?._id)
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleShare = async () => {
    if (!folder) return;
    
    try {
      if (activeTab === 'departments') {
        await foldersAPI.shareDepartment(folder._id, selectedDepartments);
      } else {
        await foldersAPI.share(folder._id, selectedUsers);
      }
      onShare();
      onClose();
    } catch (error) {
      console.error('Error sharing folder:', error);
      alert('Error sharing folder. Please try again.');
    }
  };

  if (!isOpen || !folder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Share Folder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">Folder: <strong>{folder.name}</strong></p>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('departments')}
              className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'departments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 mr-1" />
              Departments
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Users
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {activeTab === 'departments' ? (
            departments.map(dept => (
              <label key={dept._id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(dept._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDepartments([...selectedDepartments, dept._id]);
                    } else {
                      setSelectedDepartments(selectedDepartments.filter(id => id !== dept._id));
                    }
                  }}
                  className="mr-3"
                />
                <span className="text-sm">{dept.displayName}</span>
                <span className="text-xs text-gray-500 ml-2">({dept.employeeCount} employees)</span>
              </label>
            ))
          ) : (
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-3"
                onChange={(e) => {
                  const userId = e.target.value;
                  if (userId && !selectedUsers.includes(userId)) {
                    setSelectedUsers([...selectedUsers, userId]);
                  }
                  e.target.value = '';
                }}
                value=""
              >
                <option value="">Select a user to add...</option>
                {users
                  .filter(user => !selectedUsers.includes(user._id || user.id))
                  .map(user => (
                    <option key={user._id || user.id} value={user._id || user.id}>
                      {user.name} - {user.email} ({user.role})
                    </option>
                  ))
                }
              </select>
              
              {selectedUsers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Users:</p>
                  <div className="space-y-2">
                    {selectedUsers.map(userId => {
                      const user = users.find(u => (u._id || u.id) === userId);
                      if (!user) return null;
                      return (
                        <div key={userId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <span className="text-sm font-medium">{user.name}</span>
                            <div className="text-xs text-gray-500">
                              {user.email} • {user.role} • {user.department?.displayName}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderShareModal;
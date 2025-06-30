import React, { useState, useEffect } from 'react';
import { User, Document } from '../types';
import { usersAPI, shareAPI } from '../services/api';
import { X, Share, Check } from 'lucide-react';

interface ShareModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ document, isOpen, onClose, onShare }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    read: [] as string[],
    write: [] as string[],
    delete: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened for document:', document);
      loadUsers();
      setSelectedUsers(document.sharedWith?.map(u => u.id) || []);
      setPermissions({
        read: document.permissions?.read?.map((u: any) => u._id || u.id || u) || [],
        write: document.permissions?.write?.map((u: any) => u._id || u.id || u) || [],
        delete: document.permissions?.delete?.map((u: any) => u._id || u.id || u) || []
      });
    }
  }, [isOpen, document]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      console.log('API response:', response);
      console.log('Users data:', response.data);
      const filteredUsers = response.data.filter(u => u.id !== document.owner.id);
      console.log('Filtered users:', filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handlePermissionChange = (userId: string, permission: 'read' | 'write' | 'delete', checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked 
        ? [...prev[permission], userId]
        : prev[permission].filter(id => id !== userId)
    }));
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      await shareAPI.shareDocument(document._id, selectedUsers, permissions);
      onShare();
      onClose();
    } catch (error) {
      console.error('Error sharing document:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Share Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{document.originalName}</h3>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {users.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Loading users...
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({user.email})</span>
                  </div>
                </div>
                
                {selectedUsers.includes(user.id) && (
                  <div className="flex space-x-4 text-xs">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={permissions.read.includes(user.id)}
                        onChange={(e) => handlePermissionChange(user.id, 'read', e.target.checked)}
                        className="mr-1"
                      />
                      Read
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={permissions.write.includes(user.id)}
                        onChange={(e) => handlePermissionChange(user.id, 'write', e.target.checked)}
                        className="mr-1"
                      />
                      Edit
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={permissions.delete.includes(user.id)}
                        onChange={(e) => handlePermissionChange(user.id, 'delete', e.target.checked)}
                        className="mr-1"
                      />
                      Delete
                    </label>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleShare}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
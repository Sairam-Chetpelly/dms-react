import React, { useState, useEffect } from 'react';
import { adminAPI, Department } from '../services/api';
import { foldersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface FolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  currentFolder: string | null;
}

const FolderCreateModal: React.FC<FolderCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  currentFolder,
}) => {
  const { user } = useAuth();
  const [folderName, setFolderName] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      setFolderName('');
      setSelectedDepartments([]);
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments({ page: 1, limit: 100 });
      setDepartments(response.data.departments || response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      await foldersAPI.create(folderName, currentFolder || undefined, selectedDepartments);
      onCreate();
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modern-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold gradient-text">Create New Folder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="modern-input w-full"
            autoFocus
            required
          />

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share with departments (optional):
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {departments.map(dept => (
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
                      className="mr-2"
                    />
                    <span className="text-sm">{dept.displayName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modern-button"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderCreateModal;
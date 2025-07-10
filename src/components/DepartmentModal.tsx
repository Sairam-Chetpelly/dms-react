import React, { useState, useEffect } from 'react';
import { adminAPI, Department } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { X } from 'lucide-react';

interface DepartmentModalProps {
  department: Department | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  department,
  isOpen,
  onClose,
  onSave,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (department) {
        setFormData({
          name: department.name,
          displayName: department.displayName,
          description: department.description || '',
        });
      } else {
        setFormData({
          name: '',
          displayName: '',
          description: '',
        });
      }
    }
  }, [isOpen, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (department) {
        await adminAPI.updateDepartment(department._id, {
          displayName: formData.displayName,
          description: formData.description,
          isActive: true,
        });
        showToast('success', 'Department updated successfully');
      } else {
        await adminAPI.createDepartment(formData);
        showToast('success', 'Department created successfully');
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving department:', error);
      showToast('error', error.response?.data?.message || 'Failed to save department');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modern-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold gradient-text">
            {department ? 'Edit Department' : 'Add New Department'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Department Name (lowercase)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
            className="modern-input w-full"
            required
            disabled={!!department}
          />
          
          <input
            type="text"
            placeholder="Display Name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="modern-input w-full"
            required
          />
          
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="modern-input w-full h-24 resize-none"
            rows={3}
          />

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
              {department ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;
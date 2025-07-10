import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { adminAPI, Department } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { X } from 'lucide-react';

interface EmployeeModalProps {
  employee: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSave,
}) => {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    department: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      if (employee) {
        setFormData({
          name: employee.name,
          email: employee.email,
          password: '',
          role: employee.role,
          department: employee.department._id,
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'employee',
          department: '',
        });
      }
    }
  }, [isOpen, employee]);

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
    try {
      if (employee) {
        await adminAPI.updateEmployee(employee._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
        });
        showToast('success', 'Employee updated successfully');
      } else {
        await adminAPI.createEmployee(formData);
        showToast('success', 'Employee created successfully');
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      showToast('error', error.response?.data?.message || 'Failed to save employee');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modern-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold gradient-text">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="modern-input w-full"
            required
          />
          
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="modern-input w-full"
            required
          />
          
          {!employee && (
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="modern-input w-full"
              required
            />
          )}
          
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            className="modern-input w-full"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          
          <select
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="modern-input w-full"
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.displayName}</option>
            ))}
          </select>

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
              {employee ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
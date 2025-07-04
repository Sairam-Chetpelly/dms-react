import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { adminAPI, Department } from '../services/api';
import EmployeeModal from './EmployeeModal';
import DepartmentModal from './DepartmentModal';
import { Plus, Edit, Trash2, Users, Building } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees');

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await adminAPI.getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await adminAPI.deleteEmployee(id);
        loadEmployees();
        loadDepartments();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">Manage employees and departments</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Employees
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'departments'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building className="w-4 h-4 inline mr-2" />
            Departments
          </button>
        </nav>
      </div>

      {activeTab === 'employees' && (
        <div>
          <div className='flex justify-end'>
          <button
            onClick={() => {
              setEditingEmployee(null);
              setShowEmployeeModal(true);
            }}
            className="mb-6 modern-button"
          >
            <Plus className="w-4 h-4 mr-2" />
          </button>
          </div>

          {/* Employees Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.role === 'admin' ? 'bg-red-100 text-red-800' :
                        employee.role === 'manager' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.department?.displayName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingEmployee(employee);
                          setShowEmployeeModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div>
          <div className='flex justify-end'>
          <button
            onClick={() => {
              setEditingDepartment(null);
              setShowDepartmentModal(true);
            }}
            className="mb-6 modern-button"
          >
            <Plus className="w-4 h-4 mr-2" />
          </button>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div key={dept._id} className="bg-white p-6 rounded-lg shadow group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="w-8 h-8 text-indigo-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dept.displayName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {dept.employeeCount} employees
                      </p>
                      {dept.description && (
                        <p className="text-xs text-gray-400 mt-1">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                    <button
                      onClick={() => {
                        setEditingDepartment(dept);
                        setShowDepartmentModal(true);
                      }}
                      className="p-1 text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this department?')) {
                          adminAPI.deleteDepartment(dept._id).then(() => loadDepartments());
                        }
                      }}
                      className="p-1 text-red-600 hover:text-red-900"
                      disabled={dept.employeeCount > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <EmployeeModal
        employee={editingEmployee}
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEditingEmployee(null);
        }}
        onSave={() => {
          loadEmployees();
          loadDepartments();
        }}
      />
      
      <DepartmentModal
        department={editingDepartment}
        isOpen={showDepartmentModal}
        onClose={() => {
          setShowDepartmentModal(false);
          setEditingDepartment(null);
        }}
        onSave={loadDepartments}
      />
    </div>
  );
};

export default AdminPanel;
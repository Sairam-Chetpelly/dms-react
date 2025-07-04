import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { adminAPI, Department } from '../services/api';
import { Plus, Edit, Trash2, Users, Building } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    department: '',
  });
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    displayName: '',
    description: '',
  });
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await adminAPI.updateEmployee(editingEmployee._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
        });
      } else {
        await adminAPI.createEmployee(formData);
      }
      resetForm();
      loadEmployees();
      loadDepartments();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleEdit = (employee: User) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
      department: employee.department._id,
    });
    setShowEmployeeForm(true);
  };
  
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await adminAPI.updateDepartment(editingDept._id, {
          displayName: deptFormData.displayName,
          description: deptFormData.description,
          isActive: true,
        });
      } else {
        await adminAPI.createDepartment(deptFormData);
      }
      resetDeptForm();
      loadDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };
  
  const handleEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptFormData({
      name: dept.name,
      displayName: dept.displayName,
      description: dept.description || '',
    });
    setShowDeptForm(true);
  };
  
  const handleDeleteDept = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await adminAPI.deleteDepartment(id);
        loadDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
    });
    setEditingEmployee(null);
    setShowEmployeeForm(false);
  };
  
  const resetDeptForm = () => {
    setDeptFormData({
      name: '',
      displayName: '',
      description: '',
    });
    setEditingDept(null);
    setShowDeptForm(false);
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
          {/* Employee Form */}
          {showEmployeeForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
                {!editingEmployee && (
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                )}
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.displayName}</option>
                  ))}
                </select>
                <div className="col-span-2 flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingEmployee ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Employee Button */}
          {!showEmployeeForm && (
            <button
              onClick={() => setShowEmployeeForm(true)}
              className="mb-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </button>
          )}

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
                        employee.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
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
                        onClick={() => handleEdit(employee)}
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
          {/* Department Form */}
          {showDeptForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h2>
              <form onSubmit={handleDeptSubmit} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Department Name (lowercase)"
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value.toLowerCase() })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                  disabled={!!editingDept}
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={deptFormData.displayName}
                  onChange={(e) => setDeptFormData({ ...deptFormData, displayName: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={deptFormData.description}
                  onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                />
                <div className="col-span-2 flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingDept ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetDeptForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Department Button */}
          {!showDeptForm && (
            <button
              onClick={() => setShowDeptForm(true)}
              className="mb-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </button>
          )}

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
                      onClick={() => handleEditDept(dept)}
                      className="p-1 text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDept(dept._id)}
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
    </div>
  );
};

export default AdminPanel;
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { adminAPI, Department } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import EmployeeModal from './EmployeeModal';
import DepartmentModal from './DepartmentModal';
import AIManagement from './AIManagement';
import Pagination from './Pagination';
import { Plus, Edit, Trash2, Users, Building, Brain } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'ai'>('employees');
  
  // Pagination states
  const [employeePage, setEmployeePage] = useState(1);
  const [departmentPage, setDepartmentPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  const loadEmployees = async (page = 1) => {
    try {
      const response = await adminAPI.getEmployees({ page, limit: itemsPerPage });
      setEmployees(response.data.employees || response.data);
      setTotalEmployees(response.data.total || response.data.length);
      setEmployeePage(page);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadDepartments = async (page = 1) => {
    try {
      const response = await adminAPI.getDepartments({ page, limit: itemsPerPage });
      setDepartments(response.data.departments || response.data);
      setTotalDepartments(response.data.total || response.data.length);
      setDepartmentPage(page);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await adminAPI.deleteEmployee(id);
        loadEmployees(employeePage);
        loadDepartments(departmentPage);
        showToast('success', 'Employee deleted successfully');
      } catch (error: any) {
        console.error('Error deleting employee:', error);
        showToast('error', error.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage employees and departments</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
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
            className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'departments'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building className="w-4 h-4 inline mr-2" />
            Departments
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            AI Management
          </button>
        </nav>
      </div>

      {activeTab === 'employees' && (
        <div>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 sm:hidden">Employees</h2>
            <button
              onClick={() => {
                setEditingEmployee(null);
                setShowEmployeeModal(true);
              }}
              className="modern-button text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Employee</span>
            </button>
          </div>

          {/* Employees Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Email
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Department
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee._id}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{employee.email}</div>
                        <div className="text-xs text-gray-500 md:hidden">{employee.department?.displayName || 'N/A'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {employee.email}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.role === 'admin' ? 'bg-red-100 text-red-800' :
                          employee.role === 'manager' ? 'bg-cyan-100 text-cyan-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {employee.department?.displayName || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingEmployee(employee);
                              setShowEmployeeModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee._id)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={employeePage}
              totalPages={Math.ceil(totalEmployees / itemsPerPage)}
              onPageChange={loadEmployees}
              totalItems={totalEmployees}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 sm:hidden">Departments</h2>
            <button
              onClick={() => {
                setEditingDepartment(null);
                setShowDepartmentModal(true);
              }}
              className="modern-button text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Department</span>
            </button>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {departments.map((dept) => (
              <div key={dept._id} className="bg-white p-4 sm:p-6 rounded-lg shadow group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <Building className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 mr-2 sm:mr-3 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {dept.displayName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {dept.employeeCount} employees
                      </p>
                      {dept.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex space-x-1 ml-2">
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
                          adminAPI.deleteDepartment(dept._id)
                            .then(() => {
                              loadDepartments(departmentPage);
                              showToast('success', 'Department deleted successfully');
                            })
                            .catch((error: any) => {
                              showToast('error', error.response?.data?.message || 'Failed to delete department');
                            });
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
          <div className="mt-6">
            <Pagination
              currentPage={departmentPage}
              totalPages={Math.ceil(totalDepartments / itemsPerPage)}
              onPageChange={loadDepartments}
              totalItems={totalDepartments}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <AIManagement />
      )}
      
      <EmployeeModal
        employee={editingEmployee}
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEditingEmployee(null);
        }}
        onSave={() => {
          loadEmployees(employeePage);
          loadDepartments(departmentPage);
        }}
      />
      
      <DepartmentModal
        department={editingDepartment}
        isOpen={showDepartmentModal}
        onClose={() => {
          setShowDepartmentModal(false);
          setEditingDepartment(null);
        }}
        onSave={() => loadDepartments(departmentPage)}
      />
    </div>
  );
};

export default AdminPanel;
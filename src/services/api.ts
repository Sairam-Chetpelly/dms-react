import axios from 'axios';
import { AuthResponse, Document, Folder, Tag, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role: string, department: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password, role, department }),
  getProfile: () => api.get('/auth/me'),
};

export const documentsAPI = {
  upload: (formData: FormData) =>
    api.post<Document>('/documents/upload', formData),
  getAll: (params?: any) => api.get<Document[]>('/documents', { params }),
  getById: (id: string) => api.get<Document>(`/documents/${id}`),
  star: (id: string, starred: boolean) =>
    api.put<Document>(`/documents/${id}/star`, { starred }),
  delete: (id: string) => api.delete(`/documents/${id}`),
  download: (id: string) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  getViewUrl: (id: string) => `${API_BASE_URL}/documents/${id}/view`,
  splitPdf: (id: string, ranges: string) =>
    api.post(`/documents/${id}/split`, { ranges }),
  mergePdfs: (pdfIds: string[], fileName: string, folder?: string | null) =>
    api.post('/documents/merge', { pdfIds, fileName, folder }),
  mergePages: (pages: {pdfId: string, pageNum: number, pdfName: string}[], fileName: string, folder?: string | null) =>
    api.post('/documents/merge-pages', { pages, fileName, folder }),
};

export const invoicesAPI = {
  create: (data: any) => api.post('/invoices', data),
  getAll: (params?: any) => api.get('/invoices', { params }),
  export: (params?: any) => api.get('/invoices/export', { params, responseType: 'blob' }),
};

export const foldersAPI = {
  create: (name: string, parent?: string, departmentAccess?: string[]) =>
    api.post<Folder>('/folders', { name, parent, departmentAccess }),
  getAll: (parent?: string) => api.get<Folder[]>('/folders', { params: { parent } }),
  getById: (id: string) => api.get<Folder>(`/folders/${id}`),
  getContents: (id: string) => api.get(`/folders/${id}/contents`),
  getHierarchy: () => api.get('/folders/hierarchy'),
  update: (id: string, name: string, departmentAccess?: string[]) =>
    api.put<Folder>(`/folders/${id}`, { name, departmentAccess }),
  shareDepartment: (id: string, departments: string[]) =>
    api.put<Folder>(`/folders/${id}/share-department`, { departments }),
  shareUsers: (id: string, userIds: string[]) =>
    api.put<Folder>(`/folders/${id}/share-users`, { userIds }),
  share: (id: string, userIds: string[]) =>
    api.put<Folder>(`/folders/${id}/share`, { userIds }),
  delete: (id: string) => api.delete(`/folders/${id}`),
};

export const tagsAPI = {
  create: (name: string, color?: string) =>
    api.post<Tag>('/tags', { name, color }),
  getAll: () => api.get<Tag[]>('/tags'),
  update: (id: string, name: string, color: string) =>
    api.put<Tag>(`/tags/${id}`, { name, color }),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

export const usersAPI = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
};

export const shareAPI = {
  shareDocument: (id: string, userIds: string[], permissions: any) =>
    api.put<Document>(`/documents/${id}/share`, { userIds, permissions }),
  shareFolder: (id: string, userIds: string[]) =>
    api.put<Folder>(`/folders/${id}/share`, { userIds }),
};

export interface Department {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export const adminAPI = {
  getEmployees: (params?: { page?: number; limit?: number }) => api.get('/admin/employees', { params }),
  createEmployee: (data: { name: string; email: string; password: string; role: string; department: string }) =>
    api.post<User>('/admin/employees', data),
  updateEmployee: (id: string, data: { name: string; email: string; role: string; department: string }) =>
    api.put<User>(`/admin/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/admin/employees/${id}`),
  getDepartments: (params?: { page?: number; limit?: number }) => api.get('/admin/departments', { params }),
  createDepartment: (data: { name: string; displayName: string; description?: string }) =>
    api.post<Department>('/admin/departments', data),
  updateDepartment: (id: string, data: { displayName: string; description?: string; isActive: boolean }) =>
    api.put<Department>(`/admin/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/admin/departments/${id}`),
  shareDepartment: (folderId: string, departments: string[]) =>
    api.put<Folder>(`/folders/${folderId}/share-department`, { departments }),
};
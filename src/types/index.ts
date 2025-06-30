export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Document {
  _id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  folder?: Folder;
  tags: Tag[];
  owner: User;
  isStarred: boolean;
  isShared: boolean;
  sharedWith: User[];
  permissions?: {
    read: User[];
    write: User[];
    delete: User[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  _id: string;
  name: string;
  parent?: Folder;
  owner: User;
  isShared: boolean;
  sharedWith: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  _id: string;
  name: string;
  color: string;
  owner: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
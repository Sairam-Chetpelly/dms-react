import React, { useState, useEffect } from 'react';
import { Document, Folder, User } from '../types';
import { documentsAPI, foldersAPI, usersAPI, shareAPI } from '../services/api';
import { Share, Users, FileText, FolderIcon } from 'lucide-react';

const SharingDemo: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, foldersRes, usersRes] = await Promise.all([
        documentsAPI.getAll(),
        foldersAPI.getAll(),
        usersAPI.getAll()
      ]);
      
      setDocuments(docsRes.data);
      setFolders(foldersRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const shareDocument = async (documentId: string) => {
    if (!selectedUser) {
      setMessage('Please select a user first');
      return;
    }

    try {
      await shareAPI.shareDocument(documentId, [selectedUser], { read: [selectedUser] });
      setMessage('Document shared successfully!');
      loadData(); // Refresh data
    } catch (error) {
      setMessage('Error sharing document');
      console.error('Error:', error);
    }
  };

  const shareFolder = async (folderId: string) => {
    if (!selectedUser) {
      setMessage('Please select a user first');
      return;
    }

    try {
      await shareAPI.shareFolder(folderId, [selectedUser]);
      setMessage('Folder shared successfully!');
      loadData(); // Refresh data
    } catch (error) {
      setMessage('Error sharing folder');
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sharing Functionality Demo</h1>
      
      {/* User Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select User to Share With:
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Choose a user...</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Folders */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FolderIcon className="w-5 h-5 mr-2" />
            Folders (Full Access Sharing)
          </h2>
          <div className="space-y-2">
            {folders.slice(0, 5).map(folder => (
              <div key={folder._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <FolderIcon className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">{folder.name}</span>
                  {folder.sharedWith && folder.sharedWith.length > 0 && (
                    <div title="Shared">
                      <Users className="w-4 h-4 ml-2 text-green-500" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => shareFolder(folder._id)}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  disabled={!selectedUser}
                >
                  <Share className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Folder sharing gives access to ALL files inside the folder
          </p>
        </div>

        {/* Documents */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Documents (Individual File Sharing)
          </h2>
          <div className="space-y-2">
            {documents.slice(0, 5).map(document => (
              <div key={document._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium block">{document.originalName}</span>
                    {document.folder && (
                      <span className="text-xs text-gray-400">in {document.folder.name}</span>
                    )}
                  </div>
                  {document.sharedWith && document.sharedWith.length > 0 && (
                    <div title="Shared">
                      <Users className="w-4 h-4 ml-2 text-green-500" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => shareDocument(document._id)}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  disabled={!selectedUser}
                >
                  <Share className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            File sharing makes folder visible but only shows the shared file
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">How Sharing Works:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li><strong>Folder Sharing:</strong> User gets access to the entire folder and all files inside it</li>
          <li><strong>File Sharing:</strong> User can see the folder in hierarchy but only access the specific shared file</li>
          <li><strong>Example:</strong> If you share only "document.pdf" from "/Projects/", user will see "/Projects/" folder but only "document.pdf" inside it</li>
        </ul>
      </div>
    </div>
  );
};

export default SharingDemo;
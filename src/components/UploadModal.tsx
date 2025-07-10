import React, { useState } from 'react';
import { Document } from '../types';
import { documentsAPI, invoicesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { X, Upload } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  currentFolder: string | null;
}

interface InvoiceData {
  vendorName: string;
  invoiceDate: string;
  invoiceValue: number;
  invoiceQty: number;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, currentFolder }) => {
  const { showToast } = useToast();
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    vendorName: '',
    invoiceDate: '',
    invoiceValue: 0,
    invoiceQty: 0
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Check if uploading to My Drives (no folder selected)
  const isMyDrivesUpload = !currentFolder;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolder) formData.append('folder', currentFolder);

      const response = await documentsAPI.upload(formData);
      setUploadedDocument(response.data);
      showToast('success', 'File uploaded successfully');
      
      // If uploading to My Drives, auto-complete the upload
      if (isMyDrivesUpload) {
        setTimeout(() => {
          onUpload();
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!uploadedDocument) return;

    setSaving(true);
    try {
      await invoicesAPI.create({
        document: uploadedDocument._id,
        ...invoiceData
      });

      onUpload();
      handleClose();
      showToast('success', 'Invoice record saved successfully');
    } catch (error) {
      console.error('Error saving invoice:', error);
      showToast('error', 'Failed to save invoice record');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUploadedDocument(null);
    setInvoiceData({
      vendorName: '',
      invoiceDate: '',
      invoiceValue: 0,
      invoiceQty: 0
    });
    onClose();
  };

  if (!isOpen) return null;

  const token = localStorage.getItem('token');
  const viewUrl = uploadedDocument ? `${documentsAPI.getViewUrl(uploadedDocument._id)}?token=${token}` : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {isMyDrivesUpload ? 'Upload File' : 'Upload & Create Invoice'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 flex">
          <div className={`${isMyDrivesUpload ? 'w-full' : 'flex-1'} p-6`}>
            {!uploadedDocument ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center h-full flex aligh-center item-center flex-col justify-center">
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" /><br/>
                  Upload your file</h3>
                <p className="text-gray-500 mb-4">Choose a file to upload</p>
                <p className="text-gray-500 mb-4">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden p-1"
                  id="file-upload"
                /></p>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </label>
                {uploading && <p className="mt-4 text-blue-600">Uploading...</p>}
                {uploadedDocument && isMyDrivesUpload && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">✅ File uploaded successfully!</p>
                    <p className="text-green-600 text-sm mt-1">{(uploadedDocument as Document).originalName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full bg-white rounded-lg border">
                <div className="bg-indigo-600 text-white p-3 rounded-t-lg">
                  <span className="font-medium">Preview: {uploadedDocument.originalName}</span>
                </div>
                {uploadedDocument.mimeType.startsWith('image/') ? (
                  <div className="p-4 h-full flex items-center justify-center">
                    <img
                      src={viewUrl}
                      alt={uploadedDocument.originalName}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : uploadedDocument.mimeType === 'application/pdf' ? (
                  <iframe
                    src={viewUrl}
                    className="w-full h-full border-0"
                    title={uploadedDocument.originalName}
                  />
                ) : (
                  <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{uploadedDocument.originalName}</h3>
                    <p className="text-gray-500">File type: {uploadedDocument.mimeType}</p>
                    <p className="text-sm text-gray-400 mt-2">Preview not available for this file type</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isMyDrivesUpload && (
            <div className="w-80 bg-indigo-50 border-l border-indigo-200 p-6">
              <div className="bg-indigo-600 text-white p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold">Invoice Details</h3>
                <p className="text-indigo-100 text-sm">Complete the form below</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    value={invoiceData.vendorName}
                    onChange={(e) => setInvoiceData({...invoiceData, vendorName: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    placeholder="Enter vendor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceData.invoiceDate}
                    onChange={(e) => setInvoiceData({...invoiceData, invoiceDate: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">
                    Invoice Value
                  </label>
                  <input
                    type="number"
                    value={invoiceData.invoiceValue}
                    onChange={(e) => setInvoiceData({...invoiceData, invoiceValue: parseFloat(e.target.value)})}
                    className="w-full px-4 py-4 border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={invoiceData.invoiceQty}
                    onChange={(e) => setInvoiceData({...invoiceData, invoiceQty: parseInt(e.target.value)})}
                    className="w-full px-4 py-4 border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    placeholder="Enter quantity"
                  />
                </div>

                <button
                  onClick={handleSaveInvoice}
                  disabled={!uploadedDocument || saving}
                  className="w-full bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-large shadow-lg hover:shadow-xl transition-all"
                >
                  {saving ? 'Saving...' : 'Save Invoice Record'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
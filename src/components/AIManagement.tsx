import React, { useState, useEffect } from 'react';
import { Brain, Database, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';

interface IndexingStats {
  total: number;
  indexed: number;
  unindexed: number;
  indexingProgress: string;
  queueLength: number;
  isProcessing: boolean;
  error?: string;
}

const AIManagement: React.FC = () => {
  const [stats, setStats] = useState<IndexingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/ai/indexing/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch indexing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    if (!window.confirm('This will re-index all documents. Continue?')) {
      return;
    }

    setReindexing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/ai/indexing/reindex`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Re-indexing started: ${response.data.total} documents queued`);
      fetchStats();
    } catch (error: any) {
      alert('Failed to start re-indexing: ' + (error.response?.data?.error || error.message));
    } finally {
      setReindexing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Management</h2>
            <p className="text-gray-600">Manage document indexing and AI services</p>
          </div>
        </div>
        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${reindexing ? 'animate-spin' : ''}`} />
          {reindexing ? 'Re-indexing...' : 'Re-index All'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Documents
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Indexed Documents
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.indexed}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Unindexed Documents
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.unindexed}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className={`h-8 w-8 ${stats.isProcessing ? 'text-blue-400 animate-pulse' : 'text-gray-400'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Queue Length
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.queueLength}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Indexing Progress</h3>
            <span className="text-sm text-gray-500">{stats.indexingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.indexingProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-500">
            <span>{stats.indexed} indexed</span>
            <span>{stats.unindexed} remaining</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Indexing Service</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              stats?.isProcessing 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {stats?.isProcessing ? 'Processing' : 'Idle'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Vector Store</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">AI Service</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Running
            </span>
          </div>
          
          {stats?.error && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Error</span>
              <span className="text-xs text-red-600 max-w-xs truncate" title={stats.error}>
                {stats.error}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Graph Workflow</h4>
              <p className="text-sm text-gray-600">Query analysis and processing</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Vector Search</h4>
              <p className="text-sm text-gray-600">Semantic document similarity</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Multi-Model Support</h4>
              <p className="text-sm text-gray-600">Gemini, GPT, and more</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Auto Indexing</h4>
              <p className="text-sm text-gray-600">Real-time document processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIManagement;
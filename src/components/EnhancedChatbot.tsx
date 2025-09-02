import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Settings, Brain, Search, BarChart3, Zap, Lightbulb } from 'lucide-react';
import axios from 'axios';
// import * as d3 from 'd3';

interface AIModel {
  id: string;
  name: string;
  provider: string;
}

interface QueryAnalysis {
  intent: string;
  entities: string[];
  query_type: string;
  keywords: string[];
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  analysis?: QueryAnalysis;
  documentsFound?: number;
  model?: string;
  timestamp?: Date;
}

// Interfaces for future graph implementation
// interface GraphNode {
//   id: string;
//   label: string;
//   type: 'query' | 'entity' | 'document' | 'response';
// }
// interface GraphLink {
//   source: string;
//   target: string;
//   type: 'analyzes' | 'contains' | 'references';
// }

const EnhancedChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'bot', 
      content: 'Hi! I\'m your enhanced AI assistant powered by LangChain. I can help you with document search, analysis, and intelligent conversations. What would you like to explore?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini_flash');
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<QueryAnalysis | null>(null);
  const [chatMode, setChatMode] = useState<'enhanced' | 'direct' | 'search'>('enhanced');
  // const graphRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchAvailableModels();
  }, []);

  // useEffect(() => {
  //   if (showGraph && currentAnalysis) {
  //     renderGraph();
  //   }
  // }, [showGraph, currentAnalysis]);

  const fetchAvailableModels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/ai/models`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableModels(response.data.models);
    } catch (error) {
      console.error('Failed to fetch AI models:', error);
    }
  };

  // const renderGraph = () => {
  //   // Simplified for now
  // };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      let endpoint = '/ai/chat';
      
      switch (chatMode) {
        case 'direct':
          endpoint = '/ai/direct-chat';
          break;
        case 'search':
          endpoint = '/ai/search';
          break;
        default:
          endpoint = '/ai/chat';
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        { 
          message: userMessage, 
          model: selectedModel,
          query: userMessage,
          limit: 5
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botMessage: Message = {
        type: 'bot',
        content: response.data.response || 'Search completed',
        analysis: response.data.analysis,
        documentsFound: response.data.documentsFound,
        model: response.data.model,
        timestamp: new Date()
      };

      if (response.data.analysis) {
        setCurrentAnalysis(response.data.analysis);
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getChatModeIcon = () => {
    switch (chatMode) {
      case 'enhanced': return <Brain size={16} />;
      case 'direct': return <Zap size={16} />;
      case 'search': return <Search size={16} />;
      default: return <Brain size={16} />;
    }
  };

  const getChatModeColor = () => {
    switch (chatMode) {
      case 'enhanced': return 'bg-blue-600';
      case 'direct': return 'bg-green-600';
      case 'search': return 'bg-purple-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 ${getChatModeColor()} hover:opacity-80 text-white p-4 rounded-full shadow-lg transition-all z-50 flex items-center gap-2`}
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
      >
        {isOpen ? <X size={24} /> : getChatModeIcon()}
        {!isOpen && <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div 
          className="fixed bottom-20 right-6 w-96 h-[500px] bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col z-50"
          style={{ position: 'fixed', bottom: '80px', right: '24px', zIndex: 9999 }}
        >
          <div className={`${getChatModeColor()} text-white p-4 rounded-t-lg flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              {getChatModeIcon()}
              <h3 className="font-semibold">Enhanced AI Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="text-white hover:text-gray-200 transition-colors"
                title="Toggle Analysis"
              >
                <BarChart3 size={18} />
              </button>
              <button
                onClick={() => setShowGraph(!showGraph)}
                className="text-white hover:text-gray-200 transition-colors"
                title="Toggle Graph View"
              >
                <Lightbulb size={18} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="bg-gray-50 p-3 border-b space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chat Mode:
                </label>
                <select
                  value={chatMode}
                  onChange={(e) => setChatMode(e.target.value as any)}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="enhanced">Enhanced (Graph Workflow)</option>
                  <option value="direct">Direct Chat</option>
                  <option value="search">Semantic Search</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Model:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {showGraph && currentAnalysis && (
            <div className="bg-gray-50 p-3 border-b">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Query Analysis</h4>
              <div className="text-xs space-y-1">
                <div><strong>Intent:</strong> {currentAnalysis.intent}</div>
                <div><strong>Type:</strong> {currentAnalysis.query_type}</div>
                <div><strong>Entities:</strong> {currentAnalysis.entities.join(', ') || 'None'}</div>
                <div><strong>Keywords:</strong> {currentAnalysis.keywords.join(', ') || 'None'}</div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[280px] px-3 py-2 rounded-lg text-sm ${
                  message.type === 'user' 
                    ? getChatModeColor() + ' text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {showAnalysis && message.analysis && (
                    <div className="mt-2 p-2 bg-white bg-opacity-20 rounded text-xs">
                      <div><strong>Intent:</strong> {message.analysis.intent}</div>
                      <div><strong>Type:</strong> {message.analysis.query_type}</div>
                      {message.analysis.entities.length > 0 && (
                        <div><strong>Entities:</strong> {message.analysis.entities.join(', ')}</div>
                      )}
                      {message.analysis.keywords.length > 0 && (
                        <div><strong>Keywords:</strong> {message.analysis.keywords.join(', ')}</div>
                      )}
                    </div>
                  )}
                  
                  {message.documentsFound !== undefined && (
                    <div className="mt-1 text-xs opacity-75">
                      📄 {message.documentsFound} documents found
                    </div>
                  )}
                  
                  {message.model && (
                    <div className="mt-1 text-xs opacity-75">
                      🤖 {message.model}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Processing with {chatMode} mode...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask using ${chatMode} mode...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className={`${getChatModeColor()} hover:opacity-80 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors`}
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Mode: {chatMode} | Model: {availableModels.find(m => m.id === selectedModel)?.name || selectedModel}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedChatbot;
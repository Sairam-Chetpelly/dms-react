import React, { useState } from 'react';
import { MessageCircle, Send, X, FileText } from 'lucide-react';
import axios from 'axios';

interface ChatResult {
  document: {
    _id: string;
    originalName: string;
    createdAt: string;
    folder?: { name: string };
  };
  snippet: string;
}

interface ChatResponse {
  query: string;
  results: ChatResult[];
  message: string;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  results?: ChatResult[];
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfModal, setPdfModal] = useState<{isOpen: boolean, url: string, name: string}>({isOpen: false, url: '', name: ''});
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', content: 'Hi! I can help you search through your PDF documents. What would you like to find?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background-color: yellow; padding: 1px 2px;">$1</mark>');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setCurrentQuery(userMessage);
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Try PDF search first
      try {
        const pdfResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/documents/chat`,
          { query: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const pdfData: ChatResponse = pdfResponse.data;
        if (pdfData.results && pdfData.results.length > 0) {
          setMessages(prev => [...prev, { 
            type: 'bot', 
            content: pdfData.message,
            results: pdfData.results 
          }]);
          return;
        }
      } catch (pdfError) {
        console.log('PDF search failed, trying chatbot');
      }
      
      // Fallback to AI chatbot
      const chatResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/chatbot/chat`,
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: chatResponse.data.response
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Error processing your request. Please try again.' 
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

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-black p-4 rounded-full shadow-lg transition-colors z-50"
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div 
          className="fixed bottom-20 right-6 w-80 h-96 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col z-50"
          style={{ position: 'fixed', bottom: '80px', right: '24px', zIndex: 9999, display: 'flex' }}
        >
          <div className="bg-blue-600 text-black p-4 rounded-t-lg">
            <h3 className="font-semibold">PDF Search Assistant</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '280px' }}>
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[250px] px-2 rounded-lg text-sm ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-black' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {message.results && message.results.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.results.map((result, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border text-gray-800">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText size={14} />
                            <button
                              onClick={() => setPdfModal({
                                isOpen: true,
                                url: `${process.env.REACT_APP_API_URL}/documents/${result.document._id}/view?token=${localStorage.getItem('token')}`,
                                name: result.document.originalName
                              })}
                              className="text-xs font-medium truncate text-blue-600 hover:underline cursor-pointer"
                            >
                              {result.document.originalName}
                            </button>
                          </div>
                          {result.snippet && (
                            <p 
                              className="text-xs text-gray-600 italic"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(result.snippet, currentQuery)
                              }}
                            />
                          )}
                          <div className="text-xs text-green-600 mt-1">
                            📄 Click to view PDF
                          </div>
                        </div>
                      ))}
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
                    <span className="text-sm">Searching...</span>
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
                placeholder="Ask about your PDFs..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-black p-2 rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF Modal */}
      {pdfModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold truncate">{pdfModal.name}</h3>
              <button
                onClick={() => setPdfModal({isOpen: false, url: '', name: ''})}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={pdfModal.url}
                className="w-full h-full border-0"
                title={pdfModal.name}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
// src/App.js
import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage if available
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [persona, setPersona] = useState(() => {
    return localStorage.getItem('chatPersona') || '';
  });
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!prompt.trim()) return;

    const userMsg = { type: 'human', content: prompt };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setPrompt('');

    try {
      const response = await fetch('https://Hacksbya.pythonanywhere.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setMessages(data.history);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      setMessages([...newHistory, { 
        type: 'bot', 
        content: 'Sorry, there was an error processing your request. Please try again.'
      }]);
    }
  };

  const startNewChat = async () => {
    try {
      // Call backend to clear chat history
      await fetch('https://Hacksbya.pythonanywhere.com/clear-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Clear frontend messages
      setMessages([]);
      localStorage.removeItem('chatMessages');
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  const savePersona = (name) => {
    setPersona(name);
    localStorage.setItem('chatPersona', name);
    setShowPersonaModal(false);
    // Update the system message in backend
    updatePersona(name);
  };

  const updatePersona = async (name) => {
    try {
      await fetch('https://Hacksbya.pythonanywhere.com/update-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: name }),
      });
    } catch (error) {
      console.error('Error updating persona:', error);
    }
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^\s*\*\s(.*)$/gm, '<li>$1</li>')
      .replace(/^\s*\d+\.\s(.*)$/gm, '<li>$1</li>')
      .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>')
      .replace(/\n/g, '<br>');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <div className="header">
        <div className="logo">
          <div className="logo-icon"></div>
          <h1>myBot</h1>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowPersonaModal(true)} className="persona-btn">
            {persona ? `👤 ${persona}` : '➕ Add Persona'}
          </button>
          <button onClick={startNewChat} className="new-chat-btn">
            New Chat
          </button>
          <button onClick={toggleTheme} className="toggle-btn">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      
      {showPersonaModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Set Your Name</h2>
            <input
              type="text"
              placeholder="Enter your name"
              defaultValue={persona}
              onKeyDown={(e) => {
                if (e.key === 'Enter') savePersona(e.target.value);
              }}
            />
            <div className="modal-actions">
              <button onClick={() => setShowPersonaModal(false)}>Cancel</button>
              <button onClick={(e) => savePersona(e.target.previousSibling.value)}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-box" ref={chatBoxRef}>
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="welcome-message">
                <h2>Welcome to Chat-Bot</h2>
                <p>Start a conversation by entering a prompt!</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.type === 'human' ? 'human' : 'bot'}`}>
              {msg.type === 'human' ? (
                <div className="avatar user-avatar">
                  {persona ? persona[0].toUpperCase() : '👤'}
                </div>
              ) : (
                <div className="avatar bot-avatar">
                  🤖
                </div>
              )}
              <div className="msg-bubble">
                <div 
                  className="msg-content"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="input-container">
        <div className="input-box">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
          />
          <button onClick={sendMessage} className="send-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

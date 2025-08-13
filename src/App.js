import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './App.css';

// Import logo (save your logo as src/logo.png)
import logo from './logo.png';

// Your Google AI API key
const genAI = new GoogleGenerativeAI('AIzaSyCeaZPNbobYF6TUL20q0K9IfEb35a06cdA');

// Quick question presets
const quickQuestions = [
  "What happens at my next hearing?",
  "What are my parental rights?",
  "How do I complete my case plan?",
  "What if I can't attend court?"
];

function App() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);

  // Load saved messages from localStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('case-conversations');
    return saved ? JSON.parse(saved) : [
      { 
        role: 'assistant', 
        text: "Hi! I'm your personal Florida dependency case assistant. How can I help you today?" 
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Evidence (file) upload
  const [evidence, setEvidence] = useState(null);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem('case-conversations', JSON.stringify(messages));
  }, [messages]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.body.style.background = 'linear-gradient(135deg, #223447 60%, #C97D60 100%)';
    } else {
      document.body.style.background = 'linear-gradient(135deg, #F7EFE8 60%, #fff 100%)';
    }
  }, [darkMode]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
You are a knowledgeable assistant helping with a Florida juvenile dependency case.

CONTEXT: This is for a parent navigating their own dependency case in Florida family court.

KEY GUIDELINES:
- Provide specific, actionable information about Florida dependency procedures
- Reference Florida Statutes Chapter 39 when relevant
- Explain court processes, timelines, and parental rights clearly
- Be supportive but realistic about the legal process
- Always include "This is information, not legal advice - consult your attorney for legal advice"
- If you're unsure about something, say so

User's question about their case: ${userMessage}

Provide helpful, specific information:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setMessages(prev => [...prev, { role: 'assistant', text: text }]);
      
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'Sorry, I had trouble processing that. Please try again.' 
      }]);
    }
    
    setLoading(false);
  };

  // Export chat history as text
  const exportChat = () => {
    const chatText = messages.map(m => (m.role === 'user' ? 'You: ' : 'Assistant: ') + m.text).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-history.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Evidence file handler
  const handleEvidence = (e) => {
    setEvidence(e.target.files[0]);
  };

  return (
    <div className={darkMode ? "App dark" : "App"}>
      {/* --- Header --- */}
      <header className="header">
        <img src={logo} className="logo" alt="We The Parent Logo" />
        <div className="header-content">
          <div className="header-title">We The Parent Case Helper</div>
          <div className="header-tagline">One Voice. One Fight. One Family.</div>
        </div>
        <button className="darkmode-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>

      {/* --- Quick Questions --- */}
      <div className="quick-questions">
        {quickQuestions.map((q, i) => (
          <button key={i} onClick={() => setInput(q)}>{q}</button>
        ))}
      </div>

      {/* --- Main Layout --- */}
      <div className="main">
        {/* Sidebar: Timeline, Evidence, Profile */}
        <div className="sidebar">
          <div>
            <strong style={{color: 'var(--navy)', fontFamily: 'var(--font-heading)'}}>Timeline Tracker</strong>
            <div style={{marginTop: '0.5rem', color: 'var(--rust)'}}>Coming soon: Add your hearings & deadlines!</div>
          </div>
          <div>
            <strong style={{color: 'var(--navy)', fontFamily: 'var(--font-heading)'}}>Evidence Upload</strong>
            <input
              type="file"
              id="evidence"
              className="attach-btn"
              onChange={handleEvidence}
              style={{marginTop: '0.5rem'}}
              />
            {evidence && <div style={{marginTop: '0.3rem', color: 'var(--rust)'}}>File: {evidence.name}</div>}
          </div>
          <div>
            <strong style={{color: 'var(--navy)', fontFamily: 'var(--font-heading)'}}>User Profile</strong>
            <div style={{marginTop: '0.5rem', color: 'var(--rust)'}}>Coming soon: Save your info</div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="chat-container">
          <button className="export-btn" onClick={exportChat}>
            Export Chat History
          </button>
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  <strong>{message.role === 'user' ? 'You:' : '🤖 Assistant:'}</strong>
                  <div className="message-text">{message.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content">
                  <strong>🤖 Assistant:</strong>
                  <div className="message-text">Thinking about your question...</div>
                </div>
              </div>
            )}
          </div>
          <div className="input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about deadlines, procedures, your rights, what to expect..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      </div>

      {/* --- Disclaimer --- */}
      <footer className="disclaimer">
        <p><strong>Important:</strong> This provides information, not legal advice. Always consult with your attorney for legal guidance specific to your case.</p>
      </footer>
    </div>
  );
}

export default App;
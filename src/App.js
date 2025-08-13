import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './App.css';

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
  // Load saved messages from localStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('case-conversations');
    return saved ? JSON.parse(saved) : [
      { 
        role: 'assistant', 
        text: "Hi! I'm your personal Florida dependency case assistant. I can help you understand procedures, deadlines, your rights, and what to expect. What questions do you have about your case?" 
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem('case-conversations', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `You are a knowledgeable assistant helping with a Florida juvenile dependency case.

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

  return (
    <div className="App">
      <header className="header">
        <h1>My Dependency Case Helper</h1>
        <p>Personal AI assistant for your Florida case</p>
      </header>

      <div className="chat-container">
        {/* Quick Question Buttons */}
        <div className="quick-questions">
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => setInput(q)}>{q}</button>
          ))}
        </div>
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

      <footer className="disclaimer">
        <p><strong>Important:</strong> This provides information, not legal advice. Always consult with your attorney for legal guidance specific to your case.</p>
      </footer>
    </div>
  );
}

export default App;
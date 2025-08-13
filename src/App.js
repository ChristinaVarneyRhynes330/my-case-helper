import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsPDF } from "jspdf";
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

  // Chat
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

  // Timeline tracker
  const [timeline, setTimeline] = useState(() => {
    const saved = localStorage.getItem('case-timeline');
    return saved ? JSON.parse(saved) : [];
  });
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Evidence upload
  const [evidence, setEvidence] = useState(null);

  // User profile
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('case-profile');
    return saved ? JSON.parse(saved) : {name:'', case:'', attorney:''};
  });

  // Save messages/timeline/profile to localStorage
  useEffect(() => {
    localStorage.setItem('case-conversations', JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    localStorage.setItem('case-timeline', JSON.stringify(timeline));
  }, [timeline]);
  useEffect(() => {
    localStorage.setItem('case-profile', JSON.stringify(profile));
  }, [profile]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.body.style.background = 'linear-gradient(135deg, #223447 60%, #C97D60 100%)';
    } else {
      document.body.style.background = 'linear-gradient(135deg, #F7EFE8 60%, #fff 100%)';
    }
  }, [darkMode]);

  // Chat send
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

  // Export chat history as PDF
  const exportChatPDF = () => {
    const doc = new jsPDF();
    doc.setFont("times", "normal");
    doc.setFontSize(14);

    // Title
    doc.text("We The Parent Case Helper - Chat History", 10, 15);

    // Profile
    doc.setFontSize(11);
    doc.text(`Name: ${profile.name || ""}`, 10, 25);
    doc.text(`Case #: ${profile.case || ""}`, 10, 32);
    doc.text(`Attorney: ${profile.attorney || ""}`, 10, 39);

    // Timeline
    let y = 46;
    if (timeline.length > 0) {
      doc.setFontSize(12);
      doc.text("Timeline:", 10, y);
      y += 6;
      doc.setFontSize(11);
      timeline.forEach(item => {
        doc.text(`- ${item.date}: ${item.desc}`, 12, y);
        y += 6;
      });
    }

    // Chat
    y += 4;
    doc.setFontSize(12);
    doc.text("Chat:", 10, y);
    y += 8;
    doc.setFontSize(11);
    messages.forEach(m => {
      let role = m.role === "user" ? "You:" : "Assistant:";
      let textLines = doc.splitTextToSize(m.text, 180);
      textLines.forEach(line => {
        doc.text(`${role} ${line}`, 10, y);
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 15;
        }
      });
      y += 2;
    });

    doc.save("chat-history.pdf");
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
          {/* Timeline Tracker */}
          <div>
            <strong style={{color: 'var(--navy)', fontFamily: 'var(--font-heading)'}}>Timeline Tracker</strong>
            <form
              style={{marginTop: '0.5rem'}}
              onSubmit={e => {
                e.preventDefault();
                if (!newDate || !newDesc) return;
                const updated = [...timeline, {date: newDate, desc: newDesc}];
                setTimeline(updated);
                setNewDate('');
                setNewDesc('');
              }}>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                style={{marginRight: '0.5rem'}}
              />
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description"
                style={{marginRight: '0.5rem'}}
              />
              <button type="submit" className="attach-btn">Add</button>
            </form>
            <ul style={{marginTop:'0.5rem', paddingLeft:'1rem', color:'var(--navy)'}}>
              {timeline.map((item, i) => (
                <li key={i}>{item.date}: {item.desc}</li>
              ))}
            </ul>
          </div>
          {/* Evidence Upload */}
          <div>
            <strong style={{color: 'var(--navy)', fontFamily: 'var(--font-heading)'}}>Evidence Upload</strong>
            <input
              type="file"
              id="evidence"
              className="attach-btn"
              onChange={handleEvidence}
              style={{marginTop: '0.5rem'}}
            />
            {evidence && (
              <div style={{marginTop: '0.3rem', color: 'var(--rust)'}}>
                File: {evidence.name}
                {evidence.type && evidence.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(evidence)}
                    alt="preview"
                    style={{maxWidth:'100%', maxHeight:'80px', display:'block', marginTop:'0.5rem'}}
                  />
                )}
              </div>
            )}
          </div>
          {/* User Profile */}
          <div>
            <strong style={{color: 'var(--navy)', fontFamily: 'var(--font-heading)'}}>User Profile</strong>
            <form
              onSubmit={e => {
                e.preventDefault();
                localStorage.setItem('case-profile', JSON.stringify(profile));
                alert('Profile saved!');
              }}
              style={{marginTop:'0.5rem'}}
            >
              <input
                type="text"
                value={profile.name}
                placeholder="Your Name"
                onChange={e => setProfile({...profile, name: e.target.value})}
                style={{marginRight:'0.5rem', marginBottom:'0.3rem'}}
              />
              <input
                type="text"
                value={profile.case}
                placeholder="Case Number"
                onChange={e => setProfile({...profile, case: e.target.value})}
                style={{marginRight:'0.5rem', marginBottom:'0.3rem'}}
              />
              <input
                type="text"
                value={profile.attorney}
                placeholder="Attorney"
                onChange={e => setProfile({...profile, attorney: e.target.value})}
                style={{marginRight:'0.5rem', marginBottom:'0.3rem'}}
              />
              <button type="submit" className="attach-btn">Save</button>
            </form>
            <div style={{marginTop:'0.5rem', color:'var(--navy)'}}>
              <strong>Saved:</strong><br/>
              Name: {profile.name}<br/>
              Case #: {profile.case}<br/>
              Attorney: {profile.attorney}
            </div>
          </div>
        </div>
        {/* Chat Container */}
        <div className="chat-container">
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
            <button className="export-btn" onClick={exportChat}>
              Export Chat (Text)
            </button>
            <button className="export-btn" onClick={exportChatPDF}>
              Export Chat (PDF)
            </button>
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
      </div>
      {/* --- Disclaimer --- */}
      <footer className="disclaimer">
        <p><strong>Important:</strong> This provides information, not legal advice. Always consult with your attorney for legal guidance specific to your case.</p>
      </footer>
    </div>
  );
}

export default App;
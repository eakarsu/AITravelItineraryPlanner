import React, { useState, useRef, useEffect } from 'react';
import * as api from '../services/api';

const AIChat = ({ context = {} }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your AI travel assistant. I can help you with:
• Trip planning and itineraries
• Destination information
• Restaurant and activity recommendations
• Budget optimization
• Packing suggestions
• Translation help

What would you like to know?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.ai.chat({
        message: userMessage,
        context
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          error: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`ai-chat-message ${msg.role} ${msg.error ? 'error' : ''}`}
          >
            <div className="message-avatar">
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              <pre>{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-chat-message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="ai-chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about travel..."
          rows="2"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
};

export default AIChat;

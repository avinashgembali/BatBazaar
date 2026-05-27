import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { getBotResponse } from '../gemini';
import '../styles/chatbot.css';

const SUGGESTIONS = [
  'Best bats under ₹10,000',
  'Bats for aggressive batsmen',
  'Compare MRF vs SS',
  'Top rated bats',
  'Lightweight bat for quick scoring',
];

// Hardcoded filter outcomes for suggestion chips so they always apply correctly
// regardless of how Gemini interprets the text.
const getSuggestionFilters = (text, dataRange) => {
  const [dMin, dMax] = dataRange;
  const map = {
    'Best bats under ₹10,000':       { applyFilters: true,  brands: [], priceRange: [dMin, 10000], minRating: 4.0, sort: 'none' },
    'Top rated bats':                 { applyFilters: true,  brands: [], priceRange: [dMin, dMax],  minRating: 4.0, sort: 'none' },
    'Bats for aggressive batsmen':    { applyFilters: false },
    'Compare MRF vs SS':              { applyFilters: false },
    'Lightweight bat for quick scoring': { applyFilters: false },
  };
  return map[text] ?? null;
};

const AIChatbot = ({ bats, brands, dataRange, onApplyFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hi! I'm BatBot, your AI cricket bat assistant. I can help you find the perfect bat, suggest options based on your playing style, compare brands, or filter by budget. What are you looking for?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setInput('');
    setLoading(true);
    try {
      const result = await getBotResponse(text.trim(), bats, brands, dataRange);

      // For known suggestion chips, override Gemini's filter decision with the
      // hardcoded correct values so they always behave as intended.
      const override = getSuggestionFilters(text.trim(), dataRange);
      if (override) {
        result.applyFilters = override.applyFilters;
        if (override.applyFilters) {
          result.brands     = override.brands;
          result.priceRange = override.priceRange;
          result.minRating  = override.minRating;
          result.sort       = override.sort;
        }
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        text: result.message,
        filtersApplied: result.applyFilters,
      }]);
      if (result.applyFilters) {
        onApplyFilters({
          brands: result.brands,
          priceRange: result.priceRange,
          minRating: result.minRating,
          sort: result.sort,
        });
      }
    } catch (err) {
      console.error('BatBot error:', err);
      const msg = err?.message || 'Unknown error';
      const display = msg.includes('API key not configured')
        ? 'API key missing — restart the dev server and reload.'
        : msg.includes('429') || msg.toLowerCase().includes('quota')
          ? 'Rate limit hit. Wait a moment and try again.'
          : `Error: ${msg}`;
      setMessages(prev => [...prev, { role: 'ai', text: display }]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <>
      <button
        className={`chatbot-fab${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Open BatBot AI assistant"
      >
        <span className="fab-icon">{isOpen ? <FaTimes /> : <FaRobot />}</span>
        {!isOpen && <span className="fab-label">ChatBot</span>}
      </button>

      <div className={`chatbot-panel${isOpen ? ' visible' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar"><FaRobot /></div>
            <div>
              <p className="chatbot-name">ChatBot</p>
              <p className="chatbot-sub">AI Bat Assistant</p>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              {msg.role === 'ai' && <div className="chat-avatar-sm"><FaRobot /></div>}
              <div className="chat-bubble">
                {msg.text}
                {msg.filtersApplied && (
                  <div className="filters-applied-tag">Filters applied on shop</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg ai">
              <div className="chat-avatar-sm"><FaRobot /></div>
              <div className="chat-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="chat-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          className="chatbot-input-row"
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about bats..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </>
  );
};

export default AIChatbot;

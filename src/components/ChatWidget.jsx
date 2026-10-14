import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Terminal, X, ExternalLink, Send } from 'lucide-react';
import { subscribeToOrgSettings } from '../services/organizationService';
import { subscribeToOrgKeywords } from '../services/keywordService';

export default function ChatWidget({ organizationId, triggerAudioEffect }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userChatMessage, setUserChatMessage] = useState('');
  const [keywordsList, setKeywordsList] = useState([]);
  const [settings, setSettings] = useState({
    botName: 'Match-Bot',
    companyName: 'Match-Bot',
    welcomeMessage: 'Greetings agent. How can I assist you?',
    whatsappNumber: '1234567890'
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Subscribe to organization settings and keywords dynamically
  useEffect(() => {
    if (!organizationId) return;

    const unsubscribeSettings = subscribeToOrgSettings(organizationId, (data) => {
      setSettings(data);
      // Initialize welcome message using org settings
      setChatMessages([
        {
          id: 'welcome-msg',
          sender: 'bot',
          text: data.welcomeMessage || `Greetings agent. I am ${data.botName}. Type any command or keyword to receive database retrieval.`,
          timestamp: new Date()
        }
      ]);
    });

    const unsubscribeKeywords = subscribeToOrgKeywords(organizationId, (list) => {
      setKeywordsList(list);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeKeywords();
    };
  }, [organizationId]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isBotTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userChatMessage.trim()) return;

    const queryText = userChatMessage.trim();

    const userMsgObj = {
      id: Math.random().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date()
    };

    setChatMessages((prev) => [...prev, userMsgObj]);
    setUserChatMessage('');
    if (triggerAudioEffect) triggerAudioEffect('message-sent');

    setIsBotTyping(true);

    setTimeout(() => {
      // Clean query by removing punctuation and converting to lowercase
      const cleanQuery = queryText.toLowerCase().replace(/[^\w\s]/gi, '');
      const queryWords = cleanQuery.split(/\s+/);

      // Find matching keyword using exact phrase inclusion OR individual word matches
      const match = keywordsList.find((item) => {
        const kw = item.keyword.toLowerCase().trim();
        return cleanQuery.includes(kw) || queryWords.includes(kw);
      });

      let responseMsgObj = {};

      if (match) {
        responseMsgObj = {
          id: Math.random().toString(),
          sender: 'bot',
          text: match.answer,
          timestamp: new Date()
        };
      } else {
        responseMsgObj = {
          id: Math.random().toString(),
          sender: 'bot',
          text: "I couldn't find an exact match in our database. Let me connect you directly with our team!",
          hasWhatsAppButton: true,
          timestamp: new Date()
        };
      }

      setChatMessages((prev) => [...prev, responseMsgObj]);
      setIsBotTyping(false);
      if (triggerAudioEffect) triggerAudioEffect('message-received');
    }, 800);
  };

  const getWhatsAppLink = () => {
    const rawNumber = (settings.whatsappNumber || '1234567890').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Greetings, I am requesting support for ${settings.companyName || 'your organization'}.`);
    return `https://wa.me/${rawNumber}?text=${text}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono">
      {/* Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={() => {
            setIsChatOpen(true);
            if (triggerAudioEffect) triggerAudioEffect('success');
          }}
          className="w-14 h-14 rounded-full bg-black border-2 border-[#39FF14] hover:bg-[#39FF14]/10 text-[#39FF14] flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all duration-300 hover:scale-105 group relative"
        >
          <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>
        </button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="w-[340px] sm:w-[380px] h-[480px] bg-zinc-950/95 backdrop-blur-md border-2 border-[#39FF14] rounded-xl flex flex-col shadow-[0_0_40px_rgba(57,255,20,0.25)] overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-3 bg-black border-b border-[#39FF14]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 rounded bg-zinc-900 border border-[#39FF14] flex items-center justify-center text-[#39FF14]">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#39FF14] rounded-full border border-black"></div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-widest uppercase">
                  {settings.botName || 'Match-Bot'}
                </h4>
                <p className="text-[9px] text-zinc-400 tracking-widest uppercase">
                  {settings.companyName || 'Support Node'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsChatOpen(false);
                if (triggerAudioEffect) triggerAudioEffect('keystroke');
              }}
              className="p-1 rounded text-zinc-400 hover:text-[#39FF14] hover:bg-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
              >
                <div
                  className={`rounded-lg px-3 py-2.5 text-xs font-mono leading-relaxed shadow-sm ${msg.sender === 'user'
                    ? 'bg-[#39FF14]/10 border border-[#39FF14]/40 text-[#39FF14]'
                    : 'bg-zinc-900 border border-zinc-800 text-white'
                    }`}
                >
                  {msg.text}

                  {msg.hasWhatsAppButton && (
                    <div className="mt-3">
                      <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (triggerAudioEffect) triggerAudioEffect('success');
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#39FF14] text-black font-extrabold text-[10px] tracking-wider uppercase transition-all duration-300 hover:shadow-[0_0_15px_#39FF14] hover:bg-emerald-400"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Chat on WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                <span className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}

            {isBotTyping && (
              <div className="flex flex-col items-start mr-auto max-w-[80%]">
                <div className="rounded-lg px-3 py-2 bg-zinc-900 border border-zinc-800 text-[#39FF14] text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(57,255,20,0.1)]">
                  <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef}></div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-2 border-t border-zinc-900 bg-black flex gap-1.5">
            <input
              type="text"
              value={userChatMessage}
              onChange={(e) => {
                setUserChatMessage(e.target.value);
                if (triggerAudioEffect) triggerAudioEffect('keystroke');
              }}
              placeholder="Type your question..."
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-[#39FF14]/50 rounded px-3 py-2 text-xs text-white outline-none placeholder-zinc-700 transition-colors font-mono"
              required
            />
            <button
              type="submit"
              className="px-3.5 rounded bg-black border border-[#39FF14]/60 hover:bg-[#39FF14]/10 text-[#39FF14] flex items-center justify-center transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
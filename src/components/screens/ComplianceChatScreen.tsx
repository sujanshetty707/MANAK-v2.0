import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { Send, Scale, BookOpen, Loader2 } from 'lucide-react';
import { askComplianceChatApi } from '../../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citation?: string;
  time: string;
}

export const ComplianceChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Namaste Inspector. I am your Legal Metrology Compliance Assistant. Ask me anything regarding the Packaged Commodities Rules 2011, numeral height tables, or compounding procedures.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');

    setIsLoading(true);
    try {
      const res = await askComplianceChatApi(textToSend);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer || 'Refer to Legal Metrology (Packaged Commodities) Rules, 2011 for explicit statutory directives.',
        citation: res.citation || 'Legal Metrology (Packaged Commodities) Rules, 2011',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Rule 6(1) specifies mandatory declarations: manufacturer details, generic name, net quantity, MRP, mfg date, and consumer care details.',
        citation: 'Rule 6(1) Packaged Commodities Rules 2011',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#F5F6F8] flex flex-col justify-between overflow-hidden">
      <Header title="Legal Metrology AI Assistant" showBack showLogo />

      {/* Chat History */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
        <div className="bg-blue-50/80 rounded-xl p-2.5 border border-blue-100 flex items-center space-x-2 text-xs text-slate-700">
          <BookOpen className="w-4 h-4 text-manak-navy flex-shrink-0" />
          <span className="text-[10.5px]">
            Advisory Assistant for 2011 Rules, GSR 202(E) &amp; Section 36 queries.
          </span>
        </div>

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-subtle ${
                msg.sender === 'user'
                  ? 'bg-manak-navy text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
              }`}
            >
              <p>{msg.text}</p>
              {msg.citation && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-manak-navy font-mono font-semibold flex items-center gap-1">
                  <Scale className="w-3 h-3 text-manak-orange flex-shrink-0" />
                  <span>{msg.citation}</span>
                </div>
              )}
            </div>
            <span className="text-[9.5px] text-slate-400 mt-1 px-1 mono">{msg.time}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-manak-navy" />
            <span>Consulting Legal Metrology API...</span>
          </div>
        )}

        {/* Quick Query Pills */}
        <div className="pt-2">
          <span className="text-[10px] text-slate-400 font-semibold uppercase mono block mb-1.5">
            Suggested Statutory Questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSend('What is the mandatory MRP tax disclaimer under Rule 6(1)(e)?')}
              className="text-[10px] py-1 px-2.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition-colors shadow-subtle"
            >
              MRP Tax Disclaimer Format
            </button>
            <button
              onClick={() => handleSend('What declarations are mandatory on e-commerce listings?')}
              className="text-[10px] py-1 px-2.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition-colors shadow-subtle"
            >
              E-Commerce Rule 6(10)
            </button>
            <button
              onClick={() => handleSend('What is the compounding penalty amount under Rule 32?')}
              className="text-[10px] py-1 px-2.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition-colors shadow-subtle"
            >
              Rule 32 Penalties
            </button>
          </div>
        </div>
      </main>

      {/* Input Bar */}
      <footer className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 z-20 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question on 2011 Rules..."
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-manak-navy"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-manak-navy hover:bg-slate-900 text-white transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-manak-orange" />}
        </button>
      </footer>

      <BottomNav />
    </div>
  );
};

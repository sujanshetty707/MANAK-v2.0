import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../common/Header';
import { BottomNav } from '../common/BottomNav';
import { Bot, Send, Sparkles, Scale, BookOpen } from 'lucide-react';

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
      time: '10:00'
    },
    {
      id: '2',
      sender: 'user',
      text: 'What is the minimum numeral height for a 500g package under Rule 7?',
      time: '10:01'
    },
    {
      id: '3',
      sender: 'assistant',
      text: 'Under Rule 7(2) Table I of the 2011 Rules, for a net quantity exceeding 200g up to 1kg, the minimum height of numeral and letters on the principal display panel must be at least 4.0 mm (or 2.0 mm if blown/embossed on glass/metal).',
      citation: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Table I, Rule 7(2)',
      time: '10:01'
    }
  ]);

  const [input, setInput] = useState('');

  const handleSend = (queryText?: string) => {
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

    setTimeout(() => {
      let reply = 'According to the Legal Metrology (Packaged Commodities) Rules 2011, statutory declarations must be made in English or Hindi (Devanagari script) and placed conspicuously on the principal display panel.';
      let citation = 'Rule 6(1) & Section 36 of Legal Metrology Act, 2009';

      const lower = textToSend.toLowerCase();
      if (lower.includes('mrp') || lower.includes('tax') || lower.includes('price')) {
        reply = 'Rule 6(1)(e) mandates that the retail price must be expressed as "Maximum Retail Price" or "MRP Rs. XX.XX (inclusive of all taxes)". No retailer may charge more than the declared MRP or add extra tax surcharge.';
        citation = 'Rule 6(1)(e) & Rule 2(m) Gazette Notification';
      } else if (lower.includes('ecommerce') || lower.includes('online') || lower.includes('url') || lower.includes('origin')) {
        reply = 'Rule 6(10) mandates that e-commerce marketplaces must display name and address of manufacturer/packer, country of origin, net quantity, best before/expiry date, MRP, and consumer care details on the digital product page.';
        citation = 'Rule 6(10) Amendment & Consumer Protection (E-Commerce) Rules 2020';
      } else if (lower.includes('fine') || lower.includes('penalty') || lower.includes('rule 32')) {
        reply = 'Under Rule 32, compounding fines for packaging offenses under Section 36 are standard ₹2,000 for first offenses, with subsequent offenses leading to formal court prosecution.';
        citation = 'Rule 32 Compounding Schedule';
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: reply,
        citation,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 450);
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
          className="p-2.5 rounded-xl bg-manak-navy hover:bg-slate-900 text-white transition-colors"
        >
          <Send className="w-4 h-4 text-manak-orange" />
        </button>
      </footer>

      <BottomNav />
    </div>
  );
};

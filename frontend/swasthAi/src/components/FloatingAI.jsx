import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Mic, Paperclip, Sparkles, Activity, Clock, Shield } from 'lucide-react';

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', content: 'Hello Doctor. I\'m SwasthAI Clinical Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), type: 'user', content: input }]);
    setInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'ai', 
        content: 'Patient shows early sepsis indicators. Temperature increased by 2.5°F, blood pressure dropped, heart rate increased. Recommended immediate physician review.',
        detailed: true 
      }]);
      setIsTyping(false);
    }, 1800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-slate-800' : 'gradient-primary'
        }`}
        style={{ boxShadow: '0 20px 40px -10px rgba(37,99,235,0.4)' }}
      >
        {isOpen ? <X size={24} className="text-white" /> : <Bot size={24} className="text-white" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-20 right-0 w-[420px] max-w-[90vw] h-[560px] glass-premium rounded-3xl overflow-hidden shadow-2xl border border-white/40 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/30 bg-gradient-to-r from-[#2563EB]/5 to-[#06B6D4]/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/20">AI</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">SwasthAI Assistant</p>
                  <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> Online · Clinical AI
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.type === 'user' ? 'gradient-primary text-white rounded-2xl rounded-tr-sm' : 'bg-white/70 backdrop-blur rounded-2xl rounded-tl-sm border border-white/50'} px-4 py-2.5 shadow-sm`}>
                    <p className={`text-sm ${msg.type === 'user' ? 'text-white' : 'text-slate-700'}`}>{msg.content}</p>
                    {msg.detailed && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <div className="bg-red-50/70 rounded-lg p-1.5 text-center">
                          <p className="text-[10px] text-slate-400">Risk</p>
                          <p className="text-xs font-bold text-red-500">91%</p>
                        </div>
                        <div className="bg-blue-50/70 rounded-lg p-1.5 text-center">
                          <p className="text-[10px] text-slate-400">Confidence</p>
                          <p className="text-xs font-bold text-[#2563EB]">96%</p>
                        </div>
                        <div className="bg-amber-50/70 rounded-lg p-1.5 text-center">
                          <p className="text-[10px] text-slate-400">Timeline</p>
                          <p className="text-xs font-bold text-amber-600">6 hrs</p>
                        </div>
                        <div className="bg-emerald-50/70 rounded-lg p-1.5 text-center">
                          <p className="text-[10px] text-slate-400">Action</p>
                          <p className="text-xs font-bold text-emerald-600">Review</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/70 backdrop-blur rounded-2xl rounded-tl-sm px-4 py-2.5 border border-white/50">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/30 bg-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl hover:bg-slate-100/50 transition">
                  <Paperclip size={18} className="text-slate-400" />
                </button>
                <button className="p-2 rounded-xl hover:bg-slate-100/50 transition">
                  <Mic size={18} className="text-slate-400" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about patient risk..."
                  className="flex-1 px-4 py-2 bg-white/60 backdrop-blur rounded-xl border border-white/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm placeholder:text-slate-400"
                />
                <button 
                  onClick={handleSend}
                  className="p-2.5 rounded-xl gradient-primary text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><Shield size={10} /> HIPAA Compliant</span>
                <span className="flex items-center gap-1"><Activity size={10} /> Clinical AI</span>
                <span className="flex items-center gap-1"><Sparkles size={10} /> Explainable</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
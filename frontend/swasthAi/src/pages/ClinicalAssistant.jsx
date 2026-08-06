import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Activity, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const initialMessages = [
  { id: 1, type: 'ai', content: 'Hello Doctor. I\'m SwasthAI Clinical Assistant. How can I help you today?' },
];

export default function ClinicalAssistant() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), type: 'user', content: input }]);
    setInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'ai', 
        content: 'Patient shows early sepsis indicators. Temperature increased by 2.5°F, blood pressure dropped, heart rate increased.',
        detailed: true 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-180px)] grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* History */}
      <div className="lg:col-span-1 glass rounded-3xl p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Conversations</h3>
        <div className="space-y-2">
          {['Patient 102 - High Risk', 'Patient 87 - Follow up', 'Ward A - Morning Round'].map((conv) => (
            <div key={conv} className="p-3 rounded-xl bg-white/40 hover:bg-white/60 transition cursor-pointer border border-white/30">
              <p className="text-sm font-medium text-slate-700">{conv}</p>
              <p className="text-xs text-slate-400">2 min ago</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="lg:col-span-2 flex flex-col glass rounded-3xl overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.type === 'ai' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                {msg.type === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`max-w-[85%] ${msg.type === 'user' ? 'bg-primary text-white rounded-2xl rounded-tr-sm' : 'bg-white/60 backdrop-blur-sm rounded-2xl rounded-tl-sm border border-white/30'} px-4 py-3`}>
                <p className="text-sm">{msg.content}</p>
                {msg.detailed && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-red-50/50 rounded-xl p-2 text-center">
                      <p className="text-xs text-slate-400">Risk Score</p>
                      <p className="text-sm font-bold text-red-500">91%</p>
                    </div>
                    <div className="bg-blue-50/50 rounded-xl p-2 text-center">
                      <p className="text-xs text-slate-400">Confidence</p>
                      <p className="text-sm font-bold text-blue-600">96%</p>
                    </div>
                    <div className="bg-amber-50/50 rounded-xl p-2 text-center">
                      <p className="text-xs text-slate-400">Timeline</p>
                      <p className="text-sm font-bold text-amber-600">6 hrs</p>
                    </div>
                    <div className="bg-emerald-50/50 rounded-xl p-2 text-center">
                      <p className="text-xs text-slate-400">Action</p>
                      <p className="text-sm font-bold text-emerald-600">Review</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Bot size={16} />
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/30 bg-white/20 backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about patient risk, vitals, or recommendations..."
              className="flex-1 px-4 py-2.5 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <button 
              onClick={handleSend}
              className="w-11 h-11 rounded-2xl bg-gradient-to-r from-primary to-ai-cyan text-white flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      <div className="lg:col-span-1 glass rounded-3xl p-4 space-y-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-800">Patient Context</h3>
        <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/30">
          <p className="text-xs text-slate-400">Current Patient</p>
          <p className="text-sm font-medium text-slate-700">Patient 102 · Rahul Sharma</p>
          <p className="text-xs text-slate-400">ICU A · 58y · Male</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <Activity size={12} className="text-red-500" />
            <span className="text-red-500 font-medium">CRITICAL · 91% Risk</span>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/30">
          <p className="text-xs text-slate-400">Recent Alerts</p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-start gap-2 text-xs">
              <AlertCircle size={12} className="text-red-500 mt-0.5" />
              <span className="text-slate-600">HR spike detected 10 min ago</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <AlertCircle size={12} className="text-amber-500 mt-0.5" />
              <span className="text-slate-600">BP declining trend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { STAKEHOLDERS } from '../mockData';
import { MatchStatus } from '../types';
import { ArrowLeft, Send, ShieldCheck, User, Building2, ChevronDown, CheckCircle2, FileText, Handshake } from 'lucide-react';

const ChatRoomPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getChatById, sendMessage, updateChatStatus } = useChat();
  const [inputText, setInputText] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = getChatById(chatId || '');
  
  useEffect(() => {
    if (!chat || !user) {
      navigate('/dashboard');
    }
  }, [chat, user, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  if (!chat || !user) return null;

  const otherParticipantId = chat.participant_ids.find(id => id !== user.id && id !== user.stakeholder_id);
  const otherParticipant = STAKEHOLDERS.find(s => s.stakeholder_id === otherParticipantId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(chat.id, user.id, inputText);
    setInputText('');
  };

  const handleStatusUpdate = (newStatus: MatchStatus) => {
    if (updateChatStatus) {
      updateChatStatus(chat.id, newStatus);
      sendMessage(chat.id, 'system', `Status updated to ${newStatus}`);
      setShowStatusDropdown(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
      {/* Enhanced Chat Header with Pipeline Management */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                {otherParticipant?.name.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 flex items-center gap-1.5 truncate max-w-[200px] md:max-w-xs">
                  {otherParticipant?.name || 'External Stakeholder'}
                </h2>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">{chat.item_name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative">
                <button 
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all"
                >
                  <Handshake size={14}/> {chat.status} <ChevronDown size={14} className={showStatusDropdown ? 'rotate-180' : ''}/>
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
                    {Object.values(MatchStatus).map(s => (
                      <button 
                        key={s}
                        onClick={() => handleStatusUpdate(s)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 flex items-center justify-between ${chat.status === s ? 'text-blue-600' : 'text-slate-600'}`}
                      >
                        {s} {chat.status === s && <CheckCircle2 size={14}/>}
                      </button>
                    ))}
                  </div>
                )}
             </div>
             <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Secure File Vault">
               <FileText size={20}/>
             </button>
          </div>
        </div>
        
        {/* Visual Pipeline Progress */}
        <div className="flex px-6 pb-2 gap-1 overflow-hidden">
          {[MatchStatus.INQUIRY, MatchStatus.NDA_PENDING, MatchStatus.TECHNICAL_DD, MatchStatus.NEGOTIATION, MatchStatus.CONTRACT_SIGNED].map((s, idx) => {
            const isDone = [MatchStatus.INQUIRY, MatchStatus.NDA_PENDING, MatchStatus.TECHNICAL_DD, MatchStatus.NEGOTIATION, MatchStatus.CONTRACT_SIGNED].indexOf(chat.status) >= idx;
            return (
              <div key={s} className={`h-1 flex-grow rounded-full transition-all duration-500 ${isDone ? 'bg-blue-600' : 'bg-slate-100'}`} />
            );
          })}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {chat.messages.map((msg) => {
          const isMe = msg.sender_id === user.id;
          const isSystem = msg.sender_id === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-6">
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-slate-200">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                isMe ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-2 opacity-40 font-bold ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 bg-white border-t">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
          <input 
            type="text"
            placeholder="Discuss terms, ask technical questions..."
            className="flex-grow px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 text-sm"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoomPage;

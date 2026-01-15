
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatRoom, Message, MatchStatus } from '../types';

interface ChatContextType {
  chatRooms: ChatRoom[];
  createOrGetChat: (itemId: string, itemName: string, providerId: string, userId: string, type: 'tech' | 'need') => string;
  sendMessage: (chatId: string, senderId: string, text: string) => void;
  updateChatStatus: (chatId: string, status: MatchStatus) => void;
  getChatById: (chatId: string) => ChatRoom | undefined;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const savedChats = localStorage.getItem('apctt_chats_v2');
    if (savedChats) {
      setChatRooms(JSON.parse(savedChats));
    }
  }, []);

  const saveChats = (chats: ChatRoom[]) => {
    setChatRooms(chats);
    localStorage.setItem('apctt_chats_v2', JSON.stringify(chats));
  };

  const createOrGetChat = (itemId: string, itemName: string, providerId: string, userId: string, type: 'tech' | 'need') => {
    const existing = chatRooms.find(c =>
      (type === 'tech' ? c.tech_id === itemId : c.need_id === itemId) &&
      c.participant_ids.includes(providerId) &&
      c.participant_ids.includes(userId)
    );

    if (existing) return existing.id;

    const newChat: ChatRoom = {
      id: `chat_${Date.now()}`,
      tech_id: type === 'tech' ? itemId : undefined,
      need_id: type === 'need' ? itemId : undefined,
      item_name: itemName,
      participant_ids: [providerId, userId],
      messages: [
        {
          id: 'system_1',
          sender_id: 'system',
          text: `Match initiated for "${itemName}". Discussion group established.`,
          timestamp: Date.now()
        }
      ],
      last_updated: Date.now(),
      status: MatchStatus.INQUIRY
    };

    saveChats([...chatRooms, newChat]);

    // Sync to backend for stats
    fetch('/api/chat-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newChat.id, created_at: newChat.last_updated })
    }).catch(err => console.error('Failed to sync chat stats:', err));

    return newChat.id;
  };

  const sendMessage = (chatId: string, senderId: string, text: string) => {
    const updated = chatRooms.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [
            ...chat.messages,
            { id: `msg_${Date.now()}`, sender_id: senderId, text, timestamp: Date.now() }
          ],
          last_updated: Date.now()
        };
      }
      return chat;
    });
    saveChats(updated);
  };

  const updateChatStatus = (chatId: string, status: MatchStatus) => {
    const updated = chatRooms.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, status, last_updated: Date.now() };
      }
      return chat;
    });
    saveChats(updated);
  };

  const getChatById = (chatId: string) => chatRooms.find(c => c.id === chatId);

  return (
    <ChatContext.Provider value={{ chatRooms, createOrGetChat, sendMessage, updateChatStatus, getChatById }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, User, ShieldCheck, Loader2, ShoppingCart, Tag, Sparkles } from 'lucide-react';
import { Chat, Message, Product } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, query, orderBy, onSnapshot, addDoc, setDoc, serverTimestamp, getDoc, where, or } from 'firebase/firestore';

interface ChatWindowProps {
  onClose: () => void;
  initialChatId?: string; // If consumer clicked "Chat" on a product, we can open/create that chat thread
  targetFarmerId?: string;
  targetFarmerName?: string;
  initialProduct?: Product;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export default function ChatWindow({ onClose, initialChatId, targetFarmerId, targetFarmerName, initialProduct, onAddToCart, onBuyNow }: ChatWindowProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentUser = auth.currentUser;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 1. Fetch available chat threads for the current user
  useEffect(() => {
    if (!currentUser) return;

    setLoadingChats(true);
    const chatsRef = collection(db, 'chats');
    
    // Use secure Firestore query with OR to only retrieve chats where this user is a participant
    const q = query(
      chatsRef,
      or(
        where('consumerId', '==', currentUser.uid),
        where('farmerId', '==', currentUser.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allChats: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Chat;
        allChats.push({ id: doc.id, ...data });
      });
      setChats(allChats);
      setLoadingChats(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. Handle initial chat creation/loading when clicked from a product
  useEffect(() => {
    async function setupInitialChat() {
      if (!currentUser || !targetFarmerId || !targetFarmerName) return;

      const chatId = `${targetFarmerId}_${currentUser.uid}`;
      const chatDocRef = doc(db, 'chats', chatId);

      try {
        const chatDoc = await getDoc(chatDocRef);
        
        const chatData: Chat = {
          id: chatId,
          farmerId: targetFarmerId,
          consumerId: currentUser.uid,
          farmerName: targetFarmerName,
          consumerName: currentUser.displayName || 'Khách hàng',
          lastMessage: 'Bắt đầu cuộc trò chuyện...',
          lastMessageAt: new Date().toISOString()
        };

        if (!chatDoc.exists()) {
          // Create chat thread document
          await setDoc(chatDocRef, chatData);
          setActiveChat(chatData);
        } else {
          setActiveChat({ id: chatDoc.id, ...chatDoc.data() } as Chat);
        }
      } catch (err) {
        console.error('Error setting up initial chat:', err);
      }
    }

    setupInitialChat();
  }, [initialChatId, targetFarmerId, targetFarmerName, currentUser]);

  // 3. Listen to messages for the active chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(fetchedMessages);
      setLoadingMessages(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${activeChat.id}/messages`);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // 3a. Mark active chat as read when changed or loaded
  useEffect(() => {
    if (activeChat) {
      localStorage.setItem(`chat_read_${activeChat.id}`, new Date().toISOString());
      window.dispatchEvent(new Event('chat_read_update'));
    }
  }, [activeChat]);

  // 4. Send Message function
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeChat || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
      const timestamp = new Date().toISOString();

      // Write message to subcollection
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Người dùng',
        text: messageText,
        createdAt: timestamp
      });

      // Update thread head
      const chatDocRef = doc(db, 'chats', activeChat.id);
      await setDoc(chatDocRef, {
        lastMessage: messageText,
        lastMessageAt: timestamp,
        lastSenderId: currentUser.uid
      }, { merge: true });

      // Also mark as read locally
      localStorage.setItem(`chat_read_${activeChat.id}`, timestamp);
      window.dispatchEvent(new Event('chat_read_update'));

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChat.id}/messages`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] flex overflow-hidden border border-slate-200 shadow-2xl"
      >
        {/* Left pane - Thread List */}
        <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center">
              <MessageSquare className="w-4 h-4 mr-1.5 text-emerald-600" />
              Hội thoại của bạn
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingChats ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs">Đang tải tin nhắn...</span>
              </div>
            ) : chats.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-12">Chưa có cuộc trò chuyện nào.</p>
            ) : (
              chats.map((chat) => {
                const isActive = activeChat?.id === chat.id;
                const isFarmer = currentUser?.uid === chat.farmerId;
                const partnerName = isFarmer ? chat.consumerName : chat.farmerName;

                // Helper to check if a chat is unread
                const isUnread = (c: Chat) => {
                  if (activeChat?.id === c.id) return false;
                  if (c.lastSenderId === currentUser?.uid) return false;
                  const lastReadStr = localStorage.getItem(`chat_read_${c.id}`);
                  if (!lastReadStr) return true;
                  return new Date(c.lastMessageAt).getTime() > new Date(lastReadStr).getTime();
                };

                return (
                  <button
                    id={`chat-thread-${chat.id}`}
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="truncate pr-2 flex-1">
                      <p className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {partnerName}
                      </p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-500'} mt-0.5`}>
                        {chat.lastMessage}
                      </p>
                    </div>
                    {isUnread(chat) && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs border border-white ml-2 animate-pulse" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane - Messages Area */}
        <div className="flex-1 flex flex-col bg-slate-100">
          {/* Header */}
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            {activeChat ? (
              <div>
                <p className="font-bold text-slate-900 text-sm flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-slate-500" />
                  {currentUser?.uid === activeChat.farmerId ? activeChat.consumerName : activeChat.farmerName}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {currentUser?.uid === activeChat.farmerId ? 'Người tiêu dùng' : 'Nông dân trồng vườn'}
                </p>
              </div>
            ) : (
              <span className="text-slate-500 text-sm">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</span>
            )}
            <button
              id="close-chat-window"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product Context Banner */}
          {activeChat && initialProduct && (currentUser?.uid !== initialProduct.farmerId) && (
            <div className="bg-emerald-50 border-b border-emerald-100 p-3 px-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3 min-w-0">
                <img 
                  src={initialProduct.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} 
                  alt={initialProduct.name} 
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-emerald-200" 
                  referrerPolicy="no-referrer" 
                />
                <div className="truncate">
                  <p className="font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Thảo luận: {initialProduct.name}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    Giá nông sản: <span className="text-emerald-700 font-black">{initialProduct.price.toLocaleString('vi-VN')}đ / {initialProduct.unit}</span> • Kho: {initialProduct.quantity} {initialProduct.unit}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const text = `Chào bà con nhà vườn, tôi cần thêm thông tin chi tiết hoặc muốn thỏa thuận mua nông sản [${initialProduct.name}] này với số lượng cụ thể nhé!`;
                    if (!currentUser || !activeChat) return;
                    try {
                      const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
                      const timestamp = new Date().toISOString();
                      await addDoc(messagesRef, {
                        senderId: currentUser.uid,
                        senderName: currentUser.displayName || 'Người dùng',
                        text: text,
                        createdAt: timestamp
                      });
                      const chatDocRef = doc(db, 'chats', activeChat.id);
                      await setDoc(chatDocRef, {
                        lastMessage: text,
                        lastMessageAt: timestamp,
                        lastSenderId: currentUser.uid
                      }, { merge: true });

                      // Also mark as read locally
                      localStorage.setItem(`chat_read_${activeChat.id}`, timestamp);
                      window.dispatchEvent(new Event('chat_read_update'));
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Hỏi sỉ / Lẻ</span>
                </button>

                {onBuyNow && (
                  <button
                    type="button"
                    onClick={() => onBuyNow(initialProduct)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <ShoppingCart className="w-3 h-3 text-emerald-100 shrink-0" />
                    <span>Mua Ngay</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {!activeChat ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-xs italic">Hãy nhắn tin để trao đổi, đàm phán giá cả và hỗ trợ thu mua nông sản thuận tiện!</p>
              </div>
            ) : loadingMessages ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 shadow-xs text-xs leading-relaxed ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                        }`}
                      >
                        {!isMe && <p className="font-bold text-[10px] text-emerald-700 mb-1">{msg.senderName}</p>}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span className={`text-[9px] mt-1.5 block text-right ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <form
            id="chat-send-form"
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              disabled={!activeChat}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={activeChat ? "Nhập nội dung tin nhắn..." : "Hãy chọn một cuộc hội thoại đầu tiên..."}
              className="flex-1 text-xs bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded-full px-4 py-2.5 focus:outline-hidden transition-all text-slate-800 disabled:opacity-50"
            />
            <button
              id="send-chat-message-btn"
              type="submit"
              disabled={!activeChat || !newMessage.trim()}
              className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

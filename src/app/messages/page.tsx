'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { FaPaperPlane, FaSmile, FaLock, FaImage, FaEllipsisV, FaVideo, FaPhone, FaLockOpen, FaUserCircle } from 'react-icons/fa';
import MainNav from '@/components/layout/MainNav';
import { api } from '@/lib/trpc/client';

// Crypto helper for E2E encryption
const cryptoHelper = {
  async encrypt(message: string, key: string): Promise<string> {
    // Mock encryption for demonstration
    return `encrypted:${message}`;
  },

  async decrypt(encryptedMessage: string, key: string): Promise<string> {
    // Mock decryption for demonstration
    return encryptedMessage.replace('encrypted:', '');
  },

  generateKey(): string {
    // Generate random encryption key
    return Math.random().toString(36).substring(2, 15);
  }
};

// Emoji reactions for messages
const emojiReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉', '👀'];

// Type definitions
interface ChatUser {
  id: string;
  name: string;
  username: string;
  image: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

interface Message {
  id: string;
  content: string;
  encryptedContent?: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  readAt?: Date;
  reactions?: {
    type: string;
    userId: string;
  }[];
  isEncrypted: boolean;
}

interface Conversation {
  user: ChatUser;
  lastMessage?: Message;
  unreadCount: number;
}

// Component for showing when someone is typing
function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 px-2 py-1">
      <motion.div
        className="h-2 w-2 rounded-full bg-indigo-400"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-indigo-400"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-indigo-400"
        animate={{ scale: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
      />
    </div>
  );
}

// Message bubble component
function MessageBubble({ 
  message, 
  isMine, 
  showAvatar, 
  senderImage, 
  onReact 
}: { 
  message: Message; 
  isMine: boolean; 
  showAvatar: boolean;
  senderImage: string;
  onReact: (messageId: string, emoji: string) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  
  return (
    <div className={`group flex items-end space-x-2 ${isMine ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {showAvatar && !isMine ? (
        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
          <Image src={senderImage} alt="Sender" width={32} height={32} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      
      <div className="max-w-[75%]">
        <div 
          className={`relative rounded-2xl px-4 py-2 ${
            isMine 
              ? 'rounded-br-none bg-gradient-to-br from-indigo-600 to-purple-600 text-white' 
              : 'rounded-bl-none bg-gray-800 text-white'
          }`}
          onDoubleClick={() => setShowReactions(!showReactions)}
        >
          {message.isEncrypted && (
            <FaLock className="mr-1 inline-block h-3 w-3 text-gray-400" />
          )}
          
          <span>{message.content}</span>
          
          <div className="mt-1 text-right text-xs text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isMine && message.readAt && (
              <span className="ml-1 text-indigo-300">✓</span>
            )}
          </div>
          
          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-2 rounded-full bg-gray-900 px-2 py-0.5 text-xs">
              {message.reactions.map((reaction, i) => (
                <span key={i}>{reaction.type}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Emoji reaction selector */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            className={`absolute ${isMine ? 'right-12' : 'left-12'} z-10 flex -translate-y-8 space-x-1 rounded-full bg-gray-900 p-1 shadow-lg`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {emojiReactions.map((emoji) => (
              <button
                key={emoji}
                className="rounded-full p-1.5 hover:bg-gray-800"
                onClick={() => {
                  onReact(message.id, emoji);
                  setShowReactions(false);
                }}
              >
                <span className="text-sm">{emoji}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Conversation list component
function ConversationList({ 
  conversations, 
  activeUserId, 
  onSelectConversation 
}: { 
  conversations: Conversation[];
  activeUserId: string | null;
  onSelectConversation: (userId: string) => void;
}) {
  return (
    <div className="h-full overflow-y-auto border-r border-gray-800 bg-black/20 backdrop-blur-lg">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white">Messages</h2>
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>
      
      <div className="mt-2">
        {conversations.map((conversation) => (
          <button
            key={conversation.user.id}
            className={`flex w-full items-center space-x-3 px-4 py-3 transition-colors hover:bg-gray-800/50 ${
              activeUserId === conversation.user.id ? 'bg-gray-800/80' : ''
            }`}
            onClick={() => onSelectConversation(conversation.user.id)}
          >
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 overflow-hidden rounded-full">
                <Image 
                  src={conversation.user.image || '/placeholders/user.png'} 
                  alt={conversation.user.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-black ${
                conversation.user.status === 'online' ? 'bg-green-500' :
                conversation.user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">{conversation.user.name}</h3>
                {conversation.lastMessage && (
                  <span className="text-xs text-gray-400">
                    {new Date(conversation.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 truncate max-w-[120px]">
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>
                
                {conversation.unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Main messenger component
export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      user: {
        id: '1',
        name: 'Alex Johnson',
        username: 'alexj',
        image: '/placeholders/user.png',
        status: 'online'
      },
      lastMessage: {
        id: 'm1',
        content: 'Did you see the new 3D rendering feature?',
        senderId: '1',
        receiverId: 'current',
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        isEncrypted: false
      },
      unreadCount: 2
    },
    {
      user: {
        id: '2',
        name: 'Samir Patel',
        username: 'samir',
        image: '/placeholders/user.png',
        status: 'away'
      },
      lastMessage: {
        id: 'm2',
        content: 'Let me know what you think about the design',
        senderId: 'current',
        receiverId: '2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        readAt: new Date(Date.now() - 1000 * 60 * 30),
        isEncrypted: true
      },
      unreadCount: 0
    },
    {
      user: {
        id: '3',
        name: 'Elena Kim',
        username: 'elena',
        image: '/placeholders/user.png',
        status: 'offline'
      },
      lastMessage: {
        id: 'm3',
        content: 'The presentation went really well!',
        senderId: '3',
        receiverId: 'current',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        isEncrypted: false
      },
      unreadCount: 0
    }
  ]);
  
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Find the active conversation user
  const activeUser = conversations.find(c => c.user.id === activeConversation)?.user;
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Load messages for the active conversation
  useEffect(() => {
    if (activeConversation) {
      // In a real app, this would fetch from API
      const mockMessages: Message[] = [
        {
          id: 'msg1',
          content: 'Hey there! How are you doing today?',
          senderId: activeConversation,
          receiverId: 'current',
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          readAt: new Date(Date.now() - 1000 * 60 * 29),
          isEncrypted: false
        },
        {
          id: 'msg2',
          content: 'I\'m great! Just working on this new 3D model for our project.',
          senderId: 'current',
          receiverId: activeConversation,
          createdAt: new Date(Date.now() - 1000 * 60 * 28),
          readAt: new Date(Date.now() - 1000 * 60 * 27),
          isEncrypted: true,
          reactions: [{ type: '👍', userId: activeConversation }]
        },
        {
          id: 'msg3',
          content: 'That sounds awesome! Can you share a preview?',
          senderId: activeConversation,
          receiverId: 'current',
          createdAt: new Date(Date.now() - 1000 * 60 * 25),
          readAt: new Date(Date.now() - 1000 * 60 * 24),
          isEncrypted: false
        },
        {
          id: 'msg4',
          content: 'Sure thing! I\'ll export a render and send it over soon.',
          senderId: 'current',
          receiverId: activeConversation,
          createdAt: new Date(Date.now() - 1000 * 60 * 20),
          readAt: new Date(Date.now() - 1000 * 60 * 19),
          isEncrypted: true
        },
        {
          id: 'msg5',
          content: 'By the way, have you tried the new holographic meeting feature?',
          senderId: activeConversation,
          receiverId: 'current',
          createdAt: new Date(Date.now() - 1000 * 60 * 10),
          readAt: new Date(Date.now() - 1000 * 60 * 9),
          isEncrypted: false,
          reactions: [{ type: '🔥', userId: 'current' }]
        }
      ];
      
      setMessages(mockMessages);
      
      // Reset unread count when opening a conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.user.id === activeConversation 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    }
  }, [activeConversation]);
  
  // Show typing indicator randomly (for demo purposes)
  useEffect(() => {
    if (activeConversation) {
      const typingInterval = setInterval(() => {
        const shouldType = Math.random() > 0.7;
        setIsTyping(shouldType);
        
        if (shouldType) {
          // Stop "typing" after a few seconds
          setTimeout(() => setIsTyping(false), 3000);
        }
      }, 6000);
      
      return () => clearInterval(typingInterval);
    }
  }, [activeConversation]);
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    let content = newMessage;
    let encryptedContent;
    
    // Handle encryption if enabled
    if (isEncrypted) {
      const key = cryptoHelper.generateKey();
      encryptedContent = await cryptoHelper.encrypt(content, key);
      // In a real app, the key would be transmitted securely to the recipient
    }
    
    const message: Message = {
      id: `new-${Date.now()}`,
      content,
      encryptedContent,
      senderId: 'current',
      receiverId: activeConversation,
      createdAt: new Date(),
      isEncrypted
    };
    
    // Add to messages
    setMessages(prev => [...prev, message]);
    
    // Update conversation list
    setConversations(prev => 
      prev.map(conv => 
        conv.user.id === activeConversation 
          ? { ...conv, lastMessage: message } 
          : conv
      )
    );
    
    // Clear input
    setNewMessage('');
    
    // Scroll to bottom
    setTimeout(scrollToBottom, 100);
  };
  
  // Handle adding a reaction to a message
  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              reactions: [
                ...(msg.reactions || []).filter(r => r.userId !== 'current'),
                { type: emoji, userId: 'current' }
              ]
            }
          : msg
      )
    );
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-900 to-black text-white">
      <MainNav />
      
      <div className="flex flex-1 sm:pl-64">
        <div className="flex h-full w-full overflow-hidden">
          {/* Left sidebar with conversations */}
          <div className="w-full max-w-xs lg:max-w-sm">
            <ConversationList 
              conversations={conversations}
              activeUserId={activeConversation}
              onSelectConversation={setActiveConversation}
            />
          </div>
          
          {/* Main chat area */}
          <div className="flex flex-1 flex-col">
            {activeUser ? (
              <>
                {/* Chat header */}
                <div className="border-b border-gray-800 bg-black/40 backdrop-blur-lg">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative h-10 w-10 rounded-full">
                        <Image
                          src={activeUser.image || '/placeholders/user.png'}
                          alt={activeUser.name}
                          className="rounded-full object-cover"
                          fill
                        />
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-black ${
                          activeUser.status === 'online' ? 'bg-green-500' :
                          activeUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                      <div>
                        <h3 className="font-medium">{activeUser.name}</h3>
                        <p className="text-xs text-gray-400">
                          {activeUser.status === 'online' ? 'Online' : 
                           activeUser.status === 'away' ? 'Away' : 'Last seen recently'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button className="rounded-full bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 hover:text-white">
                        <FaPhone className="h-5 w-5" />
                      </button>
                      <button className="rounded-full bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 hover:text-white">
                        <FaVideo className="h-5 w-5" />
                      </button>
                      <button className="rounded-full bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 hover:text-white">
                        <FaEllipsisV className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isMine = message.senderId === 'current';
                      const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                      
                      return (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isMine={isMine}
                          showAvatar={showAvatar}
                          senderImage={activeUser.image}
                          onReact={handleReaction}
                        />
                      );
                    })}
                    
                    {isTyping && (
                      <div className="flex items-end space-x-2">
                        <div className="h-8 w-8 overflow-hidden rounded-full">
                          <Image 
                            src={activeUser.image} 
                            alt="Typing..." 
                            width={32} 
                            height={32} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div className="rounded-2xl rounded-bl-none bg-gray-800 px-4 py-2">
                          <TypingIndicator />
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Message input */}
                <div className="border-t border-gray-800 bg-black/40 p-4 backdrop-blur-lg">
                  <div className="flex items-center space-x-2">
                    <button 
                      className={`rounded-full p-2 transition-colors ${isEncrypted ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      onClick={() => setIsEncrypted(!isEncrypted)}
                      title={isEncrypted ? 'End-to-end encrypted' : 'Not encrypted'}
                    >
                      {isEncrypted ? <FaLock className="h-5 w-5" /> : <FaLockOpen className="h-5 w-5" />}
                    </button>
                    
                    <button className="rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700">
                      <FaImage className="h-5 w-5" />
                    </button>
                    
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="w-full rounded-full bg-gray-800 py-2 pl-4 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                        <FaSmile className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <button
                      className="rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700"
                      onClick={handleSendMessage}
                    >
                      <FaPaperPlane className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Empty state when no conversation is selected
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
                <div className="text-center">
                  <FaUserCircle className="mx-auto h-16 w-16 text-gray-700" />
                  <h3 className="mt-4 text-xl font-medium">No conversation selected</h3>
                  <p className="mt-2 text-gray-500">Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UserProfileModal } from '@/components/UserProfileModal';
import { useQuery } from '@tanstack/react-query';
import AgentChatPage from '@/components/chat/agent';
import { agentIds } from '@/setting';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
}

const matchedUser = {
  avatarUrl: '', // Add the matched user's avatar URL here
  nickname: 'Alice', // This should come from your user data
};

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId as string | undefined;
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello!', sender: 'Alice', timestamp: new Date() },
    { id: 2, text: 'Hi there!', sender: 'You', timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now(),
      text: newMessage,
      sender: 'You',
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleOpenProfile = () => setShowProfileModal(true);
  const handleCloseProfile = () => setShowProfileModal(false);

  if (chatId && agentIds.some((e: string) => e===chatId)) {
    return <AgentChatPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-[600px] flex flex-col">
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold">
                {matchedUser.avatarUrl ? (
                  <img
                    src={matchedUser.avatarUrl}
                    alt={matchedUser.nickname}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  matchedUser.nickname.charAt(0)
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {matchedUser.nickname}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'You' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === 'You'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>

        <button
          onClick={handleOpenProfile}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          View Profile
        </button>

        {showProfileModal && (
          <UserProfileModal
            nickname="Alice"
            tags={{ blockchain: ['Ethereum'], assetType: ['NFT'] }}
            tokenDistribution={{ ETH: 50, BTC: 30, USDT: 20 }}
            onClose={handleCloseProfile}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAuthStore } from '@/store/auth';
import { UserProfileModal } from '@/components/UserProfileModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatMessages, sendMessage, markMessagesAsRead, getUserMatches } from '@/lib/api';
import { ChatMessage, ChatMessagesResponse, Match } from '@/types';
import AgentChatPage from '@/components/chat/agent';
import { agentIds } from '@/setting';

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { authenticated } = usePrivy();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatId = params?.chatId as string | undefined;
  const [newMessage, setNewMessage] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [otherUser, setOtherUser] = useState<Match | null>(null);

  const userWallet = user?.wallet || user?.wallet_address;

  // Check if this is an agent chat
  if (chatId && agentIds.some((e: string) => e === chatId)) {
    return <AgentChatPage />;
  }

  // Get chat messages
  const { data: chatData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: () => getChatMessages(chatId!),
    enabled: !!chatId && !!userWallet,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
  });

  // Get user matches to find other participant info
  const { data: matchesData } = useQuery({
    queryKey: ['userMatches', userWallet],
    queryFn: () => getUserMatches(userWallet!),
    enabled: !!userWallet,
  });

  // Find the other user info from matches
  useEffect(() => {
    if (matchesData?.matches && chatId) {
      const match = matchesData.matches.find((m: Match) => m.chat_id === chatId);
      if (match) {
        setOtherUser(match);
      }
    }
  }, [matchesData, chatId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ content }: { content: string }) => 
      sendMessage(chatId!, content, userWallet!),
    onSuccess: () => {
      // Refetch messages after sending
      queryClient.invalidateQueries({ queryKey: ['chatMessages', chatId] });
      setNewMessage('');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    },
  });

  // Mark messages as read when chat opens
  useEffect(() => {
    if (chatId && userWallet && chatData?.messages?.length) {
      markMessagesAsRead(chatId, userWallet).catch(console.error);
    }
  }, [chatId, userWallet, chatData?.messages?.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatData?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({ content: newMessage.trim() });
  };

  const handleOpenProfile = () => setShowProfileModal(true);
  const handleCloseProfile = () => setShowProfileModal(false);

  // Check authentication
  if (!authenticated || !user) {
    router.push('/');
    return null;
  }

  // Loading state
  if (messagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading chat...</div>
      </div>
    );
  }

  // Error state
  if (messagesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Unable to load chat</div>
          <button
            onClick={() => router.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const messages = chatData?.messages || [];
  const otherUserNickname = otherUser?.user_info?.nickname || 'Unknown User';
  const otherUserAvatar = otherUser?.user_info?.profile?.avatar;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-[600px] flex flex-col">
            {/* Chat header */}
            <div className="flex items-center gap-4 p-4 bg-white border-b">
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold overflow-hidden">
                {otherUserAvatar ? (
                  <img
                    src={otherUserAvatar}
                    alt={otherUserNickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  otherUserNickname.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {otherUserNickname}
                </h2>
                <p className="text-sm text-gray-500">
                  {messages.length} messages
                </p>
              </div>
              <button
                onClick={handleOpenProfile}
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                View Profile
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message: ChatMessage) => (
                  <div
                    key={message.messageId}
                    className={`flex ${
                      message.sender === userWallet ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === userWallet
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                        {message.sender === userWallet && (
                          <span className="text-xs opacity-70">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Profile modal */}
        {showProfileModal && otherUser && (
          <UserProfileModal
            nickname={otherUser.user_info.nickname}
            tags={{ 
              blockchain: [otherUser.user_info.tags?.blockchain || 'Unknown'], 
              assetType: [otherUser.user_info.tags?.assetType || 'Unknown'] 
            }}
            tokenDistribution={{ ETH: 50, BTC: 30, USDT: 20 }} // Placeholder data
            onClose={handleCloseProfile}
          />
        )}
      </div>
    </div>
  );
}

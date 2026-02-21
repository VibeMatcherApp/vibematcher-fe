'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAuthStore } from '@/store/auth';
import { UserProfileModal } from '@/components/UserProfileModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatMessages, sendMessage, markMessagesAsRead, getUserMatches, getUserProfile } from '@/lib/api';
import { ChatMessage, Match } from '@/types';
import { useChat } from '@/hooks/useSocket';

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { authenticated } = usePrivy();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chatId = params?.chatId as string | undefined;
  const [newMessage, setNewMessage] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [otherUser, setOtherUser] = useState<Match | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const userWallet = user?.wallet || user?.wallet_address;
  const otherUserWallet = otherUser?.wallet_address;

  // Socket.io hook for real-time messaging
  const { isOtherTyping, onNewMessage, sendSocketMessage, emitTyping, emitStopTyping } = useChat(chatId, userWallet);

  // Get chat messages - reduced polling since we have sockets now
  const { data: chatData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: () => getChatMessages(chatId!),
    enabled: !!chatId && !!userWallet,
    refetchInterval: 30000, // Fallback: refresh every 30s (socket handles real-time)
  });

  // Get user matches to find other participant info
  const { data: matchesData } = useQuery({
    queryKey: ['userMatches', userWallet],
    queryFn: () => getUserMatches(userWallet!),
    enabled: !!userWallet,
  });

  // Get other user's profile for the modal
  const { data: otherUserProfile } = useQuery({
    queryKey: ['userProfile', otherUserWallet],
    queryFn: () => getUserProfile(otherUserWallet!),
    enabled: !!otherUserWallet && showProfileModal,
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

  // Listen for real-time messages via Socket.io
  useEffect(() => {
    const cleanup = onNewMessage((msg) => {
      if (msg.chatId === chatId) {
        // Invalidate query to merge with server data
        queryClient.invalidateQueries({ queryKey: ['chatMessages', chatId] });
      }
    });
    return cleanup;
  }, [chatId, onNewMessage, queryClient]);

  // Send message mutation (persists to backend)
  const sendMessageMutation = useMutation({
    mutationFn: ({ content }: { content: string }) =>
      sendMessage(chatId!, content, userWallet!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', chatId] });
      setNewMessage('');
      emitStopTyping();
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

  // Smart scroll: only auto-scroll if user is near bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsNearBottom(nearBottom);
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatData?.messages, isNearBottom]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    emitTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitStopTyping(), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    const content = newMessage.trim();

    // Send via Socket.io for instant delivery
    sendSocketMessage(content);

    // Persist via API
    sendMessageMutation.mutate({ content });
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
              <button
                onClick={handleOpenProfile}
                className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold overflow-hidden hover:bg-gray-300 transition-colors cursor-pointer"
              >
                {otherUserAvatar ? (
                  <img
                    src={otherUserAvatar}
                    alt={otherUserNickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  otherUserNickname.charAt(0).toUpperCase()
                )}
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {otherUserNickname}
                </h2>
                <p className="text-sm text-gray-500">
                  {isOtherTyping ? (
                    <span className="text-primary animate-pulse">typing...</span>
                  ) : (
                    `${messages.length} messages`
                  )}
                </p>
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
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
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                        {message.sender === userWallet && (
                          <span className="text-xs opacity-70 ml-2">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {isOtherTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* New messages indicator when scrolled up */}
            {!isNearBottom && (
              <button
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-primary text-white text-sm px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                New messages ↓
              </button>
            )}

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border-gray-300 focus:border-primary focus:ring-primary text-gray-900"
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Profile modal */}
        {showProfileModal && otherUser && otherUserProfile && (
          <UserProfileModal
            nickname={otherUser.user_info.nickname}
            tags={otherUserProfile.tags || { blockchain: ['Unknown'], assetType: ['Unknown'] }}
            tokenDistribution={otherUserProfile.tokenDistribution || otherUserProfile.chain_data?.distribution || {}}
            onClose={handleCloseProfile}
          />
        )}
      </div>
    </div>
  );
}

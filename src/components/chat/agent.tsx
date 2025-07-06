"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sendAgentMessage } from '@/lib/data/agent';
import { usePrivy } from '@privy-io/react-auth';

function AgentChatPage() {
    const params = useParams();
    const {user} = usePrivy();
    const agentId = params?.chatId as string | undefined;
    const [messages, setMessages] = useState<{ text: string; user: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { data: agent, isLoading: agentLoading, error } = useQuery({
        queryKey: ['agent', agentId],
        queryFn: async () => {
            if (!agentId) throw new Error('No agent ID provided');
            const res = await fetch(`https://agents-api.doodles.app/agents/${agentId}`);
            if (!res.ok) throw new Error('Failed to fetch agent');
            const data = await res.json();
            return { name: data.name, avatar: data.avatar, bio: data.bio };
        },
        enabled: !!agentId,
    });

    const sendMessage = async () => {
        if (!input.trim() || !agentId) return;
        setLoading(true);
        const userMessage = { text: input, user: user?.wallet?.address ?? ""};
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        try {
            const data = await sendAgentMessage(agentId, {...userMessage, text: `{walletAddress: "${user?.wallet?.address}", userMessage: "${userMessage.text}"}`}); // Uncomment if needed
            const agentMessage = Array.isArray(data) ? data[0] : data;
            setMessages((prev) => [...prev, { text: agentMessage.text, user: "agent" }]);
        } catch {
            setMessages((prev) => [...prev, { text: "Error sending message.", user: "system" }]);
        } finally {
            setLoading(false);
        }
    };

    if (agentLoading) {
        return <div className="flex flex-col items-center p-8">Loading agent...</div>;
    }

    if (error || !agent) {
        return <div className="flex flex-col items-center p-8 text-red-600">Agent not found.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="h-[600px] flex flex-col">
                        <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 font-bold">
                                {agent.avatar ? (
                                    <img
                                        src={agent.avatar}
                                        alt={agent.name}
                                        className="w-full h-full rounded-full"
                                    />
                                ) : (
                                    agent.name.charAt(0)
                                )}
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {agent.name}
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-400 text-sm mt-8">Start chatting with {agent.name}!</div>
                            )}
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${
                                        msg.user === "user" ? "justify-end" : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${
                                            msg.user === "user"
                                                ? "bg-primary text-white"
                                                : msg.user === "agent"
                                                    ? "bg-gray-100 text-gray-900"
                                                    : "bg-yellow-100 text-gray-900"
                                        }`}
                                    >
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs mt-1 opacity-70">
                                            {new Date().toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {/* Loading animation when sending message */}
                            {loading && (
                                <div className="flex justify-start p-4">
                                <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-white border border-gray-200 shadow-lg">
                                  <div className="flex items-center gap-3">
                                    {/* Wave animation */}
                                    <div className="flex items-center gap-1">
                                      {[...Array(3)].map((_, i) => (
                                        <div
                                          key={i}
                                          className="w-1 bg-gradient-to-t from-purple-400 to-purple-600 rounded-full animate-pulse"
                                          style={{
                                            height: '12px',
                                            animationDelay: `${i * 150}ms`,
                                            animationDuration: '1s',
                                            transform: `scaleY(${0.4 + Math.sin(Date.now() / 200 + i) * 0.3})`
                                          }}
                                        />
                                      ))}
                                    </div>
                                    
                                    <span className="text-sm font-medium text-gray-600">
                                      Waiting for response...
                                    </span>
                                    
                                    {/* Sparkle effect */}
                                    <div className="text-yellow-400 animate-ping" style={{ animationDuration: '1.5s' }}>
                                      ✨
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="border-t p-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 rounded-lg border-gray-300 focus:border-primary focus:ring-primary text-black"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading || !input.trim()}
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AgentChatPage;

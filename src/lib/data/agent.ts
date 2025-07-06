const APP_ID = "86024fe0-c7fe-44f0-84a5-a87b525fe82e";
const APP_SECRET = "iztXJfKPFndW9nTL/RrMQ0i9rLnrLdEOQXK+flyLdUE=";

export async function sendAgentMessage(agentId: string, userMessage: { text: string; user: string }) {
    const res = await fetch(`https://agents-api.doodles.app/${agentId}/user/message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-mini-app-id": APP_ID, // Replace with your actual app ID
            "x-mini-app-secret": APP_SECRET, // Replace with your actual app secret
        },
        body: JSON.stringify({ text: userMessage.text, user: userMessage.user }),
    });
    return res.json();
}

export async function getAgentMemories(agentId: string) {
    const res = await fetch(`https://agents-api.doodles.app/agents/${agentId}/memories`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "x-mini-app-id": APP_ID,
            "x-mini-app-secret": APP_SECRET,
        },
    });
    if (!res.ok) throw new Error('Failed to fetch agent memories');
    return res.json();
}

export async function deleteAgentMemories(agentId: string) {
    const res = await fetch(`https://agents-api.doodles.app/agents/${agentId}/memories`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "x-mini-app-id": APP_ID,
            "x-mini-app-secret": APP_SECRET,
        },
    });
    if (!res.ok) throw new Error('Failed to delete agent memories');
    return res.json();
} 
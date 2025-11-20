import { API_BASE } from "./constants";
import { useAuthStore } from "./useAuthStore";

export type MessageType = "text" | "image" | "file";

export type Message = {
  message_id: number;
  sender_id: number;
  sender_name?: string;
  body: string;
  type: MessageType;
  sent_at: string;
};

export type ChatMessage = {
  chat_id: number;
  linking_id: number;
  messages: Message[];
  limit: number;
  offset: number;
};

export type WebSocketMessage = {
  type: "connection" | "message" | "message_sent" | "error";
  message?: string;
  chat_id?: number;
  linking_id?: number;
  message_id?: number;
  sender_id?: number;
  sender_name?: string;
  body?: string;
  message_type?: MessageType;
  sent_at?: string;
};

// Fetch chat messages for a specific linking
export const fetchChatMessages = async (
  linkingId: number,
  limit: number = 100,
  offset: number = 0
): Promise<ChatMessage | null> => {
  const accessToken = useAuthStore.getState().accessToken;

  try {
    const response = await fetch(
      `${API_BASE}/chat/messages/${linkingId}?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch messages: ${response.status}`);
    }

    const data: ChatMessage = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return null;
  }
};

// Create WebSocket connection for real-time chat
export const createChatWebSocket = (
  linkingId: number,
  onMessage: (message: WebSocketMessage) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket => {
  const accessToken = useAuthStore.getState().accessToken;

  // Convert http/https to ws/wss
  const wsProtocol = API_BASE.startsWith("https") ? "wss" : "ws";
  const wsBase = API_BASE.replace(/^https?:\/\//, "");
  const wsUrl = `${wsProtocol}://${wsBase}/chat/ws/${linkingId}?token=${accessToken}`;

  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = (event) => {
    console.log("WebSocket closed:", event.code, event.reason);
    if (onClose) {
      onClose(event);
    }
  };

  return ws;
};

// Send a message through WebSocket
export const sendChatMessage = (
  ws: WebSocket,
  body: string,
  type: MessageType = "text"
): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        body,
        type,
      })
    );
  } else {
    console.error("WebSocket is not open. ReadyState:", ws.readyState);
  }
};

// Close WebSocket connection
export const closeChatWebSocket = (ws: WebSocket): void => {
  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close();
  }
};

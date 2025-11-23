import { API_BASE } from "./constants";
import { useAuthStore } from "./useAuthStore";
import { apiFetch } from "./api-fetch";

export type MessageType = "text" | "image" | "file" | "order" | "complaint";

export type StatusChangeEvent = {
  event: "status_change";
  entity: string;
  id: number;
  old_status: string;
  new_status: string;
};

export type Message = {
  message_id: number;
  sender_id: number;
  sender_name?: string;
  body: string;
  type: MessageType;
  sent_at: string;
  event_data?: StatusChangeEvent;
};

export type ChatMessage = {
  chat_id: number;
  linking_id: number;
  messages: Message[];
  limit: number;
  offset: number;
};

export type OrderChatMessage = {
  chat_id: number;
  order_id: number;
  messages: Message[];
  limit: number;
  offset: number;
};

export type WebSocketMessage = {
  type: "connection" | "message" | "message_sent" | "error";
  message?: string;
  chat_id?: number;
  linking_id?: number;
  order_id?: number;
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
  console.log("fetching messages for linkingId:", linkingId, "limit:", limit, "offset:", offset);
  try {
    const response = await apiFetch(
      `${API_BASE}/chat/messages/${linkingId}?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
    // WebSocket errors are typically connection issues, don't log empty objects
    // The actual error details will be in the close event
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = (event) => {
    // Only log non-normal closures
    if (event.code !== 1000 && event.code !== 1001) {
      console.log("WebSocket closed unexpectedly:", event.code, event.reason);
    }
    if (onClose) {
      onClose(event);
    }
  };

  return ws;
};

// Upload a file and get S3 URL
export const uploadChatFile = async (file: File): Promise<string | null> => {
  try {
    // Step 1: Get the S3 upload URL
    const fileExtension = file.name.split(".").pop() || "bin";
    const uploadUrlResponse = await apiFetch(
      `${API_BASE}/uploads/upload-url?ext=${fileExtension}`,
      {
        method: "GET",
        headers: {},
      }
    );

    if (!uploadUrlResponse.ok) {
      let errorMessage = "Failed to get upload URL";
      try {
        const errorData = await uploadUrlResponse.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const uploadUrlData = await uploadUrlResponse.json();
    console.log("Upload URL response:", uploadUrlData);

    const s3PresignedUrl = uploadUrlData.put_url.url;
    if (!s3PresignedUrl) {
      throw new Error("No presigned URL received from server");
    }

    // Step 2: Upload the file to S3
    const { url, fields } = uploadUrlData.put_url;
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append("file", file);
    console.log("Uploading file to S3 with fields:", fields);

    const uploadResponse = await fetch(s3PresignedUrl, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file to S3: ${uploadResponse.status}`);
    }

    // Step 3: Return the final S3 URL
    const finalUrl = uploadUrlData.finalurl;
    console.log("File uploaded successfully:", finalUrl);
    return finalUrl;
  } catch (error) {
    console.error("Failed to upload file:", error);
    return null;
  }
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

// Fetch chat messages for a specific order
export const fetchOrderChatMessages = async (
  orderId: number,
  limit: number = 100,
  offset: number = 0
): Promise<OrderChatMessage | null> => {
  console.log("fetching order messages for orderId:", orderId, "limit:", limit, "offset:", offset);
  try {
    const response = await apiFetch(
      `${API_BASE}/chat/messages/order/${orderId}?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch order messages: ${response.status}`);
    }

    const data: OrderChatMessage = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch order chat messages:", error);
    return null;
  }
};

// Create WebSocket connection for order chat
export const createOrderChatWebSocket = (
  orderId: number,
  onMessage: (message: WebSocketMessage) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket => {
  const accessToken = useAuthStore.getState().accessToken;

  // Convert http/https to ws/wss
  const wsProtocol = API_BASE.startsWith("https") ? "wss" : "ws";
  const wsBase = API_BASE.replace(/^https?:\/\//, "");
  const wsUrl = `${wsProtocol}://${wsBase}/chat/ws/order/${orderId}?token=${accessToken}`;

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
    // WebSocket errors are typically connection issues, don't log empty objects
    // The actual error details will be in the close event
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = (event) => {
    // Only log non-normal closures
    if (event.code !== 1000 && event.code !== 1001) {
      console.log("Order WebSocket closed unexpectedly:", event.code, event.reason);
    }
    if (onClose) {
      onClose(event);
    }
  };

  return ws;
};

"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useOrdersStore, Order } from "@/lib/orders-store";
import { useLinkingsStore, LinkingStatus, fetchCompanyDetails, CompanyDetails } from "@/lib/linkings-store";
import { useCompanyStore } from "@/lib/company-store";
import { useTranslations } from "next-intl";
import { fetchOrderChatMessages, createOrderChatWebSocket, sendChatMessage, closeChatWebSocket, Message, WebSocketMessage, uploadChatFile } from "@/lib/chat-api";
import useAuthStore from "@/lib/useAuthStore";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

type GroupedOrder = {
  order_id: number;
  linking_id: number;
  items: Order[];
  status: Order["order_status"];
  total_price: number;
  created_at: string;
  updated_at: string;
};

function OrdersPage() {
  const orders = useOrdersStore((state) => state.orders);
  const fetchOrders = useOrdersStore((state) => state.fetchOrders);
  const changeOrderStatus = useOrdersStore((state) => state.changeOrderStatus);
  const { linkings, fetchLinkings } = useLinkingsStore();
  const myCompany = useCompanyStore((state) => state.company);
  const getCompanyDetails = useCompanyStore((state) => state.getCompanyDetails);

  const t = useTranslations("Orders");
  const user = useAuthStore((state) => state.user);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [companiesDetails, setCompaniesDetails] = useState<Map<number, CompanyDetails>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Determine if we're a supplier or consumer
  const isSupplier = myCompany.company_type === "supplier";

  useEffect(() => {
    fetchOrders();
    fetchLinkings();
    getCompanyDetails();
  }, [fetchOrders, fetchLinkings, getCompanyDetails]);

  // Get active linkings
  const activeLinkings = linkings.filter((l) => l.status === LinkingStatus.accepted);

  // Fetch company details for all active linkings
  useEffect(() => {
    activeLinkings.forEach(async (linking) => {
      const otherCompanyId = isSupplier ? linking.consumer_company_id : linking.supplier_company_id;
      if (!companiesDetails.has(otherCompanyId)) {
        const data = await fetchCompanyDetails(otherCompanyId);
        if (data) {
          setCompaniesDetails((prev) => new Map(prev).set(otherCompanyId, data));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLinkings, isSupplier]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAttachmentMenu && !(event.target as Element).closest('.relative')) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachmentMenu]);

  // Load order chat messages when chat is opened
  useEffect(() => {
    if (!selectedOrderId || !isChatOpen) {
      setMessages([]);
      if (wsRef.current) {
        closeChatWebSocket(wsRef.current);
        wsRef.current = null;
      }
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      console.log("Calling fetchOrderChatMessages with orderId:", selectedOrderId);
      try {
        const data = await fetchOrderChatMessages(selectedOrderId);
        console.log("Received order chat data:", data);
        if (data && data.messages) {
          // Parse event_data for order and complaint (status_change) messages
          const parsedMessages = data.messages.map((msg) => {
            if (msg.type === "order" || msg.type === "complaint") {
              try {
                return { ...msg, event_data: JSON.parse(msg.body) };
              } catch (e) {
                console.error("Failed to parse event_data:", e);
                return msg;
              }
            }
            return msg;
          });
          // Sort messages by timestamp to ensure chronological order
          const sortedMessages = parsedMessages.sort((a, b) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          );
          setMessages(sortedMessages);
        }
      } catch (error: any) {
        // If 403, user doesn't have permission - silently fail
        if (error.status === 403 || error.message?.includes('403')) {
          console.log("No permission to view this order chat");
        } else {
          console.error("Failed to load order messages:", error);
        }
      }
      setIsLoadingMessages(false);
    };

    loadMessages();

    // Set up WebSocket connection
    const ws = createOrderChatWebSocket(
      selectedOrderId,
      (message: WebSocketMessage) => {
        console.log("WebSocket message received:", message);
        if (message.type === "message" && message.message_id && message.sender_id && message.body && message.sent_at) {
          const newMessage: Message = {
            message_id: message.message_id,
            sender_id: message.sender_id,
            sender_name: message.sender_name,
            body: message.body,
            type: message.message_type || "text",
            sent_at: message.sent_at,
          };

          // Parse event_data if it's an order or complaint (status_change) message
          if (newMessage.type === "order" || newMessage.type === "complaint") {
            try {
              newMessage.event_data = JSON.parse(newMessage.body);
            } catch (e) {
              console.error("Failed to parse event_data:", e);
            }
          }

          setMessages((prev) => {
            const updated = [...prev, newMessage];
            // Sort to ensure chronological order
            return updated.sort((a, b) =>
              new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
            );
          });
        }
      },
      (error) => {
        console.error("Order WebSocket error:", error);
      },
      (event) => {
        console.log("Order WebSocket closed:", event);
      }
    );

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        closeChatWebSocket(wsRef.current);
        wsRef.current = null;
      }
    };
  }, [selectedOrderId, isChatOpen]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !wsRef.current) return;

    // Optimistic update
    const tempMessage: Message = {
      message_id: Date.now(),
      sender_id: user?.user_id || 0,
      sender_name: user ? `${user.first_name} ${user.last_name}` : "You",
      body: messageInput,
      type: "text",
      sent_at: new Date().toISOString(),
    };
    setMessages((prev) => {
      const updated = [...prev, tempMessage];
      // Sort to ensure chronological order
      return updated.sort((a, b) =>
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );
    });

    sendChatMessage(wsRef.current, messageInput);
    setMessageInput("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert(t("chat.microphone_error"));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    if (!wsRef.current) return;

    setIsUploadingFile(true);
    try {
      // Create a File object from the Blob
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

      // Upload file and get S3 URL
      const audioUrl = await uploadChatFile(audioFile);

      if (audioUrl) {
        // Send message with audio type
        sendChatMessage(wsRef.current, audioUrl, "audio");

        // Add optimistic message to UI
        const optimisticMessage: Message = {
          message_id: Date.now(),
          sender_id: user?.user_id || 0,
          sender_name: user ? `${user.first_name} ${user.last_name}` : "You",
          body: audioUrl,
          type: "audio",
          sent_at: new Date().toISOString(),
        };
        setMessages((prev) => {
          const updated = [...prev, optimisticMessage];
          return updated.sort((a, b) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          );
        });
      } else {
        alert(t("chat.failed_upload"));
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert(t("chat.failed_upload"));
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, messageType: "file" | "image") => {
    const file = e.target.files?.[0];
    if (!file || !wsRef.current) return;

    setIsUploadingFile(true);
    setShowAttachmentMenu(false);
    try {
      // Upload file and get S3 URL
      const fileUrl = await uploadChatFile(file);

      if (fileUrl) {
        // For images, just send the URL; for files, send URL + filename as JSON
        const messageBody = messageType === "image"
          ? fileUrl
          : JSON.stringify({
            url: fileUrl,
            filename: file.name
          });

        // Send message with appropriate type
        sendChatMessage(wsRef.current, messageBody, messageType);

        // Add optimistic message to UI
        const optimisticMessage: Message = {
          message_id: Date.now(),
          sender_id: user?.user_id || 0,
          sender_name: user ? `${user.first_name} ${user.last_name}` : "You",
          body: messageBody,
          type: messageType,
          sent_at: new Date().toISOString(),
        };
        setMessages((prev) => {
          const updated = [...prev, optimisticMessage];
          return updated.sort((a, b) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          );
        });
      } else {
        alert(t("chat.failed_upload"));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(t("chat.failed_upload"));
    } finally {
      setIsUploadingFile(false);
      // Reset file inputs
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatusChange = (event: any) => {
    if (event.entity === "complaint") {
      if (event.old_status == null) {
        return t("chat.complaint.created");
      }

      return t("chat.complaint.updated_from", {
        oldStatus: t(`chat.complaint.status.${event.old_status}`),
        newStatus: t(`chat.complaint.status.${event.new_status}`),
      });
    }

    const id = event.id || "";
    const oldStatus = event.old_status || "";
    const newStatus = event.new_status || "";

    return t("chat.status_change.order_status_changed", {
      oldStatus: t(`status.${oldStatus}`),
      newStatus: t(`status.${newStatus}`),
      id,
    });
  };

  // Group orders by order_id first, then by linking_id
  const groupedOrders = useMemo(() => {
    const grouped = new Map<number, GroupedOrder>();

    orders.forEach((order) => {
      if (!grouped.has(order.order_id)) {
        grouped.set(order.order_id, {
          order_id: order.order_id,
          linking_id: order.linking_id,
          items: [],
          status: order.order_status,
          total_price: order.order_total_price,
          created_at: order.order_created_at,
          updated_at: order.order_updated_at,
        });
      }
      grouped.get(order.order_id)!.items.push(order);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders]);

  // Group orders by linking
  const ordersByLinking = useMemo(() => {
    const byLinking = new Map<number, GroupedOrder[]>();

    groupedOrders.forEach((order) => {
      const linkingId = order.linking_id;
      if (!byLinking.has(linkingId)) {
        byLinking.set(linkingId, []);
      }
      byLinking.get(linkingId)!.push(order);
    });

    return byLinking;
  }, [groupedOrders]);

  const selectedOrder = groupedOrders.find((o) => o.order_id === selectedOrderId);

  const getStatusColor = (status: Order["order_status"]) => {
    switch (status) {
      case "created":
        return "bg-gray-600";
      case "processing":
        return "bg-yellow-600";
      case "shipping":
        return "bg-blue-600";
      case "completed":
        return "bg-green-600";
      case "rejected":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Orders List */}
      <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-white">{t("title")}</h2>
          <p className="text-sm text-gray-400 mt-1">{groupedOrders.length} {t("total_orders")}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groupedOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center p-4">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>{t("no_orders_found")}</p>
              </div>
            </div>
          ) : (
            Array.from(ordersByLinking.entries()).map(([linkingId, orders]) => {
              const linking = activeLinkings.find((l) => l.linking_id === linkingId);
              const otherCompanyId = isSupplier ? linking?.consumer_company_id : linking?.supplier_company_id;
              const companyDetails = otherCompanyId ? companiesDetails.get(otherCompanyId) : null;
              const companyName = companyDetails?.name || `Company #${otherCompanyId || linkingId}`;

              return (
                <div key={linkingId}>
                  {/* Company Header */}
                  <div className="sticky top-0 bg-[#252525] border-b border-[#2a2a2a] px-4 py-3 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(companyName)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{companyName}</h3>
                        <p className="text-xs text-gray-400">{orders.length} {orders.length === 1 ? t("order_list.order") : t("order_list.orders")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Orders in this linking */}
                  {orders.map((order) => (
                    <div
                      key={order.order_id}
                      onClick={() => setSelectedOrderId(order.order_id)}
                      className={`p-4 cursor-pointer transition-colors border-b border-[#2a2a2a] ${selectedOrderId === order.order_id
                        ? "bg-[#2a2a2a]"
                        : "hover:bg-[#222222]"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">
                          {t("order")} #{order.order_id}
                        </h3>
                        <span className={`${getStatusColor(order.status)} text-white text-xs px-2 py-1 rounded capitalize`}>
                          {t(`status.${order.status || "created"}`)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{order.items.length} {t("items")}</span>
                        <span className="font-semibold text-white">{order.total_price != null ? order.total_price.toFixed(2) : "0.00"}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Side - Order Details and Chat */}
      <div className="flex-1 bg-[#0a0a0a] flex overflow-hidden">
        {selectedOrder && (
          <>
            {/* Order Details Container */}
            <div className={`${isChatOpen ? 'flex-1' : 'flex-1'} flex flex-col`}>
              {/* Order Header */}
              <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] p-6">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-white">
                    {t("order")} #{selectedOrder.order_id}
                  </h1>
                  <div className="flex items-center gap-3">
                    {/* Chat Toggle Button */}
                    <button
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isChatOpen
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                        }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      {isChatOpen ? t("chat.hide_chat") : t("chat.show_chat")}
                    </button>
                    {/* change status */}
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => changeOrderStatus(selectedOrder.order_id, e.target.value as Order["order_status"])}
                      className={`${getStatusColor(selectedOrder.status)} text-white text-sm px-3 py-1.5 rounded-lg capitalize font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="created">{t("status.created")}</option>
                      <option value="processing">{t("status.processing")}</option>
                      <option value="shipping">{t("status.shipping")}</option>
                      <option value="completed">{t("status.completed")}</option>
                      <option value="rejected">{t("status.rejected")}</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>{selectedOrder.items.length} {t("items")}</span>
                  <span>•</span>
                  <span>{t("total")}: {selectedOrder.total_price.toFixed(2)}</span>
                  <span>•</span>
                  <span>{formatDate(selectedOrder.created_at)}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.product_id}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 flex gap-4"
                    >
                      {/* Product Image */}
                      <div className="shrink-0">
                        {item.product_picture_url ? (
                          <img
                            src={item.product_picture_url}
                            alt={item.product_name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {item.product_description}
                        </p>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-400">{t("info.quantity")}:</span>
                            <span className="text-white ml-2 font-semibold">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">{t("info.unit_price")}:</span>
                            <span className="text-white ml-2 font-semibold">
                              {item.price.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">{t("info.id")}:</span>
                            <span className="text-white ml-2">
                              #{item.product_id}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">{t("info.item_total")}:</span>
                            <span className="text-white ml-2 font-semibold">
                              {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{t("summary.order_summary")}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg mb-2">
                      <span className="text-white font-semibold">{t("total")}:</span>
                      <span className="text-white font-bold">
                        {selectedOrder.total_price.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-[#2a2a2a] pt-3 mt-3">
                      <div className="text-sm text-gray-400">
                        <div className="flex justify-between mb-1">
                          <span>{t("summary.created")}:</span>
                          <span className="text-gray-300">{formatDate(selectedOrder.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("summary.last_updated")}:</span>
                          <span className="text-gray-300">{formatDate(selectedOrder.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Sidebar */}
            {isChatOpen && selectedOrderId && (
              <div className="w-96 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{t("chat.order_chat")}</h3>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="cursor-pointer text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">{t("chat.loading_messages")}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-center text-sm">
                        {t("chat.no_messages_yet")}
                      </p>
                    </div>
                  ) : (
                    <PhotoProvider>
                      {messages.map((message) => {
                        // Order and complaint status change messages are displayed as announcements
                        if (message.type === "order" || message.type === "complaint") {
                          return (
                            <div key={message.message_id} className="flex justify-center my-4">
                              <div className="max-w-lg px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-300 text-center">
                                  {formatStatusChange(message.event_data)}
                                </p>
                                <p className="text-xs text-gray-500 text-center mt-1">
                                  {formatMessageTime(message.sent_at)}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // Regular messages
                        const isMyMessage = message.sender_id === user?.user_id;
                        const isFileMessage = message.type === "file";
                        const isImageMessage = message.type === "image";
                        const isAudioMessage = message.type === "audio";

                        // Parse file message to extract URL and filename
                        let fileUrl = message.body;
                        let fileName = 'file';

                        if (isFileMessage) {
                          try {
                            const fileData = JSON.parse(message.body);
                            fileUrl = fileData.url;
                            fileName = fileData.filename;
                          } catch {
                            // Fallback for old format (just URL)
                            fileUrl = message.body;
                            fileName = message.body.split('/').pop() || 'file';
                          }
                        }

                        return (
                          <div
                            key={message.message_id}
                            className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                          >
                            {isImageMessage ? (
                              <div className="max-w-xs">
                                {!isMyMessage && message.sender_name && (
                                  <p className="text-xs font-semibold mb-1 text-gray-300">
                                    {message.sender_name}
                                  </p>
                                )}
                                <PhotoView src={message.body}>
                                  <img
                                    src={message.body}
                                    alt="Shared image"
                                    className="max-h-64 rounded-lg cursor-pointer"
                                  />
                                </PhotoView>
                                <p className="text-xs mt-1 text-gray-500">
                                  {formatMessageTime(message.sent_at)}
                                </p>
                              </div>
                            ) : isAudioMessage ? (
                              <div className="max-w-sm">
                                {!isMyMessage && message.sender_name && (
                                  <p className="text-xs font-semibold mb-1 text-gray-300">
                                    {message.sender_name}
                                  </p>
                                )}
                                <div
                                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isMyMessage
                                    ? "bg-blue-600"
                                    : "bg-[#2a2a2a]"
                                    }`}
                                >
                                  <svg
                                    className={`w-6 h-6 shrink-0 ${isMyMessage ? "text-white" : "text-blue-400"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                    />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <audio
                                      controls
                                      src={message.body}
                                      className="w-full"
                                      style={{
                                        height: '36px',
                                        filter: isMyMessage ? 'invert(1) brightness(2)' : 'invert(0.9)'
                                      }}
                                    />
                                  </div>
                                </div>
                                <p
                                  className={`text-xs mt-1 ${isMyMessage ? "text-gray-400" : "text-gray-500"}`}
                                >
                                  {formatMessageTime(message.sent_at)}
                                </p>
                              </div>
                            ) : (
                              <div
                                className={`max-w-[70%] px-3 py-2 rounded-2xl wrap-break-word ${isMyMessage
                                  ? "bg-blue-600 text-white"
                                  : "bg-[#2a2a2a] text-white"
                                  }`}
                              >
                                {!isMyMessage && message.sender_name && (
                                  <p className="text-xs font-semibold mb-1 text-gray-300">
                                    {message.sender_name}
                                  </p>
                                )}
                                {isFileMessage ? (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm hover:underline"
                                  >
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="break-all">{fileName}</span>
                                  </a>
                                ) : (
                                  <p className="text-sm wrap-break-word">{message.body}</p>
                                )}
                                <p
                                  className={`text-xs mt-1 ${isMyMessage ? "text-blue-200" : "text-gray-500"
                                    }`}
                                >
                                  {formatMessageTime(message.sent_at)}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </PhotoProvider>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-[#2a2a2a]">
                  <div className="flex gap-2 relative">
                    {/* Hidden file inputs */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e, "file")}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, "image")}
                      className="hidden"
                    />

                    {/* Attachment button with dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        disabled={isUploadingFile}
                        className="cursor-pointer px-3 py-2 bg-[#2a2a2a] border border-gray-700 text-white rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t("chat.attach_file_or_image")}
                      >
                        {isUploadingFile ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        )}
                      </button>

                      {/* Attachment menu */}
                      {showAttachmentMenu && (
                        <div className="absolute bottom-full mb-2 left-0 bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                          <button
                            onClick={() => {
                              imageInputRef.current?.click();
                              setShowAttachmentMenu(false);
                            }}
                            className="flex cursor-pointer items-center gap-3 px-4 py-3 w-full hover:bg-[#3a3a3a] text-white transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm">{t("chat.image")}</span>
                          </button>
                          <button
                            onClick={() => {
                              fileInputRef.current?.click();
                              setShowAttachmentMenu(false);
                            }}
                            className="flex cursor-pointer items-center gap-3 px-4 py-3 w-full hover:bg-[#3a3a3a] text-white transition-colors border-t border-gray-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm">{t("chat.file")}</span>
                          </button>
                          <button
                            onClick={() => {
                              startRecording();
                              setShowAttachmentMenu(false);
                            }}
                            className="flex cursor-pointer items-center gap-3 px-4 py-3 w-full hover:bg-[#3a3a3a] text-white transition-colors border-t border-gray-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-sm">{t("chat.voice")}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Recording indicator */}
                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="cursor-pointer px-4 py-2 bg-red-600 border border-red-700 text-white rounded-lg hover:bg-red-700 transition-colors animate-pulse"
                        title={t("chat.stop_recording")}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                      </button>
                    )}

                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={t("chat.type_your_message")}
                      className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isUploadingFile}
                      className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("chat.send")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedOrder && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg">{t("select_order_to_view_details")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
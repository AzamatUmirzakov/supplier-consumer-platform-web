"use client";
import { useState, useEffect, useRef } from "react";
import { useLinkingsStore, LinkingStatus, fetchCompanyDetails, CompanyDetails, Linking } from "@/lib/linkings-store";
import { fetchChatMessages, createChatWebSocket, sendChatMessage, closeChatWebSocket, Message, WebSocketMessage, StatusChangeEvent, uploadChatFile } from "@/lib/chat-api";
import { useCompanyStore } from "@/lib/company-store";
import useAuthStore from "@/lib/useAuthStore";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

type ChatCompany = {
  company_id: number;
  name: string;
  logo_url?: string;
  linking_id: number;
};

function ChatPage() {
  const { linkings, fetchLinkings } = useLinkingsStore();
  const user = useAuthStore((state) => state.user);
  const myCompany = useCompanyStore((state) => state.company);
  const getCompanyDetails = useCompanyStore((state) => state.getCompanyDetails);
  const [selectedLinkingId, setSelectedLinkingId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [companiesDetails, setCompaniesDetails] = useState<Map<number, CompanyDetails>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Determine if we're a supplier or consumer
  const isSupplier = myCompany.company_type === "supplier";

  useEffect(() => {
    fetchLinkings();
    getCompanyDetails(); // Fetch our own company details
  }, [fetchLinkings, getCompanyDetails]);

  // Get active linkings (accepted status) where current user participates
  const activeLinkings = linkings.filter((l) =>
    l.status === LinkingStatus.accepted &&
    l.responded_by_user_id === user?.user_id
  );

  useEffect(() => {
    activeLinkings.forEach(async (linking) => {
      // Fetch the other company's details based on our company type
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

  // Create chat list from active linkings
  const chatCompanies: ChatCompany[] = activeLinkings
    .map((linking) => {
      // Get the other company based on our type
      const otherCompanyId = isSupplier ? linking.consumer_company_id : linking.supplier_company_id;
      const company = companiesDetails.get(otherCompanyId);
      if (!company) return null;
      return {
        company_id: company.company_id,
        name: company.name,
        logo_url: company.logo_url,
        linking_id: linking.linking_id,
      } as ChatCompany;
    })
    .filter((c): c is ChatCompany => c !== null)
    .filter((company) =>
      company && company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const selectedLinking = activeLinkings.find((l) => l.linking_id === selectedLinkingId);
  const selectedCompany = selectedLinking
    ? companiesDetails.get(isSupplier ? selectedLinking.consumer_company_id : selectedLinking.supplier_company_id)
    : null;

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

  // Load messages when a chat is selected
  useEffect(() => {
    console.log("Chat load effect triggered, selectedLinkingId:", selectedLinkingId);
    if (!selectedLinkingId) {
      setMessages([]);
      return;
    }

    console.log("Calling fetchChatMessages for linking:", selectedLinkingId);
    setIsLoadingMessages(true);
    fetchChatMessages(selectedLinkingId)
      .then((data) => {
        console.log("Received chat data:", data);
        if (data) {
          // Sort messages by timestamp to ensure chronological order
          const sortedMessages = [...data.messages].sort((a, b) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          );
          setMessages(sortedMessages);
        }
      })
      .catch((error) => {
        // If 403, user doesn't have permission - silently fail
        if (error.status === 403 || error.message?.includes('403')) {
          console.log("No permission to view this chat");
        } else {
          console.error("Failed to load messages:", error);
        }
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [selectedLinkingId]);

  // WebSocket connection
  useEffect(() => {
    if (!selectedLinkingId) {
      if (wsRef.current) {
        closeChatWebSocket(wsRef.current);
        wsRef.current = null;
      }
      return;
    }

    // Create WebSocket connection
    const ws = createChatWebSocket(
      selectedLinkingId,
      (message: WebSocketMessage) => {
        if (message.type === "message") {
          // New message from other user
          const newMessage: Message = {
            message_id: message.message_id!,
            sender_id: message.sender_id!,
            sender_name: message.sender_name,
            body: message.body!,
            type: message.message_type || "text",
            sent_at: message.sent_at!,
          };
          setMessages((prev) => {
            const updated = [...prev, newMessage];
            // Sort to ensure chronological order
            return updated.sort((a, b) =>
              new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
            );
          });
        } else if (message.type === "message_sent") {
          // Our message was sent successfully
          console.log("Message sent successfully:", message.message_id);
        } else if (message.type === "error") {
          console.error("Chat error:", message.message);
        }
      },
      (error) => {
        console.error("WebSocket error:", error);
      },
      (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
      }
    );

    wsRef.current = ws;

    // Cleanup on unmount or when changing chats
    return () => {
      if (wsRef.current) {
        closeChatWebSocket(wsRef.current);
        wsRef.current = null;
      }
    };
  }, [selectedLinkingId]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !wsRef.current) return;

    // Add optimistic message to UI
    const optimisticMessage: Message = {
      message_id: Date.now(), // Temporary ID
      sender_id: user?.user_id || 0,
      sender_name: user ? `${user.first_name} ${user.last_name}` : "You",
      body: messageInput,
      type: "text",
      sent_at: new Date().toISOString(),
    };
    setMessages((prev) => {
      const updated = [...prev, optimisticMessage];
      // Sort to ensure chronological order
      return updated.sort((a, b) =>
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );
    });

    // Send through WebSocket
    sendChatMessage(wsRef.current, messageInput, "text");
    setMessageInput("");
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
        alert("Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  console.log("Messages:", messages);
  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Chats Sidebar */}
      <div className="w-80 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Messages</h2>
          <div className="mt-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {chatCompanies.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? "No chats found" : "No chats"}
            </div>
          ) : (
            chatCompanies.map((company) => (
              <div
                key={company.company_id}
                onClick={() => setSelectedLinkingId(company.linking_id)}
                className={`p-4 border-b border-gray-800 cursor-pointer transition-colors ${selectedLinkingId === company.linking_id
                  ? "bg-[#2a2a2a]"
                  : "hover:bg-[#1f1f1f]"
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {getInitials(company.name)}
                    </div>
                  )}

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      Click to start chatting
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedLinkingId && selectedCompany ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-[#1a1a1a] border-b border-gray-800">
              <div className="flex items-center gap-3">
                {selectedCompany.logo_url ? (
                  <img
                    src={selectedCompany.logo_url}
                    alt={selectedCompany.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(selectedCompany.name)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">
                    {selectedCompany.name}
                  </h3>
                  <p className="text-xs text-green-500">● Online</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <PhotoProvider>
                  {messages.map((message) => {
                    const isMyMessage = message.sender_id === user?.user_id;
                    const isFileMessage = message.type === "file";
                    const isImageMessage = message.type === "image";

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
                        ) : (
                          <div
                            className={`max-w-md px-4 py-2 rounded-2xl wrap-break-word ${isMyMessage
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
            <div className="p-4 bg-[#1a1a1a] border-t border-gray-800">
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
                    className="px-4 py-3 bg-[#2a2a2a] border border-gray-700 text-white rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Attach file or image"
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
                        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[#3a3a3a] text-white transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Image</span>
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[#3a3a3a] text-white transition-colors border-t border-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">File</span>
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isUploadingFile}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
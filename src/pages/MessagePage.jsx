import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Button, Spinner } from "@nextui-org/react";
import { useMCAuth } from "../lib/mconnect/hooks/useMCAuth";
import { mutualAPI } from "../api/mutual";
import { BACKEND_URL } from "../config";
import { cnm } from "../utils/style";
import RandomAvatar from "../components/ui/RandomAvatar";
import { Menu, Search, Send, X } from "lucide-react";

export default function MessagePage() {
  const { user } = useMCAuth();
  const [socket, setSocket] = useState(null);
  const [otherUserId, setOtherUserId] = useState(null);
  const [messages, setMessages] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);

  const {
    data: messagesHistory,
    isLoading: isMessageHistoryLoading,
    mutate: mutateMessageHistory,
  } = useSWR(
    user && otherUserId && `/messaging/history/${user.id}/${otherUserId}`,
    async (url) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return mutualAPI
        .get(`${url}?timezone=${timezone}`)
        .then((res) => res.data);
    }
  );

  const {
    data: receiverDetail,
    isLoading: isReceiverDetailLoading,
    mutate: mutateOtherUserDetails,
  } = useSWR(
    otherUserId && `/messaging/user-details/${otherUserId}`,
    async (url) => {
      return mutualAPI.get(url).then((res) => res.data);
    }
  );

  const {
    data: conversations,
    isLoading: isConversationsLoading,
    mutate: mutateConversations,
  } = useSWR(user && `/messaging/conversations/${user.id}`, async (url) => {
    return mutualAPI.get(url).then((res) => res.data);
  });

  console.log("MESSAGE HISTORY", {
    messagesHistory,
  });

  useEffect(() => {
    if (!messagesHistory) return;
    setMessages(messagesHistory);
  }, [messagesHistory]);

  useEffect(() => {
    if (!user) return;
    const socket = io(`${BACKEND_URL}`);
    setSocket(socket);
    return () => {
      socket.disconnect();
    };
  }, [user, otherUserId]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("connect", () => {
      socket.emit("register", user.id);
      setSocketConnected(true);
    });

    socket.on("error", (error) => {
      setSocketError(error);
    });

    socket.on("userStatusChange", () => {
      mutateOtherUserDetails();
    });

    socket.on("direct-message", (message) => {
      if (otherUserId === message.senderId || message.senderId === user.id) {
        setMessages((prevMessages) => {
          const day = dayjs(message.timestamp).format("YYYY-MM-DD");
          const updatedMessages = [...prevMessages];
          const existingDayIndex = updatedMessages.findIndex(
            ([date]) => date === day
          );
          if (existingDayIndex !== -1) {
            updatedMessages[existingDayIndex][1].push(message);
          } else {
            updatedMessages.push([day, [message]]);
          }
          return updatedMessages;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [socket, user, otherUserId]);

  function selectConversation(conversation) {
    setOtherUserId(conversation.userId);
    mutateMessageHistory();
  }

  function sendMessage(newMessage) {
    if (!otherUserId) {
      return toast.error("Select a user");
    }

    if (!newMessage) {
      return toast.error("Please enter a message or select a user");
    }

    socket.emit("direct-message", {
      senderId: user.id,
      receiverId: otherUserId,
      text: newMessage,
    });

    mutateConversations();
  }

  if (!socketConnected) {
    return (
      <div className="h-full overflow-y-auto w-full flex items-center justify-center">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  if (socketError) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-neutral-500">
            Can&apos;t connect to message service, please try again
          </p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }

  console.log({ conversations, receiverDetail, messages });

  return (
    <>
      <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5">
        <div className="w-full max-w-5xl flex flex-col py-20">
          <SidebarSlideMobile
            conversations={conversations}
            selectConversation={selectConversation}
            otherUserId={otherUserId}
          />
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 h-full">
            {/* Sidebar */}
            <div
              className={cnm(
                "p-6 border rounded-2xl bg-white w-full max-w-[200px] xl:max-w-sm hidden lg:flex h-[500px] overflow-y-auto"
              )}
            >
              {!conversations || conversations.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-center text-neutral-500">
                    No conversation yet
                  </p>
                </div>
              ) : (
                <div className="w-full">
                  <p className="font-medium text-3xl">Messages</p>
                  <div className="mt-6 flex flex-col gap-2 w-full">
                    {/* Message */}
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cnm(
                          "p-4 rounded-xl cursor-pointer w-full",
                          conversation.userId === otherUserId
                            ? "bg-neutral-100"
                            : "hover:bg-neutral-100"
                        )}
                        onClick={() => selectConversation(conversation)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="size-10 bg-neutral-200 rounded-full">
                            <RandomAvatar
                              seed={conversation.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{conversation.name}</p>
                            <div className="flex items-center text-sm text-neutral-400">
                              {conversation.lastMessage}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Message Box */}
            <div className="p-6 border rounded-2xl bg-white w-full lg:w-auto lg:flex-1 lg:ml-6">
              {isMessageHistoryLoading || isReceiverDetailLoading ? (
                <div className="w-full h-[450px] flex items-center justify-center">
                  <Spinner size="md" color="primary" />
                </div>
              ) : (
                <>
                  {receiverDetail ? (
                    <div className="w-full">
                      <div className="w-full flex items-center justify-between">
                        <div className="flex gap-4">
                          <div className="size-10 bg-neutral-200 rounded-full">
                            <RandomAvatar
                              seed={receiverDetail?.name || ""}
                              className="w-full h-full"
                            />
                          </div>
                          <div>
                            <p className="font-medium">
                              {receiverDetail?.name || ""}
                            </p>
                            {receiverDetail?.messaging.status === "ONLINE" ? (
                              <div className="flex items-center gap-1 text-sm text-neutral-400">
                                <span className="size-2 bg-green-700 rounded-full"></span>
                                <p>Active Now</p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-sm text-neutral-400">
                                <span className="size-2 bg-red-700 rounded-full"></span>
                                <p>Offline</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Call and search */}
                        <div className="flex items-center gap-4">
                          {/* <button className="size-8 bg-green-700 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </button> */}
                          {/* <button className="size-8 bg-neutral-200 rounded-full flex items-center justify-center">
                            <Search className="w-4 h-4 text-black" />
                          </button> */}
                        </div>
                      </div>
                      {/* Message chat */}
                      <MessageChat
                        messages={messages}
                        sendMessage={sendMessage}
                        isLoading={isMessageHistoryLoading}
                        userId={user.id}
                      />{" "}
                      *
                    </div>
                  ) : (
                    <div className="w-full h-[450px] flex items-center justify-center">
                      <p className="text-center text-neutral-500">
                        Select a message to view
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SidebarSlideMobile({
  conversations,
  selectConversation,
  otherUserId,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="z-50 p-2 bg-orangy text-white rounded-full flex lg:hidden mb-4 relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-full w-4/5 bg-white z-40 px-5 pt-44 pb-5"
      >
        <div className="pt-5 bg-white w-full h-full">
          <p className="font-medium text-3xl">Messages</p>
          <div className="mt-6 flex flex-col">
            {/* Conversation List */}
            {!conversations || conversations?.length === 0 ? (
              <div className="w-full h-[400px] flex items-center justify-center">
                <p className="text-center text-neutral-500">
                  No conversation yet
                </p>
              </div>
            ) : (
              conversations?.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cnm(
                    "p-4 rounded-xl cursor-pointer",
                    otherUserId === conversation.userId
                      ? "bg-neutral-100"
                      : "hover:bg-neutral-200"
                  )}
                  onClick={() => {
                    selectConversation(conversation);
                    toggleSidebar(); // Close sidebar after selecting a conversation
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-neutral-200 rounded-full">
                      <RandomAvatar
                        seed={conversation.name}
                        className="w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{conversation.name}</p>
                      <div className="flex items-center text-sm text-neutral-400">
                        {conversation.lastMessage}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MessageChat({ sendMessage, messages, isLoading, userId }) {
  const chatEndRef = useRef(null); // Reference to the bottom of the chat container

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="mt-4 rounded-2xl bg-creamy-300 h-[412px] relative overflow-hidden">
      {isLoading || typeof messages === "undefined" ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="md" color="primary" />
        </div>
      ) : !messages || messages.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-center text-neutral-500">No messages yet</p>
        </div>
      ) : (
        <div
          ref={chatEndRef}
          className="flex flex-col p-4 overflow-y-auto size-full max-h-[412px]"
        >
          <div className="pb-14 w-full flex flex-col">
            {/* Loop through the messages grouped by date */}
            {messages.map(([date, dayMessages]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, translateY: 50 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <p className="text-center text-sm text-neutral-500 mb-4">
                  {dayjs(date).format("YYYY-MM-DD")}
                </p>
                {dayMessages.map((msg) => (
                  <div key={msg.sentAt} className="py-2 w-full flex">
                    <div
                      className={cnm(
                        "flex items-end gap-2",
                        msg.role === "you"
                          ? "ml-auto flex-row-reverse"
                          : "mr-auto"
                      )}
                    >
                      <div className="size-6 rounded-full overflow-hidden">
                        <RandomAvatar
                          seed={msg.role === "you" ? userId : msg.senderId}
                          className="w-full h-full"
                        />
                      </div>
                      <div
                        className={cnm(
                          "chat-bubble px-4 py-2 rounded-lg text-sm",
                          msg.role === "you"
                            ? " border border-orangy/50 text-neutral-600"
                            : "bg-neutral-200"
                        )}
                      >
                        {msg.text}
                      </div>
                      <p className="text-xs text-neutral-400">
                        {dayjs(msg.timestamp).format("HH:mm")}{" "}
                        {/* Message time */}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      <div className="absolute w-[calc(100%-10px)] bottom-0 left-0 h-24 bg-gradient-to-t from-creamy-300 to-transparent"></div>

      {/* Input box for sending new messages */}
      <MessageInput sendMessage={sendMessage} />
    </div>
  );
}

function MessageInput({ sendMessage }) {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    sendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="flex gap-4 bg-white border rounded-xl items-center pr-4 h-12 focus-within:border-orangy/50">
        <input
          type="text"
          placeholder="Enter your message here"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 py-2 bg-transparent placeholder:text-sm outline-none px-4"
        />
        <button onClick={handleSend}>
          <Send className="size-6 text-orangy" />
        </button>
      </div>
    </div>
  );
}

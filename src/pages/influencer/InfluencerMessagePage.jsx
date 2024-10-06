import { Phone, Search, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cnm } from "../../utils/style";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../../config";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useMCAuth } from "../../lib/mconnect/hooks/useMCAuth";
import { mutualAPI } from "../../api/mutual";
import dayjs from "dayjs";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Spinner } from "@nextui-org/react";
import RandomAvatar from "../../components/ui/RandomAvatar";
import { set } from "@coral-xyz/anchor/dist/cjs/utils/features";

export default function InfluencerMessagePage() {
  const [newMessage, setNewMessage] = useState("");
  const { user } = useMCAuth();
  const [socket, setSocket] = useState(null);
  const [selectedMessageUserId, setSelectedMessageUserId] = useState(null);
  const [selectedMessageConversationId, setSelectedMessageConversationId] =
    useState(null);

  console.log({ user });

  const [messages, setMessages] = useState([]);

  const {
    data: messagesHistory,
    isLoading,
    mutate,
  } = useSWR(
    user && selectedMessageUserId
      ? `/messages/conversation/${user.id}/${selectedMessageUserId}?timezone=UTC`
      : null,
    async (url) => {
      const { data } = await mutualAPI.get(url);
      return data;
    }
  );

  useEffect(() => {
    if (!messagesHistory) return;

    setMessages((prev) => ({
      ...prev,
      ...messagesHistory,
    }));
  }, [messagesHistory]);

  const { data: conversations, mutate: mutateConversations } = useSWR(
    user ? `/messages/conversations/${user.id}` : null,
    async (url) => {
      const { data } = await mutualAPI.get(url);
      return data;
    }
  );

  const { data: conversationDetail } = useSWR(
    selectedMessageConversationId
      ? `/messages/conversation-detail/${selectedMessageConversationId}`
      : null,
    async (url) => {
      console.log({ url });
      const { data } = await mutualAPI.get(url);
      return data;
    }
  );

  const {
    data: otherUserDetail,
    isLoading: otherUserDetailLoading,
    mutate: mutateOtherUserDetails,
  } = useSWR(
    selectedMessageUserId
      ? `/messages/other-user-details/${selectedMessageUserId}`
      : null,
    async (url) => {
      console.log({ url });
      const { data } = await mutualAPI.get(url);
      return data;
    }
  );

  console.log({ conversations });
  console.log({ conversationDetail });

  useEffect(() => {
    if (!user) return;
    const socket = io(`${BACKEND_URL}`);
    setSocket(socket);
    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("connect", () => {
      socket.emit("join", { userId: user.id });
      toast.success("Connected to server");
    });

    socket.on("userStatusChange", () => {
      console.log("userStatusChange");
      mutateOtherUserDetails();
    });

    socket.on("personal-message", (data) => {
      // TODO implement conversation filtering
      // if (
      //   (data.senderId === selectedMessageUserId &&
      //     data.receiverId === user.id) ||
      //   (data.receiverId === selectedMessageUserId && data.senderId === user.id)
      // ) {
      const optimisticMessage = {
        id: Date.now(),
        content: data.content,
        senderId: data.senderId,
        receiverId: data.receiverId,
        role: "other",
        sentAt: new Date().toISOString(),
      };

      setMessages((currentMessages) => ({
        ...currentMessages,
        [dayjs().format("YYYY-MM-DD")]: [
          ...(currentMessages?.[dayjs().format("YYYY-MM-DD")] || []),
          optimisticMessage,
        ],
      }));
      mutateConversations();
      // } else {
      //   mutateConversations();
      // }
    });

    return () => {
      socket.disconnect();
    };
  }, [socket, user]);

  function sendMessage() {
    console.log({ newMessage });
    if (!newMessage || !selectedMessageUserId) return;

    const optimisticMessage = {
      id: Date.now(),
      content: newMessage,
      senderId: user.id,
      receiverId: selectedMessageUserId,
      role: "user",
      sentAt: new Date().toISOString(),
    };

    setMessages(
      (currentMessages) => ({
        ...currentMessages,
        [dayjs().format("YYYY-MM-DD")]: [
          ...(currentMessages?.[dayjs().format("YYYY-MM-DD")] || []),
          optimisticMessage,
        ],
      }),
      false // No need to revalidate
    );

    socket.emit("personal-message", {
      senderId: user.id,
      receiverId: selectedMessageUserId,
      content: newMessage,
      role: "user",
    });
    setNewMessage("");
    mutateConversations();
  }

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5">
      <div className="w-full max-w-5xl flex flex-col py-20">
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 h-full">
          {/* Sidebar */}
          <div
            className={cnm(
              "p-6 border rounded-2xl bg-white w-full grow  max-w-[200px] xl:max-w-sm"
              // conversations && conversations?.length === 0
              //   ? "flex-1 h-[140px]"
              //   : "w-full max-w-sm"
            )}
          >
            {!conversations || conversations.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-center text-neutral-500">No messages yet</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-3xl">Messages</p>
                <div className="mt-6 flex flex-col">
                  {/* Message */}
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cnm(
                        "p-4 rounded-xl cursor-pointer",
                        selectedMessageConversationId === conversation.id
                          ? "bg-neutral-100"
                          : "hover:bg-neutral-200"
                      )}
                      onClick={() => {
                        setSelectedMessageUserId(conversation.userId);
                        setSelectedMessageConversationId(conversation.id);
                        setMessages([]);
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
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message Box */}

          <div className="p-6 border rounded-2xl bg-white flex-1 ml-6">
            {isLoading || otherUserDetailLoading ? (
              <div className="w-full h-[450px] flex items-center justify-center">
                <Spinner size="md" color="primary" />
              </div>
            ) : (
              <>
                {otherUserDetail || conversationDetail ? (
                  <div className="w-full">
                    <div className="w-full flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="size-10 bg-neutral-200 rounded-full">
                          <RandomAvatar
                            seed={
                              otherUserDetail?.data.name ||
                              conversationDetail.data?.otherUser?.name ||
                              ""
                            }
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {otherUserDetail?.data.name ||
                              conversationDetail.data?.otherUser?.name ||
                              ""}
                          </p>
                          {otherUserDetail.data?.messagesSent.status ===
                          "ONLINE" ? (
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
                        <button className="size-8 bg-neutral-200 rounded-full flex items-center justify-center">
                          <Search className="w-4 h-4 text-black" />
                        </button>
                      </div>
                    </div>
                    {/* Message chat */}
                    <MessageChat
                      messages={messages}
                      newMessage={newMessage}
                      setNewMessage={setNewMessage}
                      sendMessage={sendMessage}
                      isLoading={isLoading}
                      selectedMessageUserId={selectedMessageUserId}
                    />
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
  );
}

function MessageChat({
  sendMessage,
  messages,
  setNewMessage,
  newMessage,
  isLoading,
  selectedMessageUserId,
}) {
  const chatEndRef = useRef(null); // Reference to the bottom of the chat container

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    console.log("send");
    sendMessage();
  };

  console.log({ messages });

  return (
    <div className="mt-4 rounded-2xl bg-creamy-300 h-[412px] relative overflow-hidden">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="md" color="primary" />
        </div>
      ) : !messages || Object.keys(messages).length === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-center text-neutral-500">No messages yet</p>
        </div>
      ) : (
        <div className="flex flex-col p-4 overflow-y-auto size-full max-h-[412px]">
          <div className="pb-14 w-full flex flex-col">
            {/* Loop through the messages grouped by date */}
            {Object.entries(messages).map(([date, dayMessages], index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, translateY: 50 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <p className="text-center text-sm text-neutral-500 mb-4">
                  {dayjs(date).format("YYYY-MM-DD")}
                </p>
                {dayMessages.map((msg) => (
                  <div key={msg.id} className="py-2 w-full flex">
                    <div
                      className={cnm(
                        "flex items-end gap-2",
                        msg.role === "user"
                          ? "ml-auto flex-row-reverse"
                          : "mr-auto"
                      )}
                    >
                      <div className="size-6 rounded-full overflow-hidden">
                        <RandomAvatar
                          seed={
                            msg.user === "user"
                              ? msg.senderId || ""
                              : msg.receiverId || ""
                          }
                          className="w-full h-full"
                        />
                      </div>
                      <div
                        className={cnm(
                          "chat-bubble px-4 py-2 rounded-lg text-sm",
                          msg.role === "user"
                            ? " border border-orangy/50 text-neutral-600"
                            : "bg-neutral-200"
                        )}
                      >
                        {msg.content}
                      </div>
                      <p className="text-xs text-neutral-400">
                        {dayjs(msg.sentAt).format("HH:mm")} {/* Message time */}
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
    </div>
  );
}

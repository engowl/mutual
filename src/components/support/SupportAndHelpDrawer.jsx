import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMCAuth } from "../../lib/mconnect/hooks/useMCAuth";
import { cnm } from "../../utils/style";
import RandomAvatar from "../ui/RandomAvatar";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../../config";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import useSWR from "swr";
import { mutualAPI } from "../../api/mutual";
import CustomerLogo from "../../assets/customer.svg?react";

export default function SupportAndHelpDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);

  const { user } = useMCAuth();

  const {
    data: messagesHistory,
    isLoading: isMessageHistoryLoading,
    mutate: mutateMessageHistory,
  } = useSWR(
    user && `/messaging/admin-user-history/admin/${user.id}`,
    async (url) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return mutualAPI
        .get(`${url}?timezone=${timezone}`)
        .then((res) => res.data);
    }
  );

  useEffect(() => {
    if (messagesHistory) {
      setMessages(messagesHistory);
    }
  }, [messagesHistory]);

  useEffect(() => {
    if (isOpen) {
      const socket = io(`${BACKEND_URL}/admin`);
      setSocket(socket);
      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user && socket) {
      socket.on("connect", () => {
        socket.emit("register", user?.id);
        setConnected(true);
      });

      socket.on("admin-message", (message) => {
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
      });

      socket.on("disconnect", () => {
        toast.error("Disconnected from admin socket server");
      });
    }
    return () => {
      socket?.disconnect();
    };
  }, [socket, user, isOpen]);

  const sendMessage = (message) => {
    if (!message) {
      return toast.error("Message cannot be empty");
    }

    if (!user) {
      return toast.error("User not found");
    }

    socket.emit("admin-message", {
      senderId: user.id,
      receiverId: "admin",
      userId: user.id,
      text: message,
    });
  };

  return (
    <div className="fixed bottom-0 w-full left-0 flex justify-end pointer-events-none">
      <div className="pointer-events-auto rounded-t-xl bg-white w-80 mr-6 shadow-lg flex flex-col text-sm z-[99] overflow-hidden border border-black/10">
        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          className={cnm(
            "h-10 flex items-center w-full justify-between px-3 transition-colors",
            isOpen ? "bg-orange-100" : ""
          )}
        >
          <div className="flex items-center gap-2">
            <CustomerLogo />
            Support and Help
          </div>
          <button>
            <X className="size-4" />
          </button>
        </motion.button>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: isOpen ? "auto" : 0 }}
          transition={{ duration: 0.3 }}
          className="w-full text-sm overflow-hidden flex flex-col"
        >
          <div
            className={cnm(
              "w-full flex flex-col gap-2 items-center py-4 transition-colors border-b-2 border-orange-700/50",
              isOpen ? "bg-orange-100" : ""
            )}
          >
            <div className="flex gap-2">
              <div className="size-10 bg-neutral-100 rounded-full">
                <RandomAvatar seed={"admin"} className={"w-full h-full"} />
              </div>
              <div className="size-10 bg-neutral-100 rounded-full">
                <RandomAvatar seed={user?.id} className={"w-full h-full"} />
              </div>
            </div>
            <p className="font-medium">Admin, You</p>
            {connected && (
              <div className="px-3 py-2 rounded-full bg-success-100 text-success-500 border-success-500">
                Connected
              </div>
            )}
          </div>
          <div className="p-3 grow flex">
            <MessageBox
              messages={messages || []}
              userId={user?.id}
              sendMessage={sendMessage}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MessageBox({ messages, userId, sendMessage }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [messages]);
  return (
    <div className="p-3 flex items-center gap-2 bg-neutral-100 rounded-lg grow relative w-full h-[400px] pb-12">
      <div ref={chatEndRef} className="w-full h-full overflow-y-auto">
        <div className="w-full flex flex-col gap-2">
          <div className="flex gap-4 items-center w-full">
            {messages.map(([date, dayMessages]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <p className="text-center text-sm text-neutral-500 mb-4">
                  {dayjs(date).format("YYYY-MM-DD")}
                </p>
                <AnimatePresence mode="popLayout">
                  {dayMessages.map((msg) => (
                    <motion.div
                      key={msg.timestamp}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cnm(
                        "py-2 w-full flex",
                        msg.role === "you"
                          ? "origin-bottom-right"
                          : "origin-bottom-left"
                      )}
                    >
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
                            seed={msg.role === "you" ? userId : "admin"}
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
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
    <div className="absolute bottom-0 left-0 right-0 p-2">
      <div className="flex gap-4 bg-white border rounded-xl items-center pr-4 h-10 focus-within:border-orangy/50">
        <input
          type="text"
          placeholder="Enter your message here"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 py-2 bg-transparent placeholder:text-sm outline-none px-4 text-xs"
        />
        <button onClick={handleSend}>
          <Send className="size-4 text-orangy" />
        </button>
      </div>
    </div>
  );
}

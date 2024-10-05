import { Phone, Search, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { cnm } from "../../utils/style";
import { io } from "socket.io-client";
import { BACKEND_URL } from "../../config";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useMCAuth } from "../../lib/mconnect/hooks/useMcAuth.jsx";
import RandomAvatar from "../../components/ui/RandomAvatar.jsx";

export default function ProjectOwnerMessagePage() {
  const [messages, setMessages] = useState([
    {
      senderId: "cm1w84sov00002sf2vparf6ei",
      content: "hello apa kabs",
    },
    {
      senderId: "cm1w84sov00002sf2vparf6ei",
      content: "ia ",
    },
    {
      senderId: "cm1w84sov00002sf2vparf6ei",
      content: "woyy",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useMCAuth();
  const [socket, setSocket] = useState(null);
  const [searchParams] = useSearchParams();

  const influencerId = searchParams.get("influencerId");

  useEffect(() => {
    if (!user) return;
    const socket = io(`${BACKEND_URL}`);
    setSocket(socket);
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("connect", () => {
      socket.emit("join", { userId: user.id });
      toast.success("Connected to server");
    });
    socket.emit("userActive", { userId: user.id });

    socket.on("personal-message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket, user]);

  function sendMessage() {
    console.log({ newMessage });
    if (!newMessage) return;

    socket.emit("personal-message", {
      senderId: user.id,
      receiverId: "cm1wmtvbe00005pe62o4anp05",
      content: newMessage,
      role: "user",
    });
    setNewMessage("");
  }

  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5">
      <div className="w-full max-w-5xl flex flex-col py-20">
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 h-full">
          {/* Sidebar */}
          {!influencerId && (
            <div className="p-6 border rounded-2xl bg-white w-full md:max-w-sm h-full">
              <p className="font-medium text-3xl">Messages</p>
              <div className="mt-6 flex flex-col">
                {/* Message */}
                <div className="flex items-center gap-4 px-3 py-3 bg-orangy/5 rounded-lg">
                  <div className="size-8 rounded-full bg-neutral-200">
                    <RandomAvatar
                      seed={
                        messages.find((m) => m.senderId != user.id).senderId
                      }
                      className={"h-full w-full"}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-sm">Angga Andinata</p>
                    <p className="text-neutral-500 text-xs">
                      Hi, I&apos;m interested in your offer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message Box */}
          <div className="p-6 border rounded-2xl bg-white flex-1 w-full h-full">
            <div className="w-full">
              <div className="w-full flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="size-10">
                    <RandomAvatar
                      seed={
                        messages.find((m) => m.senderId != user.id).senderId
                      }
                      className={"h-full w-full"}
                    />
                  </div>
                  <div>
                    <p className="font-medium">Angga Andinata</p>
                    <div className="flex items-center gap-1 text-sm text-neutral-400">
                      <span className="size-2 bg-green-700 rounded-full"></span>
                      <p>Active Now</p>
                    </div>
                  </div>
                </div>

                {/* Call and search */}
                <div className="flex items-center gap-4">
                  <button className="size-8 bg-green-700 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </button>
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageChat({ sendMessage, messages, setNewMessage, newMessage }) {
  const handleSend = () => {
    console.log("send");
    sendMessage();
  };

  const { user } = useMCAuth();

  return (
    <div className="mt-4 rounded-2xl bg-[#F1F1F1] h-[412px] pb-[2rem] relative">
      {/* chat bubbles */}
      <div className="flex flex-col p-4 overflow-y-auto size-full max-h-[412px]">
        <div className="pb-12 w-full flex flex-col">
          {messages.map((msg, index) => (
            <div key={index} className="py-2 w-full flex">
              <div
                className={cnm(
                  "flex items-end gap-2",
                  msg.senderId === user.id
                    ? "ml-auto flex-row-reverse"
                    : "mr-auto"
                )}
              >
                <div className="size-9 rounded-full overflow-hidden">
                  <RandomAvatar
                    seed={msg.senderId}
                    className={"h-full w-full"}
                  />
                </div>
                <div
                  className={cnm(
                    "chat-bubble px-4 py-2 rounded-lg text-sm",
                    "bg-white"
                  )}
                >
                  {msg.content}
                </div>
                {/* <p className="text-xs text-neutral-400">10:00</p> */}
              </div>

              <p></p>
            </div>
          ))}
        </div>
      </div>

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

import { Phone, Search, Send } from "lucide-react";
import { useState } from "react";
import { cnm } from "../../utils/style";

export default function ProjectOwnerMessagePage() {
  return (
    <div className="h-full overflow-y-auto w-full flex flex-col items-center px-5">
      <div className="w-full max-w-5xl flex flex-col py-20">
        <div className="w-full flex">
          <div className="p-6 border rounded-2xl bg-white w-full max-w-sm">
            <p className="font-medium text-3xl">Messages</p>
            <div className="mt-6 flex flex-col">
              {/* Message */}
              <div className="flex items-center gap-4 px-3 py-3 bg-orangy/5 rounded-lg">
                <div className="size-8 rounded-full bg-neutral-200"></div>
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm">Angga Andinata</p>
                  <p className="text-neutral-500 text-xs">
                    Hi, I&apos;m interested in your offer
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Message Box */}
          <div className="p-6 border rounded-2xl bg-white flex-1 ml-6">
            <div className="w-full">
              <div className="w-full flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="size-10 bg-neutral-200 rounded-full"></div>
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
              <MessageChat />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { content: "Hey there!", role: "another" },
    { content: "Hello! How are you?", role: "user" },
    { content: "I'm good, thanks. What about you?", role: "another" },
    { content: "Doing great! Working on a new project.", role: "user" },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([...messages, { content: message, role: "user" }]);
      setMessage(""); // Clear the input
    }
  };

  return (
    <div className="mt-4 rounded-2xl bg-creamy-300 min-h-[412px] relative">
      {/* chat bubbles */}
      <div className="flex flex-col p-4 overflow-y-auto size-full max-h-[412px]">
        <div className="pb-12 w-full flex flex-col">
          {messages.map((msg, index) => (
            <div key={index} className="py-2 w-full flex">
              <div
                className={cnm(
                  "flex items-end gap-2",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className="size-6 rounded-full overflow-hidden">
                  <img
                    src="/assets/demo/angga.png"
                    alt="user"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={cnm(
                    "chat-bubble px-4 py-2 rounded-lg text-sm",
                    msg.role === "user"
                      ? "bg-white border border-orangy/50 text-neutral-600"
                      : "bg-neutral-200"
                  )}
                >
                  {msg.content}
                </div>
                <p className="text-xs">10:00</p>
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
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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

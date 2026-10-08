"use client";
import { api } from "@/trpc/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { useState } from "react";

export default function ChatPage() {
  const { data: chats } = api.chat.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: messages } = api.chat.message.useQuery(
    { conversationId: selectedId ?? 0 },
    { enabled: selectedId !== null },
  );
  const utils = api.useUtils();
  const [text, setText] = useState("");

  const sendMessage = api.chat.send.useMutation({
    onSuccess: () => {
      void utils.chat.message.invalidate();
      setText("");
    },
  });
  const handleSend = () => {
    if (!text.trim() || selectedId === null) return;
    sendMessage.mutate({ conversationId: selectedId, text: text.trim() });
  };
  return (
    <>
      <AuthGuard>
        <ClientHeader />
        {/* <div>
          {chats?.length === 0 && (
            <div className="flex justify-center pt-20 text-[35px] text-black">
              Пусто
            </div>
          )}
        </div> */}
        {selectedId === null ? ( // список диалогов (клик выбирает)
          <div>
            {chats?.map((c) => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}>
                {" "}
                Диалог #{c.id}
              </button>
            ))}
          </div>
        ) : (
          // выбран диалог — показываем сообщения
          <div>
            {messages?.map((m) => (
              <div key={m.id}> {m.text}</div>
            ))}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Сообщение..."
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() || sendMessage.isPending}
              >
                Отправить
              </button>
            </div>
          </div>
        )}
      </AuthGuard>
    </>
  );
}

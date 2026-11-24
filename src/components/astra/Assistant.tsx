import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

type T = { id: string; message: string; auto_reply: string; admin_reply: string | null; created_at: string };

export function Assistant() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  async function load() {
    const { data } = await supabase.from("support_tickets").select("id,message,auto_reply,admin_reply,created_at").order("created_at");
    setItems(data ?? []);
  }
  useEffect(() => {
    if (!open) return;
    void load();
    const id = setInterval(() => void load(), 10000);
    return () => clearInterval(id);
  }, [open]);
  useEffect(() => end.current?.scrollIntoView(), [items]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || !session) return;
    setText("");
    const { error } = await supabase.from("support_tickets").insert({ message: msg.slice(0, 1000), user_id: session.user.id });
    if (error) toast.error("Não foi possível enviar.");
    await load();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-blue-grad px-5 py-3.5 text-sm font-black text-primary-foreground glow-blue">
        <MessageCircle className="size-5" /> ASTRA
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="font-black">🤖 ASTRA Assistente</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <Bubble who="bot">Olá! Sou a ASTRA. Escreva a sua dúvida e a nossa equipa responde aqui mesmo.</Bubble>
          {items.map((t) => (
            <div key={t.id} className="space-y-3">
              <Bubble who="me">{t.message}</Bubble>
              <Bubble who="bot">{t.auto_reply}</Bubble>
              {t.admin_reply && <Bubble who="bot">👨‍💼 Suporte: {t.admin_reply}</Bubble>}
            </div>
          ))}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Escreva a sua mensagem..." className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base outline-hidden focus:border-primary" />
          <button aria-label="Enviar" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Send className="size-5" /></button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Bubble({ who, children }: { who: "me" | "bot"; children: React.ReactNode }) {
  return (
    <div className={`flex ${who === "me" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${who === "me" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{children}</div>
    </div>
  );
}

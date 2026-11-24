import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

type T = { id: string; message: string; auto_reply: string; admin_reply: string | null; created_at: string };

// Guardrails estritos para o Bac Bo Astra
function generateGuardedResponse(userMsg: string): string {
  const query = userMsg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const allowedKeywords = [
    "bac bo", "bacbo", "astra", "sinal", "sinais", "robo", "bot", "estrategia",
    "gale", "martingale", "empate", "tie", "jogador", "player", "casa", "banker",
    "banca", "gestao", "stop loss", "stop win", "dado", "dados", "elephant",
    "aprovacao", "pendente", "admin", "plataforma", "assertividade", "historico",
    "roadmap", "bead plate", "telegram", "vip", "link", "cadastro", "como funciona",
    "horario", "padrao", "lucro", "win", "green", "red"
  ];

  const isRelevant = allowedKeywords.some((kw) => query.includes(kw));

  if (!isRelevant) {
    return "🔒 Respondo exclusivamente sobre estratégias do Bac Bo Astra, funcionamento dos sinais e operação da plataforma. Por favor, reformule a sua dúvida com foco nas operações de Bac Bo.";
  }

  // Respostas especializadas dentro do escopo
  if (query.includes("gale") || query.includes("martingale")) {
    return "💡 Estratégia de Gale no Bac Bo Astra: Recomendamos no máximo 1 Gale (G1) com proteção obrigatória no Empate (⚪). Nunca ultrapasse a gestão de banca recomendada (máximo 1-2% da banca por entrada).";
  }

  if (query.includes("empate") || query.includes("tie")) {
    return "⚪ Proteção no Empate: No Bac Bo, o empate paga 8x (ou até mais em empates com pontuações específicas). Uma ficha de 10% do valor da entrada principal no Empate protege seu capital e contabiliza como GREEN ✅ com grande retorno.";
  }

  if (query.includes("gestao") || query.includes("banca") || query.includes("stop")) {
    return "📊 Gestão de Banca Astra: Defina sua meta diária (Stop Win de 5-10%) e seu limite de perda (Stop Loss). Ao atingir a meta do dia, encerre as operações e garanta o lucro no bolso.";
  }

  if (query.includes("aprov") || query.includes("pendente") || query.includes("acesso")) {
    return "🔑 Acesso e Aprovação: Novas contas são verificadas e aprovadas pelo administrador do Bac Bo Astra. O administrador pode aprovar seu cadastro diretamente no Painel Administrativo.";
  }

  if (query.includes("telegram") || query.includes("bot")) {
    return "🤖 Bot VIP Telegram: Nosso robô envia o ciclo completo: Alerta de Atenção, Entrada confirmada, Gale 1 (se necessário) e o resultado imediato (Green de 1ª/G1 ou Red) com placar diário atualizado.";
  }

  return "🚀 Bac Bo Astra: Nosso robô analisa os padrões dos 4 dados em tempo real (2 dados azuis do Jogador e 2 dados vermelhos da Casa). Siga sempre a recomendação de entrada e proteja no Empate!";
}

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

    const aiReply = generateGuardedResponse(msg);

    // Save ticket with custom guarded AI reply
    const { error } = await supabase.from("support_tickets").insert({
      message: msg.slice(0, 1000),
      user_id: session.user.id,
      auto_reply: aiReply,
    });

    if (error) {
      // Fallback local display if database column constraints
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          message: msg,
          auto_reply: aiReply,
          admin_reply: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } else {
      await load();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-blue-grad px-5 py-3.5 text-sm font-black text-primary-foreground glow-blue shadow-xl">
        <MessageCircle className="size-5" /> ASTRA IA
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0 max-w-md mx-auto rounded-t-3xl border-t border-white/20 bg-background/95 backdrop-blur-2xl">
        <SheetHeader className="border-b border-border/60 p-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-black flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary animate-pulse" /> IA Bac Bo Astra
            </SheetTitle>
            <span className="text-[10px] font-mono font-bold text-muted-foreground bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              Guardrails Ativos 🛡️
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-left mt-0.5">
            Especialista exclusiva em regras, estratégias e operações do Bac Bo Astra.
          </p>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <Bubble who="bot">
            Olá! Sou a inteligência artificial do **Bac Bo Astra**.
            Posso tirar dúvidas sobre estratégias, proteção de empate, gestão de banca e funcionamento dos sinais!
          </Bubble>
          {items.map((t) => (
            <div key={t.id} className="space-y-2">
              <Bubble who="me">{t.message}</Bubble>
              <Bubble who="bot">{t.auto_reply}</Bubble>
              {t.admin_reply && <Bubble who="bot">👨‍💼 Suporte Humano: {t.admin_reply}</Bubble>}
            </div>
          ))}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border/60 p-3 bg-secondary/30">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Dúvidas sobre Bac Bo, estratégias, empate..."
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-hidden focus:border-primary"
          />
          <button aria-label="Enviar" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md">
            <Send className="size-4" />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Bubble({ who, children }: { who: "me" | "bot"; children: React.ReactNode }) {
  return (
    <div className={`flex ${who === "me" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${who === "me" ? "bg-primary text-primary-foreground" : "bg-secondary/80 text-foreground border border-white/5"}`}>
        {children}
      </div>
    </div>
  );
}

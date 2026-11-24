import { useEffect, useState } from "react";
import { Bell as BellIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type A = { id: string; title: string; body: string; created_at: string };

export function Bell() {
  const [items, setItems] = useState<A[]>([]);
  const [seen, setSeen] = useState<string>("");

  useEffect(() => {
    setSeen(localStorage.getItem("astra_seen") ?? "");
    const load = () =>
      void supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(30).then(({ data }) => setItems(data ?? []));
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);

  const unread = items.filter((i) => i.created_at > seen).length;

  return (
    <Popover
      onOpenChange={(o) => {
        if (o && items[0]) {
          localStorage.setItem("astra_seen", items[0].created_at);
          setSeen(items[0].created_at);
        }
      }}
    >
      <PopoverTrigger aria-label="Notificações" className="relative flex size-10 items-center justify-center glass rounded-2xl">
        <BellIcon className="size-4" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground">{unread}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-black">🔔 COMUNICADOS</div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && <p className="p-4 text-sm text-muted-foreground">Sem comunicados.</p>}
          {items.map((i) => (
            <div key={i.id} className="border-b border-border px-4 py-3 last:border-0">
              <p className="text-sm font-bold">{i.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{i.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(i.created_at).toLocaleString("pt-PT")}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

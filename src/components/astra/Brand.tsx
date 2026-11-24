export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="text-center">
      <h1 className={`${small ? "text-2xl" : "text-5xl"} font-black tracking-[0.12em]`}><span className="text-primary">BAC</span> <span className="text-destructive">BO</span></h1>
      <div className={`${small ? "text-[10px]" : "mt-1 text-xs"} font-extrabold tracking-[0.6em] text-foreground`}>ASTRA</div>
    </div>
  );
}

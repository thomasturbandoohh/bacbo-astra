export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center leading-none">
      <h1 className={`${small ? "text-2xl" : "text-5xl"} font-black tracking-[0.12em]`}>
        <span className="text-primary">BAC</span> <span className="text-destructive">BO</span>
      </h1>
      <div className={`${small ? "mt-1 text-[10px]" : "mt-2 text-xs"} pl-[0.6em] font-extrabold tracking-[0.6em] text-foreground`}>ASTRA</div>
    </div>
  );
}

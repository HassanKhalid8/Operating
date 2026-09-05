/* Every app that isn't built yet renders this, so the desktop is fully
   clickable from day one and nothing is a dead icon. */
export function Placeholder({ note }: { note: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="edge grid h-12 w-12 place-items-center bg-paper text-lg text-ink-faint">✎</div>
      <div className="font-chrome text-[9px] tracking-tight text-ink-faint">NOT BUILT YET</div>
      <p className="max-w-xs font-serif text-[15px] leading-relaxed text-ink-soft">{note}</p>
    </div>
  )
}

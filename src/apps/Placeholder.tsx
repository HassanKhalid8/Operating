/* Every app that isn't finished renders this, so the desktop is fully
   clickable and nothing is a dead icon. Deliberately says nothing about
   when — a build schedule is my problem, not hers, and a window promising
   something for "day 6" is a window that can be late. */
export function Placeholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="edge grid h-12 w-12 place-items-center bg-paper text-lg text-ink-faint">✎</div>
      <div className="font-chrome text-[9px] tracking-tight text-ink-faint">NOT BUILT YET</div>
      <p className="max-w-xs font-serif text-[15px] leading-relaxed text-ink-soft">
        This one isn’t finished. Try it again later — it won’t always be empty.
      </p>
    </div>
  )
}

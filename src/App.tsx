import { useEffect, useState } from "react"
import { Boot } from "./os/Boot"
import { Desktop } from "./os/Desktop"
import { MusicProvider } from "./os/MusicProvider"
import { PortraitSheet } from "./apps/PortraitSheet"
import { syncPins } from "./lib/pins"
import { syncNotes } from "./lib/notes"
import { syncTheme } from "./lib/theme"

export default function App() {
  const [booted, setBooted] = useState(false)

  /* Catch up with whatever she did on another device. Fired during the boot
     sequence rather than after it, so the answers are usually back before the
     desk is even on screen — and if they never come back, nothing waits for
     them: every one of these falls back to what this device already knows. */
  useEffect(() => {
    void syncTheme()
    void syncPins()
    void syncNotes()
  }, [])

  /* Dev-only contact sheet for the drawn portraits. `import.meta.env.DEV` is
     replaced with a literal at build time, so this branch is dropped entirely
     from the production bundle. */
  if (import.meta.env.DEV && window.location.hash === "#portraits") {
    return <PortraitSheet />
  }

  return (
    <MusicProvider>
      {booted ? <Desktop /> : <Boot onDone={() => setBooted(true)} />}
    </MusicProvider>
  )
}

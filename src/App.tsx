import { useState } from "react"
import { Boot } from "./os/Boot"
import { Desktop } from "./os/Desktop"
import { MusicProvider } from "./os/MusicProvider"
import { PortraitSheet } from "./apps/PortraitSheet"

export default function App() {
  const [booted, setBooted] = useState(false)

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

import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* Serves /api/send-doodle during `npm run dev`.

   On Vercel that file is a serverless function and this plugin is not
   involved. Without it, though, the mail route simply does not exist
   locally — `vite` serves static files and knows nothing about /api — so
   the Send button would always fall through to the share sheet and there
   would be no way to test mail without deploying.

   The handler is loaded from the same api/send-doodle.ts that Vercel
   runs, so there is one implementation and no chance of the local and
   deployed versions drifting apart. */
function mailRoute(env: Record<string, string>): Plugin {
  return {
    name: 'khinsaos:mail-dev',
    apply: 'serve',
    configureServer(server) {
      /* The handler reads process.env, the way it will in production. These
         are the un-prefixed variables from .env.local, which Vite deliberately
         keeps out of the browser bundle — they must stay server-side.

         Always overwrite. Vite restarts this server when .env.local changes,
         but the Node process lives on, so a `if (!process.env[key])` guard
         would pin whatever value the process saw first and silently ignore
         every later edit to your password. */
      const applyEnv = () => {
        for (const key of ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'MAIL_TO']) {
          if (env[key]) process.env[key] = env[key].trim()
        }
      }
      applyEnv()

      server.middlewares.use('/api/send-doodle', async (req, res) => {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)

        const shim = {
          status(code: number) {
            res.statusCode = code
            return shim
          },
          json(body: unknown) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          },
        }

        try {
          applyEnv()
          const mod = await server.ssrLoadModule('/api/send-doodle.ts')
          await mod.default(
            { method: req.method, body: Buffer.concat(chunks).toString('utf8') },
            shim,
          )
        } catch (err) {
          server.config.logger.error(`[mail-dev] ${String(err)}`)
          shim.status(500).json({ error: 'the dev mail route threw' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  /* '' as the prefix loads every variable, not just the VITE_ ones. This is
     config-time only: nothing here is passed to `define`, so the mail
     credentials never reach the client bundle. */
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), mailRoute(env)],
    // 5180 unless the tooling hands us a port (two dev servers on one machine).
    server: { port: Number(process.env.PORT) || 5180 },
  }
})

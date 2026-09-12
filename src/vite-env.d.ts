/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Unset means the site runs local-only. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon key. Public by design — see supabase/schema.sql. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

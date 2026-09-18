/* ───────────────────────────────────────────────────────────────────────────
   Shared reader-comments backend (Supabase).

   Paste your Supabase Project URL and the public "anon" key below. Both are
   designed to be embedded in a public, static site — the anon key only grants
   the access your Row-Level-Security policies allow (here: read + add + delete
   comments). It is NOT a secret and is safe to commit.

   While these are empty, comments fall back to per-browser localStorage and are
   NOT shared between readers.
   ─────────────────────────────────────────────────────────────────────────── */
/* Shared comments, without any account to set up: they live as public GitHub issues
   on this repository, labelled "comment". Reading them needs nothing at all — any
   reader, on any machine, sees the same comments. Writing one opens a prefilled issue,
   so the commenter signs it with their own GitHub account and this page never carries
   a token. Leave SUPABASE_CFG empty to use this. */
window.GITHUB_COMMENTS = {
  repo: "edekeulenaar/ai-alignment-actors",
  label: "comment",
};

window.SUPABASE_CFG = {
  url: "",        // e.g. "https://abcdefgh.supabase.co"
  anonKey: "",    // the long "anon public" key from Settings → API
  table: "comments",
};

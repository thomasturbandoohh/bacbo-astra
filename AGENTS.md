<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Real mode: live entries come only from the admin-connected API (`app_settings.api_connected`); without it the dashboard shows "a aguardar a mesa". Why: user wants no demo signals.
- History/outcomes are deterministic per block of 20 rounds (`outcomeAt`, ≤2 RED per block) and reset each block. Why: user requires ≥90% hit rate and a 20-item history.
- Telegram auto-posting runs from `/api/public/telegram/tick`, hit every minute by a managed schedule; it posts the last entry's result then a new entry. Why: rounds are server-time based, no worker state.
- The 3D robot (`Robot3D.tsx`) is lazy-loaded after mount. Why: three.js can't render during SSR.
- Single-device login: each device stores a random id in localStorage and claims it via `claim_session` RPC; clients poll and sign out on mismatch. Why: last login wins without server sessions.
- First admin is created by `setupAdmin` only while `admin_exists()` is false. Why: admin password is set at first access.
- Roles live in `user_roles` checked with `has_role`; approval status in `profiles.status`, only admins may update it.
- Never use purple or gold; gradients stay within blue hues (blue+red blends read as purple).

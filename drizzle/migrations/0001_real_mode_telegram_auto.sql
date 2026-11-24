ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS api_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_auto boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tpl_green text NOT NULL DEFAULT '✅✅ GREEN ✅✅
Entrada: {entrada}
💰 Lucro garantido!',
  ADD COLUMN IF NOT EXISTS tpl_g1 text NOT NULL DEFAULT '✅ GREEN NO G1 ✅
Entrada: {entrada}
🔁 Batemos no primeiro gale!',
  ADD COLUMN IF NOT EXISTS tpl_red text NOT NULL DEFAULT '❌ RED ❌
Entrada: {entrada}
🧘 Mantenha a gestão, vamos à próxima.',
  ADD COLUMN IF NOT EXISTS sticker_entry text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sticker_green text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sticker_red text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_sent_cycle bigint;
COMMENT ON COLUMN public.app_settings.api_key IS 'DEPRECATED: the single API field now holds the full address';
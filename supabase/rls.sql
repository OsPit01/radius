-- =====================================================================
-- Row Level Security (RLS) для всех таблиц проекта.
--
-- Зачем: включённый RLS без политик = "запрещено всё" для ролей
-- `anon` / `authenticated` (это те, кто стучится через Supabase REST API).
-- Наше приложение ходит в БД через drizzle с ролью-владельцем (service
-- role / postgres), которая обходит RLS, поэтому приложение не ломается.
--
-- Как применять: npm run db:rls
-- (запускай ПОСЛЕ каждого db:push — push пересоздаёт таблицы и сбрасывает RLS)
-- =====================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'radius_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

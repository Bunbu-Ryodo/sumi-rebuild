-- Store each user's Expo push token on their profile
alter table public.profiles
  add column if not exists push_token text;

create index if not exists profiles_push_token_idx
  on public.profiles (push_token)
  where push_token is not null;

-- Required to let pg_cron call the Edge Function on a schedule
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Store the service role key + function URL as Vault secrets first:
--   select vault.create_secret('https://<project-ref>.functions.supabase.co', 'edge_function_base_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');

select
  cron.schedule(
    'send-first-chapter-extract-push',
    '0 17 */3 * *', -- every 3 days at 17:00 UTC
    $$
    select
      net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'edge_function_base_url') || '/send-first-chapter-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        body := '{}'::jsonb
      );
    $$
  );

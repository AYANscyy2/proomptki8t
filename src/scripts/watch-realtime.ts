import { supabaseBrowser } from '../lib/supabaseBrowser';

const PROMPT_ID = '22222222-2222-4222-8222-222222222222'; // your test prompt

export const channel = supabaseBrowser
  .channel('prompt-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'prompts',
      filter: `id=eq.${PROMPT_ID}`,
    },
    (payload) => {
      console.log('--- prompt updated ---');
      console.log('new active_version_id:', payload.new.active_version_id);
    }
  )
  .subscribe((status) => {
    console.log('subscription status:', status);
  });

console.log('Watching for changes to prompt', PROMPT_ID, '— leave this running...');
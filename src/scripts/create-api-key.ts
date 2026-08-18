import { generateApiKey, hashApiKey } from '../lib/apiKey';
import { supabaseAdmin } from '../db/client';

const ORG_ID = '11111111-1111-4111-8111-111111111111'; // your test org

async function main() {
  const key = generateApiKey();
  const hash = hashApiKey(key);

  const { error } = await supabaseAdmin
    .from('api_keys')
    .insert({ org_id: ORG_ID, key_hash: hash });

  if (error) throw error;

  console.log('Save this key — it will not be shown again:');
  console.log(key);
}

main();
import { createPrompt, createVersion, activateVersion, getActivePrompt, listVersions } from './db/prompts';
const ORG_ID = '11111111-1111-4111-8111-111111111111';

async function main() {
  console.log('--- creating prompt ---');
  const prompt = await createPrompt({
    org_id: ORG_ID,
    slug: 'test-script-prompt',
    name: 'Test Script Prompt',
  });
  console.log(prompt);

  console.log('--- creating version 1 ---');
  const v1 = await createVersion({
    prompt_id: prompt.id,
    template: 'Hello {{name}}',
    variables: ['name'],
  });
  console.log(v1);

  console.log('--- activating version 1 ---');
  await activateVersion(prompt.id, v1.id);

  console.log('--- creating version 2 ---');
  const v2 = await createVersion({
    prompt_id: prompt.id,
    template: 'Hey there {{name}}, welcome!',
    variables: ['name'],
  });
  console.log(v2);

  console.log('--- activating version 2 ---');
  await activateVersion(prompt.id, v2.id);

  console.log('--- fetching active prompt (should show v2) ---');
  const active = await getActivePrompt('test-script-prompt', ORG_ID);
  console.log(active);

  console.log('--- rolling back to version 1 ---');
  await activateVersion(prompt.id, v1.id);

  console.log('--- fetching active prompt again (should show v1) ---');
  const rolledBack = await getActivePrompt('test-script-prompt', ORG_ID);
  console.log(rolledBack);

  console.log('--- listing all versions ---');
  const versions = await listVersions(prompt.id);
  console.log(versions);
}

main().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
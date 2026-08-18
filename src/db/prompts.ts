import { supabaseAdmin } from './client';
import {
  PromptSchema, PromptVersionSchema,
  CreatePromptInput, CreateVersionInput,
} from './types';
import type { Prompt, PromptVersion } from './types';
import { z } from 'zod';

export async function createPrompt(input: z.input<typeof CreatePromptInput>): Promise<Prompt> {
  const parsed = CreatePromptInput.parse(input);

  const { data, error } = await supabaseAdmin
    .from('prompts')
    .insert(parsed)
    .select()
    .single();

  if (error) throw new Error(`createPrompt failed: ${error.message}`);
  return PromptSchema.parse(data);
}

export async function createVersion(input: z.input<typeof CreateVersionInput>): Promise<PromptVersion> {
  const parsed = CreateVersionInput.parse(input);

  // get next version_number for this prompt
  const { data: latest } = await supabaseAdmin
    .from('prompt_versions')
    .select('version_number')
    .eq('prompt_id', parsed.prompt_id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version_number ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from('prompt_versions')
    .insert({ ...parsed, version_number: nextVersion })
    .select()
    .single();

  if (error) throw new Error(`createVersion failed: ${error.message}`);
  return PromptVersionSchema.parse(data);
}

export async function activateVersion(promptId: string, versionId: string): Promise<Prompt> {
  // safety check: version must actually belong to this prompt
  const { data: version, error: versionErr } = await supabaseAdmin
    .from('prompt_versions')
    .select('id, prompt_id')
    .eq('id', versionId)
    .single();

  if (versionErr || !version) throw new Error('Version not found');
  if (version.prompt_id !== promptId) throw new Error('Version does not belong to this prompt');

  const { data, error } = await supabaseAdmin
    .from('prompts')
    .update({ active_version_id: versionId })
    .eq('id', promptId)
    .select()
    .single();

  if (error) throw new Error(`activateVersion failed: ${error.message}`);
  return PromptSchema.parse(data);
}

export async function getActivePrompt(slug: string, orgId: string) {
  const { data: prompt, error } = await supabaseAdmin
    .from('prompts')
    .select('*, prompt_versions!prompts_active_version_id_fkey(*)')
    .eq('slug', slug)
    .eq('org_id', orgId)
    .single();

  if (error) throw new Error(`getActivePrompt failed: ${error.message}`);
  return prompt;
}

export async function listVersions(promptId: string): Promise<PromptVersion[]> {
  const { data, error } = await supabaseAdmin
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false });

  if (error) throw new Error(`listVersions failed: ${error.message}`);
  return z.array(PromptVersionSchema).parse(data);
}
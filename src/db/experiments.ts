import { createHash } from 'crypto';
import { supabaseAdmin } from './client';
import { ExperimentSchema, CreateExperimentInput } from './types';
import type { Experiment } from './types';
import { z } from 'zod';

export async function createExperiment(
  input: z.input<typeof CreateExperimentInput>
): Promise<Experiment> {
  const parsed = CreateExperimentInput.parse(input);

  const { data, error } = await supabaseAdmin
    .from('experiments')
    .insert(parsed)
    .select()
    .single();

  if (error) throw new Error(`createExperiment failed: ${error.message}`);
  return ExperimentSchema.parse(data);
}

export async function stopExperiment(experimentId: string): Promise<Experiment> {
  const { data, error } = await supabaseAdmin
    .from('experiments')
    .update({ status: 'stopped' })
    .eq('id', experimentId)
    .select()
    .single();

  if (error) throw new Error(`stopExperiment failed: ${error.message}`);
  return ExperimentSchema.parse(data);
}

async function getRunningExperiment(promptId: string): Promise<Experiment | null> {
  const { data, error } = await supabaseAdmin
    .from('experiments')
    .select('*')
    .eq('prompt_id', promptId)
    .eq('status', 'running')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getRunningExperiment failed: ${error.message}`);
  return data ? ExperimentSchema.parse(data) : null;
}

// Deterministic split: same subjectId always lands in the same variant
// for a given experiment, without storing per-user assignment rows.
function hashToUnitInterval(input: string): number {
  const hash = createHash('sha256').update(input).digest('hex');
  // take first 8 hex chars (32 bits) as an integer, normalize to [0, 1)
  const intVal = parseInt(hash.slice(0, 8), 16);
  return intVal / 0xffffffff;
}

export async function assignVariant(promptId: string, subjectId: string) {
  const experiment = await getRunningExperiment(promptId);

  if (!experiment) {
    // no active experiment — fall back to the prompt's active version
    const { data: prompt, error } = await supabaseAdmin
      .from('prompts')
      .select('active_version_id')
      .eq('id', promptId)
      .single();

    if (error || !prompt?.active_version_id) {
      throw new Error('No active experiment and no active version for this prompt');
    }

    const { data: version, error: vErr } = await supabaseAdmin
      .from('prompt_versions')
      .select('*')
      .eq('id', prompt.active_version_id)
      .single();

    if (vErr) throw new Error(`assignVariant fallback failed: ${vErr.message}`);
    return { version, experimentId: null, variant: null as 'a' | 'b' | null };
  }

  const bucket = hashToUnitInterval(`${experiment.id}:${subjectId}`);
  const variant: 'a' | 'b' = bucket < experiment.split_ratio ? 'b' : 'a';
  const versionId = variant === 'b'
    ? experiment.variant_b_version_id
    : experiment.variant_a_version_id;

  const { data: version, error } = await supabaseAdmin
    .from('prompt_versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error) throw new Error(`assignVariant failed: ${error.message}`);
  return { version, experimentId: experiment.id, variant };
}
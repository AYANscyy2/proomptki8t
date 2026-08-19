import { z } from 'zod';

export const PromptVersionSchema = z.object({
  id: z.string().uuid(),
  prompt_id: z.string().uuid(),
  version_number: z.number().int(),
  template: z.string(),
  variables: z.array(z.string()),
model_config: z.record(z.string(), z.any()).default({}),
  created_at: z.string(),
});
export type PromptVersion = z.infer<typeof PromptVersionSchema>;

export const PromptSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  active_version_id: z.string().uuid().nullable(),
  created_at: z.string(),
});
export type Prompt = z.infer<typeof PromptSchema>;

export const CreatePromptInput = z.object({
  org_id: z.string().uuid(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug must be lowercase, numbers, hyphens only'),
  name: z.string().min(1),
});

export const CreateVersionInput = z.object({
  prompt_id: z.string().uuid(),
  template: z.string().min(1),
  variables: z.array(z.string()).default([]),
model_config: z.record(z.string(), z.any()).default({}),
});

export const ExperimentSchema = z.object({
  id: z.string().uuid(),
  prompt_id: z.string().uuid(),
  variant_a_version_id: z.string().uuid(),
  variant_b_version_id: z.string().uuid(),
  split_ratio: z.number().min(0).max(1),
  status: z.enum(['running', 'stopped']),
  created_at: z.string(),
});
export type Experiment = z.infer<typeof ExperimentSchema>;

export const CreateExperimentInput = z.object({
  prompt_id: z.string().uuid(),
  variant_a_version_id: z.string().uuid(),
  variant_b_version_id: z.string().uuid(),
  split_ratio: z.number().min(0).max(1).default(0.5),
});
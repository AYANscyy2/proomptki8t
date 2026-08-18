import { supabaseAdmin } from '../db/client';
import { hashApiKey } from '../lib/apiKey';
import type { FastifyRequest } from 'fastify';

export interface GraphQLContext {
  orgId: string;
}

export async function buildContext({ req }: { req: FastifyRequest }): Promise<GraphQLContext> {
  const rawKey = req.headers['x-api-key'];
  const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;

  if (!apiKey) {
    throw new Error('Missing x-api-key header');
  }

  const keyHash = hashApiKey(apiKey);

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('org_id')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) {
    throw new Error('Invalid API key');
  }

  return { orgId: data.org_id };
}
import { GraphQLScalarType, Kind } from 'graphql';
import {
  createPrompt, createVersion, activateVersion,
  getActivePrompt, listVersions,
} from '../db/prompts';
import { supabaseAdmin } from '../db/client';
import type { GraphQLContext } from './context';

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return JSON.parse(ast.value);
    if (ast.kind === Kind.OBJECT) {
      // graphql-yoga parses object literals into an AST; for simplicity
      // we only support passing JSON as a variable, not inline in the query
      throw new Error('JSON scalar only supports variable input, not inline literals');
    }
    return null;
  },
});

export const resolvers = {
  JSON: JSONScalar,

  Prompt: {
    activeVersionId: (parent: any) => parent.active_version_id,
    createdAt: (parent: any) => parent.created_at,
    activeVersion: async (parent: any) => {
      if (!parent.active_version_id) return null;
      const { data } = await supabaseAdmin
        .from('prompt_versions')
        .select('*')
        .eq('id', parent.active_version_id)
        .single();
      return data;
    },
    versions: async (parent: any) => listVersions(parent.id),
  },

  PromptVersion: {
    promptId: (parent: any) => parent.prompt_id,
    versionNumber: (parent: any) => parent.version_number,
    modelConfig: (parent: any) => parent.model_config,
    createdAt: (parent: any) => parent.created_at,
  },

  Query: {
    prompt: async (_: any, args: { slug: string }, ctx: GraphQLContext) => {
      return getActivePrompt(args.slug, ctx.orgId);
    },
    promptVersions: async (_: any, args: { promptId: string }) => {
      return listVersions(args.promptId);
    },
  },

  Mutation: {
    createPrompt: async (_: any, args: { slug: string; name: string }, ctx: GraphQLContext) => {
      return createPrompt({ org_id: ctx.orgId, slug: args.slug, name: args.name });
    },
    createVersion: async (_: any, args: {
      promptId: string; template: string; variables?: string[]; modelConfig?: any;
    }) => {
      return createVersion({
        prompt_id: args.promptId,
        template: args.template,
        variables: args.variables ?? [],
        model_config: args.modelConfig ?? {},
      });
    },
    activateVersion: async (_: any, args: { promptId: string; versionId: string }) => {
      return activateVersion(args.promptId, args.versionId);
    },
  },
};
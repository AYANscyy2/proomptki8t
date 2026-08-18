import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { buildContext } from './graphql/context';

const app = Fastify({ logger: true });

app.addContentTypeParser('application/json', (req, payload, done) => {
  done(null, payload);
});

async function main() {
  await app.register(cors);

  const yoga = createYoga({
    schema: createSchema({ typeDefs, resolvers }),
    context: async ({ req }: any) => buildContext({ req }),
    graphqlEndpoint: '/graphql',
    // tell yoga to use Node's raw req/res, not the Fetch API
    graphiql: true,
  });

  // let fastify hand off the raw node req/res directly to yoga
  app.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
  reply.hijack();
  const response = await yoga.handleNodeRequest(req.raw, {
    req: req.raw,
    res: reply.raw,
  });

  response.headers.forEach((value: string, key: string) => {
    reply.raw.setHeader(key, value);
  });
  reply.raw.writeHead(response.status);

  const body = await response.text();
  reply.raw.end(body);
},
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.listen({ port: 4000 });
  console.log('promptkit running at http://localhost:4000/graphql');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
import { buildApp } from './app.js';
import { getEnv } from './lib/env.js';

const env = getEnv();
const app = buildApp();

app
  .listen({ port: env.PORT, host: '0.0.0.0' })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });


import { startServer } from './server/server.js';

startServer().catch((err) => {
  console.error('VF server terminated with error:', err);
  process.exit(1);
});

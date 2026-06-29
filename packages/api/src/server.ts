import { app } from './index';

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Freshy API listening on port ${port}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

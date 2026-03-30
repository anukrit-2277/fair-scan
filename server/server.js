const app = require('./src/app');
const { env, connectDB } = require('./src/config');

const start = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`\n  FairScan API running`);
    console.log(`  Environment : ${env.NODE_ENV}`);
    console.log(`  Port        : ${env.PORT}`);
    console.log(`  Health      : http://localhost:${env.PORT}/api/health\n`);
  });

  return server;
};

// ─── Process-level error handlers ───
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled promise rejection:', err?.message || err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err?.message || err);
  process.exit(1);
});

start();

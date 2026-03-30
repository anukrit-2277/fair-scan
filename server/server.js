const app = require('./src/app');
const { env, connectDB } = require('./src/config');

const start = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`\n  FairScan API running`);
    console.log(`  Environment : ${env.NODE_ENV}`);
    console.log(`  Port        : ${env.PORT}`);
    console.log(`  Health      : http://localhost:${env.PORT}/api/health\n`);
  });
};

start();

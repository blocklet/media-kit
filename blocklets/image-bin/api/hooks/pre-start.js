const { migrate } = require('../store/migrate');

(async () => {
  try {
    await migrate();
    process.exit(0);
  } catch (err) {
    console.error('[pre-start] failed', err);
    process.exit(1);
  }
})();

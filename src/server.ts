import app from "./app";
import { config } from "./config";
import { getSupabase } from "./db/supabase";

async function bootstrap() {
  // Test Supabase connection
  try {
    const db = getSupabase();
    await db.from("users").select("user_id").limit(1);
    console.log("✅  Supabase connected");
  } catch (err) {
    console.warn("⚠️  Supabase connection warning:", err);
  }

  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   AI Interview Platform — Node.js + TypeScript   ║
╠══════════════════════════════════════════════════╣
║  Server  : http://localhost:${config.port}               ║
║  Env     : ${config.nodeEnv.padEnd(38)}║
╚══════════════════════════════════════════════════╝
    `.trim());
  });
}

bootstrap().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

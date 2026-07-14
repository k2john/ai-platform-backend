import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  supabase: {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    anonKey: required("SUPABASE_ANON_KEY"),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "60m",
  },

  openai: {
    apiKey: required("OPENAI_API_KEY"),
  },

  elevenlabs: {
    apiKey: required("ELEVENLABS_API_KEY"),
    defaultVoiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID || "EXAVITQu4vr4xnSDxMaL",
  },

  did: {
    apiKey: required("DID_API_KEY"),
    apiUrl: process.env.DID_API_URL || "https://api.d-id.com",
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || "http://localhost:3000").split(",").map(o => o.trim()),
  },
} as const;

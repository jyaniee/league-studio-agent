import dotenv from "dotenv";

dotenv.config();

export const config = {
  liveClientApiUrl:
    process.env.LIVE_CLIENT_API_URL ??
    "https://127.0.0.1:2999/liveclientdata/allgamedata",

  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 1000),

  
  statusLogIntervalMs: Number(process.env.STATUS_LOG_INTERVAL_MS ?? 10000),

  allowInsecureLocalTls:
    process.env.ALLOW_INSECURE_LOCAL_TLS === "true",
};
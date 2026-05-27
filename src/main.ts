import { config } from "./config.js";

if (config.allowInsecureLocalTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import { fetchLiveClientData } from "./liveClient.js";
import { parseObjectiveEvents } from "./eventParser.js";

let lastEventId = 0;

async function pollLiveClientData() {
  try {
    const data = await fetchLiveClientData(config.liveClientApiUrl);

    const objectiveEvents = parseObjectiveEvents(data.events.Events);
    const newEvents = objectiveEvents.filter(
      (event) => event.eventId > lastEventId
    );

    for (const event of newEvents) {
      console.log("[OBJECTIVE EVENT]", event);
      lastEventId = Math.max(lastEventId, event.eventId);
    }
  } catch (error) {
    console.error(
      "[AGENT ERROR]",
      error instanceof Error ? error.message : error
    );
  }
}

console.log("[League Studio Agent] started");
console.log(`[Poll Interval] ${config.pollIntervalMs}ms`);

setInterval(pollLiveClientData, config.pollIntervalMs);
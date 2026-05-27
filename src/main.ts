import { config } from "./config.js";

if (config.allowInsecureLocalTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import { fetchLiveClientData } from "./liveClient.js";
import { parseObjectiveEvents } from "./eventParser.js";

let lastEventId = 0;
let lastSuccessAt: Date | null = null;
let lastErrorMessage: string | null = null;
let totalPollCount = 0;
let totalObjectiveEventCount = 0;


async function pollLiveClientData() {
    totalPollCount += 1;

    try {
        const data = await fetchLiveClientData(config.liveClientApiUrl);

        lastSuccessAt = new Date();
        lastErrorMessage = null;

        const objectiveEvents = parseObjectiveEvents(data.events.Events);
        const newEvents = objectiveEvents.filter(
        (event) => event.eventId > lastEventId
        );

        for (const event of newEvents) {
            totalObjectiveEventCount += 1;
            console.log("[OBJECTIVE EVENT]", event);
            lastEventId = Math.max(lastEventId, event.eventId);
        }
    } catch (error) {
        lastErrorMessage = error instanceof Error ? error.message : String(error);
        console.error(
        "[AGENT ERROR]",
        lastErrorMessage
        );
    }
}

function logStatus() {
    const now = new Date();

    if (lastSuccessAt === null) {
        console.log("[STATUS] Waiting for Live Client API Connection...");
        return;
    }

    const secondsSinceLastSuccess = Math.floor(
        (now.getTime() - lastSuccessAt.getTime()) / 1000
    );

    if (lastErrorMessage) {
        console.log(
            `[STATUS] Disconnected | last success: ${secondsSinceLastSuccess}s ago | error: ${lastErrorMessage}`
        );
        return;
    }

    console.log(
        `[STATUS] Connected | polls: ${totalPollCount} | objective events: ${totalObjectiveEventCount} | last event id: ${lastEventId}` 
    );
}

console.log("[League Studio Agent] started");
console.log(`[Live Client API ${config.liveClientApiUrl}`);
console.log(`[Poll Interval] ${config.pollIntervalMs}ms`);
console.log(`[Status Log Interval] ${config.statusLogIntervalMs}ms`);

setInterval(pollLiveClientData, config.pollIntervalMs);
setInterval(logStatus, config.statusLogIntervalMs);
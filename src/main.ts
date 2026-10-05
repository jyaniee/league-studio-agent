import { config } from "./config.js";
import { sendObjectiveEventToServer,sendTowerEventToServer } from "./serverClient.js";

if (config.allowInsecureLocalTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import { fetchLiveClientData } from "./liveClient.js";
import { parseObjectiveEvents,parseTowerEvents } from "./eventParser.js";

let lastEventId = 0;
let lastSuccessAt: Date | null = null;
let lastErrorMessage: string | null = null;
let totalPollCount = 0;
let totalObjectiveEventCount = 0;
let lastObjectiveEventId = 0;
let lastTowerEventId = 0;
let totalTowerEventCount = 0;


async function pollLiveClientData() {
    totalPollCount += 1;

    try {
        const data = await fetchLiveClientData(config.liveClientApiUrl);

        lastSuccessAt = new Date();
        lastErrorMessage = null;

        const objectiveEvents = parseObjectiveEvents(
            data.events.Events,
            data.allPlayers,
        );

        const towerEvents = parseTowerEvents(
            data.events.Events,
            data.allPlayers,
        );

        const newObjectiveEvents = objectiveEvents.filter(
            (event) => event.eventId > lastObjectiveEventId,
        );

        for (const event of newObjectiveEvents) {
            totalObjectiveEventCount += 1;
            console.log("[OBJECTIVE EVENT]", event);

            if (config.sendToServer) {
                try {
                    await sendObjectiveEventToServer({
                        serverIngestUrl: config.serverIngestUrl,
                        matchId: config.matchId,
                        agentId: config.agentId,
                        event,
                    });

                    console.log(
                        `[SEND] Objective event sent to server: ${event.eventId}`,
                    );
                } catch (error) {
                    console.error(
                        "[OBJECTIVE SEND ERROR]",
                        error instanceof Error ? error.message : String(error),
                    );
                }
            }

            lastObjectiveEventId = Math.max(
                lastObjectiveEventId,
                event.eventId,
            );
        }

        const newTowerEvents = towerEvents.filter(
            (event) => event.eventId > lastTowerEventId,
        );

        for (const event of newTowerEvents) {
            totalTowerEventCount += 1;
            console.log("[TOWER EVENT]", event);

            if (config.sendToServer) {
                try {
                    await sendTowerEventToServer({
                        serverTowerIngestUrl: config.serverTowerIngestUrl,
                        matchId: config.matchId,
                        agentId: config.agentId,
                        event,
                    });

                    console.log(
                        `[SEND] Tower event sent to server: ${event.eventId}`,
                    );
                } catch (error) {
                    console.error(
                        "[TOWER SEND ERROR]",
                        error instanceof Error ? error.message : String(error),
                    );
                }
            }

            lastTowerEventId = Math.max(
                lastTowerEventId,
                event.eventId,
            );
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
console.log(`[Live Client API] ${config.liveClientApiUrl}`);
console.log(`[Poll Interval] ${config.pollIntervalMs}ms`);
console.log(`[Status Log Interval] ${config.statusLogIntervalMs}ms`);
console.log(`[Send to Server] ${config.sendToServer}`);
console.log(`[Server Ingest URL] ${config.serverIngestUrl}`);
console.log(`[Match ID] ${config.matchId}`);
console.log(`[Agent ID] ${config.agentId}`);

setInterval(pollLiveClientData, config.pollIntervalMs);
setInterval(logStatus, config.statusLogIntervalMs);
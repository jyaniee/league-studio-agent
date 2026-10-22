
import type {
    AgentObjectiveEvent,
    AgentObjectiveEventPayload,
    AgentTowerEvent,
} from "./types";

const SERVER_URL = "http://localhost:3001";

type SendObjectiveEventOptions = {
    serverIngestUrl: string;
    matchId: string;
    agentId: string;
    event: AgentObjectiveEvent;
};

type SendTowerEventOptions = {
    serverTowerIngestUrl: string;
    matchId: string;
    agentId: string;
    event: AgentTowerEvent;
};

export async function sendTowerEventToServer({
    serverTowerIngestUrl,
    matchId,
    agentId,
    event,
}: SendTowerEventOptions): Promise<void> {
    const response = await fetch(serverTowerIngestUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            matchId,
            agentId,
            sentAt: new Date().toISOString(),
            event,
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Server tower ingest failed: ${response.status} ${response.statusText}`,
        );
    }
}

export async function sendObjectiveEventToServer({
    serverIngestUrl,
    matchId,
    agentId,
    event,
}: SendObjectiveEventOptions): Promise<void> {
    const payload: AgentObjectiveEventPayload = {
        matchId,
        agentId,
        sentAt: new Date().toISOString(),
        event,
    };

    const response = await fetch(serverIngestUrl, {
        method: "POST",
        headers: {
            "Content-Types": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(
            `Server ingest failed: ${response.status} ${response.statusText}`
        );
    }
}
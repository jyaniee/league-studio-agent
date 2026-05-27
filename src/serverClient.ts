import type {
    AgentObjectiveEvent,
    AgentObjectiveEventPayload,
} from "./types";

type SendObjectiveEventOptions = {
    serverIngestUrl: string;
    matchId: string;
    agentId: string;
    event: AgentObjectiveEvent;
};

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
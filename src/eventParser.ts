import type { LiveClientEvent, ObjectiveEvent } from "./types.js";

const OBJECTIVE_EVENT_NAMES = new Set([
  "DragonKill",
  "BaronKill",
  "HeraldKill",
  "HordeKill",
]);

export function parseObjectiveEvents(
  events: LiveClientEvent[]
): ObjectiveEvent[] {
  return events
    .filter((event) => OBJECTIVE_EVENT_NAMES.has(event.EventName))
    .map((event) => ({
      eventId: event.EventID,
      eventName: event.EventName,
      eventTime: event.EventTime,
      killerName: event.KillerName,
      dragonType: event.DragonType,
      stolen: event.Stolen,
    }));
}
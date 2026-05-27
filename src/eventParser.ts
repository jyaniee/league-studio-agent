import { resolve } from "node:dns";
import type { 
    LiveClientEvent, 
    AgentObjectiveEvent, 
    LeagueStudioTeam, 
    LiveClientPlayer,
    ObjectiveRawEventName,
    ObjectiveType,
    DragonType, 
} from "./types.js";
import { unescape } from "node:querystring";

const OBJECTIVE_EVENT_NAMES = new Set<ObjectiveRawEventName>([
  "DragonKill",
  "BaronKill",
  "HeraldKill",
  "HordeKill",
]);

function normalizeName(name?: string): string {
    return name?.trim().toLowerCase() ?? "";
}

function getNameCandidates(player: LiveClientPlayer): string[] {
    return [
        player.riotIdGameName,
        player.summonerName?.split("#")[0],
        player.riotId?.split("#")[0],
    ].filter((name): name is string => Boolean(name));
}


function findExactMatch(
  killerName: string,
  players: LiveClientPlayer[]
): LiveClientPlayer | undefined {
    return players.find((player) =>
        getNameCandidates(player).some((name) => name === killerName)
    );
}

function findNormalizedMatch(
  killerName: string,
  players: LiveClientPlayer[]
): LiveClientPlayer | undefined {
    const normalizedKillerName = normalizeName(killerName);

    const matchedPlayers = players.filter((player) =>
        getNameCandidates(player).some(
        (name) => normalizeName(name) === normalizedKillerName
        )
    );

    if (matchedPlayers.length !== 1) {
        console.warn(
        `[WARN] Ambiguous or missing normalized match for killerName: ${killerName}`
        );
        return undefined;
    }

    return matchedPlayers[0];
}


function toLeagueStudioTeam(team?: string): LeagueStudioTeam {
    if (team === "ORDER") {
        return "blue";
    }

    if (team === "CHAOS") {
        return "red";
    }

    return "unknown";
}

function resolveKillerTeam(
    killerName: string | undefined,
    players: LiveClientPlayer[]
): LeagueStudioTeam {
    if(!killerName){
        return "unknown";
    }

    const exactMatch = findExactMatch(killerName, players);

    if (exactMatch) {
        return toLeagueStudioTeam(exactMatch.team);
    }

    const normalizedMatch = findNormalizedMatch(killerName, players);

    if (normalizedMatch) {
        return toLeagueStudioTeam(normalizedMatch.team);
    }
    
    console.warn(`[WARN] Killer not found in allPlayers: ${killerName}`);
    return "unknown";
}

function isObjectiveRawEventName(
    eventName: string
): eventName is ObjectiveRawEventName {
    return OBJECTIVE_EVENT_NAMES.has(eventName as ObjectiveRawEventName);
}

function toObjectiveType(eventName: ObjectiveRawEventName): ObjectiveType {
    switch (eventName) {
        case "DragonKill":
            return "dragon";
        case "BaronKill":
            return "baron";
        case "HeraldKill":
            return "herald";
        case "HordeKill":
            return "voidgrub";
    }
}

function toDragonType(rawDragonType?: string): DragonType | undefined {
    switch (rawDragonType) {
        case "Air":
            return "cloud";
        case "Fire":
            return "infernal";
        case "Water":
            return "ocean";
        case "Earth":
            return "mountain";
        case "Hextech":
            return "hextech";
        case "Chemtech":
            return "chemtech";
        case "Elder":
            return "elder";
        default:
            return undefined;
    }
}


function toBoolean(value?: string): boolean | undefined {
    if (value === "True") {
        return true;
    }

    if (value === "False") {
        return false;
    }

    return undefined;
}

export function parseObjectiveEvents(
  events: LiveClientEvent[],
  players: LiveClientPlayer[]
): AgentObjectiveEvent[] {
  return events
    .filter((event) => isObjectiveRawEventName(event.EventName))
    .map((event) => {
        const rawEventName = event.EventName as ObjectiveRawEventName;

        return {
            eventId: event.EventID,
            eventTime: event.EventTime,
            objective: toObjectiveType(rawEventName),
            rawEventName,
            team: resolveKillerTeam(event.KillerName, players),
            killerName: event.KillerName,
            dragonType: toDragonType(event.DragonType),
            rawDragonType: event.DragonType,
            stolen: toBoolean(event.Stolen),
        };
    });
}
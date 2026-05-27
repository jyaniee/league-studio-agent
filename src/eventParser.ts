import type { LiveClientEvent, ObjectiveEvent, LeagueStudioTeam, LiveClientPlayer } from "./types.js";

const OBJECTIVE_EVENT_NAMES = new Set([
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

export function parseObjectiveEvents(
  events: LiveClientEvent[],
  players: LiveClientPlayer[]
): ObjectiveEvent[] {
  return events
    .filter((event) => OBJECTIVE_EVENT_NAMES.has(event.EventName))
    .map((event) => ({
      eventId: event.EventID,
      eventName: event.EventName,
      eventTime: event.EventTime,
      killerName: event.KillerName,
      team: resolveKillerTeam(event.KillerName, players),
      dragonType: event.DragonType,
      stolen: event.Stolen,
    }));
}
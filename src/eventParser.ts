import { resolve } from "node:dns";
import type { 
    LiveClientEvent, 
    AgentObjectiveEvent, 
    LeagueStudioTeam, 
    LiveClientPlayer,
    ObjectiveRawEventName,
    ObjectiveType,
    DragonType, 
    AgentTowerEvent,
} from "./types.js";
import { unescape } from "node:querystring";

const OBJECTIVE_EVENT_NAMES = new Set<ObjectiveRawEventName>([
  "DragonKill",
  "BaronKill",
  "HeraldKill",
  "HordeKill",
]);

const TOWER_EVENT_NAME = "TurretKilled" as const;

function resolveDestroyedTowerTeam(
  turretKilled?: string,
): LeagueStudioTeam {
  if (!turretKilled) {
    return "unknown";
  }

  const value = turretKilled.toUpperCase();

  // ORDER / T2 / T100 = 블루 진영 구조물
  if (
    value.includes("ORDER") ||
    value.includes("T100") ||
    /(^|[_\s-])T2([_\s-]|$)/.test(value)
  ) {
    return "red";
  }

  // CHAOS / T1 / T200 = 레드 진영 구조물
  if (
    value.includes("CHAOS") ||
    value.includes("T200") ||
    /(^|[_\s-])T1([_\s-]|$)/.test(value)
  ) {
    return "blue";
  }

  return "unknown";
}

function getOppositeTeam(team: LeagueStudioTeam): LeagueStudioTeam {
  if (team === "blue") {
    return "red";
  }

  if (team === "red") {
    return "blue";
  }

  return "unknown";
}


function normalizeName(name?: string): string {
    return (name ?? "")
        .trim()
        .replace(/\s+/g,"")
        .split("#")[0]
        .toLowerCase();
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
    if (killerName.startsWith("Minion_T100")){
        return "blue";
    }
    if (killerName.startsWith("Minion_T200")){
        return "red";
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
function resolveTowerKillTeam(event: LiveClientEvent): LeagueStudioTeam{
    const turretKilled = event.TurretKilled;

    if (!turretKilled) {
        return "unknown";
    }
    console.log("[TURRET KILLED]",turretKilled, "killer:",event.KillerName);
/*
T1 = ORDER 쪽 타워, 블루팀 포탑이 부서짐 -> 레드팀이 포탑 파괴 점수 획득
T2 = CHAOS 쪽 타워, ''
*/
    if (turretKilled.includes("ORDER") || turretKilled.includes("T1")){
        return "red";
    }
    if (turretKilled.includes("CHAOS") || turretKilled.includes("T2")){
        return "blue";
    }
    return "unknown";
}
function resolveObjectiveTeam(
    event: LiveClientEvent,
    players: LiveClientPlayer[],
): LeagueStudioTeam{
    //타워 이벤트는 TurretKilled 값으로 팀 판단
    if (event.EventName === "TurretKilled"){
        const towerTeam = resolveTowerKillTeam(event);

        if (towerTeam !== "unknown") {
            return towerTeam;
        }
        return resolveKillerTeam(event.KillerName, players);
    }
    return resolveKillerTeam(event.KillerName, players);
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
export function parseTowerEvents(
  events: LiveClientEvent[],
  allPlayers: LiveClientPlayer[],
): AgentTowerEvent[] {
  return events
    .filter((event) => event.EventName === TOWER_EVENT_NAME)
    .map((event) => {
      const destroyedTeam = resolveDestroyedTowerTeam(event.TurretKilled);

      // TurretKilled 값을 못 읽은 예외 상황에서만 KillerName 기반으로 보정
      const fallbackScoringTeam = resolveKillerTeam(
        event.KillerName,
        allPlayers,
      );

      const scoringTeam =
        destroyedTeam === "unknown"
          ? fallbackScoringTeam
          : getOppositeTeam(destroyedTeam);

      return {
        eventId: event.EventID,
        eventTime: event.EventTime,
        destroyedTeam,
        scoringTeam,
        rawEventName: "TurretKilled",
        turretKilled: event.TurretKilled,
        killerName: event.KillerName,
      };
    });
}

export function parseObjectiveEvents(
  events: LiveClientEvent[],
  players: LiveClientPlayer[]
): AgentObjectiveEvent[] {
  return events
    .filter((event) => isObjectiveRawEventName(event.EventName))
    .map((event) => {
        const rawEventName = event.EventName as ObjectiveRawEventName;
        const team = resolveObjectiveTeam(event, players);

        return {
            eventId: event.EventID,
            eventTime: event.EventTime,
            objective: toObjectiveType(rawEventName),
            rawEventName,
            team,
            killerName: event.KillerName,
            dragonType: toDragonType(event.DragonType),
            rawDragonType: event.DragonType,
            stolen: toBoolean(event.Stolen),
        };
    });
}
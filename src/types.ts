export type LiveClientTeam = "ORDER" | "CHAOS";

export type LeagueStudioTeam = "blue" | "red" | "unknown";

export type ObjectiveRawEventName =
    | "DragonKill"
    | "BaronKill"
    | "HeraldKill"
    | "HordeKill"
    | "TurretKilled";

export type ObjectiveType =
    | "dragon"
    | "baron"
    | "herald"
    | "voidgrub"
    | "tower";

export type DragonType =
    | "cloud"
    | "infernal"
    | "mountain"
    | "ocean"
    | "hextech"
    | "chemtech"
    | "elder";

export type AgentObjectiveEvent = {
    eventId: number;
    eventTime: number;
    objective: ObjectiveType;
    rawEventName: ObjectiveRawEventName;
    team: LeagueStudioTeam;
    killerName?: string;
    dragonType?: string;
    rawDragonType?: string;
    stolen?: boolean;
};


export type LiveClientPlayer = {
    summonerName?: string;
    riotId?: string;
    riotIdGameName?: string;
    riotIdTagLile?: string;
    championName?: string;
    team?: LiveClientTeam;
};

export type LiveClientEvent = {
  EventID: number;
  EventName: string;
  EventTime: number;
  KillerName?: string;
  DragonType?: string;
  Stolen?: string;
  Acer?: string;
  TurretKilled?: string;
  InhibKilled?: string;
};

export type LiveClientAllGameData = {
    allPlayers: LiveClientPlayer[];
    events: {
        Events: LiveClientEvent[];
    };
};

/*
export type ObjectiveEvent = {
  eventId: number;
  eventName: string;
  eventTime: number;
  killerName?: string;
  team: LeagueStudioTeam;
  dragonType?: string;
};
*/

export type AgentObjectiveEventPayload = {
    matchId: string;
    agentId: string;
    sentAt: string;
    event: AgentObjectiveEvent;
};
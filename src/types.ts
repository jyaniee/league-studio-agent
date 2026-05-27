export type LiveClientTeam = "ORDER" | "CHAOS";

export type LeagueStudioTeam = "blue" | "red" | "unknown";

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

export type ObjectiveEvent = {
  eventId: number;
  eventName: string;
  eventTime: number;
  killerName?: string;
  team: LeagueStudioTeam;
  dragonType?: string;
};
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
  events: {
    Events: LiveClientEvent[];
  };
};

export type ObjectiveEvent = {
  eventId: number;
  eventName: string;
  eventTime: number;
  killerName?: string;
  dragonType?: string;
};
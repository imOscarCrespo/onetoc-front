export interface Match {
  id: number;
  name: string;
  team: number;
  media: string | null;
  second_media: string | null;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  club: number;
}

export interface Club {
  id: number;
  name: string;
}

export interface Player {
  id: number;
  name: string;
  number: string;
  position: string;
  total_minutes: number;
}

export interface Action {
  id: number;
  name: string;
  key: string;
  color: string;
  match: number | null;
  enabled: boolean;
  default: boolean;
  team: number;
  status: string;
}

export interface EventOnetoc {
  id: number;
  match: number;
  action: number;
  status: string;
  created_at: string;
  updated_at: string;
  updated_by: number;
  start: number;
  delay_start: number;
  type: string;
}

export interface MatchInfo {
  id: number;
  match: number;
  yellow_card: number;
  yellow_card_opponent: number;
  red_card: number;
  red_card_opponent: number;
  goal: number;
  goal_opponent: number;
  substitution: number;
  substitution_opponent: number;
  corner: number;
  corner_opponent: number;
  [key: string]: number;
}

export interface LineupWithPlayer {
  is_starter: boolean;
  id: number;
  match: number;
  player: Player;
  created_at: string;
  updated_at: string;
  updated_by: number;
}
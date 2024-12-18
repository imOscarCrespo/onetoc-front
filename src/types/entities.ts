// Common types
interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}

// Team related
export interface Team extends BaseEntity {
  name: string;
  logo_url?: string;
  description?: string;
}

// Action related
export interface Action extends BaseEntity {
  key: string;
  name: string;
  team: number; // team ID
  default: boolean;
  icon?: string;
  description?: string;
}

// Match related
export interface Match extends BaseEntity {
  name: string;
  team_home: number; // team ID
  team_away: number; // team ID
  date: string;
  location?: string;
  competition?: string;
}

// Match Info (Statistics)
export interface MatchInfo extends BaseEntity {
  match: number; // match ID
  goal: number;
  goal_opponent: number;
  yellow_card: number;
  yellow_card_opponent: number;
  red_card: number;
  red_card_opponent: number;
  corner: number;
  corner_opponent: number;
  substitution: number;
  substitution_opponent: number;
  possession?: number;
  shots_on_target?: number;
  shots_on_target_opponent?: number;
}

// Event related
export interface EventOnetoc extends BaseEntity {
  match: number; // match ID
  action: number; // action ID
  start: number;
  delay_start: number;
  end?: number;
  delay_end?: number;
  notes?: string;
}

// Player related (if needed)
export interface Player extends BaseEntity {
  team: number; // team ID
  name: string;
  number?: number;
  position?: string;
  is_active: boolean;
}

// You might want to create some utility types as well
export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';
export type ActionKey = string; // You could make this more specific with literal types

// Response types for API calls
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
} 
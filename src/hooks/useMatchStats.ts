import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

interface Action {
  id: number;
  key: string;
  name: string;
  match: number;
}

interface Event {
  id: number;
  match: number;
  action: number;
  status: string;
  created_at: string;
  updated_at: string;
  updated_by: number;
  start: number,
  delay_start: number;
  type: string;
}

export function useMatchStats(matchId: string) {
  // Get the team ID from the match first
  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });

  const { data: actions } = useQuery<Action[]>({
    queryKey: ['actions', matchId],
    queryFn: async () => {
      if (!match?.team) return [];
      const response = await api.get(`/action?&team=${match.team}`);
      return response.data;
    },
    enabled: !!match?.team
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ['events', matchId],
    queryFn: async () => {
      const response = await api.get(`/event?match=${matchId}`);
      return response.data;
    },
  });

  const getEventCount = (type: string) => {
    if (!events) return 0;
    return events.filter(event => event.type === type).length;
  };

  return {
    stats: {
      home: {
        yellowCards: getEventCount('yellow_card'),
        redCards: getEventCount('red_card'),
        corners: getEventCount('corner'),
        substitutions: getEventCount('substitution')
      },
      away: {
        yellowCards: getEventCount('yellow_card_oponent'),
        redCards: getEventCount('red_card_oponent'),
        corners: getEventCount('corner_oponent'),
        substitutions: getEventCount('substitution_oponent')
      }
    },
    actions,
    events
  };
}
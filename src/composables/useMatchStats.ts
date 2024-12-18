import { useQuery } from '@tanstack/vue-query';
import api from '@/services/api';
import type { Action, EventOnetoc } from '@/types';

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
      if (!match?.value?.team) return [];
      const response = await api.get(`/action?&team=${match.value.team}`);
      return response.data;
    },
    enabled: !!match?.value?.team
  });

  const { data: events } = useQuery<EventOnetoc[]>({
    queryKey: ['events', matchId],
    queryFn: async () => {
      const response = await api.get(`/event?match=${matchId}`);
      return response.data;
    },
  });

  const getEventCount = (type: string) => {
    if (!events?.value) return 0;
    return events.value.filter(event => event.type === type).length;
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
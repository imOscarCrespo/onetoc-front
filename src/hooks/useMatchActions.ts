import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

interface Action {
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

const TIME_OFFSET = 7; // 7 seconds offset


export function useMatchActions(matchId: string) {
  const queryClient = useQueryClient();

  // Get the team ID from the match first
  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });



  // Get actions after ensuring defaults exist
  const { data: actions, isLoading: isLoadingActions } = useQuery<Action[]>({
    queryKey: ['actions', matchId],
    queryFn: async () => {
      if (!match?.team) return [];
      const response = await api.get(`/action?&team=${match.team}`);
      return response.data;
    },
    enabled: !!match?.team
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['events', matchId],
    queryFn: async () => {
      const response = await api.get(`/event?match=${matchId}`);
      return response.data.sort((a: Event, b: Event) => (a.start-a.delay_start) - (b.start-b.delay_start));
    },
  });

  const createEvent = useMutation({
    mutationFn: async (actionKey: string) => {
      const selectedAction = actions?.find(action => action.key === actionKey);
      if (!selectedAction) {
        throw new Error(`Action not found: ${actionKey}`);
      }

      const response = await api.post('/event', {
        match: Number(matchId),
        action: selectedAction.id,
        start: Math.max(0, Date.now() / 1000 - TIME_OFFSET),
        delay_start: 7,
        type: actionKey
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      queryClient.invalidateQueries({ queryKey: ['match-info', matchId] });
    }
  });

  return {
    actions,
    events,
    isLoading: isLoadingActions || isLoadingEvents,
    createEvent
  };
}
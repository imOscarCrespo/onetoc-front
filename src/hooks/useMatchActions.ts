import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { actionTranslations } from '../translations/actions';

interface Action {
  id: number;
  name: string;
  key: string;
  color: string;
  match: number | null;
  enabled: boolean;
  default: boolean;
  team: number;
}

interface Event {
  id: number;
  match: number;
  action: number;
  status: string;
  created_at: string;
  updated_at: string;
  updated_by: number;
  delay: number;
  type: string;
}

const TIME_OFFSET = 7; // 7 seconds offset

const DEFAULT_ACTIONS = Object.entries(actionTranslations).map(([key, value]) => ({
  name: value.name,
  key,
  color: '#000000',
  enabled: true,
  default: true
}));

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

  // Create default actions if they don't exist
  // const createDefaultActions = useMutation({
  //   mutationFn: async () => {
  //     if (!match?.team) return;
  //     console.log('3')
  //     const existingActions = await api.get(`/action?matches=${matchId}&team=${match.team}`);
  //     const existingKeys = new Set(existingActions.data.map((a: Action) => a.key));

  //     const actionsToCreate = DEFAULT_ACTIONS.filter(action => !existingKeys.has(action.key));

  //     if (actionsToCreate.length === 0) return;
  //     console.log('2')
  //     return Promise.all(
  //       actionsToCreate.map(action =>
  //         api.post('/action', {
  //           ...action,
  //           team: match.team,
  //           match: null
  //         })
  //       )
  //     );
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['actions', matchId] });
  //   }
  // });

  // Get actions after ensuring defaults exist
  const { data: actions, isLoading: isLoadingActions } = useQuery<Action[]>({
    queryKey: ['actions', matchId],
    queryFn: async () => {
      if (!match?.team) return [];
      // await createDefaultActions.mutateAsync();
      console.log('4')
      const response = await api.get(`/action?matches=${matchId}&team=${match.team}`);
      return response.data;
    },
    enabled: !!match?.team
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['events', matchId],
    queryFn: async () => {
      const response = await api.get(`/event?match=${matchId}`);
      return response.data;
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
        delay: Math.max(0, Date.now() / 1000 - TIME_OFFSET),
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
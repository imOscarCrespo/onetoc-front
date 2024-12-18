import { ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/services/api';
import type { Action, EventOnetoc } from '@/types';

const TIME_OFFSET = 7; // 7 seconds offset

export function useMatchActions(matchId: string) {
  const queryClient = useQueryClient();
  const isCreatingEvent = ref(false);

  // Get the team ID from the match first
  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });

  // Get actions after ensuring defaults exist
  const { data: actions } = useQuery({
    queryKey: ['actions', matchId],
    queryFn: async () => {
      if (!match?.value?.team) return [];
      const response = await api.get(`/action?team=${match.value.team}`);
      return response.data;
    },
    enabled: !!match?.value?.team
  });

  const { data: events } = useQuery({
    queryKey: ['events', matchId],
    queryFn: async () => {
      const response = await api.get(`/event?match=${matchId}`);
      return response.data.sort((a: EventOnetoc, b: EventOnetoc) => 
        (a.start - a.delay_start) - (b.start - b.delay_start)
      );
    },
  });

  const createEvent = useMutation({
    mutationFn: async (actionKey: string) => {
      isCreatingEvent.value = true;
      const selectedAction = actions?.value?.find((action: Action) => action.key === actionKey);
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

      // Update match info if needed
      if (actionKey !== 'automatic') {
        await api.patch(`/matchInfo/${match.value?.id}`, {
          [actionKey]: 1
        });
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', matchId] });
      queryClient.invalidateQueries({ queryKey: ['match-info', matchId] });
      isCreatingEvent.value = false;
    },
    onError: () => {
      isCreatingEvent.value = false;
    }
  });

  return {
    match,
    actions,
    events,
    isCreatingEvent,
    createEvent
  };
}
<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="isLoading" class="flex justify-center items-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading match data...</p>
      </div>
    </div>

    <div v-else class="p-4">
      <div class="max-w-lg mx-auto">
        <!-- Tabs -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="tab in tabs"
            :key="tab"
            @click="activeTab = tab"
            :class="[
              'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
              activeTab === tab
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            ]"
          >
            {{ tab === 'analysis' ? 'Analysis' : `Events (${sortedEvents.length})` }}
          </button>
        </div>

        <!-- Analysis Tab -->
        <div v-if="activeTab === 'analysis'" class="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <!-- Score Display -->
          <div class="flex items-center justify-between mb-6 sm:mb-8">
            <div class="text-center flex-1">
              <p class="text-xs sm:text-sm font-medium mb-1 truncate px-2">{{ selectedTeamName }}</p>
              <p class="text-3xl sm:text-4xl font-bold mb-2">{{ matchInfo?.goal || 0 }}</p>
            </div>
            <div class="px-2 sm:px-4">
              <button
                @click="openScoreModal"
                class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Edit score"
              >
                <Edit2Icon class="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div class="text-center flex-1">
              <p class="text-xs sm:text-sm font-medium mb-1 truncate px-2">{{ match?.name }}</p>
              <p class="text-3xl sm:text-4xl font-bold mb-2">{{ matchInfo?.goal_opponent || 0 }}</p>
            </div>
          </div>

          <div class="text-center mb-6 sm:mb-8">
            <div class="text-4xl sm:text-6xl font-mono font-bold mb-4 sm:mb-6">
              {{ formatTime(time) }}
            </div>
            <div class="flex justify-center gap-3 sm:gap-4">
              <button
                @click="toggleTimer"
                class="btn flex items-center gap-2 px-4 sm:px-6 py-2"
              >
                <component :is="isRunning ? PauseIcon : PlayIcon" class="w-4 h-4 sm:w-5 sm:h-5" />
                <span class="sm:inline">{{ isRunning ? 'Pause' : 'Start' }}</span>
              </button>
              <button
                @click="resetTimer"
                class="btn bg-gray-500 hover:bg-gray-600 flex items-center gap-2"
              >
                <span class="sm:inline">Reset</span>
              </button>
              <template v-for="action in timerActions" :key="action.id">
                <ActionButton
                  :action-key="action.key"
                  :is-disabled="isCreatingEvent"
                  :color="action.color"
                  class="btn bg-gray-500 hover:bg-gray-600"
                  @create-event="createEvent"
                />
              </template>
            </div>
          </div>

          <div class="space-y-3 sm:space-y-4">
            <!-- Default Actions -->

            <!-- Team Actions Grid -->
            <div class="grid grid-cols-2 gap-2 sm:gap-4">
              <div class="grid grid-cols-2 gap-2 sm:gap-4">
                <ActionButton
                  v-for="action in defaultActions"
                  :key="action.id"
                  :action-key="action.key"
                  :color="action.color"
                  :is-disabled="isCreatingEvent"
                  class="bg-gray-500 hover:bg-gray-400"
                  @create-event="createEvent"
                />
              </div>

              <div class="grid grid-cols-2 gap-2 sm:gap-4">
                <ActionButton
                  v-for="action in defaultActionsOpponent"
                  :key="action.id"
                  :action-key="action.key"
                  :color="action.color"
                  :is-disabled="isCreatingEvent"
                  class="bg-gray-500 hover:bg-gray-400"
                  @create-event="createEvent"
                />
              </div>
            </div>

            <div class="h-px bg-gray-200 my-4 sm:my-6"></div>

            <div class="grid grid-cols-4 gap-2 sm:gap-4">
              <ActionButton
                v-for="action in customActions"
                :key="action.id"
                :action-key="action.key"
                :is-disabled="isCreatingEvent"
                :color="action.color"
                class="bg-gray-500 hover:bg-gray-400"
                @create-event="createEvent"
              />
            </div>
          </div>
        </div>

        <!-- Events Tab -->
        <div v-else class="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div class="space-y-3">
            <div
              v-for="event in sortedEvents"
              :key="event.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <span class="font-mono">{{ formatTime(event.start - event.delay_start) }}</span>
                <span>{{ getEventTranslation(event) }}</span>
              </div>
              <span class="text-xs sm:text-sm text-gray-500">
                {{ new Date(event.created_at).toLocaleTimeString() }}
              </span>
              <button
                @click="deleteEvent(event.id)"
                class="text-red-500 hover:text-red-700 ml-2"
                title="Delete event"
              >
                <Trash2Icon class="w-4 h-4" />
              </button>
            </div>

            <p v-if="!eventsData?.length" class="text-center text-gray-500 py-4">
              No events recorded yet
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Score Modal -->
    <BaseModal
      :is-open="isScoreModalOpen"
      title="Edit Score"
      :on-close="closeScoreModal"
    >
      <form @submit.prevent="updateScore">
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ selectedTeamName }}
            </label>
            <input
              type="number"
              min="0"
              v-model="score.home"
              class="input"
              placeholder="0"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ match?.name }}
            </label>
            <input
              type="number"
              min="0"
              v-model="score.away"
              class="input"
              placeholder="0"
            />
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="closeScoreModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn"
            :disabled="isUpdatingScore"
          >
            {{ isUpdatingScore ? 'Updating...' : 'Update Score' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import BaseModal from '@/components/BaseModal.vue';
import TeamStats from '@/components/match/TeamStats.vue';
import HomeTeamActions from '@/components/match/HomeTeamActions.vue';
import AwayTeamActions from '@/components/match/AwayTeamActions.vue';
import ActionButton from '@/components/match/ActionButton.vue';
import { useTimer } from '@/composables/useTimer';
import api from '@/services/api';
import type { Match, Action, EventOnetoc, MatchInfo } from '@/types';
import { PauseIcon, PlayIcon } from 'lucide-vue-next';

const route = useRoute();
const toast = useToast();
const queryClient = useQueryClient();

const matchId = route.params.matchId as string;
const selectedTeamName = localStorage.getItem('selectedTeamName') || 'Home Team';
const teamId = localStorage.getItem('teamId');
const activeTab = ref<'analysis' | 'events'>('analysis');
const isScoreModalOpen = ref(false);
const score = ref({ home: '', away: '' });
const isUpdatingScore = ref(false);

const { time, isRunning, toggleTimer, resetTimer, formatTime } = useTimer(matchId);

// Add loading state
const isLoading = ref(true);

// Initialize data refs
const matchInfoData = ref<MatchInfo | null>(null);
const match = ref<Match | null>(null);
const matchData = ref<Match | null>(null);
const actionsData = ref<Action[]>([]);
const actionsOpponentData = ref<Action[]>([]);
const actionsMatchData = ref<Action[]>([]);
const eventsData = ref<EventOnetoc[]>([]);

// Create fetch functions
const fetchInitialData = async () => {
  try {
    const [matchInfoRes, matchRes, actionsRes, eventsRes] = await Promise.all([
      api.get(`/matchInfo?match=${matchId}`),
      api.get(`/match/${matchId}`),
      teamId ? api.get(`/action?team=${teamId}`) : Promise.resolve({ data: [] }),
      api.get(`/event?match=${matchId}`)
    ]);

    matchInfoData.value = matchInfoRes.data;
    match.value = matchRes.data;
    matchData.value = matchRes.data;
    actionsData.value = actionsRes.data.filter((action: Action) => !action.key.includes('opponent')).filter((action: Action) => action.key !== 'automatic' && action.key !== 'first_half');
    actionsOpponentData.value = actionsRes.data.filter((action: Action) => action.key.includes('opponent'));
    actionsMatchData.value = actionsRes.data.filter((action: Action) => action.key === 'automatic' || action.key === 'first_half');
    eventsData.value = eventsRes.data;
  } catch (error) {
    toast.error('Failed to load match data');
  } finally {
    isLoading.value = false;
  }
};

// Initialize data on mount
onMounted(() => {
  fetchInitialData();
});

// Queries
const { data: matchInfo } = useQuery<MatchInfo>({
  queryKey: ['match-info', matchId],
  queryFn: async () => {
    const response = await api.get(`/matchInfo?match=${matchId}`);
    return response.data;
  },
  retry: false,
  refetchOnWindowFocus: false
});

const createEventMutation = useMutation({
  mutationFn: async (actionKey: string) => {
    const allActions = [...actionsData.value, ...actionsMatchData.value, ...actionsOpponentData.value];
    const action = allActions.find((a: Action) => a.key === actionKey);
    if (!action) throw new Error('Action not found');

    const response = await api.post('/event', {
      match: matchId,
      action: action.id,
      start: time.value,
      delay_start: time.value < 6 ? 0 : 5
    });

    // Actualizar matchInfo si es un gol
    if (action.key === 'goal' || action.key === 'goal_opponent') {
      const currentMatchInfo = matchInfoData.value;
      if (currentMatchInfo) {
        await api.patch(`/matchInfo/${currentMatchInfo.id}`, {
          goal: action.key === 'goal' ? (currentMatchInfo.goal || 0) + 1 : currentMatchInfo.goal,
          goal_opponent: action.key === 'goal_opponent' ? (currentMatchInfo.goal_opponent || 0) + 1 : currentMatchInfo.goal_opponent
        });
      }
    }

    return response;
  },
  onSuccess: async () => {
    // Refetch data after successful mutation
    await fetchInitialData();
    await queryClient.invalidateQueries({ queryKey: ['match-info', matchId] });
  }
});

// Computed
const defaultActions = computed(() => 
  actionsData.value.filter((action: Action) => action.default && action.status !== 'INACTIVE').filter((action: Action) => !action.name.includes('opponent'))
);

const defaultActionsOpponent = computed(() => 
  actionsOpponentData.value.filter((action: Action) => 
    action.default && 
    action.status !== 'INACTIVE' && 
    action.key.includes('opponent')
  )
  
);
const customActions = computed(() => 
  actionsData.value.filter((action: Action) => !action.default && action.status !== 'INACTIVE')
);

const sortedEvents = computed(() => 
  eventsData.value.slice().sort((a: EventOnetoc, b: EventOnetoc) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
);

const homeStats = computed(() => ({
  yellowCards: matchInfoData.value?.yellow_card || 0,
  redCards: matchInfoData.value?.red_card || 0,
  corners: matchInfoData.value?.corner || 0,
  substitutions: matchInfoData.value?.substitution || 0
}));

const awayStats = computed(() => ({
  yellowCards: matchInfoData.value?.yellow_card_opponent || 0,
  redCards: matchInfoData.value?.red_card_opponent || 0,
  corners: matchInfoData.value?.corner_opponent || 0,
  substitutions: matchInfoData.value?.substitution_opponent || 0
}));

const isCreatingEvent = computed(() => createEventMutation.isPending.value);

const timerActions = computed(() => 
  actionsMatchData.value.filter((action: Action) => 
    action.key === 'first_half' || action.key === 'automatic'
  )
);

// Mutations
const deleteEventMutation = useMutation({
  mutationFn: async (eventId: number) => {
    await api.patch(`/event/${eventId}/`, {
      status: 'INACTIVE'
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events', matchId] });
    toast.success('Event deleted successfully');
  },
  onError: () => {
    toast.error('Failed to delete event');
  }
});

const updateScoreMutation = useMutation({
  mutationFn: async ({ home, away }: { home: string; away: string }) => {
    console.log('updateScoreMutation', home, away);
    if (!matchInfoData.value) return;
    
    return api.patch(`/matchInfo/${matchInfoData.value.id}`, {
      goal: parseInt(home) || 0,
      goal_opponent: parseInt(away) || 0
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['match-info', matchId] });
    closeScoreModal();
    toast.success('Score updated successfully');
  },
  onError: () => {
    toast.error('Failed to update score');
  }
});

// Methods
const createEvent = async (actionKey: string) => {
  try {
    console.log('actionKey', actionKey);
    await createEventMutation.mutateAsync(actionKey);
    toast.success('Event recorded successfully');
  } catch (error) {
    toast.error('Failed to record event');
    console.log('error', error);
  }
};

const deleteEvent = (eventId: number) => {
  deleteEventMutation.mutate(eventId);
};

const openScoreModal = () => {
  score.value = {
    home: String(matchInfoData.value?.goal || ''),
    away: String(matchInfoData.value?.goal_opponent || '')
  };
  isScoreModalOpen.value = true;
};

const closeScoreModal = () => {
  isScoreModalOpen.value = false;
  score.value = { home: '', away: '' };
};

const updateScore = () => {
  isUpdatingScore.value = true;
  updateScoreMutation.mutate(score.value);
};

const getEventTranslation = (event: EventOnetoc) => {
  const findActionName = (actions: Action[]) => 
    actions.find(a => a.id === event.action)?.name;

  return findActionName(actionsData.value) || 
         findActionName(actionsMatchData.value) || 
         findActionName(actionsOpponentData.value) || 
         'Unknown Action';
};

// Add to script setup:
const tabs = ['analysis', 'events'] as const;
</script>
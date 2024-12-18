<template>
  <main class="h-screen max-w-[1920px] mx-auto px-4 py-8 flex flex-col min-h-0">
    <!-- Botones de First/Second Half -->
    <div class="flex gap-2 mb-4 shrink-0">
      <button
        v-for="half in halves"
        :key="half"
        @click="activeHalf = half"
        :class="[
          'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
          activeHalf === half
            ? 'bg-black text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        ]"
      >
        {{ half === 'first' ? 'First Half' : 'Second Half' }}
      </button>
    </div>

    <!-- Contenedor principal -->
    <div class="flex gap-6 min-h-0">
      <!-- Columna izquierda (Video) -->
      <div class="flex-1 shrink-0">
        <div v-if="!match?.media && !videoUrl && !match?.second_media" class="border border-gray-200 rounded p-8 text-center">
          <h3 class="text-lg font-medium">Upload Match Footage</h3>
          <p class="text-sm text-gray-500 mt-2">Add video footage for detailed analysis</p>
          <div class="mt-6">
            <label for="file-upload" class="btn cursor-pointer">
              Select Video
              <input
                id="file-upload"
                type="file"
                accept="video/*"
                class="hidden"
                @change="handleFileChange"
              />
            </label>
          </div>
        </div>

        <div v-if="match?.media || videoUrl || match?.second_media" class="flex gap-6">
          <!-- Contenedor del video que establecerá la altura -->
          <div class="flex-1">
            <VideoPlayer 
              ref="videoPlayerRef"
              class="w-full"
              :video-url="activeHalf === 'first' ? (match?.media || videoUrl || '') : (match?.second_media || '')"
              :on-file-change="handleFileUpload"
              :on-remove="removeVideo"
              :show-remove-button="!match?.media"
              :on-add-action="handleAddAction"
              :initial-markers="filteredEvents
                ?.filter(event => event.status !== 'INACTIVE')
                ?.map(event => ({
                  timestamp: event.start - event.delay_start,
                  date: event.created_at,
                  name: getAction(event)?.name || 'Unknown Action'
                }))
                .sort((a, b) => a.timestamp - b.timestamp) || []"
            />
          </div>

          <!-- Lista de eventos que se ajustará a la altura del video -->
          <div class="w-[400px]">
            <div class="card overflow-hidden">
              <!-- Header fijo -->
              <div class="p-4 border-b border-gray-200">
                <form @submit.prevent="handleDelayAdjustment" class="flex items-end gap-4">
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Adjust All Event Times (seconds)
                    </label>
                    <input
                      type="number"
                      v-model="delayAdjustment"
                      class="input"
                      placeholder="Enter adjustment (e.g., +20 or -10)"
                    />
                  </div>
                  <button
                    type="submit"
                    :disabled="!delayAdjustment || isAdjustingDelays"
                    class="btn"
                  >
                    {{ isAdjustingDelays ? 'Adjusting...' : 'Apply' }}
                  </button>
                </form>
              </div>

              <!-- Lista de eventos con scroll -->
              <div class="overflow-y-auto" style="max-height: calc(100vh - 200px)">
                <div class="divide-y divide-gray-200">
                  <div 
                    v-for="(events, actionId) in groupedEvents" 
                    :key="actionId" 
                    class="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      @click="toggleAction(actionId)"
                      class="flex items-center justify-between w-full"
                    >
                      <div class="flex items-center gap-2">
                        <span 
                          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                          :style="{ 
                            backgroundColor: `${getAction(events[0])?.color}20`, 
                            color: getAction(events[0])?.color 
                          }"
                        >
                          {{ getAction(events[0])?.name || 'Unknown' }}
                          <span class="ml-2 bg-white bg-opacity-30 px-2 rounded-full">
                            {{ events.length }}
                          </span>
                        </span>
                      </div>
                      
                      <ChevronDownIcon 
                        class="w-5 h-5 transition-transform duration-200"
                        :class="{ 'rotate-180': expandedActions[actionId] }"
                      />
                    </button>

                    <div 
                      v-show="expandedActions[actionId]"
                      class="mt-3 space-y-2 pl-4"
                    >
                      <div 
                        v-for="event in events" 
                        :key="event.id"
                        class="w-full group bg-gray-50 hover:bg-gray-100 rounded-lg p-3 flex items-center gap-4 transition-colors"
                      >
                        <!-- Timestamp with play icon - clickable -->
                        <button
                          @click="seekToTime(event.start - event.delay_start)"
                          class="flex items-center gap-2"
                        >
                          <span class="font-medium">{{ formatTime(event.start - event.delay_start) }}</span>
                        </button>

                        <!-- Delay input and apply button -->
                        <div class="flex items-center gap-2">
                          <input
                            type="number"
                            v-model="individualDelays[event.id]"
                            class="w-20 h-8 px-2 text-sm border rounded"
                            placeholder="Delay"
                          />
                          <button
                            @click="handleIndividualDelay(event.id)"
                            class="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                            :disabled="!individualDelays[event.id]"
                          >
                            Apply
                          </button>
                        </div>

                        <!-- Visibility toggle button -->
                        <button
                          @click="toggleEventVisibility(event)"
                          class="px-2 py-1 text-sm rounded transition-colors"
                          :class="event.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'"
                          :title="event.status === 'PUBLISHED' ? 'Hide event' : 'Show event'"
                        >
                          {{ event.status === 'PUBLISHED' ? 'Active' : 'Inactive' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useMutation } from '@tanstack/vue-query';
import VideoPlayer from '@/components/VideoPlayer.vue';
import { useTimer } from '@/composables/useTimer';
import { useMatchVideo } from '@/composables/useMatchVideo';
import api from '@/services/api';
import type { Match, Action, EventOnetoc } from '@/types';
const route = useRoute();
const toast = useToast();

const matchId = route.params.matchId as string;
const activeHalf = ref<'first' | 'second'>('first');
const delayAdjustment = ref('');
const individualDelays = ref<Record<number, string>>({});
const isAdjustingDelays = ref(false);
const isDeletingEvent = ref(false);

const { videoUrl, handleFileUpload, removeVideo } = useMatchVideo(matchId);
const { formatTime } = useTimer(matchId);

const match = ref<Match | null>(null);
const actions = ref<Action[]>([]);
const events = ref<EventOnetoc[]>([]);
const isLoading = ref(true);

const fetchInitialData = async () => {
  const teamId = localStorage.getItem('teamId');
  try {
    const [matchRes, actionsRes, eventsRes] = await Promise.all([
      api.get(`/match/${matchId}`),
      api.get(`/action?team=${teamId}`),
      api.get(`/event?match=${matchId}`)
    ]);

    match.value = matchRes.data;
    actions.value = actionsRes.data;
    events.value = eventsRes.data.sort((a: EventOnetoc, b: EventOnetoc) => 
      (a.start - a.delay_start) - (b.start - b.delay_start)
    );
  } catch (error) {
    toast.error('Failed to load match data');
    console.error('Error loading initial data:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchInitialData();
});

const firstHalfEvent = computed(() => 
  events?.value?.find(event => {
    const action = actions?.value?.find(a => a.id === event.action);
    return action?.key === 'first_half';
  })
);

const filteredEvents = computed(() => 
  events?.value?.filter(event => {
    if (!firstHalfEvent.value) return true;
    
    if (activeHalf.value === 'first') {
      return new Date(event.created_at) < new Date(firstHalfEvent.value.created_at);
    } else {
      return new Date(event.created_at) >= new Date(firstHalfEvent.value.created_at);
    }
  })
);

const getAction = (event: EventOnetoc ) => 
  actions?.value?.find(action => action.id === event.action);

const handleFileChange = (e: Event) => {
  handleFileSelect(e as unknown as InputEvent);
};

const adjustEventDelaysMutation = useMutation({
  mutationFn: async (adjustment: number) => {
    if (!events.value?.length) return;
    const eventIds = events.value.map(event => event.id);
    
    await api.patch('/event', {
      ids: eventIds,
      update: {
        delay_start: adjustment
      }
    });
  },
  onSuccess: () => {
    fetchInitialData();
    toast.success('Event times adjusted successfully');
    delayAdjustment.value = '';
  },
  onError: () => {
    toast.error('Failed to adjust event times');
  }
});

const adjustIndividualDelayMutation = useMutation({
  mutationFn: async ({ eventId, adjustment }: { eventId: number; adjustment: number }) => {
    const event = events.value?.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    await api.patch(`/event/${eventId}/`, {
      delay_start: event.delay_start + adjustment
    });
  },
  onSuccess: () => {
    fetchInitialData();
    toast.success('Event time updated');
    individualDelays.value = {};
  },
  onError: () => {
    toast.error('Failed to update event time');
  }
});

const hideEventMutation = useMutation({
  mutationFn: async (eventId: number) => {
    await api.patch(`/event/${eventId}/`, {
      status: 'INACTIVE'
    });
  },
  onSuccess: () => {
    fetchInitialData();
    toast.success('Event hidden successfully');
  },
  onError: () => {
    toast.error('Failed to hide event');
  }
});

const handleDelayAdjustment = () => {
  const adjustment = parseInt(delayAdjustment.value);
  if (isNaN(adjustment)) {
    toast.error('Please enter a valid number');
    return;
  }

  const baseEvent = events?.value?.[0];
  if (!baseEvent) return;

  const newDelay = Math.max(0, baseEvent.delay_start + adjustment);
  isAdjustingDelays.value = true;
  adjustEventDelaysMutation.mutate(newDelay);
};

const handleIndividualDelay = (eventId: number) => {
  const adjustment = individualDelays.value[eventId];
  if (!adjustment) return;

  const parsedAdjustment = parseInt(adjustment);
  if (isNaN(parsedAdjustment)) {
    toast.error('Please enter a valid number');
    return;
  }

  adjustIndividualDelayMutation.mutate({ eventId, adjustment: parsedAdjustment });
};

const handleHideEvent = (eventId: number) => {
  isDeletingEvent.value = true;
  hideEventMutation.mutate(eventId);
};

const handleAddAction = async (timestamp: number) => {
  try {
    const result = await api.post('/event', {
      match: Number(matchId),
      action: actions?.value?.[0]?.id,
      start: timestamp,
      delay_start: 7,
      type: 'automatic'
    });
    
    fetchInitialData();
    toast.success('Event added successfully');
    return result.data;
  } catch (error) {
    toast.error('Failed to add event');
    throw error;
  }
};

const expandedActions = ref<Record<string, boolean>>({});

const groupedEvents = computed(() => {
  if (!filteredEvents.value) return null;
  
  return filteredEvents.value.reduce((groups: Record<string, EventOnetoc[]>, event) => {
    const actionId = event.action.toString();
    if (!groups[actionId]) {
      groups[actionId] = [];
    }
    groups[actionId].push(event);
    return groups;
  }, {});
});

const showEditTime = (event: EventOnetoc) => {
  individualDelays.value[event.id] = '';
  // Aquí podrías implementar un modal o un sistema in-line para editar el tiempo
};

const toggleAction = (actionId: string) => {
  expandedActions.value[actionId] = !expandedActions.value[actionId];
};

const toggleEventVisibilityMutation = useMutation({
  mutationFn: async (event: EventOnetoc) => {
    const newStatus = event.status === 'PUBLISHED' ? 'INACTIVE' : 'PUBLISHED';
    await api.patch(`/event/${event.id}/`, {
      status: newStatus
    });
  },
  onSuccess: () => {
    fetchInitialData();
    toast.success('Event status updated successfully');
  },
  onError: () => {
    toast.error('Failed to update event status');
  }
});

const toggleEventVisibility = (event: EventOnetoc) => {
  toggleEventVisibilityMutation.mutate(event);
};

const halves = ['first', 'second'] as const;

interface VideoPlayerInstance {
  seekToTime: (time: number) => void;
}

const videoPlayerRef = ref<VideoPlayerInstance | null>(null);

const seekToTime = (time: number) => {
  videoPlayerRef.value?.seekToTime(time);
};

const handleFileSelect = (e: InputEvent) => {
  const target = e.target as HTMLInputElement;
  const selectedFile = target.files?.[0];
  if (selectedFile) {
    handleFileUpload(selectedFile);
    toast.success('Match footage loaded successfully');
  }
};
</script>
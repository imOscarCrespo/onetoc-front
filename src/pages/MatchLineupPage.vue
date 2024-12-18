<template>
  <DndContext
    :sensors="sensors"
    @drag-start="handleDragStart"
    @drag-end="handleDragEnd"
  >
    <main class="min-h-screen bg-gray-50 p-8">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center gap-4 mb-8">
          <div class="flex-1">
            <h1 class="text-xl font-medium">{{ match?.name }}</h1>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Available Players -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200 bg-gray-50">
              <h2 class="font-medium">Available Players</h2>
            </div>
            <div class="divide-y divide-gray-100">
              <div
                v-for="player in availablePlayers"
                :key="player.id"
                class="p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {{ player.number }}
                    </div>
                    <div>
                      <p class="font-medium">{{ player.name }}</p>
                      <p class="text-sm text-gray-500">{{ player.position }}</p>
                      <p class="text-sm text-gray-500">{{ player.total_minutes }} min</p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      @click="handleAddPlayer(player, 'starters')"
                      class="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      title="Add to starting lineup"
                    >
                      <ArrowRightIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleAddPlayer(player, 'substitutes')"
                      class="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                      title="Add to substitutes"
                    >
                      <ArrowRightIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="!availablePlayers.length" class="p-4 text-center text-gray-500">
                No players available. Add players to the team first.
              </div>
            </div>
          </div>

          <!-- Starting Lineup -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200 bg-gray-50">
              <h2 class="font-medium">Starting Lineup ({{ starters.length }}/11)</h2>
            </div>
            <SortableContext
              :items="starters.map(p => p.id)"
              :strategy="verticalListSortingStrategy"
              children
            >
              <DroppableArea id="starters">
                <PlayerCard
                  v-for="lineup in starters"
                  :key="lineup.id"
                  :player="lineup.player"
                  @remove="() => handleRemovePlayer(lineup.id)"
                />
                <div v-if="!starters.length" class="text-center py-8 text-gray-500">
                  Drag players here or use the arrow button to add them to the starting lineup
                </div>
              </DroppableArea>
            </SortableContext>
          </div>

          <!-- Substitutes -->
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200 bg-gray-50">
              <h2 class="font-medium">Substitutes ({{ substitutes.length }})</h2>
            </div>
            <SortableContext
              :items="substitutes.map(p => p.id)"
              :strategy="verticalListSortingStrategy"
              children
            >
              <DroppableArea id="substitutes">
                <PlayerCard
                  v-for="lineup in substitutes"
                  :key="lineup.id"
                  :player="lineup.player"
                  @remove="() => handleRemovePlayer(lineup.id)"
                />
                <div v-if="!substitutes.length" class="text-center py-8 text-gray-500">
                  Drag players here or use the arrow button to add them to the substitutes bench
                </div>
              </DroppableArea>
            </SortableContext>
          </div>
        </div>
      </div>

      <DragOverlay>
        <div
          v-if="activePlayer"
          class="bg-white rounded-lg border border-gray-200 shadow-lg p-4"
        >
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
              {{ activePlayer.player.number }}
            </div>
            <div>
              <p class="font-medium">{{ activePlayer.player.name }}</p>
              <p class="text-sm text-gray-500">{{ activePlayer.player.position }}</p>
            </div>
          </div>
        </div>
      </DragOverlay>
    </main>
  </DndContext>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { 
  DndContext, 
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { ArrowRightIcon } from 'lucide-vue-next';
import DroppableArea from '@/components/lineup/DroppableArea.vue';
import PlayerCard from '@/components/lineup/PlayerCard.vue';
import api from '@/services/api';
import type { Match, Player, LineupWithPlayer } from '@/types';
import { verticalListSortingStrategy } from '@dnd-kit/sortable';

const route = useRoute();
const toast = useToast();

const matchId = route.params.matchId as string;
const teamId = new URLSearchParams(window.location.search).get('teamId');

const starters = ref<LineupWithPlayer[]>([]);
const substitutes = ref<LineupWithPlayer[]>([]);
const activeId = ref<number | null>(null);
const activeList = ref<'starters' | 'substitutes' | null>(null);
const players = ref<Player[]>([]);
const lineups = ref<LineupWithPlayer[]>([]);

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
);

const { data: match } = useQuery<Match>({
  queryKey: ['match', matchId],
  queryFn: async () => {
    const response = await api.get(`/match/${matchId}`);
    return response.data;
  }
});

// Fetch players
useQuery({
  queryKey: ['players', teamId],
  queryFn: async () => {
    try {
      const response = await api.get(`/player?team=${teamId}`);
      players.value = response.data;
    } catch (error) {
      toast.error('Failed to fetch players');
    }
  }
});

// Fetch lineup
useQuery({
  queryKey: ['lineup', matchId],
  queryFn: async () => {
    try {
      const response = await api.get(`/lineup?match=${matchId}`);
      lineups.value = response.data;
      starters.value = response.data.filter((lineup: LineupWithPlayer) => lineup.is_starter);
      substitutes.value = response.data.filter((lineup: LineupWithPlayer) => !lineup.is_starter);
    } catch (error) {
      toast.error('Failed to fetch lineup');
    }
  }
});

const availablePlayers = computed(() => 
  players.value.filter(player => 
    !lineups.value.some(lineup => lineup.player.id === player.id)
  )
);

const activePlayer = computed(() => 
  activeId.value ? [...starters.value, ...substitutes.value].find(p => p.id === activeId.value) : null
);

const createLineupMutation = useMutation({
  mutationFn: async ({ player, isStarter }: { player: Player; isStarter: boolean }) => {
    const response = await api.post('/lineup', {
      match: Number(matchId),
      player: player.id,
      is_starter: isStarter,
    });

    const newLineup: LineupWithPlayer = {
      id: response.data.id,
      match: Number(matchId),
      player: player,
      is_starter: isStarter,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 1,
    };

    lineups.value = [...lineups.value, newLineup];

    if (isStarter) {
      starters.value = [...starters.value, newLineup];
    } else {
      substitutes.value = [...substitutes.value, newLineup];
    }

    return response.data;
  },
  onError: () => {
    toast.error('Failed to add player to lineup');
  }
});

const deleteLineupMutation = useMutation({
  mutationFn: async (lineupId: number) => {
    await api.delete(`/lineup/${lineupId}`);
    
    lineups.value = lineups.value.filter(lineup => lineup.id !== lineupId);
    starters.value = starters.value.filter(lineup => lineup.id !== lineupId);
    substitutes.value = substitutes.value.filter(lineup => lineup.id !== lineupId);
  },
  onError: () => {
    toast.error('Failed to remove player from lineup');
  }
});

const handleDragStart = (event: DragStartEvent) => {
  const { active } = event;
  activeId.value = active.id as number;
  
  if (starters.value.find(p => p.id === active.id)) {
    activeList.value = 'starters';
  } else if (substitutes.value.find(p => p.id === active.id)) {
    activeList.value = 'substitutes';
  }
};

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (!over) return;

  const playerId = active.id as number;
  const player = [...starters.value, ...substitutes.value].find(p => p.id === playerId);
  
  if (!player) return;

  const targetList = over.id as 'starters' | 'substitutes';
  const sourceList = activeList.value;

  if (sourceList === targetList) return;

  // Remove from source list
  if (sourceList === 'starters') {
    starters.value = starters.value.filter(p => p.id !== playerId);
  } else if (sourceList === 'substitutes') {
    substitutes.value = substitutes.value.filter(p => p.id !== playerId);
  }

  // Add to target list
  if (targetList === 'starters') {
    if (starters.value.length < 11) {
      starters.value = [...starters.value, player];
    } else {
      substitutes.value = [...substitutes.value, player];
      toast.error('Starting lineup is limited to 11 players');
    }
  } else if (targetList === 'substitutes') {
    substitutes.value = [...substitutes.value, player];
  }

  activeId.value = null;
  activeList.value = null;
};

const handleAddPlayer = (player: Player, targetList: 'starters' | 'substitutes') => {
  const isStarter = targetList === 'starters';
  if (isStarter && starters.value.length >= 11) {
    toast.error('Starting lineup is limited to 11 players');
    return;
  }
  createLineupMutation.mutate({ player, isStarter });
};

const handleRemovePlayer = (lineupId: number) => {
  deleteLineupMutation.mutate(lineupId);
};
</script>
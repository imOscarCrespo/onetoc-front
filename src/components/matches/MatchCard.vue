<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-black transition-colors">
    <div 
      class="p-4 cursor-pointer"
      @click="$emit('navigate', `/match/${match.id}`)"
    >
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-medium mb-2">{{ match.name }}</h3>
          <p class="text-sm text-gray-500">
            {{ formatDate(match.created_at) }}
          </p>
        </div>
        <button
          @click.stop="$emit('delete', match)"
          class="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
          title="Delete match"
        >
          <Trash2Icon class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div class="border-t border-gray-100 p-3 bg-gray-50 flex gap-2">
      <button
        @click="$emit('navigate', `/match/${match.id}/lineup?teamId=${match.team}`)"
        class="btn bg-blue-500 hover:bg-blue-600 flex-1 flex items-center justify-center gap-2 py-2"
      >
        <UsersIcon class="w-4 h-4" />
        Lineup
      </button>
      <button
        @click="$emit('navigate', `/match/${match.id}/live`)"
        class="btn bg-green-600 hover:bg-green-700 flex-1 flex items-center justify-center gap-2 py-2"
      >
        <PlayCircleIcon class="w-4 h-4" />
        Live
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match } from '@/types';

defineProps<{
  match: Match;
}>();

defineEmits<{
  (e: 'delete', match: Match): void;
  (e: 'navigate', path: string): void;
}>();

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};
</script>

<script lang="ts">
export default {
  name: 'MatchCard'
}
</script>
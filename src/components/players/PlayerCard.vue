<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 hover:border-black transition-colors">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-medium">
        {{ player.number }}
      </div>
      <div class="flex-1">
        <h3 class="font-medium">{{ player.name }}</h3>
        <p class="text-sm text-gray-500">{{ player.position }}</p>
        <div class="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <ClockIcon class="w-4 h-4" />
          <span>{{ player.total_minutes }} min played</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          @click="$emit('edit', player)"
          class="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
          title="Edit player"
        >
          <Edit2Icon class="w-4 h-4" />
        </button>
        <button
          @click="$emit('delete', player)"
          class="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
          title="Delete player"
        >
          <Trash2Icon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '@/types';

defineProps<{
  player: Player;
}>();

defineEmits<{
  (e: 'edit', player: Player): void;
  (e: 'delete', player: Player): void;
}>();
</script>

<script lang="ts">
export default {
  name: 'PlayerCard'
}
</script>

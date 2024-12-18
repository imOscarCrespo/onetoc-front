<template>
  <div
    ref="setNodeRef"
    :style="style"
    v-bind="attributes"
    v-on="listeners"
    class="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:border-black transition-colors"
    :class="{ 'opacity-50': isDragging }"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
          {{ player.number }}
        </div>
        <div>
          <p class="font-medium">{{ player.name }}</p>
          <p class="text-sm text-gray-500">{{ player.position }}</p>
        </div>
      </div>
      <button
        @click="$emit('remove')"
        class="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
        title="Remove from lineup"
      >
        <ArrowLeftIcon class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeftIcon } from 'lucide-vue-next';
import type { Player } from '@/types';

const props = defineProps<{
  player: Player;
}>();

defineEmits<{
  (e: 'remove'): void;
}>();

const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: props.player.id });

const style = computed(() => ({
  transform: transform ? CSS.Transform.toString(transform) : '',
  transition: transition || ''
}));
</script>

<script lang="ts">
export default {
  name: 'PlayerCard'
}
</script>
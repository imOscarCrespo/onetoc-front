<template>
  <div 
    :class="[
      'rounded-lg border p-4 transition-colors',
      action.status === 'INACTIVE' 
        ? 'bg-gray-300 border-gray-500 opacity-70' 
        : 'bg-white border-gray-200 hover:border-black'
    ]"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-3">
        <div 
          class="w-4 h-4 rounded-full"
          :style="{ backgroundColor: action.color }"
        />
        <h3 class="font-medium">{{ action.name }}</h3>
      </div>
      <div class="flex gap-2">
        <button
          @click="$emit('edit', action)"
          class="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
          title="Edit action"
        >
          <Edit2Icon class="w-4 h-4" />
        </button>
        <button
          @click="$emit('toggle-status', action)"
          :class="[
            'p-2 rounded-full transition-colors',
            action.status === 'INACTIVE'
              ? 'text-500 hover:bg-50'
              : 'text-500 hover:bg-50'
          ]"
          :title="action.status === 'INACTIVE' ? 'Enable action' : 'Disable action'"
        >
          {{ action.status === 'INACTIVE' ? 'Enable' : 'Disable' }}
        </button>
        <button
          @click="$emit('delete', action)"
          class="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
          title="Delete action"
        >
          <Trash2Icon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit2Icon, Trash2Icon } from 'lucide-vue-next';
import type { Action } from '@/types';

defineProps<{
  action: Action;
}>();

defineEmits<{
  (e: 'edit', action: Action): void;
  (e: 'delete', action: Action): void;
  (e: 'toggle-status', action: Action): void;
}>();
</script>

<script lang="ts">
export default {
  name: 'ActionCard'
}
</script>
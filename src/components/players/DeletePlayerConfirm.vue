<template>
  <div class="space-y-4">
    <p class="text-gray-600">
      Are you sure you want to delete <span class="font-medium">{{ player?.name }}</span>? 
      This action cannot be undone.
    </p>
    <div class="flex justify-end gap-3">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
      >
        Cancel
      </button>
      <button
        @click="$emit('confirm')"
        :disabled="isDeleting"
        class="btn bg-red-500 hover:bg-red-600"
      >
        {{ isDeleting ? 'Deleting...' : 'Delete Player' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import type { Player } from '@/types';

export default {
  name: 'DeletePlayerConfirm'
}
</script>

<script setup lang="ts">
defineProps<{
  player: Player | null;
  isDeleting: boolean;
}>();

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>
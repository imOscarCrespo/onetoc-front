<template>
  <form @submit.prevent="$emit('submit')" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Player Name
      </label>
      <input
        type="text"
        v-model="playerData.name"
        class="input"
        placeholder="Enter player name"
        required
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Jersey Number
      </label>
      <input
        type="number"
        v-model="playerData.number"
        class="input"
        placeholder="Enter jersey number"
        required
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Position
      </label>
      <select
        v-model="playerData.position"
        class="input"
        required
      >
        <option value="">Select position</option>
        <option v-for="position in positions" :key="position" :value="position">
          {{ position }}
        </option>
      </select>
    </div>

    <div v-if="mode === 'edit'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Add minutes
      </label>
      <input
        type="number"
        v-model="playerData.total_minutes"
        class="input"
        placeholder="Enter total minutes played"
        required
      />
    </div>

    <div class="flex justify-end gap-3">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn"
        :disabled="isSubmitting"
      >
        {{ isSubmitting 
          ? (mode === 'create' ? 'Adding...' : 'Updating...') 
          : (mode === 'create' ? 'Add Player' : 'Update Player') 
        }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  playerData: {
    name: string;
    number: string;
    position: string;
    total_minutes: number;
  };
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}>();

defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel'): void;
}>();

const positions = [
  'GOALKEEPER',
  'DEFENDER',
  'MIDFIELDER',
  'FORWARD'
];
</script>

<script lang="ts">
export default {
  name: 'PlayerForm'
}
</script>

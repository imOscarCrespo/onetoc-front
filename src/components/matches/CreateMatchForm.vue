<template>
  <form @submit.prevent="$emit('submit')">
    <div class="mb-4">
      <label for="matchName" class="block text-sm font-medium text-gray-700 mb-1">
        Match Name
      </label>
      <input
        type="text"
        id="matchName"
        :value="matchName"
        @input="handleInput"
        class="input"
        placeholder="Enter match name"
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
        :disabled="isCreating"
      >
        {{ isCreating ? 'Creating...' : 'Create Match' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  matchName: string;
  isCreating: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:match-name', value: string): void;
  (e: 'submit'): void;
  (e: 'cancel'): void;
}>();

const handleInput = (e: Event) => {
  emit('update:match-name', (e.target as HTMLInputElement).value);
};
</script>

<script lang="ts">
export default {
  name: 'CreateMatchForm'
}
</script>
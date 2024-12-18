<template>
  <form @submit.prevent="$emit('submit')">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Action Name
      </label>
      <input
        type="text"
        v-model="actionData.name"
        class="input"
        placeholder="Enter action name"
        required
      />
    </div>

    <div class="mt-4">
      <label class="flex items-center">
        <input
          type="checkbox"
          :checked="isTemporal"
          @change="$emit('update:is-temporal', ($event.target as HTMLInputElement).checked)"
          class="mr-2"
        />
        <span class="text-sm">Is this action temporal?</span>
      </label>
    </div>

    <div class="flex justify-end gap-3 mt-6">
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
          ? (mode === 'create' ? 'Creating...' : 'Updating...') 
          : (mode === 'create' ? 'Create Action' : 'Update Action')
        }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  actionData: {
    name: string;
    color: string;
  };
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  isTemporal: boolean;
}>();

defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel'): void;
  (e: 'update:is-temporal', value: boolean): void;
}>();
</script>
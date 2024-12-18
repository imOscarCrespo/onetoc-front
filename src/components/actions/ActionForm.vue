<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="color" class="block text-sm font-medium text-gray-700">Color</label>
      <div class="mt-1 flex items-center gap-3">
        <input
          id="color"
          v-model="formData.color"
          type="color"
          class="h-10 w-20 rounded border border-gray-300 p-1"
        />
        <span class="text-sm text-gray-500">{{ formData.color }}</span>
      </div>
    </div>

    <div v-if="mode === 'create'">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          v-model="isTemporal"
          class="rounded border-gray-300"
        />
        <span class="text-sm text-gray-700">Temporal action</span>
      </label>
    </div>

    <div class="flex justify-end gap-3 mt-6">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn-secondary"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="btn"
      >
        {{ mode === 'create' ? 'Create' : 'Update' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  actionData: {
    name: string;
    color: string;
  };
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
  isTemporal?: boolean;
}>();


const emit = defineEmits<{
  (e: 'submit', data: { name: string; color: string }): void;
  (e: 'cancel'): void;
  (e: 'update:isTemporal', value: boolean): void;
  (e: 'update:actionData', value: { name: string; color: string }): void;
}>();

const formData = ref({
  name: props.actionData.name,
  color: props.actionData.color
});

const isTemporal = ref(props.isTemporal);

watch(() => props.actionData, (newData) => {
  formData.value = { ...newData };
}, { deep: true });

watch(isTemporal, (value) => {
  emit('update:isTemporal', value);
});

watch(() => formData.value.name, (newValue) => {
  emit('update:actionData', { ...formData.value });
});

watch(() => formData.value.color, (newValue) => {
  emit('update:actionData', { ...formData.value });
});

const handleSubmit = () => {
  emit('submit', {
    name: formData.value.name,
    color: formData.value.color
  });
};
</script>

<script lang="ts">
export default {
  name: 'ActionForm'
}
</script>
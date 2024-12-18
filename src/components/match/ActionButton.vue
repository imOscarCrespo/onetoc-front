<template>
  <button
    @click="$emit('create-event', actionKey)"
    :disabled="isDisabled"
    class="w-full btn text-xs sm:text-sm py-3 flex items-center justify-center h-14"
    :class="$attrs.class"
    :style="{ backgroundColor: color }"
  >
    <span class="truncate px-1 break-words whitespace-normal leading-tight">
      {{ translation.name }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { actionTranslations } from '@/translations/actions';

const props = defineProps<{
  actionKey: string;
  isDisabled: boolean;
  color: string;
}>();

defineEmits<{
  (e: 'create-event', actionKey: string): void;
}>();

const translation = computed(() => ({
  name: actionTranslations[props.actionKey]?.shortName || 
        actionTranslations[props.actionKey]?.name.replace('Opp', '') || 
        props.actionKey,
  emoji: ''
}));
</script>

<script lang="ts">
export default {
  name: 'ActionButton'
}
</script>
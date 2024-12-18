<template>
  <button
    @click="$emit('create-event', actionKey)"
    :disabled="isDisabled"
    class="w-full btn text-xs sm:text-sm py-3 flex items-center justify-center h-14"
    :class="$attrs.class"
  >
    <span>
      {{ translation.name }} {{ translation.emoji }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { actionTranslations } from '@/translations/actions';

const props = defineProps<{
  actionKey: string;
  isDisabled: boolean;
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
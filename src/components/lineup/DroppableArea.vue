<template>
  <div ref="setNodeRef" class="min-h-[200px] p-4 space-y-2">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { useDroppable } from '@dnd-kit/core';

const props = defineProps<{
  id: 'starters' | 'substitutes';
}>();

const { setNodeRef } = useDroppable({ id: props.id });
</script>

<script lang="ts">
export default {
  name: 'DroppableArea'
}
</script>

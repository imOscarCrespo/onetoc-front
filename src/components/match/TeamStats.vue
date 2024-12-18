<template>
  <div class="flex items-center justify-center gap-1 xs:gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
    <div class="flex items-center gap-0.5 xs:gap-1">
      <span class="text-sm sm:text-base lg:text-lg">🟨</span>
      <span class="font-medium">{{ stats.yellowCards }}</span>
    </div>
    <div class="flex items-center gap-0.5 xs:gap-1">
      <span class="text-sm sm:text-base lg:text-lg">🟥</span>
      <span class="font-medium">{{ stats.redCards }}</span>
    </div>
    <div class="flex items-center gap-0.5 xs:gap-1">
      <span class="text-sm sm:text-base lg:text-lg">⛳</span>
      <span class="font-medium">{{ stats.corners }}</span>
    </div>
    <div class="flex items-center gap-0.5 xs:gap-1">
      <span class="text-sm sm:text-base lg:text-lg">🔄</span>
      <span class="font-medium">{{ stats.substitutions }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    yellowCards: number;
    redCards: number;
    corners: number;
    substitutions: number;
  };
}>();
</script>

<script lang="ts">
export default {
  name: 'TeamStats'
}
</script>
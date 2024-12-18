<template>
  <div class="space-y-2">
    <p class="text-xs sm:text-sm font-medium text-center mb-2">{{ teamName }} 🚌</p>
    <div class="grid grid-cols-2 gap-2">
      <ActionButton
        action-key="goal_kick_opponent"
        :is-disabled="isCreatingEvent"
        class="bg-purple-500 hover:bg-purple-600"
      />
      <ActionButton
        action-key="corner_opponent"
        :is-disabled="isCreatingEvent"
        class="bg-orange-500 hover:bg-orange-600"
      />
    </div>
    <div class="grid grid-cols-2 gap-2">
      <ActionButton
        action-key="yellow_card_opponent"
        :is-disabled="isCreatingEvent"
        class="bg-yellow-500 hover:bg-yellow-600"
      />
      <ActionButton
        action-key="goalkeeper_opponent"
        :is-disabled="isCreatingEvent"
        class="bg-red-500 hover:bg-red-600"
      />
    </div>
    <div class="grid grid-cols-2 gap-2">
      <ActionButton
        action-key="goal_opponent"
        :is-disabled="isCreatingEvent"
        class="bg-green-500 hover:bg-green-600"
      />
      <ActionButton
        action-key="goal_chance_opponent"
        :is-disabled="isCreatingEvent"
        class="bg-blue-500 hover:bg-blue-600"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  teamName: string;
  isCreatingEvent: boolean;
}>();
</script>

<script lang="ts">
export default {
  name: 'AwayTeamActions'
}
</script>
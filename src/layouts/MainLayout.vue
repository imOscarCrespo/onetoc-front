```vue
<template>
  <div>
    <Header v-if="!isLoginPage && !isTeamPage" back-text="Go Back" />
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/Header.vue';

const route = useRoute();

const isLoginPage = computed(() => route.path === '/login');
const isTeamPage = computed(() => route.path === '/');
</script>
```
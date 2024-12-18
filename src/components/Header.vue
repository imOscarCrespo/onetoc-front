```vue
<template>
  <header class="header py-4">
    <div class="mx-auto px-4">
      <div class="flex items-center justify-between">
        <button
          @click="handleBack"
          class="flex gap-2 text-sm text-gray-500 transition-colors"
        >
          ← {{ isMainPage ? 'Change Team' : backText }}
        </button>
        <button
          @click="handleLogout"
          class="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOutIcon class="w-4 h-4" />
          <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { LogOutIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  backText?: string;
  onBack?: () => void;
}>();

const router = useRouter();
const authStore = useAuthStore();

const isMainPage = computed(() => 
  window.location.pathname.includes('team')
);

const handleBack = () => {
  if (props.onBack) {
    props.onBack();
  } else if (window.location.pathname.includes('team')) {
    router.push('/');
  } else {
    router.back();
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
```
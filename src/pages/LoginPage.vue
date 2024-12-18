<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-sm card p-8">
      <div class="text-center mb-8">
        <div class="inline-block bg-black px-6 py-3 rounded-lg mb-6">
          <h1 class="text-white text-2xl font-light tracking-[0.2em]">
            ONETOC
          </h1>
        </div>
        <p class="text-gray-500">
          Sign in to manage your matches
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Username
          </label>
          <input
            type="text"
            v-model="credentials.username"
            class="input"
            required
            autofocus
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            v-model="credentials.password"
            class="input"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn w-full py-2.5 transition-all duration-200 transform active:scale-95"
        >
          <div v-if="loading" class="flex items-center justify-center">
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <span v-else>Sign In</span>
        </button>
      </form>

      <p class="mt-8 text-sm text-center text-gray-500">
        Analyze and improve your team's performance with app's advanced match tracking system.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const credentials = ref({
  username: '',
  password: ''
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;

  try {
    const success = await authStore.login(credentials.value.username, credentials.value.password);
    if (success) {
      router.push('/');
    } else {
      toast.error('Invalid credentials');
    }
  } finally {
    loading.value = false;
  }
};
</script>
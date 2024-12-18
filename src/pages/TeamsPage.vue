<template>
  <main class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-xl font-medium">Teams</h1>
      <button
        @click="isModalOpen = true"
        class="btn flex items-center gap-2"
      >
        <PlusIcon class="w-4 h-4" />
        New Team
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        v-for="team in teams"
        :key="team.id"
        @click="handleTeamSelect(team)"
        class="text-left p-6 border border-gray-200 rounded hover:border-black transition-colors"
      >
        <h2 class="text-lg font-medium">{{ team.name }}</h2>
      </button>
    </div>

    <BaseModal
      v-if="isModalOpen"
      :is-open="isModalOpen"
      title="Create New Team"
      :on-close="() => {
        isModalOpen = false;
        newTeamName = '';
        selectedClubId = null;
      }"
    >
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label for="teamName" class="block text-sm font-medium text-gray-700 mb-1">
            Team Name
          </label>
          <input
            type="text"
            id="teamName"
            v-model="newTeamName"
            class="input"
            placeholder="Enter team name"
            required
          />
        </div>
        <div class="mb-4">
          <label for="clubSelect" class="block text-sm font-medium text-gray-700 mb-1">
            Select Club
          </label>
          <select
            id="clubSelect"
            v-model="selectedClubId"
            class="input"
            required
          >
            <option value="" disabled>Select a club</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.name }}
            </option>
          </select>
        </div>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="() => {
              isModalOpen = false;
              newTeamName = '';
              selectedClubId = null;
            }"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn"
            :disabled="isCreating"
          >
            {{ isCreating ? 'Creating...' : 'Create Team' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { PlusIcon } from 'lucide-vue-next';
import api from '@/services/api';
import BaseModal from '@/components/BaseModal.vue';

interface Team {
  id: number;
  name: string;
  club: number;
}

interface Club {
  id: number;
  name: string;
}

const router = useRouter();
const toast = useToast();
const queryClient = useQueryClient();

const isModalOpen = ref(false);
const newTeamName = ref('');
const selectedClubId = ref<number | null>(null);
const isCreating = ref(false);

const { data: teams } = useQuery({
  queryKey: ['teams'],
  queryFn: async () => {
    const response = await api.get<Team[]>('/team');
    return response.data;
  }
});

const { data: clubs } = useQuery({
  queryKey: ['clubs'],
  queryFn: async () => {
    const response = await api.get<Club[]>('/club');
    return response.data;
  }
});

const createTeamMutation = useMutation({
  mutationFn: async ({ name, clubId }: { name: string; clubId: number }) => {
    return api.post('/team', { name, club: clubId });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    isModalOpen.value = false;
    newTeamName.value = '';
    selectedClubId.value = null;
    toast.success('Team created successfully');
  },
  onError: () => {
    toast.error('Failed to create team');
  }
});

const handleSubmit = () => {
  if (newTeamName.value.trim() && selectedClubId.value) {
    createTeamMutation.mutate({
      name: newTeamName.value,
      clubId: selectedClubId.value
    });
  }
};

const handleTeamSelect = (team: Team) => {
  localStorage.setItem('selectedTeamName', team.name);
  localStorage.setItem('teamId', team.id.toString());
  router.push(`/team/${team.id}/matches`);
};
</script>
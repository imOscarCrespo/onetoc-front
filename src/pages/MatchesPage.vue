<template>
  <div class="flex min-h-screen bg-gray-50">
    <TeamSidebar :team-id="teamId" active-tab="matches" />
    
    <main class="flex-1 p-8">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-xl font-medium">Matches</h1>
          <button
            @click="isModalOpen = true"
            class="btn flex items-center gap-2"
          >
            <PlusIcon class="w-4 h-4" />
            New Match
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MatchCard
            v-for="match in matches"
            :key="match.id"
            :match="match"
            @delete="handleDelete"
            @navigate="handleNavigate"
          />

          <div
            v-if="!matches?.length"
            class="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200"
          >
            No matches found. Create your first match to get started!
          </div>
        </div>

        <BaseModal
          :is-open="isModalOpen"
          :title="modalType === 'create' ? 'Create New Match' : 'Delete Match'"
          :on-close="closeModal"
        >
          <CreateMatchForm
            v-if="modalType === 'create'"
            :is-creating="isCreating"
            :match-name="matchName"
            @update:match-name="matchName = $event"
            @submit="handleSubmit"
            @cancel="closeModal"
          />
          <DeleteMatchConfirm
            v-else
            :match="selectedMatch"
            :is-deleting="isDeleting"
            @confirm="confirmDelete"
            @cancel="closeModal"
          />
        </BaseModal>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { PlusIcon } from 'lucide-vue-next';
import TeamSidebar from '@/components/TeamSidebar.vue';
import BaseModal from '@/components/BaseModal.vue';
import MatchCard from '@/components/matches/MatchCard.vue';
import CreateMatchForm from '@/components/matches/CreateMatchForm.vue';
import DeleteMatchConfirm from '@/components/matches/DeleteMatchConfirm.vue';
import api from '@/services/api';
import type { Match } from '@/types';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const teamId = route.params.teamId as string;
const isModalOpen = ref(false);
const modalType = ref<'create' | 'delete'>('create');
const matchName = ref('');
const selectedMatch = ref<Match | null>(null);
const isCreating = ref(false);
const isDeleting = ref(false);
const matches = ref<Match[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const response = await api.get<Match[]>(`/match?teams=${teamId}`);
    matches.value = response.data;
  } catch (error) {
    toast.error('Failed to load matches');
  } finally {
    isLoading.value = false;
  }
});

const createMatch = async (name: string) => {
  try {
    isCreating.value = true;
    await api.post('/match', {
      name,
      team: Number(teamId),
      tab: 1
    });
    const response = await api.get<Match[]>(`/match?teams=${teamId}`);
    matches.value = response.data;
    closeModal();
    toast.success('Match created successfully');
  } catch (error) {
    toast.error('Failed to create match');
  } finally {
    isCreating.value = false;
  }
};

const deleteMatch = async (matchId: number) => {
  try {
    isDeleting.value = true;
    await api.delete(`/match/${matchId}`);
    const response = await api.get<Match[]>(`/match?teams=${teamId}`);
    matches.value = response.data;
    closeModal();
    toast.success('Match deleted successfully');
  } catch (error) {
    toast.error('Failed to delete match');
  } finally {
    isDeleting.value = false;
  }
};

const handleSubmit = () => {
  if (matchName.value.trim()) {
    createMatch(matchName.value);
  }
};

const handleDelete = (match: Match) => {
  modalType.value = 'delete';
  selectedMatch.value = match;
  isModalOpen.value = true;
};

const confirmDelete = () => {
  if (selectedMatch.value) {
    deleteMatch(selectedMatch.value.id);
  }
};

const handleNavigate = (path: string) => {
  router.push(path);
};

const closeModal = () => {
  isModalOpen.value = false;
  modalType.value = 'create';
  matchName.value = '';
  selectedMatch.value = null;
  isCreating.value = false;
  isDeleting.value = false;
};
</script>
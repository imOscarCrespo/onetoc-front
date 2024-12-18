<template>
  <div class="flex min-h-screen bg-gray-50">
    <TeamSidebar :team-id="teamId" active-tab="players" />
    
    <main class="flex-1 p-8">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-xl font-medium">Players</h1>
          <button
            @click="openCreateModal"
            class="btn flex items-center gap-2"
          >
            <PlusIcon class="w-4 h-4" />
            Add Player
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PlayerCard
            v-for="player in players"
            :key="player.id"
            :player="player"
            @edit="handleEdit"
            @delete="handleDelete"
          />

          <div
            v-if="!players?.length"
            class="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200"
          >
            No players found. Add your first player to get started!
          </div>
        </div>

        <BaseModal
          :is-open="isModalOpen"
          :title="modalType === 'create' ? 'Add New Player' : modalType === 'edit' ? 'Edit Player' : 'Delete Player'"
          :on-close="closeModal"
        >
          <PlayerForm
            v-if="modalType !== 'delete'"
            :player-data="playerData"
            :is-submitting="isSubmitting"
            :mode="modalType"
            @submit="handleSubmit"
            @cancel="closeModal"
          />
          <DeletePlayerConfirm
            v-else
            :player="selectedPlayer"
            :is-deleting="isSubmitting"
            @confirm="confirmDelete"
            @cancel="closeModal"
          />
        </BaseModal>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { PlusIcon } from 'lucide-vue-next';
import TeamSidebar from '@/components/TeamSidebar.vue';
import BaseModal from '@/components/BaseModal.vue';
import PlayerCard from '@/components/players/PlayerCard.vue';
import PlayerForm from '@/components/players/PlayerForm.vue';
import DeletePlayerConfirm from '@/components/players/DeletePlayerConfirm.vue';
import api from '@/services/api';
import type { Player } from '@/types';

const route = useRoute();
const toast = useToast();
const queryClient = useQueryClient();

const teamId = route.params.teamId as string;
const isModalOpen = ref(false);
const modalType = ref<'create' | 'edit' | 'delete'>('create');
const selectedPlayer = ref<Player | null>(null);
const isSubmitting = ref(false);
const playerData = ref({
  name: '',
  number: '',
  position: '',
  total_minutes: 0,
});

const { data: players } = useQuery({
  queryKey: ['players', teamId],
  queryFn: async () => {
    const response = await api.get<Player[]>(`/player?team=${teamId}`);
    return response.data;
  }
});

const createPlayerMutation = useMutation({
  mutationFn: async (data: typeof playerData.value) => {
    return api.post('/player', {
      name: data.name,
      team: Number(teamId),
      position: data.position,
      number: Number(data.number)
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    closeModal();
    toast.success('Player added successfully');
  },
  onError: () => {
    toast.error('Failed to add player');
  }
});

const updatePlayerMutation = useMutation({
  mutationFn: async (data: typeof playerData.value & { id: number }) => {
    return api.patch(`/player/${data.id}`, {
      name: data.name,
      position: data.position,
      number: Number(data.number),
      total_minutes: data.total_minutes
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    closeModal();
    toast.success('Player updated successfully');
  },
  onError: () => {
    toast.error('Failed to update player');
  }
});

const deletePlayerMutation = useMutation({
  mutationFn: async (playerId: number) => {
    return api.delete(`/player/${playerId}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    closeModal();
    toast.success('Player deleted successfully');
  },
  onError: () => {
    toast.error('Failed to delete player');
  }
});

const openCreateModal = () => {
  modalType.value = 'create';
  resetForm();
  isModalOpen.value = true;
};

const handleEdit = (player: Player) => {
  modalType.value = 'edit';
  selectedPlayer.value = player;
  playerData.value = {
    name: player.name,
    number: player.number,
    position: player.position,
    total_minutes: player.total_minutes
  };
  isModalOpen.value = true;
};

const handleDelete = (player: Player) => {
  modalType.value = 'delete';
  selectedPlayer.value = player;
  isModalOpen.value = true;
};

const handleSubmit = () => {
  isSubmitting.value = true;
  if (modalType.value === 'create') {
    createPlayerMutation.mutate(playerData.value);
  } else if (modalType.value === 'edit' && selectedPlayer.value) {
    const updatedTotalMinutes = (selectedPlayer.value.total_minutes || 0) + playerData.value.total_minutes;
    updatePlayerMutation.mutate({
      ...playerData.value,
      id: selectedPlayer.value.id,
      total_minutes: updatedTotalMinutes
    });
  }
};

const confirmDelete = () => {
  if (selectedPlayer.value) {
    isSubmitting.value = true;
    deletePlayerMutation.mutate(selectedPlayer.value.id);
  }
};

const resetForm = () => {
  playerData.value = {
    name: '',
    number: '',
    position: '',
    total_minutes: 0
  };
  selectedPlayer.value = null;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
  isSubmitting.value = false;
};
</script>
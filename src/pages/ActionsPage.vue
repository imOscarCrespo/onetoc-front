<template>
  <div class="flex min-h-screen bg-gray-50">
    <TeamSidebar :team-id="teamId" active-tab="actions" />
    
    <main class="flex-1 p-8">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-xl font-medium">Actions</h1>
          <button
            @click="openCreateModal"
            class="btn flex items-center gap-2"
          >
            <PlusIcon class="w-4 h-4" />
            New Action
          </button>
        </div>

        <div class="flex gap-2 mb-6">
          <button 
            @click="activeTab = 'custom'"
            :class="[
              'py-2 px-4 rounded-lg font-medium transition-colors',
              activeTab === 'custom' 
                ? 'bg-black text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            ]"
          >
            Custom Actions
          </button>
          <button 
            @click="activeTab = 'default'"
            :class="[
              'py-2 px-4 rounded-lg font-medium transition-colors',
              activeTab === 'default' 
                ? 'bg-black text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            ]"
          >
            Default Actions
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            v-for="action in filteredActions"
            :key="action.id"
            :action="action"
            @edit="handleEdit"
            @delete="handleDelete"
            @toggle-status="handleToggleStatus"
          />

          <div
            v-if="!filteredActions.filter(action => action.status === 'ACTIVE').length"
            class="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200"
          >
            {{ emptyMessage }}
          </div>
        </div>

        <BaseModal
          :is-open="isModalOpen"
          :title="modalType === 'create' ? 'Create New Action' : modalType === 'edit' ? 'Edit Action' : 'Delete Action'"
          :on-close="closeModal"
        >
          <ActionForm
            v-if="modalType !== 'delete'"
            :action-data="actionData"
            :is-submitting="isSubmitting"
            :mode="modalType"
            :is-temporal="isTemporal"
            @update:is-temporal="isTemporal = $event"
            @submit="handleSubmit"
            @cancel="closeModal"
          />
          <DeleteActionConfirm
            v-else
            :action="selectedAction"
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
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useMutation } from '@tanstack/vue-query';
import { PlusIcon } from 'lucide-vue-next';
import TeamSidebar from '@/components/TeamSidebar.vue';
import BaseModal from '@/components/BaseModal.vue';
import ActionCard from '@/components/actions/ActionCard.vue';
import ActionForm from '@/components/actions/ActionForm.vue';
import DeleteActionConfirm from '@/components/actions/DeleteActionConfirm.vue';
import api from '@/services/api';
import type { Action } from '@/types';

const route = useRoute();
const toast = useToast();

const teamId = route.params.teamId as string;
const isModalOpen = ref(false);
const modalType = ref<'create' | 'edit' | 'delete'>('create');
const selectedAction = ref<Action | null>(null);
const isSubmitting = ref(false);
const isTemporal = ref(false);
const actionData = ref({
  name: '',
  color: '#000000',
});

const actions = ref<Action[]>([]);
const isLoading = ref(true);
const activeTab = ref('custom');

onMounted(async () => {
  try {
    const response = await api.get<Action[]>(`/action?team=${teamId}`);
    actions.value = response.data;
  } catch (error) {
    toast.error('Failed to load actions');
  } finally {
    isLoading.value = false;
  }
});

const filteredActions = computed(() => {
  return actions.value.filter(action => 
    activeTab.value === 'default' ? action.default : !action.default
  );
});

const emptyMessage = computed(() => {
  return activeTab.value === 'default' 
    ? 'No default actions available.'
    : 'No custom actions found. Create your first action to get started!';
});

const createActionMutation = useMutation({
  mutationFn: async ({ name, isTemporal }: { name: string; isTemporal: boolean }) => {
    const response = await api.post('/action', {
      name,
      color: '#000000',
      team: Number(teamId),
      enabled: true,
      default: false,
      temporal: isTemporal
    });
    const actionsResponse = await api.get<Action[]>(`/action?team=${teamId}`);
    actions.value = actionsResponse.data.filter((action: Action) => !action.default);
    return response;
  },
  onSuccess: () => {
    closeModal();
    toast.success('Action created successfully');
  },
  onError: () => {
    toast.error('Failed to create action');
  }
});

const updateActionMutation = useMutation({
  mutationFn: async ({ id, name, status }: { id: number; name: string; status: string }) => {
    const response = await api.patch(`/action/${id}`, {
      name,
      status
    });
    return response.data;
  },
  onSuccess: async () => {
    const actionsResponse = await api.get<Action[]>(`/action?team=${teamId}`);
    actions.value = actionsResponse.data;
    closeModal();
    toast.success('Action updated successfully');
  },
  onError: () => {
    toast.error('Failed to update action');
  }
});

const deleteActionMutation = useMutation({
  mutationFn: async (actionId: number) => {
    return api.delete(`/action/${actionId}`);
  },
  onSuccess: () => {
    closeModal();
    toast.success('Action deleted successfully');
  },
  onError: () => {
    toast.error('Failed to delete action');
  }
});

const openCreateModal = () => {
  modalType.value = 'create';
  resetForm();
  isModalOpen.value = true;
};

const handleEdit = (action: Action) => {
  modalType.value = 'edit';
  selectedAction.value = action;
  actionData.value = {
    name: action.name,
    color: action.color
  };
  isModalOpen.value = true;
};

const handleDelete = (action: Action) => {
  modalType.value = 'delete';
  selectedAction.value = action;
  isModalOpen.value = true;
};

const handleToggleStatus = (action: Action) => {
  const newStatus = action.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
  updateActionMutation.mutate({ 
    id: action.id, 
    name: action.name, 
    status: newStatus 
  });
};

const handleSubmit = () => {
  isSubmitting.value = true;
  if (modalType.value === 'create') {
    createActionMutation.mutate({ 
      name: actionData.value.name, 
      isTemporal: isTemporal.value 
    });
  } else if (modalType.value === 'edit' && selectedAction.value) {
    updateActionMutation.mutate({
      id: selectedAction.value.id,
      name: actionData.value.name,
      status: selectedAction.value.status
    });
  }
};

const confirmDelete = () => {
  if (selectedAction.value) {
    isSubmitting.value = true;
    deleteActionMutation.mutate(selectedAction.value.id);
  }
};

const resetForm = () => {
  actionData.value = {
    name: '',
    color: '#000000'
  };
  isTemporal.value = false;
  selectedAction.value = null;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
  isSubmitting.value = false;
};
</script>
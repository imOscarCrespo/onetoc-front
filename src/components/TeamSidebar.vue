<template>
  <div 
    :class="[
      isExpanded ? 'w-64' : 'w-20',
      'bg-white border-r border-gray-200 transition-all duration-200 relative group min-h-screen flex flex-col'
    ]"
  >
    <!-- Toggle Button -->
    <button
      @click="isExpanded = !isExpanded"
      class="absolute -right-4 top-6 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm transition-shadow z-50"
    >
      <ChevronLeftIcon v-if="isExpanded" class="w-4 h-4" />
      <ChevronRightIcon v-else class="w-4 h-4" />
    </button>

    <div class="p-4 flex-1">
      <!-- Team Name -->
      <h2 
        :class="[
          'font-medium mb-6 truncate transition-all duration-200',
          isExpanded ? 'text-xl px-1' : 'text-sm text-center'
        ]"
      >
        {{ isExpanded ? team?.name : team?.name?.[0] }}
      </h2>

      <!-- Navigation -->
      <nav class="space-y-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="router.push(tab.path)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
            activeTab === tab.id ? 'bg-black text-white' : 'text-gray-600'
          ]"
          :title="!isExpanded ? tab.name : undefined"
        >
          <component :is="tab.icon" class="w-5 h-5 flex-shrink-0" />
          <span 
            :class="[
              'truncate transition-all duration-200',
              isExpanded ? 'opacity-100' : 'opacity-0 w-0'
            ]"
          >
            {{ tab.name }}
          </span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import { TrophyIcon, UsersIcon, Settings2Icon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next';
import api from '@/services/api';


const props = defineProps<{
  teamId: string;
  activeTab: 'matches' | 'players' | 'actions';
}>();

const router = useRouter();
const isExpanded = ref(window.innerWidth > 768);

const { data: team } = useQuery({
  queryKey: ['team', props.teamId],
  queryFn: async () => {
    const response = await api.get(`/team/${props.teamId}`);
    return response.data;
  }
});

const tabs = [
  {
    id: 'matches',
    name: 'Matches',
    icon: TrophyIcon,
    path: `/team/${props.teamId}/matches`
  },
  {
    id: 'players',
    name: 'Players',
    icon: UsersIcon,
    path: `/team/${props.teamId}/players`
  },
  {
    id: 'actions',
    name: 'Actions',
    icon: Settings2Icon,
    path: `/team/${props.teamId}/actions`
  }
];

onMounted(() => {
  const handleResize = () => {
    if (window.innerWidth <= 768) {
      isExpanded.value = false;
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  return () => window.removeEventListener('resize', handleResize);
});
</script>

<script lang="ts">
export default {
  name: 'TeamSidebar'
}
</script>
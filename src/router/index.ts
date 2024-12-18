import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import LoginPage from '@/pages/LoginPage.vue';
import TeamsPage from '@/pages/TeamsPage.vue';
import MatchesPage from '@/pages/MatchesPage.vue';
import PlayersPage from '@/pages/PlayersPage.vue';
import ActionsPage from '@/pages/ActionsPage.vue';
import MatchDetailPage from '@/pages/MatchDetailPage.vue';
import LiveAnalysisPage from '@/pages/LiveAnalysisPage.vue';
import MatchLineupPage from '@/pages/MatchLineupPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/',
      name: 'teams',
      component: TeamsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/team/:teamId/matches',
      name: 'matches',
      component: MatchesPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/team/:teamId/players',
      name: 'players',
      component: PlayersPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/team/:teamId/actions',
      name: 'actions',
      component: ActionsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/match/:matchId',
      name: 'match-detail',
      component: MatchDetailPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/match/:matchId/live',
      name: 'live-analysis',
      component: LiveAnalysisPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/match/:matchId/lineup',
      name: 'match-lineup',
      component: MatchLineupPage,
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
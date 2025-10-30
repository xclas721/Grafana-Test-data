import { createRouter, createWebHistory } from 'vue-router'

import TestInput from '@/views/TestInput.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TestInput,
    },
  ],
})

export default router

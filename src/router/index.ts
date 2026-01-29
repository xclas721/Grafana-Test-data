import { createRouter, createWebHistory } from 'vue-router'

import TestInput from '@/views/TestInput.vue'
import RateLimitTest from '@/views/RateLimitTest.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TestInput
    },
    {
      path: '/rate-limit-test',
      name: 'rate-limit-test',
      component: RateLimitTest
    }
  ]
})

export default router

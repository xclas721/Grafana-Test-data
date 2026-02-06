import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '@/views/HomePage.vue'
import RootLayout from '@/views/RootLayout.vue'
import TestInput from '@/views/TestInput.vue'
import TestDataLayout from '@/views/TestDataLayout.vue'
import DDoSRateLimitLayout from '@/views/ddos/DDoSRateLimitLayout.vue'
import DDoSAreqCardTest from '@/views/ddos/DDoSAreqCardTest.vue'
import DDoSAreqMerchantTest from '@/views/ddos/DDoSAreqMerchantTest.vue'
import DDoSCreqCheckpoint1Test from '@/views/ddos/DDoSCreqCheckpoint1Test.vue'
import DDoSCreqCheckpoint2Test from '@/views/ddos/DDoSCreqCheckpoint2Test.vue'
import DDoS3DSMethodTest from '@/views/ddos/DDoS3DSMethodTest.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: RootLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomePage
        }
      ]
    },
    {
      path: '/test-data',
      component: TestDataLayout,
      children: [
        {
          path: '',
          name: 'test-data',
          component: TestInput
        }
      ]
    },
    {
      path: '/rate-limit-test',
      component: DDoSRateLimitLayout,
      children: [
        { path: '', redirect: '/rate-limit-test/areq-card' },
        {
          path: 'areq-card',
          name: 'rate-limit-test-areq-card',
          component: DDoSAreqCardTest
        },
        {
          path: 'areq-merchant',
          name: 'rate-limit-test-areq-merchant',
          component: DDoSAreqMerchantTest
        },
        {
          path: 'creq-checkpoint1',
          name: 'rate-limit-test-creq-checkpoint1',
          component: DDoSCreqCheckpoint1Test
        },
        {
          path: 'creq-checkpoint2',
          name: 'rate-limit-test-creq-checkpoint2',
          component: DDoSCreqCheckpoint2Test
        },
        {
          path: '3dsmethod',
          name: 'rate-limit-test-3dsmethod',
          component: DDoS3DSMethodTest
        }
      ]
    }
  ]
})

export default router

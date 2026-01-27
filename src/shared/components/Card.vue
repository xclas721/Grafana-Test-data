<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <div class="card bg-base-100 border border-base-300 shadow-sm">
    <div class="card-body p-4 md:p-5">
      <div v-if="title || subtitle" class="mb-4">
        <h2 v-if="title" class="card-title text-base-content">{{ title }}</h2>
        <p v-if="subtitle" class="text-base-content/60 text-sm">{{ subtitle }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>

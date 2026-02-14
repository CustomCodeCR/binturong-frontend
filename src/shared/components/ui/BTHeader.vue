<script setup lang="ts">

</script>

<template>
  <div class="flex items-start justify-between w-full mb-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold tracking-tight text-bt-grey-900 leading-none">
        <slot name="title"/>
      </h1>

      <p class="text-base text-bt-grey-600">
        <slot name="description"/>
      </p>
    </div>

    <div class="flex items-center gap-3">
      <slot name="action"/>
    </div>
  </div>
</template>
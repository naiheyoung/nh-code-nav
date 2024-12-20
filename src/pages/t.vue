<template>
  <div class="t wfull hfull" ref="t"></div>
</template>

<script setup lang="ts">
const { initT } = useTerminal()

const t = useTemplateRef<HTMLElement>('t')

onMounted(() => {
  initT(t.value!)
})
</script>

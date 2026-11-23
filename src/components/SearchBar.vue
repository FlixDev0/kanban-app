<script setup>
import { useKanban } from '../composables/useKanban.js'

const { busqueda } = useKanban()
</script>

<template>
  <input
    v-model="busqueda"
    class="buscador"
    type="search"
    placeholder="Buscar por título o código…"
    aria-label="Buscar tareas"
  />
</template>

<style scoped>
.buscador {
  width: 260px;
  height: 34px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #232831;
  background: var(--fondo);
  color: var(--texto);
  font: inherit;
  font-size: 13px;
}

.buscador:focus {
  outline: none;
  border-color: var(--acento);
}
</style>

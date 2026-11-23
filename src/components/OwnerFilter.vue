<script setup>
import { useKanban } from '../composables/useKanban.js'

const { filtroResponsable, responsablesDisponibles } = useKanban()
</script>

<template>
  <select v-model="filtroResponsable" class="filtro" aria-label="Filtrar por responsable">
    <option value="">Todas las personas</option>
    <option v-for="persona in responsablesDisponibles" :key="persona" :value="persona">
      {{ persona }}
    </option>
  </select>
</template>

<style scoped>
.filtro {
  height: 34px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #232831;
  background: var(--fondo);
  color: var(--texto);
  font: inherit;
  font-size: 13px;
}

.filtro:focus {
  outline: none;
  border-color: var(--acento);
}
</style>

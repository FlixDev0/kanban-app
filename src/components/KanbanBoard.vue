<script setup>
import { onMounted, onUnmounted } from 'vue'
import { COLUMNAS } from '../constants.js'
import { useKanban } from '../composables/useKanban.js'
import KanbanColumn from './KanbanColumn.vue'
import SearchBar from './SearchBar.vue'
import OwnerFilter from './OwnerFilter.vue'
import TaskModal from './TaskModal.vue'

const {
  tareasPorColumna,
  conteoPorColumna,
  limiteProgreso,
  tareaAbierta,
  cerrarDetalle,
  totalTareas,
  totalBloqueadas,
  deshacerDisponible,
  deshacerUltimo,
  reiniciar,
  puedeEditar,
  mensaje,
  tablero,
} = useKanban()

function confirmarReinicio() {
  if (confirm(`¿Volver el tablero "${tablero.value.nombre}" a su estado inicial? Se borran sus cambios.`)) {
    reiniciar()
  }
}

function alPresionarTecla(evento) {
  const tecla = evento.key.toLowerCase()
  if (!(evento.ctrlKey || evento.metaKey) || tecla !== 'z' || evento.shiftKey) return

  // Dentro de un campo de texto, Ctrl+Z es el deshacer del propio campo.
  const destino = evento.target
  if (destino instanceof HTMLInputElement || destino instanceof HTMLTextAreaElement) return

  evento.preventDefault()
  deshacerUltimo()
}

onMounted(() => window.addEventListener('keydown', alPresionarTecla))
onUnmounted(() => window.removeEventListener('keydown', alPresionarTecla))
</script>

<template>
  <div class="cabecera">
    <div>
      <h1>{{ tablero.nombre }}</h1>
      <p class="sub">
        Código {{ tablero.prefijo }} · {{ totalTareas }} tareas · {{ totalBloqueadas }} bloqueada{{ totalBloqueadas === 1 ? '' : 's' }}
      </p>
    </div>
    <div class="herramientas">
      <SearchBar />
      <OwnerFilter />
      <button
        :disabled="!deshacerDisponible || !puedeEditar"
        title="Deshacer (Ctrl+Z)"
        @click="deshacerUltimo"
      >
        Deshacer
      </button>
      <button :disabled="!puedeEditar" @click="confirmarReinicio">Reiniciar</button>
    </div>
  </div>

  <div class="tablero">
    <KanbanColumn
      v-for="(columna, indice) in COLUMNAS"
      :key="columna.id"
      :columna="columna"
      :indice="indice"
      :tareas="tareasPorColumna[columna.id]"
      :total="conteoPorColumna[columna.id]"
      :limite="columna.id === 'progreso' ? limiteProgreso : null"
    />
  </div>

  <TaskModal
    v-if="tareaAbierta"
    :key="tareaAbierta.id"
    :tarea="tareaAbierta"
  />

  <div v-if="mensaje" class="mensaje" role="status">{{ mensaje }}</div>
</template>

<style scoped>
.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.herramientas {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--texto-secundario);
}

button {
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  height: 34px;
  padding: 0 14px;
  border-radius: 6px;
  background: var(--tarjeta);
  color: var(--texto);
  border: 1px solid var(--borde-tarjeta);
}

button:hover:not(:disabled) {
  border-color: var(--acento);
}

button:disabled {
  opacity: 0.35;
  cursor: default;
}

.mensaje {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 20;
  max-width: min(560px, 90vw);
  padding: 10px 16px;
  font-size: 13px;
  border-radius: 8px;
  color: var(--prioridad-media);
  background: #2a2314;
  border: 1px solid rgba(245, 194, 107, 0.45);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
}

.tablero {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 1fr));
  gap: clamp(14px, 1.6vw, 24px);
  align-items: start;
}
</style>

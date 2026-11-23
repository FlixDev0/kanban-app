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
} = useKanban()

function confirmarReinicio() {
  if (confirm('¿Volver al tablero inicial? Se borran tus cambios.')) reiniciar()
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
      <h1>Tablero</h1>
      <p class="sub">
        {{ totalTareas }} tareas · {{ totalBloqueadas }} bloqueada{{ totalBloqueadas === 1 ? '' : 's' }}
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

.tablero {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 1fr));
  gap: clamp(14px, 1.6vw, 24px);
  align-items: start;
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { useKanban } from '../composables/useKanban.js'
import { LIMITES_TITULO } from '../constants.js'
import KanbanCard from './KanbanCard.vue'

const props = defineProps({
  columna: { type: Object, required: true },
  indice: { type: Number, required: true },
  tareas: { type: Array, required: true },
  total: { type: Number, required: true },
  limite: { type: Number, default: null },
})

const { agregarTarea, moverTarea, buscando, setLimiteProgreso, puedeEditar } = useKanban()
const nuevoTitulo = ref('')
const sobre = ref(false)

// Aviso amarillo al superar el límite. La tarea igual se mueve.
const excedeLimite = computed(() => props.limite !== null && props.total > props.limite)

function añadir() {
  if (agregarTarea(props.columna.id, nuevoTitulo.value)) nuevoTitulo.value = ''
}

function alSoltar(evento) {
  sobre.value = false
  const id = Number(evento.dataTransfer.getData('text/plain'))
  if (id) moverTarea(id, props.columna.id)
}
</script>

<template>
  <section
    class="columna"
    :class="{ sobre }"
    @dragover.prevent="sobre = true"
    @dragleave="sobre = false"
    @drop.prevent="alSoltar"
  >
    <div class="cabecera-columna" :style="{ color: columna.color }">
      <span>{{ columna.nombre }}</span>
      <span class="contador">{{ tareas.length }}</span>
    </div>

    <div v-if="limite !== null" class="limite">
      <span>Límite</span>
      <input
        type="number"
        min="1"
        max="99"
        :value="limite"
        :disabled="!puedeEditar"
        aria-label="Límite de tareas en la columna"
        @change="setLimiteProgreso($event.target.value)"
      />
    </div>

    <p v-if="excedeLimite" class="aviso">
      Superaste el límite: {{ total }} tareas de {{ limite }} permitidas
    </p>

    <div class="tarjetas">
      <KanbanCard
        v-for="tarea in tareas"
        :key="tarea.id"
        :tarea="tarea"
        :indice="indice"
      />
      <p v-if="tareas.length === 0 && buscando" class="sin-resultados">Sin resultados</p>
    </div>

    <div class="agregar">
      <input
        v-model="nuevoTitulo"
        :disabled="!puedeEditar"
        placeholder="Nueva tarea…"
        :maxlength="LIMITES_TITULO.titulo"
        @keydown.enter="añadir"
      />
      <button :disabled="!puedeEditar" title="Agregar" @click="añadir">+</button>
    </div>
  </section>
</template>

<style scoped>
.columna {
  background: var(--paneles);
  border: 1px solid var(--borde-paneles);
  border-radius: 10px;
  padding: 12px 14px 14px;
  min-height: clamp(440px, 62vh, 720px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s;
}

.columna.sobre {
  border-color: var(--acento);
}

.cabecera-columna {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  margin-bottom: 8px;
}

.contador {
  color: #5c636e;
}

.limite {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--texto-secundario);
  margin-bottom: 6px;
}

.limite input {
  width: 56px;
  height: 26px;
  padding: 0 6px;
  border-radius: 5px;
  border: 1px solid #232831;
  background: var(--fondo);
  color: var(--texto);
  font: inherit;
  font-size: 12px;
}

.aviso {
  margin: 0 0 6px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--prioridad-media);
  background: rgba(245, 194, 107, 0.12);
  border: 1px solid rgba(245, 194, 107, 0.35);
}

.tarjetas {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sin-resultados {
  margin: 0;
  padding: 16px 0;
  text-align: center;
  font-size: 13px;
  color: #5c636e;
}

.agregar {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 14px;
}

.agregar input {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #232831;
  background: var(--fondo);
  color: var(--texto);
  font: inherit;
  font-size: 13px;
}

.agregar input:focus {
  outline: none;
  border-color: var(--acento);
}

.agregar button {
  height: 32px;
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  background: var(--tarjeta);
  color: var(--texto);
  border: 1px solid var(--borde-tarjeta);
}

.agregar button:hover {
  border-color: var(--acento);
}
</style>

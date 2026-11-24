<script setup>
import { computed, nextTick, ref } from 'vue'
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

// Uso del límite para la barra (se llena hasta el 100 %, aunque se supere).
const porcentajeUso = computed(() =>
  props.limite ? Math.min(100, Math.round((props.total / props.limite) * 100)) : 0,
)
const enElLimite = computed(() => props.limite !== null && props.total >= props.limite)

function cambiarLimite(valor, campo) {
  setLimiteProgreso(valor)
  // Si el valor no era válido, el campo vuelve al límite real.
  nextTick(() => {
    if (campo) campo.value = props.limite
  })
}

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

    <div v-if="limite !== null" class="limite" :class="{ lleno: enElLimite }">
      <div class="limite-info">
        <span class="limite-titulo">Límite</span>
        <span class="limite-uso">{{ total }} de {{ limite }}</span>
      </div>

      <div class="selector" role="group" aria-label="Límite de tareas en la columna">
        <button
          type="button"
          :disabled="!puedeEditar || limite <= 1"
          title="Bajar el límite"
          @click="cambiarLimite(limite - 1)"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          max="99"
          :value="limite"
          :disabled="!puedeEditar"
          aria-label="Límite"
          @change="cambiarLimite($event.target.value, $event.target)"
        />
        <button
          type="button"
          :disabled="!puedeEditar || limite >= 99"
          title="Subir el límite"
          @click="cambiarLimite(limite + 1)"
        >
          +
        </button>
      </div>

      <div class="barra" aria-hidden="true">
        <div class="barra-llena" :style="{ width: porcentajeUso + '%' }" />
      </div>
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
        :disabled="!puedeEditar || enElLimite"
        :placeholder="enElLimite ? 'Límite alcanzado' : 'Nueva tarea…'"
        :maxlength="LIMITES_TITULO.titulo"
        @keydown.enter="añadir"
      />
      <button
        :disabled="!puedeEditar || enElLimite"
        :title="enElLimite ? 'La columna está en su límite' : 'Agregar'"
        @click="añadir"
      >
        +
      </button>
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
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--fondo);
  border: 1px solid var(--borde-paneles);
  border-radius: 8px;
}

.limite-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.limite-titulo,
.limite-uso {
  white-space: nowrap;
}

.limite-titulo {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #5c636e;
}

.limite-uso {
  font-size: 13px;
  color: var(--texto);
}

.selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--borde-tarjeta);
  border-radius: 6px;
  overflow: hidden;
}

.selector button {
  width: 26px;
  height: 28px;
  padding: 0;
  font: inherit;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  background: var(--tarjeta);
  color: var(--texto-secundario);
  border: none;
}

.selector button:hover:not(:disabled) {
  color: var(--texto);
  background: #1e242c;
}

.selector button:disabled {
  opacity: 0.35;
  cursor: default;
}

.selector input {
  width: 38px;
  height: 28px;
  padding: 0;
  text-align: center;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--texto);
  background: var(--fondo);
  border: none;
  border-left: 1px solid var(--borde-tarjeta);
  border-right: 1px solid var(--borde-tarjeta);
  border-radius: 0;
  appearance: textfield;
  -moz-appearance: textfield;
}

.selector input::-webkit-outer-spin-button,
.selector input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.selector input:focus {
  outline: none;
  background: #151a21;
}

.selector input:disabled {
  opacity: 0.5;
}

.barra {
  grid-column: 1 / -1;
  height: 4px;
  border-radius: 2px;
  background: #1c2026;
  overflow: hidden;
}

.barra-llena {
  height: 100%;
  border-radius: 2px;
  background: var(--acento);
  transition: width 0.2s, background 0.2s;
}

.limite.lleno .barra-llena {
  background: var(--prioridad-media);
}

.limite.lleno .limite-uso {
  color: var(--prioridad-media);
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

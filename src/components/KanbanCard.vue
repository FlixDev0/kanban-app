<script setup>
import { computed } from 'vue'
import { COLUMNAS, PRIORIDADES } from '../constants.js'
import { useKanban } from '../composables/useKanban.js'
import { fechaCorta, estadoFecha, iniciales } from '../utils/formato.js'

const props = defineProps({
  tarea: { type: Object, required: true },
  indice: { type: Number, required: true },
})

const { alternarBloqueo, cambiarPrioridad, eliminarTarea, moverPaso, abrirDetalle, puedeEditar } =
  useKanban()

const esPrimera = computed(() => props.indice === 0)
const esUltima = computed(() => props.indice === COLUMNAS.length - 1)
const esListo = computed(() => props.tarea.columna === 'listo')

const fecha = computed(() =>
  props.tarea.fechaLimite
    ? { texto: fechaCorta(props.tarea.fechaLimite), estado: estadoFecha(props.tarea.fechaLimite) }
    : null,
)

// Al hacer clic en la franja se pasa a la siguiente prioridad: alta → media → baja → alta.
function siguientePrioridad() {
  const indice = PRIORIDADES.indexOf(props.tarea.prioridad)
  cambiarPrioridad(props.tarea.id, PRIORIDADES[(indice + 1) % PRIORIDADES.length])
}

function alArrastrar(evento) {
  evento.dataTransfer.effectAllowed = 'move'
  evento.dataTransfer.setData('text/plain', String(props.tarea.id))
}

function eliminar() {
  if (confirm(`¿Eliminar la tarea "${props.tarea.titulo}"?`)) eliminarTarea(props.tarea.id)
}
</script>

<template>
  <article
    class="tarjeta"
    :class="{ bloqueada: tarea.bloqueada }"
    :draggable="puedeEditar"
    @dragstart="alArrastrar"
    @click="abrirDetalle(tarea.id)"
  >
    <button
      class="franja"
      :class="`prioridad-${tarea.prioridad}`"
      :title="`Prioridad ${tarea.prioridad}. Clic para cambiar`"
      :disabled="!puedeEditar"
      @click.stop="siguientePrioridad"
    />

    <div class="fila-superior">
      <span class="codigo">{{ tarea.codigo }}</span>
      <span class="acciones">
        <button
          v-if="!esListo"
          class="icono"
          :disabled="!puedeEditar"
          :title="tarea.bloqueada ? 'Quitar bloqueo' : 'Marcar como bloqueada'"
          @click.stop="alternarBloqueo(tarea.id)"
        >
          {{ tarea.bloqueada ? '✓' : '⊘' }}
        </button>
        <button
          class="icono eliminar"
          title="Eliminar"
          :disabled="!puedeEditar"
          @click.stop="eliminar"
        >
          ×
        </button>
      </span>
    </div>

    <div class="titulo">{{ tarea.titulo }}</div>
    <span v-if="tarea.bloqueada" class="etiqueta">bloqueada</span>

    <div v-if="fecha || tarea.responsables.length" class="pie">
      <span v-if="fecha" class="fecha" :class="fecha.estado">{{ fecha.texto }}</span>
      <span v-if="tarea.responsables.length" class="responsables">
        <span
          v-for="persona in tarea.responsables"
          :key="persona"
          class="circulo"
          :title="persona"
        >
          {{ iniciales(persona) }}
        </span>
      </span>
    </div>

    <div class="movimientos">
      <button
        class="icono"
        title="Columna anterior"
        :disabled="esPrimera || !puedeEditar"
        @click.stop="moverPaso(tarea.id, -1)"
      >
        ←
      </button>
      <button
        class="icono"
        title="Columna siguiente"
        :disabled="esUltima || !puedeEditar"
        @click.stop="moverPaso(tarea.id, 1)"
      >
        →
      </button>
    </div>
  </article>
</template>

<style scoped>
.tarjeta {
  position: relative;
  padding: 12px 14px;
  background: var(--tarjeta);
  border: 1px solid var(--borde-tarjeta);
  border-radius: var(--radio-tarjeta);
  box-shadow: 0 16px 26px rgba(0, 0, 0, 0.55);
  cursor: grab;
  transition: transform 0.15s, box-shadow 0.15s;
}

.tarjeta:hover {
  transform: translateY(-4px);
  box-shadow: 0 26px 40px rgba(0, 0, 0, 0.65);
  border-color: #3a4250;
}

.tarjeta.bloqueada {
  border-color: #5a2a2a;
}

.franja {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  height: auto;
  padding: 0;
  border: none;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
}

.franja:hover {
  filter: brightness(1.3);
}

.prioridad-alta {
  background: var(--prioridad-alta);
}

.prioridad-media {
  background: var(--prioridad-media);
}

.prioridad-baja {
  background: var(--texto-secundario);
}

.fila-superior {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.codigo {
  font-size: 11px;
  color: #5c636e;
  font-family: ui-monospace, Menlo, Consolas, monospace;
}

.acciones {
  display: flex;
  gap: 4px;
}

.titulo {
  font-size: 14px;
  margin: 6px 0 8px;
  line-height: 1.35;
}

.etiqueta {
  display: inline-block;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--fondo-alerta);
  color: var(--prioridad-alta);
  margin-bottom: 8px;
}

.pie {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.fecha {
  font-size: 12px;
  color: var(--texto-secundario);
}

.fecha.vencida {
  color: var(--prioridad-alta);
  background: var(--fondo-alerta);
  padding: 2px 6px;
  border-radius: 4px;
}

.fecha.por-vencer {
  color: var(--prioridad-media);
}

.responsables {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.circulo {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  background: #232831;
  color: var(--texto);
  border: 1px solid var(--borde-tarjeta);
}

.movimientos {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.icono {
  width: 22px;
  height: 22px;
  padding: 0;
  line-height: 20px;
  text-align: center;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  border-radius: 5px;
  border: 1px solid var(--borde-tarjeta);
  background: transparent;
  color: var(--texto-secundario);
}

.icono:hover:not(:disabled) {
  color: var(--texto);
  border-color: var(--acento);
}

.icono.eliminar:hover:not(:disabled) {
  color: var(--prioridad-alta);
  border-color: #5a2a2a;
}

.icono:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>

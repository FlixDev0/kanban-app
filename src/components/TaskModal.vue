<script setup>
import { computed, reactive, ref, onMounted, onUnmounted } from 'vue'
import { PRIORIDADES, LIMITES_TITULO } from '../constants.js'
import { useKanban } from '../composables/useKanban.js'
import { ETIQUETAS_PRIORIDAD, iniciales } from '../utils/formato.js'

const props = defineProps({
  tarea: { type: Object, required: true },
})

const { guardarDetalle, cerrarDetalle, puedeEditar, equipo } = useKanban()

// Copia local: Cancelar descarta estos cambios sin tocar el tablero.
const form = reactive({
  titulo: props.tarea.titulo,
  descripcion: props.tarea.descripcion,
  prioridad: props.tarea.prioridad,
  fechaLimite: props.tarea.fechaLimite ?? '',
  responsables: [...props.tarea.responsables],
})
const error = ref('')

// Opciones: el equipo, más cualquier responsable que la tarea ya tenga y no esté en el equipo.
const opciones = computed(() => [
  ...new Set([...equipo.value.map((m) => m.nombre), ...form.responsables]),
])

function alternarResponsable(nombre) {
  const i = form.responsables.indexOf(nombre)
  if (i >= 0) form.responsables.splice(i, 1)
  else form.responsables.push(nombre)
}

function guardar() {
  const titulo = form.titulo.trim()
  if (!titulo) {
    error.value = 'El título es obligatorio.'
    return
  }
  guardarDetalle(props.tarea.id, {
    titulo: titulo.slice(0, LIMITES_TITULO.titulo),
    descripcion: form.descripcion.trim().slice(0, LIMITES_TITULO.descripcion),
    prioridad: form.prioridad,
    fechaLimite: form.fechaLimite || null,
    responsables: [...form.responsables],
  })
  cerrarDetalle()
}

function alPresionarTecla(evento) {
  if (evento.key === 'Escape') cerrarDetalle()
}

onMounted(() => window.addEventListener('keydown', alPresionarTecla))
onUnmounted(() => window.removeEventListener('keydown', alPresionarTecla))
</script>

<template>
  <div class="fondo" @click.self="cerrarDetalle">
    <form class="ventana" @submit.prevent="guardar">
      <div class="cabecera">
        <span class="codigo">{{ tarea.codigo }}</span>
        <button type="button" class="cerrar" title="Cancelar" @click="cerrarDetalle">×</button>
      </div>

      <fieldset :disabled="!puedeEditar" class="campos">
        <label class="campo">
          Título
          <input v-model="form.titulo" :maxlength="LIMITES_TITULO.titulo" />
        </label>

        <label class="campo">
          Descripción
          <textarea v-model="form.descripcion" :maxlength="LIMITES_TITULO.descripcion" rows="4" />
        </label>

        <div class="fila">
          <label class="campo">
            Prioridad
            <select v-model="form.prioridad">
              <option v-for="prioridad in PRIORIDADES" :key="prioridad" :value="prioridad">
                {{ ETIQUETAS_PRIORIDAD[prioridad] }}
              </option>
            </select>
          </label>

          <label class="campo">
            Fecha límite
            <input v-model="form.fechaLimite" type="date" />
          </label>
        </div>

        <div class="campo">
          Responsables
          <details class="desplegable">
            <summary>
              {{ form.responsables.length ? form.responsables.join(', ') : 'Sin responsables' }}
            </summary>
            <div class="opciones">
              <p v-if="opciones.length === 0" class="vacio">
                Todavía no hay miembros. Agregalos en Equipo.
              </p>
              <label v-for="nombre in opciones" :key="nombre" class="opcion">
                <input
                  type="checkbox"
                  :checked="form.responsables.includes(nombre)"
                  @change="alternarResponsable(nombre)"
                />
                <span class="circulo">{{ iniciales(nombre) }}</span>
                {{ nombre }}
              </label>
            </div>
          </details>
        </div>
      </fieldset>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="!puedeEditar" class="error">Solo lectura: no podés modificar esta tarea.</p>

      <div class="pie">
        <button type="button" @click="cerrarDetalle">{{ puedeEditar ? 'Cancelar' : 'Cerrar' }}</button>
        <button v-if="puedeEditar" type="submit" class="primario">Guardar</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.fondo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.ventana {
  width: min(480px, 90vw);
  background: var(--paneles);
  border: 1px solid var(--borde-tarjeta);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7);
}

.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.codigo {
  font-size: 12px;
  color: #5c636e;
  font-family: ui-monospace, Menlo, Consolas, monospace;
}

.cerrar {
  width: 26px;
  height: 26px;
  padding: 0;
  font: inherit;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  border: 1px solid var(--borde-tarjeta);
  background: transparent;
  color: var(--texto-secundario);
}

.campos {
  border: none;
  padding: 0;
  margin: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--texto-secundario);
}

.fila {
  display: flex;
  gap: 12px;
}

.fila .campo {
  flex: 1;
}

input,
textarea,
select {
  font: inherit;
  font-size: 14px;
  color: var(--texto);
  background: var(--fondo);
  border: 1px solid #232831;
  border-radius: 6px;
  padding: 8px 10px;
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--acento);
}

.desplegable {
  position: relative;
  background: var(--fondo);
  border: 1px solid #232831;
  border-radius: 6px;
}

.desplegable summary {
  padding: 8px 10px;
  font-size: 14px;
  color: var(--texto);
  cursor: pointer;
  list-style: none;
}

.desplegable summary::-webkit-details-marker {
  display: none;
}

.desplegable summary::after {
  content: '▾';
  float: right;
  color: var(--texto-secundario);
}

.desplegable[open] {
  border-color: var(--acento);
}

.opciones {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  max-height: 220px;
  overflow-y: auto;
  border-top: 1px solid #232831;
}

.opcion {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 5px;
  font-size: 14px;
  color: var(--texto);
  cursor: pointer;
}

.opcion:hover {
  background: var(--tarjeta);
}

.opcion input {
  padding: 0;
  margin: 0;
}

.opciones .circulo {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  background: #232831;
  border: 1px solid var(--borde-tarjeta);
}

.vacio {
  margin: 0;
  padding: 8px;
  font-size: 13px;
  color: #5c636e;
}

.error {
  margin: 0;
  font-size: 13px;
  color: var(--prioridad-alta);
}

.pie {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pie button {
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  height: 34px;
  padding: 0 16px;
  border-radius: 6px;
  background: var(--tarjeta);
  color: var(--texto);
  border: 1px solid var(--borde-tarjeta);
}

.pie button.primario {
  background: var(--acento);
  border-color: var(--acento);
  color: #fff;
}
</style>

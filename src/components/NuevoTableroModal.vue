<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { LIMITES_TABLERO } from '../constants.js'
import { useKanban } from '../composables/useKanban.js'

const emit = defineEmits(['cerrar'])

const { crearTablero } = useKanban()

const nombre = ref('')
const codigo = ref('')
const error = ref('')

// El código siempre se escribe en mayúsculas y sin espacios ni símbolos.
function alEscribirCodigo(evento) {
  codigo.value = evento.target.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, LIMITES_TABLERO.prefijoMax)
  evento.target.value = codigo.value
}

const ejemplo = computed(() => `${codigo.value || 'ABC'}-001`)

function crear() {
  const resultado = crearTablero(nombre.value, codigo.value)
  if (resultado.ok) emit('cerrar')
  else error.value = resultado.error
}

function alPresionarTecla(evento) {
  if (evento.key === 'Escape') emit('cerrar')
}

onMounted(() => window.addEventListener('keydown', alPresionarTecla))
onUnmounted(() => window.removeEventListener('keydown', alPresionarTecla))
</script>

<template>
  <div class="fondo" @click.self="emit('cerrar')">
    <form class="ventana" @submit.prevent="crear">
      <div class="cabecera">
        <h2>Nuevo tablero</h2>
        <button type="button" class="cerrar" title="Cancelar" @click="emit('cerrar')">×</button>
      </div>

      <label class="campo">
        Nombre
        <input
          v-model="nombre"
          :maxlength="LIMITES_TABLERO.nombre"
          placeholder="Ej: Marketing"
          autofocus
        />
      </label>

      <label class="campo">
        Código de las tareas
        <input
          :value="codigo"
          :maxlength="LIMITES_TABLERO.prefijoMax"
          placeholder="Ej: MKT"
          @input="alEscribirCodigo"
        />
        <span class="ayuda">
          De {{ LIMITES_TABLERO.prefijoMin }} a {{ LIMITES_TABLERO.prefijoMax }} letras o números.
          Las tareas se numerarán así: <strong>{{ ejemplo }}</strong>, {{ codigo || 'ABC' }}-002…
        </span>
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="pie">
        <button type="button" @click="emit('cerrar')">Cancelar</button>
        <button type="submit" class="primario">Crear tablero</button>
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
  width: min(440px, 90vw);
  background: var(--paneles);
  border: 1px solid var(--borde-tarjeta);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7);
}

.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
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

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--texto-secundario);
}

.campo input {
  font: inherit;
  font-size: 14px;
  color: var(--texto);
  background: var(--fondo);
  border: 1px solid #232831;
  border-radius: 6px;
  padding: 8px 10px;
}

.campo input:focus {
  outline: none;
  border-color: var(--acento);
}

.ayuda {
  font-size: 12px;
  color: #5c636e;
}

.ayuda strong {
  color: var(--texto-secundario);
  font-family: ui-monospace, Menlo, Consolas, monospace;
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

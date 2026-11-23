<script setup>
import { computed, ref } from 'vue'
import { ROLES } from '../constants.js'
import { useKanban } from '../composables/useKanban.js'
import { iniciales } from '../utils/formato.js'

const { equipo, rolActual, puedeEditar, agregarMiembro, cambiarRol, quitarMiembro } = useKanban()

const nuevoNombre = ref('')
const etiquetaRol = computed(() => ROLES.find((r) => r.id === rolActual.value)?.nombre ?? '')

// No se puede dejar el equipo sin ningún editor.
const cantidadEditores = computed(() => equipo.value.filter((m) => m.rol === 'editar').length)
function esUltimoEditor(miembro) {
  return miembro.rol === 'editar' && cantidadEditores.value === 1
}

function añadir() {
  if (agregarMiembro(nuevoNombre.value)) nuevoNombre.value = ''
}
</script>

<template>
  <div class="panel">
    <div class="cabecera">
      <div>
        <h1>Equipo</h1>
        <p class="sub">Tu rol actual: {{ etiquetaRol }}</p>
      </div>
    </div>

    <p class="nota">
      Los permisos se aplican en este navegador según el nombre elegido en "Tu nombre".
      No hay inicio de sesión, así que no son un control de seguridad.
    </p>

    <ul class="lista">
      <li v-for="miembro in equipo" :key="miembro.nombre" class="fila">
        <span class="circulo">{{ iniciales(miembro.nombre) }}</span>
        <span class="nombre">{{ miembro.nombre }}</span>
        <select
          :value="miembro.rol"
          :disabled="!puedeEditar || esUltimoEditor(miembro)"
          :title="esUltimoEditor(miembro) ? 'Debe quedar al menos un editor' : 'Cambiar permiso'"
          aria-label="Permiso"
          @change="cambiarRol(miembro.nombre, $event.target.value)"
        >
          <option v-for="rol in ROLES" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
        </select>
        <button
          class="quitar"
          :disabled="!puedeEditar || esUltimoEditor(miembro)"
          :title="esUltimoEditor(miembro) ? 'Debe quedar al menos un editor' : 'Quitar del equipo'"
          @click="quitarMiembro(miembro.nombre)"
        >
          Quitar
        </button>
      </li>
    </ul>
    <p v-if="equipo.length === 0" class="vacio">Todavía no hay miembros. Todos pueden editar.</p>

    <form class="agregar" @submit.prevent="añadir">
      <input
        v-model="nuevoNombre"
        :disabled="!puedeEditar"
        maxlength="30"
        placeholder="Nombre o iniciales"
        aria-label="Nombre del nuevo miembro"
      />
      <button type="submit" :disabled="!puedeEditar">Agregar miembro</button>
    </form>
    <p class="ayuda">Los miembros nuevos entran como "Solo lectura". Cambialos a "Puede editar" si corresponde.</p>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.nota,
.ayuda {
  margin: 0;
  font-size: 12px;
  color: #5c636e;
}

.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--paneles);
  border: 1px solid var(--borde-paneles);
  border-radius: 10px;
  overflow: hidden;
}

.fila {
  display: grid;
  grid-template-columns: 36px 1fr 180px 90px;
  gap: 14px;
  align-items: center;
  padding: 12px 18px;
  font-size: 14px;
  border-bottom: 1px solid var(--borde-paneles);
}

.fila:last-child {
  border-bottom: none;
}

.circulo {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: #232831;
  border: 1px solid var(--borde-tarjeta);
}

.vacio {
  margin: 0;
  padding: 24px 0;
  text-align: center;
  font-size: 14px;
  color: #5c636e;
}

select,
input,
button {
  font: inherit;
  font-size: 13px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid #232831;
  background: var(--fondo);
  color: var(--texto);
  padding: 0 10px;
}

button {
  cursor: pointer;
  background: var(--tarjeta);
  border-color: var(--borde-tarjeta);
}

button:hover:not(:disabled),
select:hover:not(:disabled) {
  border-color: var(--acento);
}

button:disabled,
select:disabled,
input:disabled {
  opacity: 0.4;
  cursor: default;
}

.quitar:hover:not(:disabled) {
  color: var(--prioridad-alta);
  border-color: #5a2a2a;
}

.agregar {
  display: flex;
  gap: 10px;
}

.agregar input {
  flex: 1;
  max-width: 320px;
}

.agregar input:focus {
  outline: none;
  border-color: var(--acento);
}
</style>

<script setup>
import { ref } from 'vue'
import { useKanban } from './composables/useKanban.js'
import KanbanBoard from './components/KanbanBoard.vue'
import StatsPanel from './components/StatsPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import ImportExport from './components/ImportExport.vue'
import EquipoPanel from './components/EquipoPanel.vue'
import NuevoTableroModal from './components/NuevoTableroModal.vue'

const { vista, usuario, setUsuario, puedeEditar, tablero, tableros, seleccionarTablero } =
  useKanban()

// Barra lateral visible u oculta (se vuelve a mostrar al recargar la página).
const menuAbierto = ref(true)

// Ventana para crear un tablero nuevo.
const creandoTablero = ref(false)

const secciones = [
  { id: 'tablero', nombre: 'Tablero' },
  { id: 'metricas', nombre: 'Métricas' },
  { id: 'historial', nombre: 'Historial' },
  { id: 'equipo', nombre: 'Equipo' },
]

const vistas = {
  tablero: KanbanBoard,
  metricas: StatsPanel,
  historial: HistoryPanel,
  equipo: EquipoPanel,
}
</script>

<template>
  <div class="app">
    <aside class="barra-lateral" :class="{ cerrada: !menuAbierto }" :aria-hidden="!menuAbierto">
      <div class="encabezado">
        <div class="marca">Kanban</div>
        <button class="alternar" title="Ocultar menú" aria-label="Ocultar menú" @click="menuAbierto = false">
          ‹
        </button>
      </div>

      <span class="seccion-titulo">Tableros</span>
      <ul class="tableros">
        <li v-for="t in tableros" :key="t.id">
          <button
            class="tablero-item"
            :class="{ activo: t.id === tablero.id }"
            :title="`${t.nombre} (${t.prefijo})`"
            @click="seleccionarTablero(t.id)"
          >
            <span class="tablero-nombre">{{ t.nombre }}</span>
            <span class="tablero-codigo">{{ t.prefijo }}</span>
          </button>
        </li>
      </ul>
      <button
        class="nuevo-tablero"
        :disabled="!puedeEditar"
        :title="puedeEditar ? 'Crear un tablero nuevo' : 'Solo lectura'"
        @click="creandoTablero = true"
      >
        + Nuevo tablero
      </button>

      <span class="seccion-titulo">Secciones</span>
      <button
        v-for="seccion in secciones"
        :key="seccion.id"
        class="navegacion"
        :class="{ activa: vista === seccion.id }"
        @click="vista = seccion.id"
      >
        {{ seccion.nombre }}
      </button>

      <div class="pie">
        <label class="usuario">
          Tu nombre
          <input
            :value="usuario"
            maxlength="30"
            @change="setUsuario($event.target.value)"
          />
        </label>
        <p v-if="!puedeEditar" class="lectura">Modo solo lectura</p>
        <ImportExport />
      </div>
    </aside>

    <main class="principal">
      <button
        v-if="!menuAbierto"
        class="abrir"
        title="Mostrar menú"
        aria-label="Mostrar menú"
        @click="menuAbierto = true"
      >
        ☰ Menú
      </button>
      <div class="contenido">
        <component :is="vistas[vista]" />
      </div>
    </main>

    <NuevoTableroModal v-if="creandoTablero" @cerrar="creandoTablero = false" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
}

.barra-lateral {
  width: clamp(180px, 15vw, 260px);
  flex: none;
  padding: clamp(18px, 2vw, 28px) 16px;
  border-right: 1px solid var(--borde-paneles);
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto; /* si la ventana es baja, scrollea toda la barra */
  white-space: nowrap;
  transition: width 0.2s ease, padding 0.2s ease;
}

.barra-lateral > * {
  flex-shrink: 0; /* nada se achica: el scroll es de la barra entera */
}

/* Oculta del todo (también para el teclado) una vez terminada la animación. */
.barra-lateral.cerrada {
  width: 0;
  padding-left: 0;
  padding-right: 0;
  border-right-width: 0;
  visibility: hidden;
  transition: width 0.2s ease, padding 0.2s ease, visibility 0s 0.2s;
}

.seccion-titulo {
  margin-top: 6px;
  padding: 0 10px;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5c636e;
}

.tableros {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 30vh; /* con muchos tableros, la lista scrollea sola */
  overflow-y: auto;
}

.tablero-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--texto-secundario);
}

.tablero-item:hover {
  color: var(--texto);
}

.tablero-item.activo {
  background: var(--tarjeta);
  color: var(--texto);
}

.tablero-nombre {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tablero-codigo {
  flex: none;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 4px;
  background: #1c2026;
  color: var(--texto-secundario);
}

.nuevo-tablero {
  margin: 2px 0 8px;
  height: 32px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  border: 1px dashed var(--borde-tarjeta);
  background: transparent;
  color: var(--texto-secundario);
}

.nuevo-tablero:hover:not(:disabled) {
  color: var(--texto);
  border-color: var(--acento);
}

.nuevo-tablero:disabled {
  opacity: 0.4;
  cursor: default;
}

.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20px;
}

.marca {
  font-size: 15px;
  font-weight: 600;
  padding: 0 8px;
}

.alternar {
  width: 26px;
  height: 26px;
  padding: 0;
  font: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  border-radius: 5px;
  border: 1px solid var(--borde-tarjeta);
  background: transparent;
  color: var(--texto-secundario);
}

.alternar:hover {
  color: var(--texto);
  border-color: var(--acento);
}

.abrir {
  align-self: flex-start;
  margin-bottom: 14px;
  font: inherit;
  font-size: 13px;
  height: 34px;
  padding: 0 14px;
  cursor: pointer;
  border-radius: 6px;
  background: var(--tarjeta);
  color: var(--texto);
  border: 1px solid var(--borde-tarjeta);
}

.abrir:hover {
  border-color: var(--acento);
}

.navegacion {
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--texto-secundario);
}

.navegacion:hover {
  color: var(--texto);
}

.navegacion.activa {
  background: var(--tarjeta);
  color: var(--texto);
}

.pie {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;
}

.usuario {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--texto-secundario);
}

.usuario input {
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #232831;
  background: var(--fondo);
  color: var(--texto);
  font: inherit;
  font-size: 13px;
}

.lectura {
  margin: 0;
  font-size: 12px;
  color: var(--prioridad-media);
}

.principal {
  flex: 1;
  min-width: 0;
  padding: clamp(18px, 2vw, 32px) clamp(20px, 3vw, 48px);
  display: flex;
  flex-direction: column;
}

.contenido {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(14px, 1.6vw, 24px);
  flex: 1;
}
</style>

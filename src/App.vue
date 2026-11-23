<script setup>
import { useKanban } from './composables/useKanban.js'
import KanbanBoard from './components/KanbanBoard.vue'
import StatsPanel from './components/StatsPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import ImportExport from './components/ImportExport.vue'
import EquipoPanel from './components/EquipoPanel.vue'

const { vista, usuario, setUsuario, puedeEditar } = useKanban()

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
    <aside class="barra-lateral">
      <div class="marca">Proyecto Web</div>

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
      <div class="contenido">
        <component :is="vistas[vista]" />
      </div>
    </main>
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
}

.marca {
  font-size: 15px;
  font-weight: 600;
  padding: 0 8px 20px;
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

<script setup>
import { computed } from 'vue'
import { COLUMNAS } from '../constants.js'
import { useKanban } from '../composables/useKanban.js'

const { historial, limpiarHistorial, puedeEditar } = useKanban()

const nombreColumna = (id) => COLUMNAS.find((c) => c.id === id)?.nombre ?? id

// Más reciente primero.
const movimientos = computed(() => [...historial.value].reverse())

function formatearFecha(iso) {
  const f = new Date(iso)
  const dia = String(f.getDate()).padStart(2, '0')
  const mes = String(f.getMonth() + 1).padStart(2, '0')
  const hora = String(f.getHours()).padStart(2, '0')
  const minutos = String(f.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${f.getFullYear()} ${hora}:${minutos}`
}

function confirmarLimpieza() {
  if (confirm('¿Borrar todo el historial de movimientos? Esta acción no se puede deshacer.')) {
    limpiarHistorial()
  }
}
</script>

<template>
  <div class="panel">
    <div class="cabecera">
      <div>
        <h1>Historial</h1>
        <p class="sub">{{ historial.length }} movimiento{{ historial.length === 1 ? '' : 's' }} registrado{{ historial.length === 1 ? '' : 's' }}</p>
      </div>
      <button
        :disabled="historial.length === 0 || !puedeEditar"
        @click="confirmarLimpieza"
      >
        Limpiar historial
      </button>
    </div>

    <p v-if="historial.length === 0" class="vacio">Todavía no hay movimientos.</p>

    <ul v-else class="lista">
      <li v-for="mov in movimientos" :key="mov.id" class="fila">
        <span class="fecha">{{ formatearFecha(mov.fecha) }}</span>
        <span class="usuario">{{ mov.usuario }}</span>
        <span class="tarea">
          <span class="codigo">{{ mov.codigo }}</span> {{ mov.titulo }}
        </span>
        <span class="ruta">{{ nombreColumna(mov.de) }} → {{ nombreColumna(mov.a) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
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

.vacio {
  padding: 48px 0;
  text-align: center;
  color: #5c636e;
  font-size: 14px;
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
  grid-template-columns: 140px 120px 1fr 260px;
  gap: 16px;
  align-items: center;
  padding: 12px 18px;
  font-size: 13px;
  border-bottom: 1px solid var(--borde-paneles);
}

.fila:last-child {
  border-bottom: none;
}

.fecha,
.codigo {
  color: #5c636e;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
}

.usuario {
  color: var(--texto-secundario);
}

.ruta {
  color: var(--texto-secundario);
}
</style>

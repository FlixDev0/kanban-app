<script setup>
import { computed } from 'vue'
import { useKanban } from '../composables/useKanban.js'
import { completadasPorSemana } from '../utils/estadisticas.js'

const { tareas } = useKanban()

const semanas = computed(() => completadasPorSemana(tareas.value))
const total = computed(() => semanas.value.reduce((suma, s) => suma + s.cantidad, 0))
const maximo = computed(() => Math.max(1, ...semanas.value.map((s) => s.cantidad)))
</script>

<template>
  <div class="panel">
    <div class="cabecera">
      <div>
        <h1>Métricas</h1>
        <p class="sub">Tareas completadas por semana, últimas 8 semanas</p>
      </div>
      <span class="total">{{ total }} completadas</span>
    </div>

    <p v-if="total === 0" class="vacio">
      Todavía no hay tareas completadas en las últimas 8 semanas.
    </p>

    <div v-else class="grafico" role="img" aria-label="Tareas completadas por semana">
      <div v-for="semana in semanas" :key="semana.etiqueta" class="columna-barra">
        <span class="valor">{{ semana.cantidad }}</span>
        <div class="barra-zona">
          <div
            class="barra"
            :style="{ height: (semana.cantidad / maximo) * 100 + '%' }"
            :title="`${semana.cantidad} completadas, semana del ${semana.etiqueta}`"
          />
        </div>
        <span class="etiqueta">{{ semana.etiqueta }}</span>
      </div>
    </div>
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

.total {
  font-size: 13px;
  color: var(--prioridad-baja);
}

.vacio {
  padding: 48px 0;
  text-align: center;
  color: #5c636e;
  font-size: 14px;
}

.grafico {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16px;
  height: 380px;
  padding: 20px;
  background: var(--paneles);
  border: 1px solid var(--borde-paneles);
  border-radius: 10px;
}

.columna-barra {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 0;
}

.valor {
  font-size: 12px;
  color: var(--texto);
  font-family: ui-monospace, Menlo, Consolas, monospace;
}

.barra-zona {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 0;
}

.barra {
  width: 60%;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: var(--acento);
}

.etiqueta {
  font-size: 12px;
  color: var(--texto-secundario);
  font-family: ui-monospace, Menlo, Consolas, monospace;
}
</style>

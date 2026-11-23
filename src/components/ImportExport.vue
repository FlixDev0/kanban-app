<script setup>
import { ref } from 'vue'
import { useKanban } from '../composables/useKanban.js'
import { validarTablero } from '../utils/validar.js'

const { exportarTablero, importarTablero, puedeEditar } = useKanban()
const mensaje = ref('')
const esError = ref(false)

function mostrar(texto, error = false) {
  mensaje.value = texto
  esError.value = error
}

function exportar() {
  const blob = new Blob([JSON.stringify(exportarTablero(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  const hoy = new Date().toISOString().slice(0, 10)
  enlace.href = url
  enlace.download = `kanban-${hoy}.json`
  enlace.click()
  URL.revokeObjectURL(url)
  mostrar('Tablero exportado.')
}

async function alElegirArchivo(evento) {
  const archivo = evento.target.files?.[0]
  evento.target.value = '' // permite volver a elegir el mismo archivo
  if (!archivo) return

  let datos
  try {
    datos = JSON.parse(await archivo.text())
  } catch {
    mostrar('El archivo no es JSON válido. No se cambió nada.', true)
    return
  }

  // Validar antes de pedir confirmación: si el formato está mal, no se cambia nada.
  const revision = validarTablero(datos)
  if (!revision.ok) {
    mostrar(`${revision.error} No se cambió nada.`, true)
    return
  }

  if (!confirm('¿Reemplazar el tablero actual con el contenido de este archivo?')) return

  const resultado = importarTablero(datos)
  if (resultado.ok) mostrar('Tablero importado.')
  else mostrar(`${resultado.error} No se cambió nada.`, true)
}
</script>

<template>
  <div class="datos">
    <button class="boton" @click="exportar">Exportar</button>

    <label class="boton" title="Cargar un archivo JSON exportado antes">
      Importar
      <input
        type="file"
        accept="application/json,.json"
        hidden
        :disabled="!puedeEditar"
        @change="alElegirArchivo"
      />
    </label>

    <p v-if="mensaje" class="mensaje" :class="{ error: esError }">{{ mensaje }}</p>
  </div>
</template>

<style scoped>
.datos {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.boton {
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--tarjeta);
  color: var(--texto);
  border: 1px solid var(--borde-tarjeta);
}

.boton:hover {
  border-color: var(--acento);
}

.mensaje {
  margin: 0;
  font-size: 12px;
  color: var(--prioridad-baja);
}

.mensaje.error {
  color: var(--prioridad-alta);
}
</style>

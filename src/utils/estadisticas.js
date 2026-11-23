// Tareas completadas por semana. "Completada" = columna Listo.
// Se usa la fecha de última actualización como fecha de completado (aproximación).

const DIA_MS = 86400000
export const SEMANAS_ESTADISTICAS = 8

// Lunes de la semana de la fecha dada, a las 00:00.
function inicioSemana(fecha) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  const diasDesdeLunes = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diasDesdeLunes)
  return d
}

// "2026-11-23" -> "23/11" (formato del lunes de cada semana)
function etiquetaFecha(fecha) {
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

export function completadasPorSemana(tareas, hoy = new Date()) {
  const inicioActual = inicioSemana(hoy)
  const semanas = Array.from({ length: SEMANAS_ESTADISTICAS }, (_, i) => {
    const inicio = new Date(inicioActual)
    inicio.setDate(inicio.getDate() - (SEMANAS_ESTADISTICAS - 1 - i) * 7)
    return { inicio, etiqueta: etiquetaFecha(inicio), cantidad: 0 }
  })

  for (const tarea of tareas) {
    if (tarea.columna !== 'listo') continue
    const hace = Math.round((inicioActual - inicioSemana(tarea.actualizada)) / (7 * DIA_MS))
    if (hace >= 0 && hace < SEMANAS_ESTADISTICAS) {
      semanas[SEMANAS_ESTADISTICAS - 1 - hace].cantidad++
    }
  }

  return semanas
}

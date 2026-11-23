// Funciones puras de formato. No tocan el estado ni localStorage.

export const ETIQUETAS_PRIORIDAD = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

// "2026-11-25" -> "25/11"
export function fechaCorta(fechaIso) {
  const [, mes, dia] = fechaIso.split('-')
  return `${dia}/${mes}`
}

// Días desde hoy hasta la fecha (negativo = ya venció).
export function diasHasta(fechaIso) {
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((fecha - hoy) / 86400000)
}

// "vencida" en rojo, "por-vencer" si vence en las próximas 48 horas (amarillo), o "normal".
export function estadoFecha(fechaIso) {
  const dias = diasHasta(fechaIso)
  if (dias < 0) return 'vencida'
  if (dias <= 2) return 'por-vencer'
  return 'normal'
}

// "Juan Pizarro" -> "JP"; "JP" -> "JP"
export function iniciales(nombre) {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
  return nombre.trim().slice(0, 2).toUpperCase()
}

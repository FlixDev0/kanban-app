import {
  COLUMNAS,
  LIMITE_EN_PROGRESO_DEFECTO,
  LIMITES_TITULO,
  PRIORIDADES,
  ROLES,
} from '../constants.js'

// Valida un archivo de tablero antes de importarlo. No modifica nada.
// Devuelve { ok: true, datos } con los campos normalizados, o { ok: false, error }.

export const FORMATO_ARCHIVO = 'kanban-tablero'

const IDS_COLUMNA = COLUMNAS.map((c) => c.id)
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/
const REGEX_CODIGO = /^WEB-\d{3,}$/

const esTexto = (v) => typeof v === 'string'
const esFechaIso = (v) => esTexto(v) && !Number.isNaN(Date.parse(v))
const esLimite = (v) => Number.isInteger(v) && v >= 1 && v <= 99

function validarTarea(t, posicion) {
  const error = (mensaje) => ({ ok: false, error: `Tarea ${posicion}: ${mensaje}` })

  if (!t || typeof t !== 'object' || Array.isArray(t)) return error('no es un objeto.')
  if (!Number.isFinite(t.id)) return error('id inválido.')
  if (!REGEX_CODIGO.test(t.codigo)) return error('código inválido (formato WEB-000).')
  if (!esTexto(t.titulo) || !t.titulo.trim() || t.titulo.length > LIMITES_TITULO.titulo) {
    return error('título vacío o demasiado largo.')
  }
  if (!esTexto(t.descripcion) || t.descripcion.length > LIMITES_TITULO.descripcion) {
    return error('descripción demasiado larga.')
  }
  if (!IDS_COLUMNA.includes(t.columna)) return error('columna desconocida.')
  if (!PRIORIDADES.includes(t.prioridad)) return error('prioridad desconocida.')
  if (!(t.fechaLimite === null || (esTexto(t.fechaLimite) && REGEX_FECHA.test(t.fechaLimite)))) {
    return error('fecha límite inválida.')
  }
  if (!Array.isArray(t.responsables) || !t.responsables.every(esTexto)) {
    return error('responsables inválidos.')
  }
  if (typeof t.bloqueada !== 'boolean') return error('campo bloqueada inválido.')
  if (!esFechaIso(t.creada) || !esFechaIso(t.actualizada)) return error('fechas inválidas.')
  return null
}

function validarEntradaHistorial(h, posicion) {
  const error = (mensaje) => ({ ok: false, error: `Historial ${posicion}: ${mensaje}` })

  if (!h || typeof h !== 'object' || Array.isArray(h)) return error('no es un objeto.')
  if (!esTexto(h.id) || !esFechaIso(h.fecha) || !esTexto(h.usuario)) return error('datos inválidos.')
  if (!esTexto(h.codigo) || !esTexto(h.titulo)) return error('tarea inválida.')
  if (!IDS_COLUMNA.includes(h.de) || !IDS_COLUMNA.includes(h.a)) return error('columna inválida.')
  return null
}

export function validarTablero(archivo) {
  const error = (mensaje) => ({ ok: false, error: mensaje })

  if (!archivo || typeof archivo !== 'object' || Array.isArray(archivo)) {
    return error('El archivo no tiene el formato esperado.')
  }
  if (archivo.formato !== FORMATO_ARCHIVO) {
    return error('No es un archivo de tablero Kanban.')
  }
  if (!Array.isArray(archivo.tareas)) return error('Falta la lista de tareas.')
  if (!Number.isInteger(archivo.contadorCodigo) || archivo.contadorCodigo < 1) {
    return error('El contador de códigos no es válido.')
  }

  const limiteProgreso = archivo.limiteProgreso ?? LIMITE_EN_PROGRESO_DEFECTO
  if (!esLimite(limiteProgreso)) return error('El límite de En progreso no es válido.')

  const historial = archivo.historial ?? []
  if (!Array.isArray(historial)) return error('El historial no es una lista.')

  const ids = new Set()
  const codigos = new Set()
  for (let i = 0; i < archivo.tareas.length; i++) {
    const t = archivo.tareas[i]
    const problema = validarTarea(t, i + 1)
    if (problema) return problema
    if (ids.has(t.id)) return error(`Tarea ${i + 1}: id repetido.`)
    if (codigos.has(t.codigo)) return error(`Tarea ${i + 1}: código repetido.`)
    ids.add(t.id)
    codigos.add(t.codigo)
  }

  for (let i = 0; i < historial.length; i++) {
    const problema = validarEntradaHistorial(historial[i], i + 1)
    if (problema) return problema
  }

  const equipo = archivo.equipo ?? []
  if (!Array.isArray(equipo)) return error('El equipo no es una lista.')
  const nombresEquipo = new Set()
  for (let i = 0; i < equipo.length; i++) {
    const m = equipo[i]
    if (!m || typeof m !== 'object' || !esTexto(m.nombre) || !m.nombre.trim()) {
      return error(`Miembro ${i + 1}: nombre inválido.`)
    }
    if (m.nombre.length > 30) return error(`Miembro ${i + 1}: nombre demasiado largo.`)
    if (!ROLES.map((r) => r.id).includes(m.rol)) return error(`Miembro ${i + 1}: rol inválido.`)
    if (nombresEquipo.has(m.nombre)) return error(`Miembro ${i + 1}: nombre repetido.`)
    nombresEquipo.add(m.nombre)
  }

  return {
    ok: true,
    datos: {
      tareas: archivo.tareas,
      contadorCodigo: archivo.contadorCodigo,
      limiteProgreso,
      historial,
      equipo,
    },
  }
}

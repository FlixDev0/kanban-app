import { reactive, shallowReactive, computed, ref, watch } from 'vue'
import {
  CLAVE_ALMACENAMIENTO,
  COLUMNAS,
  LIMITE_EN_PROGRESO_DEFECTO,
  MAX_HISTORIAL,
  PRIORIDAD_DEFECTO,
  PRIORIDADES,
  LIMITES_TITULO,
  MAX_ACCIONES_DESHACER,
  ROLES,
  ROL_DEFECTO,
  ROL_NUEVO_MIEMBRO,
  USUARIO_DEFECTO,
} from '../constants.js'
import { DATOS_EJEMPLO } from '../data/datos-ejemplo.js'
import { FORMATO_ARCHIVO, validarTablero } from '../utils/validar.js'

// Único punto que lee y escribe localStorage. Los componentes solo usan estas funciones.

const ROLES_VALIDOS = ROLES.map((r) => r.id)
const MENSAJE_LECTURA = 'Estás en modo solo lectura.'

function copiarEjemplo() {
  return structuredClone(DATOS_EJEMPLO)
}

function cargarEstado() {
  try {
    const raw = localStorage.getItem(CLAVE_ALMACENAMIENTO)
    if (raw) {
      const datos = JSON.parse(raw)
      if (Array.isArray(datos.tareas) && typeof datos.contadorCodigo === 'number') {
        if (typeof datos.limiteProgreso !== 'number') {
          datos.limiteProgreso = LIMITE_EN_PROGRESO_DEFECTO
        }
        if (typeof datos.usuario !== 'string') datos.usuario = USUARIO_DEFECTO
        if (!Array.isArray(datos.historial)) datos.historial = []
        if (!Array.isArray(datos.equipo)) datos.equipo = []
        return datos
      }
    }
  } catch {
    // Datos corruptos: se usa el tablero de ejemplo.
  }
  return { ...copiarEjemplo(), usuario: USUARIO_DEFECTO }
}

const estado = reactive(cargarEstado())

watch(
  estado,
  (valor) => {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(valor))
    } catch {
      // Sin espacio o sin acceso a localStorage: el tablero sigue funcionando en memoria.
    }
  },
  { deep: true },
)

const columnasValidas = COLUMNAS.map((c) => c.id)

// Vista activa: tablero, métricas, historial o equipo.
const vista = ref('tablero')

// Búsqueda y filtro por persona: se combinan entre sí.
const busqueda = ref('')
const filtroResponsable = ref('')
const buscando = computed(() => busqueda.value.trim() !== '' || filtroResponsable.value !== '')

// Detalle abierto en la ventana (null = ninguna).
const idAbierto = ref(null)

// Deshacer: cada acción guarda una función que revierte solo esa acción.
// No se guarda en localStorage; se pierde al recargar la página.
const pilaDeshacer = shallowReactive([])
const deshacerDisponible = computed(() => pilaDeshacer.length > 0)

function registrarDeshacer(revertir) {
  pilaDeshacer.push(revertir)
  if (pilaDeshacer.length > MAX_ACCIONES_DESHACER) pilaDeshacer.shift()
}

function deshacerUltimo() {
  if (!puedeEditar.value) return
  const revertir = pilaDeshacer.pop()
  revertir?.()
}

// Equipo y permisos. No hay inicio de sesión: el rol se toma del nombre elegido en "Tu nombre".
const equipo = computed(() => estado.equipo)
const rolActual = computed(
  () => estado.equipo.find((m) => m.nombre === estado.usuario)?.rol ?? ROL_DEFECTO,
)
const puedeEditar = computed(() => rolActual.value === 'editar')

const tareas = computed(() => estado.tareas)

const tareasPorColumna = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const persona = filtroResponsable.value
  return Object.fromEntries(
    COLUMNAS.map((c) => [
      c.id,
      estado.tareas.filter(
        (t) =>
          t.columna === c.id &&
          (!q || t.titulo.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q)) &&
          (!persona || t.responsables.includes(persona)),
      ),
    ]),
  )
})

// Cantidad real por columna, sin filtros (para el límite de columna).
const conteoPorColumna = computed(() =>
  Object.fromEntries(
    COLUMNAS.map((c) => [c.id, estado.tareas.filter((t) => t.columna === c.id).length]),
  ),
)

const responsablesDisponibles = computed(() =>
  [...new Set(estado.tareas.flatMap((t) => t.responsables))].sort(),
)

const totalTareas = computed(() => estado.tareas.length)
const totalBloqueadas = computed(() => estado.tareas.filter((t) => t.bloqueada).length)

const limiteProgreso = computed(() => estado.limiteProgreso)

function setLimiteProgreso(valor) {
  if (!puedeEditar.value) return
  const n = Number(valor)
  if (!Number.isInteger(n) || n < 1 || n > 99) return
  estado.limiteProgreso = n
}

const usuario = computed(() => estado.usuario)

function setUsuario(nombre) {
  const limpio = nombre.trim().slice(0, 30)
  estado.usuario = limpio || USUARIO_DEFECTO
}

const historial = computed(() => estado.historial)

function limpiarHistorial() {
  if (!puedeEditar.value) return
  estado.historial = []
}

function buscarTarea(id) {
  return estado.tareas.find((t) => t.id === id)
}

const tareaAbierta = computed(() => (idAbierto.value === null ? null : buscarTarea(idAbierto.value)))

// Ver el detalle está permitido también en solo lectura.
function abrirDetalle(id) {
  if (buscarTarea(id)) idAbierto.value = id
}

function cerrarDetalle() {
  idAbierto.value = null
}

// Cambia campos de una tarea y registra cómo revertirlos.
function modificarTarea(tarea, cambios) {
  const id = tarea.id
  const antes = { actualizada: tarea.actualizada }
  for (const campo of Object.keys(cambios)) antes[campo] = tarea[campo]

  registrarDeshacer(() => {
    const t = buscarTarea(id)
    if (t) Object.assign(t, antes)
  })

  Object.assign(tarea, cambios, { actualizada: new Date().toISOString() })
}

// Guarda la ventana de detalle. Si nada cambió, no registra nada.
function guardarDetalle(id, datos) {
  if (!puedeEditar.value) return
  const tarea = buscarTarea(id)
  if (!tarea) return

  const cambios = {}
  for (const campo of Object.keys(datos)) {
    if (JSON.stringify(tarea[campo]) !== JSON.stringify(datos[campo])) {
      cambios[campo] = datos[campo]
    }
  }
  if (Object.keys(cambios).length > 0) modificarTarea(tarea, cambios)
}

function agregarTarea(columna, titulo) {
  if (!puedeEditar.value) return false
  const limpio = titulo.trim().slice(0, LIMITES_TITULO.titulo)
  if (!limpio || !columnasValidas.includes(columna)) return false

  let id = Date.now()
  while (estado.tareas.some((t) => t.id === id)) id++

  const ahora = new Date().toISOString()
  const numero = estado.contadorCodigo++
  estado.tareas.push({
    id,
    codigo: 'WEB-' + String(numero).padStart(3, '0'),
    titulo: limpio,
    descripcion: '',
    columna,
    prioridad: PRIORIDAD_DEFECTO,
    fechaLimite: null,
    responsables: [],
    bloqueada: false,
    creada: ahora,
    actualizada: ahora,
  })
  return true
}

// Mover entra en el historial y, al deshacerlo, sale del historial.
function moverTarea(id, columna) {
  if (!puedeEditar.value) return
  const tarea = buscarTarea(id)
  if (!tarea || tarea.columna === columna || !columnasValidas.includes(columna)) return

  const ahora = new Date().toISOString()
  const antes = { columna: tarea.columna, bloqueada: tarea.bloqueada, actualizada: tarea.actualizada }
  const entrada = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fecha: ahora,
    usuario: estado.usuario,
    codigo: tarea.codigo,
    titulo: tarea.titulo,
    de: tarea.columna,
    a: columna,
  }

  estado.historial.push(entrada)
  while (estado.historial.length > MAX_HISTORIAL) estado.historial.shift()

  registrarDeshacer(() => {
    const t = buscarTarea(id)
    if (t) Object.assign(t, antes)
    const indice = estado.historial.findIndex((h) => h.id === entrada.id)
    if (indice >= 0) estado.historial.splice(indice, 1)
  })

  const cambios = { columna }
  // Listo no admite bloqueos: al llegar ahí se quita el bloqueo.
  if (columna === 'listo') cambios.bloqueada = false
  Object.assign(tarea, cambios, { actualizada: ahora })
}

function moverPaso(id, direccion) {
  const tarea = buscarTarea(id)
  if (!tarea) return
  const indice = columnasValidas.indexOf(tarea.columna) + direccion
  if (indice < 0 || indice >= columnasValidas.length) return
  moverTarea(id, columnasValidas[indice])
}

function alternarBloqueo(id) {
  if (!puedeEditar.value) return
  const tarea = buscarTarea(id)
  if (!tarea || tarea.columna === 'listo') return
  modificarTarea(tarea, { bloqueada: !tarea.bloqueada })
}

function cambiarPrioridad(id, prioridad) {
  if (!puedeEditar.value) return
  const tarea = buscarTarea(id)
  if (!tarea || tarea.prioridad === prioridad || !PRIORIDADES.includes(prioridad)) return
  modificarTarea(tarea, { prioridad })
}

function eliminarTarea(id) {
  if (!puedeEditar.value) return
  const indice = estado.tareas.findIndex((t) => t.id === id)
  if (indice < 0) return

  // Copia completa para poder volver a insertarla en la misma posición.
  const copia = JSON.parse(JSON.stringify(estado.tareas[indice]))
  registrarDeshacer(() => {
    estado.tareas.splice(Math.min(indice, estado.tareas.length), 0, copia)
  })
  estado.tareas.splice(indice, 1)
  if (idAbierto.value === id) cerrarDetalle()
}

// Equipo: solo quien puede editar gestiona miembros. Siempre debe quedar al menos un editor.
function cantidadEditores() {
  return estado.equipo.filter((m) => m.rol === 'editar').length
}

function agregarMiembro(nombre) {
  if (!puedeEditar.value) return false
  const limpio = nombre.trim().slice(0, 30)
  if (!limpio || estado.equipo.some((m) => m.nombre === limpio)) return false
  estado.equipo.push({ nombre: limpio, rol: ROL_NUEVO_MIEMBRO })
  return true
}

function cambiarRol(nombre, rol) {
  if (!puedeEditar.value || !ROLES_VALIDOS.includes(rol)) return
  const miembro = estado.equipo.find((m) => m.nombre === nombre)
  if (!miembro || miembro.rol === rol) return
  if (miembro.rol === 'editar' && cantidadEditores() === 1) return
  miembro.rol = rol
}

function quitarMiembro(nombre) {
  if (!puedeEditar.value) return
  const miembro = estado.equipo.find((m) => m.nombre === nombre)
  if (!miembro) return
  if (miembro.rol === 'editar' && cantidadEditores() === 1) return
  estado.equipo = estado.equipo.filter((m) => m.nombre !== nombre)
}

function reiniciar() {
  if (!puedeEditar.value) return
  const ejemplo = copiarEjemplo()
  estado.tareas = ejemplo.tareas
  estado.contadorCodigo = ejemplo.contadorCodigo
  estado.historial = ejemplo.historial
  estado.limiteProgreso = ejemplo.limiteProgreso
  estado.equipo = ejemplo.equipo
  pilaDeshacer.length = 0
  cerrarDetalle()
}

// Exportar: tablero completo como objeto listo para guardar en JSON.
function exportarTablero() {
  return JSON.parse(
    JSON.stringify({
      formato: FORMATO_ARCHIVO,
      version: 1,
      exportado: new Date().toISOString(),
      tareas: estado.tareas,
      contadorCodigo: estado.contadorCodigo,
      limiteProgreso: estado.limiteProgreso,
      historial: estado.historial,
      equipo: estado.equipo,
    }),
  )
}

// Importar: valida primero; si algo falla, no se cambia nada.
function importarTablero(archivo) {
  if (!puedeEditar.value) return { ok: false, error: MENSAJE_LECTURA }
  const resultado = validarTablero(archivo)
  if (!resultado.ok) return resultado

  const { datos } = resultado
  estado.tareas = datos.tareas
  estado.contadorCodigo = datos.contadorCodigo
  estado.limiteProgreso = datos.limiteProgreso
  estado.historial = datos.historial
  estado.equipo = datos.equipo
  pilaDeshacer.length = 0
  cerrarDetalle()
  return { ok: true }
}

export function useKanban() {
  return {
    vista,
    tareas,
    busqueda,
    filtroResponsable,
    buscando,
    tareasPorColumna,
    conteoPorColumna,
    responsablesDisponibles,
    totalTareas,
    totalBloqueadas,
    limiteProgreso,
    setLimiteProgreso,
    usuario,
    setUsuario,
    historial,
    limpiarHistorial,
    equipo,
    rolActual,
    puedeEditar,
    agregarMiembro,
    cambiarRol,
    quitarMiembro,
    tareaAbierta,
    abrirDetalle,
    cerrarDetalle,
    guardarDetalle,
    deshacerDisponible,
    agregarTarea,
    moverTarea,
    moverPaso,
    alternarBloqueo,
    cambiarPrioridad,
    eliminarTarea,
    deshacerUltimo,
    reiniciar,
    exportarTablero,
    importarTablero,
  }
}

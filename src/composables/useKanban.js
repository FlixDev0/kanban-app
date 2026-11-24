import { reactive, shallowReactive, computed, ref, watch } from 'vue'
import {
  CLAVE_ALMACENAMIENTO,
  COLUMNAS,
  ID_TABLERO_PRINCIPAL,
  LIMITE_EN_PROGRESO_DEFECTO,
  LIMITES_TABLERO,
  LIMITES_TITULO,
  MAX_ACCIONES_DESHACER,
  MAX_HISTORIAL,
  NOMBRE_PRINCIPAL,
  PREFIJO_PRINCIPAL,
  PRIORIDAD_DEFECTO,
  PRIORIDADES,
  REGEX_PREFIJO,
  ROLES,
  ROL_DEFECTO,
  ROL_NUEVO_MIEMBRO,
  USUARIO_DEFECTO,
} from '../constants.js'
import { DATOS_EJEMPLO } from '../data/datos-ejemplo.js'
import { FORMATO_ARCHIVO, validarTablero } from '../utils/validar.js'

// Único punto que lee y escribe localStorage. Los componentes solo usan estas funciones.
//
// Estructura guardada:
//   tableros: [{ id, nombre, prefijo, contadorCodigo, limiteProgreso, tareas, historial }]
//   tableroActivoId, equipo, usuario   (el equipo y el usuario son compartidos por todos los tableros)

const ROLES_VALIDOS = ROLES.map((r) => r.id)
const MENSAJE_LECTURA = 'Estás en modo solo lectura.'

function copiarEjemplo() {
  return structuredClone(DATOS_EJEMPLO)
}

function tableroDeEjemplo() {
  const ejemplo = copiarEjemplo()
  return {
    id: ID_TABLERO_PRINCIPAL,
    nombre: NOMBRE_PRINCIPAL,
    prefijo: PREFIJO_PRINCIPAL,
    contadorCodigo: ejemplo.contadorCodigo,
    limiteProgreso: ejemplo.limiteProgreso,
    tareas: ejemplo.tareas,
    historial: ejemplo.historial,
  }
}

function estadoInicial() {
  return {
    tableros: [tableroDeEjemplo()],
    tableroActivoId: ID_TABLERO_PRINCIPAL,
    equipo: copiarEjemplo().equipo,
    usuario: USUARIO_DEFECTO,
  }
}

// Formato anterior (un solo tablero): pasa a ser el tablero "Proyecto Web" con código WEB.
function migrarFormatoAnterior(datos) {
  return {
    tableros: [
      {
        id: ID_TABLERO_PRINCIPAL,
        nombre: NOMBRE_PRINCIPAL,
        prefijo: PREFIJO_PRINCIPAL,
        contadorCodigo: datos.contadorCodigo,
        limiteProgreso:
          typeof datos.limiteProgreso === 'number' ? datos.limiteProgreso : LIMITE_EN_PROGRESO_DEFECTO,
        tareas: datos.tareas,
        historial: Array.isArray(datos.historial) ? datos.historial : [],
      },
    ],
    tableroActivoId: ID_TABLERO_PRINCIPAL,
    equipo: Array.isArray(datos.equipo) ? datos.equipo : [],
    usuario: typeof datos.usuario === 'string' ? datos.usuario : USUARIO_DEFECTO,
  }
}

function cargarEstado() {
  try {
    const raw = localStorage.getItem(CLAVE_ALMACENAMIENTO)
    if (raw) {
      const datos = JSON.parse(raw)

      if (Array.isArray(datos.tableros) && datos.tableros.length > 0) {
        for (const t of datos.tableros) {
          if (!Array.isArray(t.historial)) t.historial = []
          if (typeof t.limiteProgreso !== 'number') t.limiteProgreso = LIMITE_EN_PROGRESO_DEFECTO
        }
        if (!datos.tableros.some((t) => t.id === datos.tableroActivoId)) {
          datos.tableroActivoId = datos.tableros[0].id
        }
        if (typeof datos.usuario !== 'string') datos.usuario = USUARIO_DEFECTO
        if (!Array.isArray(datos.equipo)) datos.equipo = []
        return datos
      }

      if (Array.isArray(datos.tareas) && typeof datos.contadorCodigo === 'number') {
        return migrarFormatoAnterior(datos)
      }
    }
  } catch {
    // Datos corruptos: se usa el tablero de ejemplo.
  }
  return estadoInicial()
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

// Tablero activo: todas las tareas, el historial y el límite pertenecen a él.
const tablero = computed(
  () => estado.tableros.find((t) => t.id === estado.tableroActivoId) ?? estado.tableros[0],
)
const tableros = computed(() => estado.tableros)

// Vista activa: tablero, métricas, historial o equipo.
const vista = ref('tablero')

// Búsqueda y filtro por persona: se combinan entre sí.
const busqueda = ref('')
const filtroResponsable = ref('')
const buscando = computed(() => busqueda.value.trim() !== '' || filtroResponsable.value !== '')

// Detalle abierto en la ventana (null = ninguna).
const idAbierto = ref(null)

// Deshacer: cada acción guarda una función que revierte solo esa acción.
// No se guarda en localStorage; se pierde al recargar la página o al cambiar de tablero.
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

const tareas = computed(() => tablero.value.tareas)

const tareasPorColumna = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const persona = filtroResponsable.value
  return Object.fromEntries(
    COLUMNAS.map((c) => [
      c.id,
      tablero.value.tareas.filter(
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
    COLUMNAS.map((c) => [c.id, tablero.value.tareas.filter((t) => t.columna === c.id).length]),
  ),
)

// Límite estricto: con En progreso lleno no entran más tareas hasta subir el límite o liberar lugar.
const progresoLleno = computed(
  () => conteoPorColumna.value.progreso >= tablero.value.limiteProgreso,
)

// Mensaje temporal para explicar por qué se rechazó una acción.
const mensaje = ref('')
let temporizadorMensaje = null

function mostrarMensaje(texto) {
  mensaje.value = texto
  clearTimeout(temporizadorMensaje)
  temporizadorMensaje = setTimeout(() => {
    mensaje.value = ''
  }, 4500)
}

function avisarLimite() {
  mostrarMensaje(
    `En progreso está en su límite (${tablero.value.limiteProgreso}). Subí el límite o liberá lugar para agregar más.`,
  )
}

// Opciones del filtro: todo el equipo, más cualquier responsable de una tarea que no esté en el equipo.
const responsablesDisponibles = computed(() =>
  [
    ...new Set([
      ...estado.equipo.map((m) => m.nombre),
      ...tablero.value.tareas.flatMap((t) => t.responsables),
    ]),
  ].sort(),
)

const totalTareas = computed(() => tablero.value.tareas.length)
const totalBloqueadas = computed(() => tablero.value.tareas.filter((t) => t.bloqueada).length)

const limiteProgreso = computed(() => tablero.value.limiteProgreso)

function setLimiteProgreso(valor) {
  if (!puedeEditar.value) return
  const n = Number(valor)
  if (!Number.isInteger(n) || n < 1 || n > 99) return
  tablero.value.limiteProgreso = n
}

const usuario = computed(() => estado.usuario)

function setUsuario(nombre) {
  const limpio = nombre.trim().slice(0, 30)
  estado.usuario = limpio || USUARIO_DEFECTO
}

const historial = computed(() => tablero.value.historial)

function limpiarHistorial() {
  if (!puedeEditar.value) return
  tablero.value.historial = []
}

function buscarTarea(id) {
  return tablero.value.tareas.find((t) => t.id === id)
}

const tareaAbierta = computed(() => (idAbierto.value === null ? null : buscarTarea(idAbierto.value)))

// Ver el detalle está permitido también en solo lectura.
function abrirDetalle(id) {
  if (buscarTarea(id)) idAbierto.value = id
}

function cerrarDetalle() {
  idAbierto.value = null
}

// Cambia de tablero. Se limpian los filtros, el deshacer y el detalle abierto, que eran del anterior.
function seleccionarTablero(id) {
  if (!estado.tableros.some((t) => t.id === id) || id === estado.tableroActivoId) return
  estado.tableroActivoId = id
  pilaDeshacer.length = 0
  busqueda.value = ''
  filtroResponsable.value = ''
  cerrarDetalle()
}

// Crea un tablero vacío con el código elegido para sus tareas (ej. "MKT" -> MKT-001, MKT-002…).
function crearTablero(nombre, prefijo) {
  if (!puedeEditar.value) return { ok: false, error: MENSAJE_LECTURA }

  const nombreLimpio = nombre.trim().slice(0, LIMITES_TABLERO.nombre)
  const codigo = prefijo.trim().toUpperCase()

  if (!nombreLimpio) return { ok: false, error: 'El nombre es obligatorio.' }
  if (!REGEX_PREFIJO.test(codigo)) {
    return {
      ok: false,
      error: `El código debe tener de ${LIMITES_TABLERO.prefijoMin} a ${LIMITES_TABLERO.prefijoMax} letras o números, sin espacios ni símbolos.`,
    }
  }
  if (estado.tableros.some((t) => t.nombre.toLowerCase() === nombreLimpio.toLowerCase())) {
    return { ok: false, error: 'Ya existe un tablero con ese nombre.' }
  }
  if (estado.tableros.some((t) => t.prefijo === codigo)) {
    return { ok: false, error: `Ya existe un tablero con el código ${codigo}.` }
  }

  const nuevo = {
    id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    nombre: nombreLimpio,
    prefijo: codigo,
    contadorCodigo: 1,
    limiteProgreso: LIMITE_EN_PROGRESO_DEFECTO,
    tareas: [],
    historial: [],
  }
  estado.tableros.push(nuevo)
  seleccionarTablero(nuevo.id)
  vista.value = 'tablero'
  return { ok: true }
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
  if (columna === 'progreso' && progresoLleno.value) {
    avisarLimite()
    return false
  }

  const actual = tablero.value
  let id = Date.now()
  while (actual.tareas.some((t) => t.id === id)) id++

  const ahora = new Date().toISOString()
  const numero = actual.contadorCodigo++
  actual.tareas.push({
    id,
    codigo: `${actual.prefijo}-${String(numero).padStart(3, '0')}`,
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
  if (columna === 'progreso' && progresoLleno.value) {
    avisarLimite()
    return
  }

  const actual = tablero.value
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

  actual.historial.push(entrada)
  while (actual.historial.length > MAX_HISTORIAL) actual.historial.shift()

  registrarDeshacer(() => {
    const t = buscarTarea(id)
    if (t) Object.assign(t, antes)
    const indice = actual.historial.findIndex((h) => h.id === entrada.id)
    if (indice >= 0) actual.historial.splice(indice, 1)
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
  const actual = tablero.value
  const indice = actual.tareas.findIndex((t) => t.id === id)
  if (indice < 0) return

  // Copia completa para poder volver a insertarla en la misma posición.
  const copia = JSON.parse(JSON.stringify(actual.tareas[indice]))
  registrarDeshacer(() => {
    actual.tareas.splice(Math.min(indice, actual.tareas.length), 0, copia)
  })
  actual.tareas.splice(indice, 1)
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

// Reinicia solo el tablero activo: "Proyecto Web" vuelve a los datos de ejemplo; los demás quedan vacíos.
// No toca los otros tableros ni el equipo.
function reiniciar() {
  if (!puedeEditar.value) return
  const actual = tablero.value

  if (actual.id === ID_TABLERO_PRINCIPAL) {
    const ejemplo = tableroDeEjemplo()
    actual.tareas = ejemplo.tareas
    actual.contadorCodigo = ejemplo.contadorCodigo
    actual.limiteProgreso = ejemplo.limiteProgreso
    actual.historial = ejemplo.historial
  } else {
    actual.tareas = []
    actual.contadorCodigo = 1
    actual.limiteProgreso = LIMITE_EN_PROGRESO_DEFECTO
    actual.historial = []
  }
  pilaDeshacer.length = 0
  cerrarDetalle()
}

// Exportar: el tablero activo (y el equipo) como objeto listo para guardar en JSON.
function exportarTablero() {
  const actual = tablero.value
  return JSON.parse(
    JSON.stringify({
      formato: FORMATO_ARCHIVO,
      version: 1,
      exportado: new Date().toISOString(),
      nombre: actual.nombre,
      prefijo: actual.prefijo,
      tareas: actual.tareas,
      contadorCodigo: actual.contadorCodigo,
      limiteProgreso: actual.limiteProgreso,
      historial: actual.historial,
      equipo: estado.equipo,
    }),
  )
}

// Importar: reemplaza el contenido del tablero activo (conserva su nombre y su código).
// Valida primero; si algo falla, no se cambia nada.
function importarTablero(archivo) {
  if (!puedeEditar.value) return { ok: false, error: MENSAJE_LECTURA }
  const resultado = validarTablero(archivo)
  if (!resultado.ok) return resultado

  const { datos } = resultado
  const actual = tablero.value
  actual.tareas = datos.tareas
  actual.contadorCodigo = datos.contadorCodigo
  actual.limiteProgreso = datos.limiteProgreso
  actual.historial = datos.historial
  if (datos.equipo) estado.equipo = datos.equipo
  pilaDeshacer.length = 0
  cerrarDetalle()
  return { ok: true }
}

export function useKanban() {
  return {
    vista,
    tablero,
    tableros,
    seleccionarTablero,
    crearTablero,
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
    progresoLleno,
    mensaje,
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

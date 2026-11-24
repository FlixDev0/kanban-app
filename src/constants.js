// Valores fijos de la aplicación, según la especificación de fase 1.

export const CLAVE_ALMACENAMIENTO = 'kanban-tablero-v1'

export const LIMITE_EN_PROGRESO_DEFECTO = 3
export const MAX_ACCIONES_DESHACER = 20
export const MAX_HISTORIAL = 500 // pregunta abierta: ¿guardar todo o hasta 500? Se usa 500.
export const USUARIO_DEFECTO = 'Usuario'

// Tableros. El primero (de ejemplo) usa el código WEB; los nuevos eligen el suyo (2 a 6 letras o números).
export const ID_TABLERO_PRINCIPAL = 'principal'
export const NOMBRE_PRINCIPAL = 'Proyecto Web'
export const PREFIJO_PRINCIPAL = 'WEB'
export const LIMITES_TABLERO = { nombre: 40, prefijoMin: 2, prefijoMax: 6 }
export const REGEX_PREFIJO = /^[A-Z0-9]{2,6}$/

// Roles del equipo. Quien no está en la lista del equipo puede editar.
export const ROLES = [
  { id: 'editar', nombre: 'Puede editar' },
  { id: 'lectura', nombre: 'Solo lectura' },
]
export const ROL_DEFECTO = 'editar'
export const ROL_NUEVO_MIEMBRO = 'lectura'

export const COLUMNAS = [
  { id: 'backlog', nombre: 'Backlog', color: '#8b929c' },
  { id: 'progreso', nombre: 'En progreso', color: '#4f7cff' },
  { id: 'revision', nombre: 'Revisión', color: '#f5c26b' },
  { id: 'listo', nombre: 'Listo', color: '#3ddc97' },
]

export const PRIORIDADES = ['alta', 'media', 'baja']
export const PRIORIDAD_DEFECTO = 'media'

export const LIMITES_TITULO = { titulo: 80, descripcion: 1000 }

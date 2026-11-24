# Tablero Kanban

Tablero Kanban de escritorio hecho con Vue 3 (Composition API) y Vite. Los datos se guardan en el navegador con localStorage: no hay backend ni inicio de sesión.

Especificación de referencia: `../docs/Tablero Kanban especificación fase 1.md`.

## Requisitos

- Node.js 20 o superior
- npm

## Cómo correrlo

```powershell
cd kanban-app
npm install
npm run dev
```

Luego abrí la dirección que muestra Vite (normalmente http://localhost:5173).

Para generar la versión de producción:

```powershell
npm run build
npm run preview
```

## Funciones

- **Tablero:** cuatro columnas (Backlog, En progreso, Revisión, Listo). Agregar tareas, moverlas arrastrando o con ← →, bloquearlas y eliminarlas.
- **Varios tableros:** el botón **+ Nuevo tablero** de la barra lateral crea uno vacío. Al crearlo se elige el nombre y el **código de las tareas** (2 a 6 letras o números, por ejemplo `MKT`), y las tareas se numeran `MKT-001`, `MKT-002`… Cada tablero tiene sus propias tareas, historial, métricas y límite de En progreso. El equipo y el nombre de usuario son compartidos. Se cambia de tablero con la lista de la barra lateral.
- **Prioridad:** franja de color en el borde de cada tarjeta. Un clic la cambia (alta → media → baja).
- **Fecha límite:** se muestra como dd/mm. Vencida en rojo; vence en 2 días o menos, en amarillo.
- **Responsables:** iniciales en círculos, filtro por persona y búsqueda por título o código. Ambos se combinan. El filtro lista a todos los miembros de **Equipo**, tengan o no tareas.
- **Detalle:** clic en una tarjeta para editar título, descripción, prioridad, fecha y responsables. Los responsables se eligen de un desplegable con los miembros de **Equipo**.
- **Límite de En progreso:** 3 por defecto, editable en la columna con los botones − y +. Es un límite estricto: con la columna llena no se puede agregar ni mover más tareas a En progreso (las flechas y el campo de agregar se deshabilitan, y arrastrar muestra un mensaje) hasta subir el límite o liberar lugar.
- **Deshacer:** botón o Ctrl+Z, hasta 20 acciones.
- **Métricas:** tareas completadas por semana en las últimas 8 semanas.
- **Historial:** registro de movimientos entre columnas, con usuario y fecha.
- **Exportar / Importar:** archivo JSON. Al importar se valida el formato y, si falla, no se cambia nada.
- **Barra lateral ocultable:** el botón ‹ la oculta y el botón ☰ Menú la vuelve a mostrar, para ganar espacio en el tablero. Al recargar la página vuelve a verse.
- **Equipo:** lista de miembros con permiso de **Puede editar** o **Solo lectura**. Los miembros nuevos entran en solo lectura. En modo solo lectura se deshabilitan las acciones que cambian datos. No puede quedar el equipo sin ningún editor.

## Estructura

```
kanban-app/
├── public/
├── src/
│   ├── components/     # KanbanBoard, KanbanColumn, KanbanCard, TaskModal,
│   │                   # SearchBar, OwnerFilter, StatsPanel, HistoryPanel, ImportExport
│   ├── composables/
│   │   └── useKanban.js    # estado, reglas, deshacer y localStorage (único lugar que los toca)
│   ├── data/
│   │   └── datos-ejemplo.js  # tablero inicial, usado al cargar por primera vez y en Reiniciar
│   ├── styles/
│   │   └── tema.css        # colores y variables de diseño
│   ├── utils/
│   │   ├── estadisticas.js # tareas completadas por semana
│   │   ├── formato.js      # fechas, iniciales, prioridades
│   │   └── validar.js      # validación de archivos importados
│   ├── constants.js    # columnas, prioridades, límites
│   ├── App.vue
│   └── main.js
└── index.html
```

## Decisiones tomadas

La especificación dejaba algunos puntos abiertos. Estas son las decisiones que se tomaron:

- **Historial:** guarda hasta 500 movimientos; los más viejos se descartan.
- **Exportación:** incluye tareas, historial y configuración del límite.
- **Nombre de usuario:** se configura en la barra lateral ("Tu nombre"), no al entrar.
- **Varios tableros (cambia la especificación):** la especificación original decía "un solo tablero por navegador". Se cambió a pedido. Los datos anteriores se migran solos al tablero "Proyecto Web" con código `WEB`. Dos tableros no pueden repetir nombre ni código. Al cambiar de tablero se vacía el historial de deshacer y se limpian la búsqueda y el filtro.
- **Reiniciar y exportar/importar con varios tableros:** Reiniciar afecta solo al tablero activo ("Proyecto Web" vuelve a los datos de ejemplo; los demás quedan vacíos) y no toca el equipo. Exportar guarda el tablero activo y el equipo; importar reemplaza el contenido del tablero activo y conserva su nombre y su código.
- **Límite de En progreso:** se cambia desde un control en la propia columna, no desde una pantalla de ajustes.
- **Límite estricto (cambia la especificación):** la especificación original decía que, al superar el límite, solo aparecía un aviso amarillo y la tarea se movía igual. Se cambió a pedido: ahora se bloquea. Si el límite se baja por debajo de la cantidad actual, o se importa un tablero que ya lo supera, o se deshace un movimiento que devuelve una tarea a la columna llena, la columna puede quedar por encima del límite y muestra el aviso amarillo.
- **Mover a Listo:** quita el bloqueo de la tarea, porque Listo no admite bloqueos.
- **Prioridad baja:** gris, según la lista de funciones. La tabla de diseño decía verde; si se prefiere verde, cambiar `--prioridad-baja` en `src/styles/tema.css` y `.prioridad-baja` en `KanbanCard.vue`.
- **Fecha de completado (métricas):** se usa la última actualización de la tarea en Listo. Si se edita después de completarla, cambia su semana.
- **Deshacer:** no se guarda al recargar la página. Un movimiento deshecho también se quita del historial. Reiniciar borra el historial de deshacer.
- **Equipo y permisos:** el rol sale del nombre elegido en "Tu nombre". Quien no está en la lista del equipo puede editar. Los miembros nuevos entran en solo lectura.
- **Responsables:** se eligen de la lista de **Equipo**, así que el filtro coincide siempre. Si un dato viejo tiene un nombre que no está en el equipo, igual aparece en el desplegable para no perderlo.

## Limitaciones conocidas

- **Permisos sin seguridad real:** no hay inicio de sesión. Cualquiera que use el navegador puede cambiar "Tu nombre" a un miembro con permiso de edición. Los permisos sirven para organizar el trabajo, no como control de acceso. Un control real requiere backend y login.
- Solo escritorio, desde 1024 px de ancho. No está pensado para móvil.
- Los tableros no se pueden renombrar, cambiar de código ni eliminar todavía. Los datos no se sincronizan entre dispositivos.
- Los datos viven en localStorage: borrar los datos del sitio en el navegador borra el tablero (exportarlo antes evita perderlo).
- El botón Reiniciar usa el diálogo de confirmación del navegador.

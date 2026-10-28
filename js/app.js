/**
 * ============================================
 * PUNTO DE ENTRADA
 * Coordina datos, captura, interfaz y exportación
 * ============================================
 */

'use strict';

const App = (() => {

    const { MENSAJES } = CONFIG;

    let proyecto = null;
    let fotos = [];
    let colaImagenes = [];
    let imagenActual = null;

    // ---------- Carga de datos ----------

    async function refrescarGaleria() {
        fotos = proyecto ? await Database.obtenerFotos(proyecto.id) : [];
        UI.renderGaleria(fotos);
    }

    async function refrescarHistorial() {
        const proyectos = await Database.listarProyectos();
        const entradas = await Promise.all(proyectos.map(async (item) => ({
            proyecto: item,
            cantidadFotos: await Database.contarFotos(item.id)
        })));
        UI.renderHistorial(entradas);
    }

    function activarProyecto(nuevo) {
        proyecto = nuevo;
        UI.habilitarCaptura(Boolean(nuevo));
        UI.renderResumen(nuevo);
    }

    // ---------- Proyecto ----------

    async function guardarProyecto(datos) {
        try {
            const ahora = new Date().toISOString();
            const guardado = await Database.guardarProyecto({
                ...datos,
                id: proyecto ? proyecto.id : Utils.generarId(),
                fechaCreacion: proyecto ? proyecto.fechaCreacion : ahora,
                fechaActualizacion: ahora
            });

            activarProyecto(guardado);
            await refrescarGaleria();
            UI.mostrarToast(MENSAJES.PROYECTO_GUARDADO, 'success');
            UI.cambiarTab('captura');
        } catch (error) {
            console.error(MENSAJES.PROYECTO_ERROR, error);
            UI.mostrarToast(MENSAJES.PROYECTO_ERROR, 'error');
        }
    }

    function limpiarProyecto() {
        descartarCola();
        activarProyecto(null);
        fotos = [];
        UI.renderGaleria(fotos);
        UI.llenarFormulario(null);
        UI.establecerFechaPorDefecto();
        UI.cambiarTab('proyecto');
    }

    async function seleccionarProyecto(id) {
        try {
            const seleccionado = await Database.obtenerProyecto(id);
            if (!seleccionado) return;

            descartarCola();
            activarProyecto(seleccionado);
            UI.llenarFormulario(seleccionado);
            await refrescarGaleria();
            UI.cambiarTab('captura');
        } catch (error) {
            console.error('Error al abrir el proyecto:', error);
            UI.mostrarToast(MENSAJES.DB_ERROR, 'error');
        }
    }

    function cambiarTab(nombre) {
        if (nombre === 'historial') {
            refrescarHistorial().catch((error) => {
                console.error('Error al cargar el historial:', error);
                UI.mostrarToast(MENSAJES.DB_ERROR, 'error');
            });
        }
    }

    // ---------- Captura ----------

    function recibirImagenes(imagenes) {
        if (!proyecto) {
            UI.mostrarToast(MENSAJES.SIN_PROYECTO, 'warning');
            return;
        }

        colaImagenes.push(...imagenes);
        if (!imagenActual) mostrarSiguienteImagen();
    }

    function mostrarSiguienteImagen() {
        imagenActual = colaImagenes.shift() || null;
        if (imagenActual) {
            UI.abrirModal(imagenActual);
        } else {
            UI.cerrarModal();
        }
    }

    function descartarCola() {
        colaImagenes = [];
        imagenActual = null;
        UI.cerrarModal();
    }

    async function confirmarFoto(descripcion) {
        if (!imagenActual || !proyecto) return;

        UI.bloquearBotones(CONFIG.SELECTORES.BTN_CONFIRMAR_FOTO, true);
        try {
            const orden = fotos.length > 0 ? Math.max(...fotos.map((f) => f.orden)) + 1 : 0;
            await Database.guardarFoto({
                id: Utils.generarId(),
                proyectoId: proyecto.id,
                blob: imagenActual.blob,
                ancho: imagenActual.ancho,
                alto: imagenActual.alto,
                tamano: imagenActual.tamano,
                descripcion,
                orden,
                fechaCreacion: new Date().toISOString()
            });

            await refrescarGaleria();
            UI.mostrarToast(MENSAJES.FOTO_GUARDADA, 'success');
            mostrarSiguienteImagen();
        } catch (error) {
            console.error(MENSAJES.FOTO_ERROR, error);
            UI.mostrarToast(MENSAJES.FOTO_ERROR, 'error');
        } finally {
            UI.bloquearBotones(CONFIG.SELECTORES.BTN_CONFIRMAR_FOTO, false);
        }
    }

    function cancelarFoto() {
        if (!imagenActual) {
            UI.cerrarModal();
            return;
        }
        UI.mostrarToast(MENSAJES.CAPTURA_CANCELADA, 'info');
        mostrarSiguienteImagen();
    }

    // ---------- Edición de evidencias ----------

    async function cambiarDescripcion(id, descripcion) {
        const foto = fotos.find((f) => f.id === id);
        if (!foto || foto.descripcion === descripcion) return;

        try {
            await Database.guardarFoto({ ...foto, descripcion });
            foto.descripcion = descripcion;
        } catch (error) {
            console.error('Error al guardar la descripción:', error);
            UI.mostrarToast(MENSAJES.FOTO_ERROR, 'error');
        }
    }

    async function guardarNuevoOrden(ordenadas) {
        try {
            await Database.guardarOrden(ordenadas);
            fotos = ordenadas;
            UI.renderGaleria(fotos);
            UI.mostrarToast(MENSAJES.ORDEN_ACTUALIZADO, 'success');
        } catch (error) {
            console.error('Error al actualizar el orden:', error);
            UI.mostrarToast(MENSAJES.DB_ERROR, 'error');
        }
    }

    function moverFoto(id, direccion) {
        const indice = fotos.findIndex((f) => f.id === id);
        const destino = indice + direccion;
        if (indice < 0 || destino < 0 || destino >= fotos.length) return;

        const ordenadas = [...fotos];
        [ordenadas[indice], ordenadas[destino]] = [ordenadas[destino], ordenadas[indice]];
        guardarNuevoOrden(ordenadas);
    }

    function reordenarFoto(idOrigen, idDestino) {
        const origen = fotos.findIndex((f) => f.id === idOrigen);
        const destino = fotos.findIndex((f) => f.id === idDestino);
        if (origen < 0 || destino < 0) return;

        const ordenadas = [...fotos];
        const [movida] = ordenadas.splice(origen, 1);
        ordenadas.splice(destino, 0, movida);
        guardarNuevoOrden(ordenadas);
    }

    async function eliminarFoto(id) {
        if (!confirm(MENSAJES.CONFIRMACION_ELIMINAR)) return;

        try {
            await Database.eliminarFoto(id);
            await refrescarGaleria();
            UI.mostrarToast(MENSAJES.FOTO_ELIMINADA, 'success');
        } catch (error) {
            console.error('Error al eliminar la foto:', error);
            UI.mostrarToast(MENSAJES.DB_ERROR, 'error');
        }
    }

    // ---------- Exportación ----------

    async function exportar() {
        if (!proyecto) {
            UI.mostrarToast(MENSAJES.SIN_PROYECTO, 'warning');
            return;
        }
        if (fotos.length < CONFIG.VALIDACION.FOTOS_MIN_EXPORTAR) {
            UI.mostrarToast(MENSAJES.SIN_FOTOS, 'warning');
            return;
        }
        if (fotos.some((foto) => Utils.estaVacio(foto.descripcion))) {
            UI.mostrarToast(MENSAJES.VALIDACION_DESCRIPCION, 'warning');
            return;
        }

        UI.bloquearBotones(CONFIG.SELECTORES.BTN_EXPORTAR, true);
        try {
            await Exporter.generarWord(proyecto, fotos);
            UI.mostrarToast(MENSAJES.EXPORTACION_OK, 'success');
        } catch (error) {
            console.error(MENSAJES.EXPORTACION_ERROR, error);
            UI.mostrarToast(error.message || MENSAJES.EXPORTACION_ERROR, 'error');
        } finally {
            UI.bloquearBotones(CONFIG.SELECTORES.BTN_EXPORTAR, false);
        }
    }

    // ---------- Inicio ----------

    async function init() {
        UI.init({
            onCambiarTab: cambiarTab,
            onGuardarProyecto: guardarProyecto,
            onLimpiarProyecto: limpiarProyecto,
            onSeleccionarProyecto: seleccionarProyecto,
            onConfirmarFoto: confirmarFoto,
            onCancelarFoto: cancelarFoto,
            onDescripcionCambiada: cambiarDescripcion,
            onMover: moverFoto,
            onReordenar: reordenarFoto,
            onEliminarFoto: eliminarFoto,
            onExportar: exportar
        });
        Camera.init({
            alRecibir: recibirImagenes,
            alFallar: (mensaje) => UI.mostrarToast(mensaje, 'error')
        });

        UI.establecerFechaPorDefecto();
        UI.renderGaleria([]);
        UI.renderResumen(null);

        try {
            await Database.init();
            UI.actualizarEstadoDB(true);
            await refrescarHistorial();
        } catch (error) {
            console.error(MENSAJES.DB_ERROR, error);
            UI.actualizarEstadoDB(false);
            UI.mostrarToast(MENSAJES.DB_ERROR, 'error');
        }
    }

    return { init };

})();

document.addEventListener('DOMContentLoaded', App.init);

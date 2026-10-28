/**
 * ============================================
 * CONFIGURACIÓN DEL SISTEMA
 * Registro Fotográfico de Fiscalización
 * ============================================
 */

'use strict';

const CONFIG = Object.freeze({
    
    // Identificación de la aplicación
    APP: {
        NOMBRE: 'Registro Fotográfico',
        VERSION: '2.0.0',
        AUTOR: 'Sistema de Fiscalización'
    },

    // Configuración de IndexedDB
    DB: {
        NOMBRE: 'registro_fotografico_db',
        VERSION: 1,
        STORES: {
            PROYECTOS: 'proyectos',
            FOTOS: 'fotos'
        },
        INDICES: {
            PROYECTO_ID: 'proyectoId',
            FECHA: 'fechaCreacion'
        }
    },

    // Límites y validaciones
    VALIDACION: {
        CODIGO_MAX: 20,
        TEXTO_MAX: 100,
        DESCRIPCION_MAX: 500,
        DESCRIPCION_MIN: 10,
        FOTOS_MIN_EXPORTAR: 1,
        FOTOS_MAX_POR_PAGINA: 2
    },

    // Configuración de imágenes
    IMAGEN: {
        MAX_DIMENSION: 1920,        // px - redimensionar si es mayor
        CALIDAD_JPEG: 0.85,
        FORMATO_SALIDA: 'image/jpeg',
        MAX_TAMANO_MB: 10
    },

    // Configuración del documento Word
    DOCUMENTO: {
        FUENTE: 'Poppins',
        TAMANO_FUENTE: 16,           // 8pt = 16 half-points
        TAMANO_TITULO: 32,          // 16pt
        TAMANO_SUBTITULO: 24,       // 12pt
        MARGEN: 1440,               // 2.54 cm en twips
        ANCHO_PAGINA: 11906,        // A4 en twips
        ALTO_PAGINA: 16838,
        ANCHO_IMAGEN: 450,          // px en el documento
        ALTO_IMAGEN: 300
    },

    // Mensajes del sistema
    MENSAJES: {
        DB_INICIALIZADA: 'Base de datos lista',
        DB_ERROR: 'Error al inicializar el almacenamiento local',
        PROYECTO_GUARDADO: 'Datos de fiscalización guardados',
        PROYECTO_ERROR: 'No se pudo guardar el proyecto',
        FOTO_GUARDADA: 'Evidencia incorporada al registro',
        FOTO_ERROR: 'Error al procesar la imagen',
        FOTO_ELIMINADA: 'Fotografía eliminada del registro',
        ORDEN_ACTUALIZADO: 'Orden de evidencias actualizado',
        EXPORTACION_OK: 'Documento Word generado correctamente',
        EXPORTACION_ERROR: 'Error al generar el documento',
        VALIDACION_REQUERIDA: 'Complete los campos obligatorios',
        VALIDACION_DESCRIPCION: 'Todas las fotos deben tener descripción',
        CONFIRMACION_ELIMINAR: '¿Eliminar esta fotografía? Esta acción no se puede deshacer.',
        CAPTURA_CANCELADA: 'Captura cancelada',
        SIN_PROYECTO: 'Guarde los datos del proyecto primero',
        SIN_FOTOS: 'No hay evidencias para exportar'
    },

    // Selectores DOM (centralizados para mantenimiento)
    SELECTORES: {
        // Formulario
        FORM_FISCALIZACION: '#form-fiscalizacion',
        INPUT_CODIGO: '#inp-codigo',
        INPUT_FECHA: '#inp-fecha',
        INPUT_LUGAR: '#inp-lugar',
        INPUT_ESTABLECIMIENTO: '#inp-establecimiento',
        INPUT_FISCALIZADOR: '#inp-fiscalizador',
        
        // Navegación
        NAV_TABS: '.nav-tab',
        TAB_PANELS: '.tab-panel',
        BADGE_FOTOS: '#badge-fotos',
        
        // Captura
        BTN_CAMARA: '#btn-camara',
        BTN_GALERIA: '#btn-galeria',
        INPUT_CAMARA: '#input-camara',
        INPUT_GALERIA: '#input-galeria',
        
        // Modal
        MODAL_PREVIEW: '#modal-preview',
        PREVIEW_IMG: '#preview-img',
        PREVIEW_DIM: '#preview-dimensiones',
        PREVIEW_PESO: '#preview-peso',
        INPUT_DESCRIPCION: '#inp-descripcion',
        CHAR_COUNTER: '#char-counter',
        BTN_CONFIRMAR_FOTO: '#btn-confirmar-foto',
        BTN_CANCELAR_FOTO: '#btn-cancelar-foto',
        BTN_CERRAR_MODAL: '#btn-cerrar-modal',
        
        // Galería
        GALLERY_GRID: '#gallery-grid',
        GALLERY_COUNT: '#gallery-count',
        EMPTY_STATE: '#empty-state',
        EXPORT_ACTIONS: '#export-actions',
        BTN_EXPORTAR: '#btn-exportar-word',
        
        // Historial
        HISTORY_LIST: '#history-list',
        HISTORY_EMPTY: '#history-empty',
        
        // Resumen
        PROJECT_SUMMARY: '#project-summary',
        LBL_PROYECTO_ACTIVO: '#lbl-proyecto-activo',
        
        // Notificaciones
        TOAST_CONTAINER: '#toast-container',
        
        // Plantillas
        TEMPLATE_FOTO_CARD: '#template-foto-card'
    },

    // Timing
    TIMING: {
        TOAST_DURACION: 4000,
        TOAST_ANIMACION: 300,
        DEBOUNCE_INPUT: 500,
        ANIMACION_MODAL: 250
    }
});

// Exportar para uso en otros módulos (si se usa bundler)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
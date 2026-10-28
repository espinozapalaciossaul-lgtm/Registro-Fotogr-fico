/**
 * ============================================
 * CAPTURA DE IMÁGENES
 * Cámara del dispositivo y galería
 * ============================================
 */

'use strict';

const Camera = (() => {

    const { SELECTORES, IMAGEN } = CONFIG;
    let alRecibir = () => {};
    let alFallar = () => {};

    /**
     * Valida, redimensiona y mide un archivo de imagen
     * @param {File} archivo
     * @returns {Promise<{blob: Blob, ancho: number, alto: number, tamano: number}>}
     */
    async function procesarArchivo(archivo) {
        if (!archivo.type.startsWith('image/')) {
            throw new Error(`"${archivo.name}" no es una imagen`);
        }

        if (archivo.size > IMAGEN.MAX_TAMANO_MB * 1024 * 1024) {
            throw new Error(`"${archivo.name}" supera los ${IMAGEN.MAX_TAMANO_MB} MB permitidos`);
        }

        const blob = await Utils.redimensionarImagen(
            archivo,
            IMAGEN.MAX_DIMENSION,
            IMAGEN.CALIDAD_JPEG
        );
        const { width, height } = await Utils.obtenerDimensiones(blob);

        return { blob, ancho: width, alto: height, tamano: blob.size };
    }

    async function manejarSeleccion(evento) {
        const input = evento.target;
        const archivos = Array.from(input.files);
        input.value = '';

        const imagenes = [];
        for (const archivo of archivos) {
            try {
                imagenes.push(await procesarArchivo(archivo));
            } catch (error) {
                console.error('Error al procesar imagen:', error);
                alFallar(error.message || CONFIG.MENSAJES.FOTO_ERROR);
            }
        }

        if (imagenes.length > 0) {
            alRecibir(imagenes);
        }
    }

    /**
     * @param {{alRecibir: Function, alFallar: Function}} manejadores
     */
    function init(manejadores) {
        alRecibir = manejadores.alRecibir;
        alFallar = manejadores.alFallar;

        const inputCamara = document.querySelector(SELECTORES.INPUT_CAMARA);
        const inputGaleria = document.querySelector(SELECTORES.INPUT_GALERIA);

        document.querySelector(SELECTORES.BTN_CAMARA)
            .addEventListener('click', () => inputCamara.click());
        document.querySelector(SELECTORES.BTN_GALERIA)
            .addEventListener('click', () => inputGaleria.click());

        inputCamara.addEventListener('change', manejarSeleccion);
        inputGaleria.addEventListener('change', manejarSeleccion);
    }

    return { init };

})();

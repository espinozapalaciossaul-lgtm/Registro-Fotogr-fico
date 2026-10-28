/**
 * ============================================
 * UTILIDADES GENERALES
 * Funciones auxiliares reutilizables
 * ============================================
 */

'use strict';

const Utils = (() => {

    /**
     * Formatea una fecha ISO a formato legible en español
     * @param {string} fechaISO - Fecha en formato ISO 8601
     * @param {Object} opciones - Opciones de Intl.DateTimeFormat
     * @returns {string} Fecha formateada
     */
    function formatearFecha(fechaISO, opciones = {}) {
        const configuracion = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            ...opciones
        };
        
        try {
            const fecha = new Date(fechaISO);
            if (isNaN(fecha.getTime())) return 'Fecha inválida';
            
            return fecha.toLocaleDateString('es-ES', configuracion);
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return fechaISO;
        }
    }

    /**
     * Formatea fecha y hora completa
     * @param {string} fechaISO 
     * @returns {string}
     */
    function formatearFechaHora(fechaISO) {
        return formatearFecha(fechaISO, {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formatea bytes a tamaño legible (KB, MB)
     * @param {number} bytes 
     * @returns {string}
     */
    function formatearTamaño(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Convierte un Blob a Base64 para su uso en documentos
     * @param {Blob} blob 
     * @returns {Promise<string>} Data URL
     */
    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Redimensiona una imagen manteniendo proporción
     * @param {Blob} blobImagen - Imagen original
     * @param {number} maxDimension - Dimensión máxima
     * @param {number} calidad - Calidad JPEG (0-1)
     * @returns {Promise<Blob>} Imagen redimensionada
     */
    async function redimensionarImagen(blobImagen, maxDimension = 1920, calidad = 0.85) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blobImagen);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                
                // Calcular nuevas dimensiones
                let { width, height } = img;
                
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }
                
                // Crear canvas y redibujar
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a Blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Error al procesar imagen'));
                        }
                    },
                    'image/jpeg',
                    calidad
                );
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('No se pudo cargar la imagen'));
            };
            
            img.src = url;
        });
    }

    /**
     * Obtiene dimensiones de una imagen
     * @param {Blob} blobImagen 
     * @returns {Promise<{width: number, height: number}>}
     */
    function obtenerDimensiones(blobImagen) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blobImagen);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('No se pudieron obtener las dimensiones'));
            };
            
            img.src = url;
        });
    }

    /**
     * Genera un identificador único simple
     * @returns {string}
     */
    function generarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Valida si un string está vacío o solo tiene espacios
     * @param {string} valor 
     * @returns {boolean}
     */
    function estaVacio(valor) {
        return !valor || valor.trim().length === 0;
    }

    /**
     * Debounce para limitar llamadas a funciones
     * @param {Function} func 
     * @param {number} espera 
     * @returns {Function}
     */
    function debounce(func, espera = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), espera);
        };
    }

    /**
     * Sanitiza texto para prevenir XSS básico
     * @param {string} texto 
     * @returns {string}
     */
    function sanitizar(texto) {
        if (!texto) return '';
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    /**
     * Trunca texto con elipsis
     * @param {string} texto 
     * @param {number} maximo 
     * @returns {string}
     */
    function truncar(texto, maximo = 50) {
        if (!texto || texto.length <= maximo) return texto;
        return texto.substr(0, maximo).trim() + '…';
    }

    // API pública del módulo
    return {
        formatearFecha,
        formatearFechaHora,
        formatearTamaño,
        blobToBase64,
        redimensionarImagen,
        obtenerDimensiones,
        generarId,
        estaVacio,
        debounce,
        sanitizar,
        truncar
    };

})();
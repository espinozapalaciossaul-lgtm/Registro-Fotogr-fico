/**
 * ============================================
 * CAPA DE DATOS (IndexedDB)
 * Proyectos y fotografías
 * ============================================
 */

'use strict';

const Database = (() => {

    const { NOMBRE, VERSION, STORES, INDICES } = CONFIG.DB;
    let db = null;

    function init() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                reject(new Error('IndexedDB no está disponible en este navegador'));
                return;
            }

            const solicitud = indexedDB.open(NOMBRE, VERSION);

            solicitud.onupgradeneeded = () => {
                const base = solicitud.result;

                if (!base.objectStoreNames.contains(STORES.PROYECTOS)) {
                    base.createObjectStore(STORES.PROYECTOS, { keyPath: 'id' });
                }

                if (!base.objectStoreNames.contains(STORES.FOTOS)) {
                    const fotos = base.createObjectStore(STORES.FOTOS, { keyPath: 'id' });
                    fotos.createIndex(INDICES.PROYECTO_ID, 'proyectoId');
                    fotos.createIndex(INDICES.FECHA, 'fechaCreacion');
                }
            };

            solicitud.onsuccess = () => {
                db = solicitud.result;
                db.onversionchange = () => {
                    db.close();
                    db = null;
                };
                resolve();
            };

            solicitud.onerror = () => reject(solicitud.error);
            solicitud.onblocked = () => reject(new Error('La base de datos está bloqueada por otra pestaña'));
        });
    }

    /**
     * Ejecuta una operación dentro de una transacción y resuelve al confirmarse.
     * Si la operación devuelve un IDBRequest, se resuelve con su resultado.
     */
    function ejecutar(stores, modo, operar) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('La base de datos no está inicializada'));
                return;
            }

            const transaccion = db.transaction(stores, modo);
            const retorno = operar(transaccion);

            transaccion.oncomplete = () => {
                resolve(retorno instanceof IDBRequest ? retorno.result : retorno);
            };
            transaccion.onerror = () => reject(transaccion.error);
            transaccion.onabort = () => reject(transaccion.error || new Error('Transacción cancelada'));
        });
    }

    // ---------- Proyectos ----------

    function guardarProyecto(proyecto) {
        return ejecutar(STORES.PROYECTOS, 'readwrite', (tx) => {
            tx.objectStore(STORES.PROYECTOS).put(proyecto);
            return proyecto;
        });
    }

    function obtenerProyecto(id) {
        return ejecutar(STORES.PROYECTOS, 'readonly', (tx) =>
            tx.objectStore(STORES.PROYECTOS).get(id)
        );
    }

    async function listarProyectos() {
        const proyectos = await ejecutar(STORES.PROYECTOS, 'readonly', (tx) =>
            tx.objectStore(STORES.PROYECTOS).getAll()
        );
        return proyectos.sort((a, b) =>
            (b.fechaActualizacion || '').localeCompare(a.fechaActualizacion || '')
        );
    }

    // ---------- Fotografías ----------

    function guardarFoto(foto) {
        return ejecutar(STORES.FOTOS, 'readwrite', (tx) => {
            tx.objectStore(STORES.FOTOS).put(foto);
            return foto;
        });
    }

    async function obtenerFotos(proyectoId) {
        const fotos = await ejecutar(STORES.FOTOS, 'readonly', (tx) =>
            tx.objectStore(STORES.FOTOS).index(INDICES.PROYECTO_ID).getAll(proyectoId)
        );
        return fotos.sort((a, b) => a.orden - b.orden);
    }

    function contarFotos(proyectoId) {
        return ejecutar(STORES.FOTOS, 'readonly', (tx) =>
            tx.objectStore(STORES.FOTOS).index(INDICES.PROYECTO_ID).count(proyectoId)
        );
    }

    function eliminarFoto(id) {
        return ejecutar(STORES.FOTOS, 'readwrite', (tx) => {
            tx.objectStore(STORES.FOTOS).delete(id);
        });
    }

    /**
     * Persiste el nuevo orden de las fotos en una sola transacción.
     * @param {Array} fotos - Fotos ya ordenadas
     */
    function guardarOrden(fotos) {
        return ejecutar(STORES.FOTOS, 'readwrite', (tx) => {
            const store = tx.objectStore(STORES.FOTOS);
            fotos.forEach((foto, indice) => {
                foto.orden = indice;
                store.put(foto);
            });
        });
    }

    return {
        init,
        guardarProyecto,
        obtenerProyecto,
        listarProyectos,
        guardarFoto,
        obtenerFotos,
        contarFotos,
        eliminarFoto,
        guardarOrden
    };

})();

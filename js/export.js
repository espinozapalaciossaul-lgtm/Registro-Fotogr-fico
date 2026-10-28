/**
 * ============================================
 * EXPORTACIÓN A WORD (.docx)
 * Anexo fotográfico de la fiscalización
 * ============================================
 */

'use strict';

const Exporter = (() => {

    const D = CONFIG.DOCUMENTO;
    const ANCHO_CONTENIDO = D.ANCHO_PAGINA - 2 * D.MARGEN;
    const ANCHO_ETIQUETA = 2600;

    function texto(contenido, opciones = {}) {
        return new docx.TextRun({
            text: contenido,
            font: D.FUENTE,
            size: D.TAMANO_FUENTE,
            ...opciones
        });
    }

    function celda(contenido, ancho, esEtiqueta) {
        return new docx.TableCell({
            width: { size: ancho, type: docx.WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            shading: esEtiqueta
                ? { type: docx.ShadingType.CLEAR, color: 'auto', fill: 'EDF2F7' }
                : undefined,
            children: [
                new docx.Paragraph({
                    children: [texto(contenido, { bold: esEtiqueta })]
                })
            ]
        });
    }

    function tablaProyecto(proyecto) {
        const filas = [
            ['Código de práctica', proyecto.codigo],
            ['Fecha de intervención', Utils.formatearFecha(`${proyecto.fecha}T00:00:00`)],
            ['Lugar de inspección', proyecto.lugar],
            ['Establecimiento / Unidad', proyecto.establecimiento],
            ['Fiscalizador', proyecto.fiscalizador]
        ];

        return new docx.Table({
            width: { size: ANCHO_CONTENIDO, type: docx.WidthType.DXA },
            columnWidths: [ANCHO_ETIQUETA, ANCHO_CONTENIDO - ANCHO_ETIQUETA],
            rows: filas.map(([etiqueta, valor]) => new docx.TableRow({
                children: [
                    celda(etiqueta, ANCHO_ETIQUETA, true),
                    celda(valor, ANCHO_CONTENIDO - ANCHO_ETIQUETA, false)
                ]
            }))
        });
    }

    /** Ajusta la imagen al recuadro del documento manteniendo su proporción */
    function dimensionesImagen(ancho, alto) {
        const escala = Math.min(D.ANCHO_IMAGEN / ancho, D.ALTO_IMAGEN / alto);
        return {
            width: Math.round(ancho * escala),
            height: Math.round(alto * escala)
        };
    }

    async function bloqueFoto(foto, indice) {
        const datos = new Uint8Array(await foto.blob.arrayBuffer());
        const nuevaPagina = indice > 0 && indice % CONFIG.VALIDACION.FOTOS_MAX_POR_PAGINA === 0;

        return [
            new docx.Paragraph({
                pageBreakBefore: nuevaPagina,
                spacing: { before: 360, after: 120 },
                children: [texto(`Fotografía N.° ${indice + 1}`, { bold: true, size: D.TAMANO_SUBTITULO })]
            }),
            new docx.Paragraph({
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [
                    new docx.ImageRun({
                        data: datos,
                        transformation: dimensionesImagen(foto.ancho, foto.alto)
                    })
                ]
            }),
            new docx.Paragraph({
                spacing: { after: 240 },
                children: [texto(foto.descripcion)]
            })
        ];
    }

    async function construirDocumento(proyecto, fotos) {
        const bloques = [];
        for (let i = 0; i < fotos.length; i++) {
            bloques.push(...await bloqueFoto(fotos[i], i));
        }

        return new docx.Document({
            creator: CONFIG.APP.NOMBRE,
            title: `Anexo fotográfico ${proyecto.codigo}`,
            sections: [{
                properties: {
                    page: {
                        size: { width: D.ANCHO_PAGINA, height: D.ALTO_PAGINA },
                        margin: {
                            top: D.MARGEN,
                            right: D.MARGEN,
                            bottom: D.MARGEN,
                            left: D.MARGEN
                        }
                    }
                },
                children: [
                    new docx.Paragraph({
                        alignment: docx.AlignmentType.CENTER,
                        spacing: { after: 240 },
                        children: [texto('ANEXO FOTOGRÁFICO', { bold: true, size: D.TAMANO_TITULO })]
                    }),
                    tablaProyecto(proyecto),
                    ...bloques
                ]
            }]
        });
    }

    function descargar(blob, nombre) {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /**
     * Genera y descarga el anexo en Word
     * @param {Object} proyecto
     * @param {Array} fotos - Fotos ordenadas
     */
    async function generarWord(proyecto, fotos) {
        if (typeof docx === 'undefined') {
            throw new Error('No se pudo cargar la librería de Word. Verifique su conexión a internet.');
        }

        const documento = await construirDocumento(proyecto, fotos);
        const blob = await docx.Packer.toBlob(documento);
        const codigoSeguro = proyecto.codigo.replace(/[^\w-]+/g, '_');
        descargar(blob, `Anexo_Fotografico_${codigoSeguro}.docx`);
    }

    return { generarWord };

})();

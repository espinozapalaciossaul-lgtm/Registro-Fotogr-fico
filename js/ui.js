/**
 * ============================================
 * INTERFAZ DE USUARIO
 * Manipulación del DOM y eventos
 * ============================================
 */

'use strict';

const UI = (() => {

    const { SELECTORES, VALIDACION, TIMING } = CONFIG;
    const CAMPOS = ['codigo', 'fecha', 'lugar', 'establecimiento', 'fiscalizador'];

    let manejadores = {};
    let urlsGaleria = [];
    let urlPreview = null;
    let idArrastrado = null;

    const $ = (selector) => document.querySelector(selector);

    // ---------- Notificaciones ----------

    function mostrarToast(mensaje, tipo = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.setAttribute('role', tipo === 'error' ? 'alert' : 'status');

        const contenido = document.createElement('div');
        contenido.className = 'toast-content';
        const texto = document.createElement('div');
        texto.className = 'toast-message';
        texto.textContent = mensaje;
        contenido.appendChild(texto);

        const cerrar = document.createElement('button');
        cerrar.type = 'button';
        cerrar.className = 'toast-close';
        cerrar.setAttribute('aria-label', 'Cerrar notificación');
        cerrar.textContent = '×';

        toast.append(contenido, cerrar);
        $(SELECTORES.TOAST_CONTAINER).appendChild(toast);

        let cerrado = false;
        const ocultar = () => {
            if (cerrado) return;
            cerrado = true;
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), TIMING.TOAST_ANIMACION);
        };

        cerrar.addEventListener('click', ocultar);
        setTimeout(ocultar, TIMING.TOAST_DURACION);
    }

    // ---------- Pestañas ----------

    function cambiarTab(nombre) {
        document.querySelectorAll(SELECTORES.NAV_TABS).forEach((tab) => {
            const activa = tab.dataset.tab === nombre;
            tab.classList.toggle('active', activa);
            tab.setAttribute('aria-selected', String(activa));
        });

        document.querySelectorAll(SELECTORES.TAB_PANELS).forEach((panel) => {
            const activo = panel.id === `panel-${nombre}`;
            panel.classList.toggle('active', activo);
            panel.hidden = !activo;
        });
    }

    function habilitarCaptura(habilitada) {
        $('.nav-tab[data-tab="captura"]').disabled = !habilitada;
    }

    function actualizarEstadoDB(disponible) {
        const indicador = $('#db-status');
        indicador.querySelector('.status-text').textContent = disponible ? 'Local' : 'Sin almacenamiento';
        indicador.querySelector('.status-dot').style.backgroundColor = disponible
            ? ''
            : 'var(--color-danger-500)';
    }

    // ---------- Formulario del proyecto ----------

    function limpiarErrores() {
        CAMPOS.forEach((campo) => {
            $(`#error-${campo}`).textContent = '';
            $(`#inp-${campo}`).classList.remove('error');
        });
    }

    function mostrarErrorCampo(campo, mensaje) {
        $(`#error-${campo}`).textContent = mensaje;
        $(`#inp-${campo}`).classList.add('error');
    }

    /**
     * Valida el formulario y devuelve los datos, o null si hay errores
     */
    function validarFormulario() {
        limpiarErrores();
        const datos = {};
        let primerError = null;

        CAMPOS.forEach((campo) => {
            const valor = $(`#inp-${campo}`).value.trim();
            datos[campo] = valor;

            let error = '';
            if (Utils.estaVacio(valor)) {
                error = 'Este campo es obligatorio';
            } else if (campo === 'codigo' && valor.length > VALIDACION.CODIGO_MAX) {
                error = `Máximo ${VALIDACION.CODIGO_MAX} caracteres`;
            } else if (campo !== 'fecha' && valor.length > VALIDACION.TEXTO_MAX) {
                error = `Máximo ${VALIDACION.TEXTO_MAX} caracteres`;
            }

            if (error) {
                mostrarErrorCampo(campo, error);
                primerError = primerError || campo;
            }
        });

        if (primerError) {
            $(`#inp-${primerError}`).focus();
            return null;
        }
        return datos;
    }

    function llenarFormulario(proyecto) {
        limpiarErrores();
        CAMPOS.forEach((campo) => {
            $(`#inp-${campo}`).value = proyecto ? proyecto[campo] : '';
        });
    }

    function establecerFechaPorDefecto() {
        const hoy = new Date();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        $(SELECTORES.INPUT_FECHA).value = `${hoy.getFullYear()}-${mes}-${dia}`;
    }

    // ---------- Resumen del proyecto ----------

    function renderResumen(proyecto) {
        $(SELECTORES.LBL_PROYECTO_ACTIVO).textContent = proyecto ? proyecto.codigo : '—';

        const resumen = $(SELECTORES.PROJECT_SUMMARY);
        resumen.replaceChildren();
        if (!proyecto) return;

        const grid = document.createElement('div');
        grid.className = 'project-summary__grid';

        const items = [
            ['Fecha', Utils.formatearFecha(`${proyecto.fecha}T00:00:00`)],
            ['Lugar', proyecto.lugar],
            ['Establecimiento', proyecto.establecimiento],
            ['Fiscalizador', proyecto.fiscalizador]
        ];

        items.forEach(([etiqueta, valor]) => {
            const item = document.createElement('div');
            item.className = 'project-summary__item';

            const label = document.createElement('span');
            label.className = 'project-summary__label';
            label.textContent = etiqueta;

            const value = document.createElement('span');
            value.className = 'project-summary__value';
            value.textContent = valor;

            item.append(label, value);
            grid.appendChild(item);
        });

        resumen.appendChild(grid);
    }

    // ---------- Galería ----------

    function liberarUrlsGaleria() {
        urlsGaleria.forEach((url) => URL.revokeObjectURL(url));
        urlsGaleria = [];
    }

    function crearTarjeta(foto, indice, total) {
        const tarjeta = $(SELECTORES.TEMPLATE_FOTO_CARD).content.firstElementChild.cloneNode(true);
        tarjeta.dataset.id = foto.id;

        tarjeta.querySelector('.foto-card__badge').textContent = indice + 1;

        const url = URL.createObjectURL(foto.blob);
        urlsGaleria.push(url);
        const imagen = tarjeta.querySelector('.foto-card__image');
        imagen.src = url;
        imagen.alt = `Evidencia ${indice + 1}: ${Utils.truncar(foto.descripcion, 60)}`;

        const marca = tarjeta.querySelector('.foto-card__timestamp');
        marca.dateTime = foto.fechaCreacion;
        marca.textContent = Utils.formatearFechaHora(foto.fechaCreacion);

        const descripcion = tarjeta.querySelector('.foto-card__description');
        descripcion.value = foto.descripcion;
        descripcion.addEventListener('change', () => {
            manejadores.onDescripcionCambiada(foto.id, descripcion.value.trim());
        });

        const subir = tarjeta.querySelector('.btn--move-up');
        const bajar = tarjeta.querySelector('.btn--move-down');
        subir.disabled = indice === 0;
        bajar.disabled = indice === total - 1;
        subir.addEventListener('click', () => manejadores.onMover(foto.id, -1));
        bajar.addEventListener('click', () => manejadores.onMover(foto.id, 1));
        tarjeta.querySelector('.btn--delete')
            .addEventListener('click', () => manejadores.onEliminarFoto(foto.id));

        tarjeta.addEventListener('dragstart', (evento) => {
            idArrastrado = foto.id;
            tarjeta.classList.add('dragging');
            evento.dataTransfer.effectAllowed = 'move';
            evento.dataTransfer.setData('text/plain', foto.id);
        });
        tarjeta.addEventListener('dragend', () => {
            idArrastrado = null;
            tarjeta.classList.remove('dragging');
        });
        tarjeta.addEventListener('dragover', (evento) => {
            if (idArrastrado) evento.preventDefault();
        });
        tarjeta.addEventListener('drop', (evento) => {
            evento.preventDefault();
            if (idArrastrado && idArrastrado !== foto.id) {
                manejadores.onReordenar(idArrastrado, foto.id);
            }
        });

        return tarjeta;
    }

    function renderGaleria(fotos) {
        liberarUrlsGaleria();

        $(SELECTORES.GALLERY_GRID).replaceChildren(
            ...fotos.map((foto, indice) => crearTarjeta(foto, indice, fotos.length))
        );

        const cantidad = fotos.length;
        $(SELECTORES.GALLERY_COUNT).textContent =
            `${cantidad} ${cantidad === 1 ? 'fotografía' : 'fotografías'}`;
        $(SELECTORES.EMPTY_STATE).hidden = cantidad > 0;
        $(SELECTORES.EXPORT_ACTIONS).hidden = cantidad === 0;

        const insignia = $(SELECTORES.BADGE_FOTOS);
        insignia.textContent = cantidad;
        insignia.hidden = cantidad === 0;
    }

    // ---------- Historial ----------

    function renderHistorial(entradas) {
        const lista = $(SELECTORES.HISTORY_LIST);
        lista.replaceChildren();
        $(SELECTORES.HISTORY_EMPTY).hidden = entradas.length > 0;

        entradas.forEach(({ proyecto, cantidadFotos }) => {
            const item = document.createElement('article');
            item.className = 'history-item';
            item.setAttribute('role', 'listitem');
            item.tabIndex = 0;

            const info = document.createElement('div');
            info.className = 'history-item__info';
            const titulo = document.createElement('h4');
            titulo.textContent = proyecto.codigo;
            const detalle = document.createElement('p');
            detalle.textContent = `${proyecto.establecimiento} · ${proyecto.lugar}`;
            info.append(titulo, detalle);

            const meta = document.createElement('div');
            meta.className = 'history-item__meta';
            const contador = document.createElement('span');
            contador.className = 'history-item__count';
            contador.textContent = `${cantidadFotos} ${cantidadFotos === 1 ? 'foto' : 'fotos'}`;
            const fecha = document.createElement('span');
            fecha.className = 'history-item__date';
            fecha.textContent = Utils.formatearFecha(`${proyecto.fecha}T00:00:00`, { month: 'short' });
            meta.append(contador, fecha);

            const seleccionar = () => manejadores.onSeleccionarProyecto(proyecto.id);
            item.addEventListener('click', seleccionar);
            item.addEventListener('keydown', (evento) => {
                if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault();
                    seleccionar();
                }
            });

            item.append(info, meta);
            lista.appendChild(item);
        });
    }

    // ---------- Modal de vista previa ----------

    function actualizarContador() {
        const longitud = $(SELECTORES.INPUT_DESCRIPCION).value.length;
        $(SELECTORES.CHAR_COUNTER).textContent = `${longitud}/${VALIDACION.DESCRIPCION_MAX}`;
    }

    function abrirModal(imagen) {
        if (urlPreview) URL.revokeObjectURL(urlPreview);
        urlPreview = URL.createObjectURL(imagen.blob);

        $(SELECTORES.PREVIEW_IMG).src = urlPreview;
        $(SELECTORES.PREVIEW_DIM).textContent = `${imagen.ancho} × ${imagen.alto} px`;
        $(SELECTORES.PREVIEW_PESO).textContent = Utils.formatearTamaño(imagen.tamano);

        const descripcion = $(SELECTORES.INPUT_DESCRIPCION);
        descripcion.value = '';
        descripcion.classList.remove('error');
        actualizarContador();

        $(SELECTORES.MODAL_PREVIEW).hidden = false;
        descripcion.focus();
    }

    function cerrarModal() {
        $(SELECTORES.MODAL_PREVIEW).hidden = true;
        $(SELECTORES.PREVIEW_IMG).removeAttribute('src');
        if (urlPreview) {
            URL.revokeObjectURL(urlPreview);
            urlPreview = null;
        }
    }

    function modalAbierto() {
        return !$(SELECTORES.MODAL_PREVIEW).hidden;
    }

    function confirmarModal() {
        const campo = $(SELECTORES.INPUT_DESCRIPCION);
        const descripcion = campo.value.trim();

        if (descripcion.length < VALIDACION.DESCRIPCION_MIN) {
            campo.classList.add('error');
            campo.focus();
            mostrarToast(
                `La descripción debe tener al menos ${VALIDACION.DESCRIPCION_MIN} caracteres`,
                'warning'
            );
            return;
        }

        manejadores.onConfirmarFoto(descripcion);
    }

    function bloquearBotones(selector, bloqueado) {
        $(selector).disabled = bloqueado;
    }

    // ---------- Inicialización ----------

    function init(eventos) {
        manejadores = eventos;

        document.querySelectorAll(SELECTORES.NAV_TABS).forEach((tab) => {
            tab.addEventListener('click', () => {
                if (tab.disabled) return;
                cambiarTab(tab.dataset.tab);
                manejadores.onCambiarTab(tab.dataset.tab);
            });
        });

        $(SELECTORES.FORM_FISCALIZACION).addEventListener('submit', (evento) => {
            evento.preventDefault();
            const datos = validarFormulario();
            if (datos) manejadores.onGuardarProyecto(datos);
            else mostrarToast(CONFIG.MENSAJES.VALIDACION_REQUERIDA, 'warning');
        });
        $('#btn-limpiar-form').addEventListener('click', () => manejadores.onLimpiarProyecto());

        const descripcion = $(SELECTORES.INPUT_DESCRIPCION);
        descripcion.addEventListener('input', () => {
            descripcion.classList.remove('error');
            actualizarContador();
        });
        $(SELECTORES.BTN_CONFIRMAR_FOTO).addEventListener('click', confirmarModal);
        $(SELECTORES.BTN_CANCELAR_FOTO).addEventListener('click', () => manejadores.onCancelarFoto());
        $(SELECTORES.BTN_CERRAR_MODAL).addEventListener('click', () => manejadores.onCancelarFoto());
        document.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape' && modalAbierto()) manejadores.onCancelarFoto();
        });

        $(SELECTORES.BTN_EXPORTAR).addEventListener('click', () => manejadores.onExportar());
    }

    return {
        init,
        mostrarToast,
        cambiarTab,
        habilitarCaptura,
        actualizarEstadoDB,
        llenarFormulario,
        establecerFechaPorDefecto,
        renderResumen,
        renderGaleria,
        renderHistorial,
        abrirModal,
        cerrarModal,
        bloquearBotones
    };

})();

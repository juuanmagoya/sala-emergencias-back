"use strict";
// ============================================================
// FECHAS Y ZONA HORARIA
//
// Los turnos se guardan como `Date` (instante UTC). La fecha y la
// hora que eligen los usuarios se interpretan siempre en la zona
// horaria del centro médico, nunca en la zona horaria del servidor.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatearHora = exports.siguienteDiaLocal = exports.obtenerDiaSemanaLocal = exports.parsearFechaLocal = exports.parsearFechaHoraLocal = exports.convertirAHoraUtc = exports.obtenerPartesEnZona = exports.esZonaHorariaValida = void 0;
const formateadores = new Map();
const obtenerFormateador = (zonaHoraria) => {
    const formateadorExistente = formateadores.get(zonaHoraria);
    if (formateadorExistente) {
        return formateadorExistente;
    }
    const formateador = new Intl.DateTimeFormat('en-CA', {
        timeZone: zonaHoraria,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    });
    formateadores.set(zonaHoraria, formateador);
    return formateador;
};
const esZonaHorariaValida = (zonaHoraria) => {
    if (!zonaHoraria.trim()) {
        return false;
    }
    try {
        obtenerFormateador(zonaHoraria).format(new Date());
        return true;
    }
    catch {
        return false;
    }
};
exports.esZonaHorariaValida = esZonaHorariaValida;
const esFechaCalendarioValida = (anio, mes, dia) => {
    if (!Number.isInteger(anio) ||
        !Number.isInteger(mes) ||
        !Number.isInteger(dia) ||
        mes < 1 ||
        mes > 12 ||
        dia < 1 ||
        dia > 31) {
        return false;
    }
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    return (fecha.getUTCFullYear() === anio &&
        fecha.getUTCMonth() === mes - 1 &&
        fecha.getUTCDate() === dia);
};
// Devuelve las partes de un instante en la zona horaria indicada.
const obtenerPartesEnZona = (fecha, zonaHoraria) => {
    const partes = obtenerFormateador(zonaHoraria).formatToParts(fecha);
    const valores = new Map();
    for (const parte of partes) {
        if (parte.type !== 'literal') {
            valores.set(parte.type, parte.value);
        }
    }
    return {
        anio: Number(valores.get('year')),
        mes: Number(valores.get('month')),
        dia: Number(valores.get('day')),
        hora: Number(valores.get('hour')),
        minuto: Number(valores.get('minute')),
        segundo: Number(valores.get('second')),
    };
};
exports.obtenerPartesEnZona = obtenerPartesEnZona;
// Diferencia entre la hora local de la zona y UTC para un instante dado.
const obtenerDesplazamientoMs = (fecha, zonaHoraria) => {
    const partes = (0, exports.obtenerPartesEnZona)(fecha, zonaHoraria);
    const comoUtc = Date.UTC(partes.anio, partes.mes - 1, partes.dia, partes.hora, partes.minuto, partes.segundo);
    const instanteSinMilisegundos = fecha.getTime() - fecha.getTime() % 1000;
    return comoUtc - instanteSinMilisegundos;
};
// Convierte una fecha y hora local de la zona indicada al instante UTC.
const convertirAHoraUtc = (anio, mes, dia, hora, minuto, segundo, zonaHoraria) => {
    const tentativo = new Date(Date.UTC(anio, mes - 1, dia, hora, minuto, segundo));
    const primerDesplazamiento = obtenerDesplazamientoMs(tentativo, zonaHoraria);
    let instante = new Date(tentativo.getTime() - primerDesplazamiento);
    // Recalcular en los cambios de horario de verano.
    const segundoDesplazamiento = obtenerDesplazamientoMs(instante, zonaHoraria);
    if (segundoDesplazamiento !== primerDesplazamiento) {
        instante = new Date(tentativo.getTime() - segundoDesplazamiento);
    }
    return instante;
};
exports.convertirAHoraUtc = convertirAHoraUtc;
const REGEX_FECHA_HORA = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})?$/;
const REGEX_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
// Acepta:
// - `YYYY-MM-DDTHH:mm` (o con segundos) sin zona: se interpreta en la
//   zona horaria del centro médico.
// - El mismo formato con `Z` o un desplazamiento explícito (`-03:00`).
const parsearFechaHoraLocal = (valor, zonaHoraria) => {
    if (typeof valor !== 'string') {
        return null;
    }
    const coincidencia = REGEX_FECHA_HORA.exec(valor.trim());
    if (!coincidencia) {
        return null;
    }
    const [, anioTexto, mesTexto, diaTexto, horaTexto, minutoTexto, segundoTexto, milisegundoTexto, desplazamiento,] = coincidencia;
    const anio = Number(anioTexto);
    const mes = Number(mesTexto);
    const dia = Number(diaTexto);
    const hora = Number(horaTexto);
    const minuto = Number(minutoTexto);
    const segundo = Number(segundoTexto ?? '0');
    if (!esFechaCalendarioValida(anio, mes, dia) ||
        hora > 23 ||
        minuto > 59 ||
        segundo > 59) {
        return null;
    }
    if (desplazamiento) {
        const milisegundos = (milisegundoTexto ?? '0').padEnd(3, '0');
        const fecha = new Date(`${anioTexto}-${mesTexto}-${diaTexto}T${horaTexto}:${minutoTexto}:${String(segundo).padStart(2, '0')}.${milisegundos}${desplazamiento}`);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }
    return (0, exports.convertirAHoraUtc)(anio, mes, dia, hora, minuto, segundo, zonaHoraria);
};
exports.parsearFechaHoraLocal = parsearFechaHoraLocal;
// Acepta únicamente una fecha de calendario `YYYY-MM-DD`.
const parsearFechaLocal = (valor) => {
    if (typeof valor !== 'string') {
        return null;
    }
    const coincidencia = REGEX_FECHA.exec(valor.trim());
    if (!coincidencia) {
        return null;
    }
    const anio = Number(coincidencia[1]);
    const mes = Number(coincidencia[2]);
    const dia = Number(coincidencia[3]);
    if (!esFechaCalendarioValida(anio, mes, dia)) {
        return null;
    }
    return { anio, mes, dia };
};
exports.parsearFechaLocal = parsearFechaLocal;
const obtenerDiaSemanaLocal = (fecha) => new Date(Date.UTC(fecha.anio, fecha.mes - 1, fecha.dia)).getUTCDay();
exports.obtenerDiaSemanaLocal = obtenerDiaSemanaLocal;
const siguienteDiaLocal = (fecha) => {
    const siguiente = new Date(Date.UTC(fecha.anio, fecha.mes - 1, fecha.dia + 1));
    return {
        anio: siguiente.getUTCFullYear(),
        mes: siguiente.getUTCMonth() + 1,
        dia: siguiente.getUTCDate(),
    };
};
exports.siguienteDiaLocal = siguienteDiaLocal;
const formatearHora = (minutosDesdeMedianoche) => {
    const horas = Math.floor(minutosDesdeMedianoche / 60);
    const minutos = minutosDesdeMedianoche % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};
exports.formatearHora = formatearHora;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerDisponibilidad = exports.esHorarioDeLaGrilla = exports.validarHorarioDisponible = exports.generarHorariosDelDia = exports.obtenerTurnosOcupados = exports.obtenerLimitesDelDiaLocal = exports.obtenerMedico = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Especialidad_1 = __importDefault(require("../../especialidad/models/Especialidad"));
const Turno_1 = __importDefault(require("../models/Turno"));
const turno_messages_1 = require("../constants/turno.messages");
const fechaHora_1 = require("../../../utils/fechaHora");
// ============================================================
// DÍAS DE LA SEMANA
// ============================================================
const DIAS_SEMANA = [
    null,
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
];
// ============================================================
// HORARIOS DE ATENCIÓN
// ============================================================
const parsearHora = (valor) => {
    const coincidencia = /^(\d{1,2}):(\d{2})$/.exec(valor.trim());
    if (!coincidencia) {
        return null;
    }
    const hora = Number(coincidencia[1]);
    const minuto = Number(coincidencia[2]);
    if (hora > 23 || minuto > 59) {
        return null;
    }
    return hora * 60 + minuto;
};
const obtenerIntervalosDelDia = (medico, fecha) => {
    const dia = DIAS_SEMANA[(0, fechaHora_1.obtenerDiaSemanaLocal)(fecha)];
    if (!dia) {
        return [];
    }
    return medico.horariosAtencion
        .filter((horario) => horario.dia === dia)
        .map((horario) => ({
        desde: parsearHora(horario.horaInicio),
        hasta: parsearHora(horario.horaFin),
    }))
        .filter((intervalo) => intervalo.desde !== null &&
        intervalo.hasta !== null &&
        intervalo.hasta > intervalo.desde);
};
// ============================================================
// CONSULTAR MÉDICO
// ============================================================
const obtenerMedico = async (medicoId, session) => {
    if (typeof medicoId !== 'string' ||
        !mongoose_1.default.Types.ObjectId.isValid(medicoId)) {
        throw new Error('El ID del médico no es válido');
    }
    const consulta = Medico_1.default.findById(medicoId);
    const medico = await (session ? consulta.session(session) : consulta);
    if (!medico) {
        throw new Error('El médico indicado no existe');
    }
    if (!medico.activo) {
        throw new Error('El médico no está activo');
    }
    return medico;
};
exports.obtenerMedico = obtenerMedico;
// ============================================================
// LÍMITES DEL DÍA
// ============================================================
const obtenerLimitesDelDiaLocal = (fecha, zonaHoraria) => {
    const diaSiguiente = (0, fechaHora_1.siguienteDiaLocal)(fecha);
    return {
        inicioDia: (0, fechaHora_1.convertirAHoraUtc)(fecha.anio, fecha.mes, fecha.dia, 0, 0, 0, zonaHoraria),
        finDia: (0, fechaHora_1.convertirAHoraUtc)(diaSiguiente.anio, diaSiguiente.mes, diaSiguiente.dia, 0, 0, 0, zonaHoraria),
    };
};
exports.obtenerLimitesDelDiaLocal = obtenerLimitesDelDiaLocal;
// ============================================================
// TURNOS OCUPADOS
// ============================================================
const obtenerTurnosOcupados = async (medicoId, inicioDia, finDia, duracionTurno, session) => {
    const consulta = Turno_1.default.find({
        medico: medicoId,
        fechaTurno: {
            $gte: inicioDia,
            $lt: finDia,
        },
        estado: { $ne: 'cancelado' },
        activo: { $ne: false },
    });
    const turnos = await (session ? consulta.session(session) : consulta);
    return turnos.map((turno) => {
        const inicio = turno.fechaTurno;
        const fin = turno.fechaFin instanceof Date
            ? turno.fechaFin
            : new Date(inicio.getTime() + duracionTurno * 60_000);
        return { inicio, fin };
    });
};
exports.obtenerTurnosOcupados = obtenerTurnosOcupados;
// ============================================================
// GENERAR HORARIOS DISPONIBLES
// ============================================================
const generarHorariosDelDia = (medico, fecha, zonaHoraria) => {
    const duracion = medico.duracionTurno;
    if (!Number.isInteger(duracion) || duracion <= 0) {
        return [];
    }
    const horarios = [];
    const iniciosVistos = new Set();
    for (const intervalo of obtenerIntervalosDelDia(medico, fecha)) {
        for (let minuto = intervalo.desde; minuto + duracion <= intervalo.hasta; minuto += duracion) {
            const inicio = (0, fechaHora_1.convertirAHoraUtc)(fecha.anio, fecha.mes, fecha.dia, Math.floor(minuto / 60), minuto % 60, 0, zonaHoraria);
            if (iniciosVistos.has(inicio.getTime())) {
                continue;
            }
            iniciosVistos.add(inicio.getTime());
            horarios.push({
                inicio,
                fin: new Date(inicio.getTime() + duracion * 60_000),
                horaLocal: (0, fechaHora_1.formatearHora)(minuto),
            });
        }
    }
    return horarios.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
};
exports.generarHorariosDelDia = generarHorariosDelDia;
// ============================================================
// VALIDAR HORARIO DEL TURNO
// ============================================================
const seSuperponen = (inicioA, finA, inicioB, finB) => inicioA.getTime() < finB.getTime() &&
    inicioB.getTime() < finA.getTime();
const validarHorarioDisponible = (medico, inicio, ocupados, zonaHoraria) => {
    if (!medico.activo) {
        throw new Error('El médico no está activo');
    }
    const duracion = medico.duracionTurno;
    if (!Number.isInteger(duracion) ||
        duracion <= 0 ||
        Number.isNaN(inicio.getTime())) {
        throw new Error('El horario del turno no es válido');
    }
    const partes = (0, fechaHora_1.obtenerPartesEnZona)(inicio, zonaHoraria);
    const intervalos = obtenerIntervalosDelDia(medico, partes);
    if (intervalos.length === 0) {
        throw new Error('El médico no atiende ese día');
    }
    const minutos = partes.hora * 60 + partes.minuto;
    const fin = new Date(inicio.getTime() + duracion * 60_000);
    const horarioValido = intervalos.some((intervalo) => minutos >= intervalo.desde &&
        minutos < intervalo.hasta &&
        minutos + duracion <= intervalo.hasta);
    if (!horarioValido) {
        throw new Error('El turno debe comenzar y finalizar dentro del horario de atención');
    }
    const ocupado = ocupados.some((turno) => seSuperponen(inicio, fin, turno.inicio, turno.fin));
    if (ocupado) {
        throw new Error('El horario solicitado ya está ocupado');
    }
    return fin;
};
exports.validarHorarioDisponible = validarHorarioDisponible;
// ============================================================
// HORARIO PERTENECIENTE A LA GRILLA OFRECIDA
//
// El flujo de pacientes solo puede confirmar un horario que el
// backend haya ofrecido en la consulta de disponibilidad. Esta
// función reutiliza la misma generación de grilla y la misma regla
// de superposición, sin duplicarlas.
// ============================================================
const esHorarioDeLaGrilla = (medico, fecha, inicio, ocupados, zonaHoraria, ahora) => (0, exports.generarHorariosDelDia)(medico, fecha, zonaHoraria).some((horario) => horario.inicio.getTime() === inicio.getTime() &&
    horario.inicio.getTime() > ahora.getTime() &&
    !ocupados.some((turno) => seSuperponen(horario.inicio, horario.fin, turno.inicio, turno.fin)));
exports.esHorarioDeLaGrilla = esHorarioDeLaGrilla;
// ============================================================
// DISPONIBILIDAD DE UN DÍA
// ============================================================
const obtenerDisponibilidad = async (medicoId, fechaTexto, opciones) => {
    const fecha = (0, fechaHora_1.parsearFechaLocal)(fechaTexto);
    if (!fecha) {
        throw new Error('La fecha indicada no es válida');
    }
    const medico = await (0, exports.obtenerMedico)(medicoId, opciones.session);
    // Pertenencia: la especialidad consultada puede estar en cualquier
    // posición del array, no solo en la primera.
    if (opciones.especialidadId !== undefined) {
        if (!mongoose_1.default.Types.ObjectId.isValid(opciones.especialidadId)) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_ID_INVALIDO);
        }
        const asignada = (medico.especialidades ?? []).some((especialidad) => String(especialidad) ===
            String(opciones.especialidadId));
        if (!asignada) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE);
        }
    }
    if (opciones.validarEspecialidadActiva) {
        // Se valida exactamente la especialidad consultada. Sin
        // especialidad indicada se conserva la regla anterior: al
        // menos una de las asignadas debe estar activa.
        const especialidadActiva = await Especialidad_1.default.exists({
            _id: opciones.especialidadId ?? {
                $in: medico.especialidades ?? [],
            },
            activo: true,
        });
        if (!especialidadActiva) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_INACTIVA);
        }
    }
    const { inicioDia, finDia } = (0, exports.obtenerLimitesDelDiaLocal)(fecha, opciones.zonaHoraria);
    const ocupados = await (0, exports.obtenerTurnosOcupados)(medicoId, inicioDia, finDia, medico.duracionTurno, opciones.session);
    const ahora = opciones.ahora ?? new Date();
    const horarios = (0, exports.generarHorariosDelDia)(medico, fecha, opciones.zonaHoraria).filter((horario) => horario.inicio.getTime() > ahora.getTime() &&
        !ocupados.some((turno) => seSuperponen(horario.inicio, horario.fin, turno.inicio, turno.fin)));
    return {
        medicoId,
        fecha: `${fecha.anio}-${String(fecha.mes).padStart(2, '0')}-${String(fecha.dia).padStart(2, '0')}`,
        zonaHoraria: opciones.zonaHoraria,
        duracionTurno: medico.duracionTurno,
        horarios,
    };
};
exports.obtenerDisponibilidad = obtenerDisponibilidad;

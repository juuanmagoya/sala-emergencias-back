"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Especialidad_1 = __importDefault(require("../../especialidad/models/Especialidad"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Paciente_1 = __importDefault(require("../../pacientes/models/Paciente"));
const Usuario_1 = __importDefault(require("../../usuario/models/Usuario"));
const Turno_1 = __importDefault(require("../models/Turno"));
const entorno_1 = require("../../../config/entorno");
const fechaHora_1 = require("../../../utils/fechaHora");
const disponibilidad_service_1 = require("./disponibilidad.service");
const turno_messages_1 = require("../constants/turno.messages");
const erroresTurno_1 = require("../utils/erroresTurno");
const turno_types_1 = require("../types/turno.types");
const LONGITUD_MAXIMA_OBSERVACIONES = 500;
// ============================================================
// VALIDACIONES COMUNES
// ============================================================
const validarObjectId = (valor, mensaje) => {
    if (typeof valor !== 'string' ||
        !mongoose_1.default.Types.ObjectId.isValid(valor)) {
        throw new Error(mensaje);
    }
    return valor;
};
const existePaciente = async (pacienteId, session) => {
    const consulta = Paciente_1.default.exists({ _id: pacienteId });
    return Boolean(await (session ? consulta.session(session) : consulta));
};
const existeEspecialidad = async (especialidadId, session) => {
    const consulta = Especialidad_1.default.exists({
        _id: especialidadId,
    });
    return Boolean(await (session ? consulta.session(session) : consulta));
};
const esEspecialidadActiva = async (especialidadId, session) => {
    const consulta = Especialidad_1.default.exists({
        _id: especialidadId,
        activo: true,
    });
    return Boolean(await (session ? consulta.session(session) : consulta));
};
class TurnoService {
    // ============================================================
    // OBTENER TURNOS
    // ============================================================
    async getTurnos() {
        const turnos = await Turno_1.default.find({ activo: true })
            .populate('paciente')
            .populate('especialidad')
            .populate('medico');
        return turnos;
    }
    // ============================================================
    // CONSULTAR DISPONIBILIDAD
    // ============================================================
    async getDisponibilidad(medicoId, fecha, opciones = {}) {
        return (0, disponibilidad_service_1.obtenerDisponibilidad)(medicoId, fecha, {
            zonaHoraria: (0, entorno_1.leerZonaHoraria)(),
            validarEspecialidadActiva: opciones.validarEspecialidadActiva,
            especialidadId: opciones.especialidadId,
        });
    }
    // ============================================================
    // TURNOS DEL MÉDICO AUTENTICADO
    // ============================================================
    async getTurnosDelMedico(idUsuario) {
        if (!mongoose_1.default.Types.ObjectId.isValid(idUsuario)) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.SIN_PERFIL_MEDICO);
        }
        const usuario = await Usuario_1.default.findById(idUsuario);
        if (!usuario ||
            usuario.rol !== 'medico' ||
            !usuario.medico) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.SIN_PERFIL_MEDICO);
        }
        // El perfil se resuelve desde la relación explícita Usuario.medico.
        // Nunca se acepta un médico enviado por el cliente.
        const medico = await Medico_1.default.findById(usuario.medico);
        if (!medico) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.SIN_PERFIL_MEDICO);
        }
        // Se incluyen los turnos cancelados para conservar el historial.
        return Turno_1.default.find({ medico: medico._id })
            .populate('paciente')
            .populate('especialidad')
            .populate('medico')
            .sort({ fechaTurno: 1 });
    }
    // ============================================================
    // HISTORIAL DE TURNOS DEL PACIENTE AUTENTICADO
    // ============================================================
    async getHistorialDelPaciente(idPaciente) {
        // El ID proviene exclusivamente del JWT; se valida igual como
        // defensa ante un uso directo del servicio.
        const paciente = validarObjectId(idPaciente, turno_messages_1.MENSAJES_TURNO.PACIENTE_ID_INVALIDO);
        // No se filtra por `activo` ni por `estado`: el historial incluye
        // pendientes, atendidos, cancelados y los cancelados por baja
        // lógica (`activo: false`). Tampoco se exige que las referencias
        // relacionadas existan: si ya no pueden resolverse, el populate
        // devuelve `null` y el registro se conserva.
        //
        // Proyección por lista blanca: no se popula `paciente` (son los
        // datos del propio solicitante) y del médico solo se exponen
        // datos profesionales.
        return Turno_1.default.find({ paciente })
            .select('fechaTurno fechaFin estado observaciones especialidad medico')
            .populate('especialidad', 'nombre')
            .populate('medico', 'nombre apellido matricula')
            .sort({ fechaTurno: -1 });
    }
    // ============================================================
    // CREAR TURNO
    // ============================================================
    async createTurno(datos, opciones = {}) {
        const zonaHoraria = opciones.zonaHoraria ?? (0, entorno_1.leerZonaHoraria)();
        const paciente = validarObjectId(datos.paciente, turno_messages_1.MENSAJES_TURNO.PACIENTE_ID_INVALIDO);
        const especialidad = validarObjectId(datos.especialidad, turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_ID_INVALIDO);
        const medicoId = validarObjectId(datos.medico, turno_messages_1.MENSAJES_TURNO.MEDICO_ID_INVALIDO);
        const inicio = (0, fechaHora_1.parsearFechaHoraLocal)(datos.fechaTurno, zonaHoraria);
        if (!inicio) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.FECHA_INVALIDA);
        }
        const ahora = opciones.ahora ?? new Date();
        if (inicio.getTime() <= ahora.getTime()) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.FECHA_PASADA);
        }
        if (opciones.validarPaciente !== false &&
            !(await existePaciente(paciente, opciones.session))) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.PACIENTE_NO_EXISTE);
        }
        if (!(await existeEspecialidad(especialidad, opciones.session))) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_EXISTE);
        }
        if (opciones.validarEspecialidadActiva &&
            !(await esEspecialidadActiva(especialidad, opciones.session))) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_INACTIVA);
        }
        const medico = await (0, disponibilidad_service_1.obtenerMedico)(medicoId, opciones.session);
        if (!(medico.especialidades ?? []).some((asignada) => String(asignada) === String(especialidad))) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE);
        }
        const fechaLocal = (0, fechaHora_1.obtenerPartesEnZona)(inicio, zonaHoraria);
        const { inicioDia, finDia } = (0, disponibilidad_service_1.obtenerLimitesDelDiaLocal)(fechaLocal, zonaHoraria);
        const ocupados = await (0, disponibilidad_service_1.obtenerTurnosOcupados)(medicoId, inicioDia, finDia, medico.duracionTurno, opciones.session);
        // Misma regla que usa la consulta de disponibilidad.
        const fin = (0, disponibilidad_service_1.validarHorarioDisponible)(medico, inicio, ocupados, zonaHoraria);
        // El portal de pacientes solo puede confirmar un horario que
        // coincida exactamente con uno de los slots ofrecidos. La regla
        // se aplica después de las validaciones comunes para conservar
        // los mensajes existentes de día, horario y superposición.
        if (opciones.exigirHorarioDeGrilla &&
            !(0, disponibilidad_service_1.esHorarioDeLaGrilla)(medico, fechaLocal, inicio, ocupados, zonaHoraria, ahora)) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.HORARIO_NO_DISPONIBLE);
        }
        const observaciones = typeof datos.observaciones === 'string'
            ? datos.observaciones.trim() || undefined
            : undefined;
        if (observaciones &&
            observaciones.length > LONGITUD_MAXIMA_OBSERVACIONES) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.OBSERVACIONES_DEMASIADO_LARGAS);
        }
        const datosDelTurno = {
            paciente,
            especialidad,
            medico: medicoId,
            fechaTurno: inicio,
            fechaFin: fin,
            estado: 'pendiente',
            observaciones,
        };
        let turnoCreado;
        try {
            turnoCreado = opciones.session
                ? (await Turno_1.default.create([datosDelTurno], { session: opciones.session }))[0]
                : await Turno_1.default.create(datosDelTurno);
        }
        catch (error) {
            // El índice único de la base impide confirmar dos reservas
            // simultáneas sobre el mismo horario. Solo se traduce un
            // duplicado del índice medico+fechaTurno; otros 11000 se
            // propagan para no ocultar errores de la base.
            if ((0, erroresTurno_1.esDuplicadoDeTurno)(error)) {
                throw new Error(turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO);
            }
            throw error;
        }
        if (!turnoCreado) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.TURNO_NO_CREADO);
        }
        if (opciones.poblarRespuesta === false) {
            return turnoCreado;
        }
        const consultaTurno = Turno_1.default.findById(turnoCreado._id)
            .populate('paciente')
            .populate('especialidad')
            .populate('medico');
        const turnoCompleto = await (opciones.session
            ? consultaTurno.session(opciones.session)
            : consultaTurno);
        return turnoCompleto ?? turnoCreado;
    }
    // ============================================================
    // CREAR TURNO PARA EL PACIENTE AUTENTICADO
    // ============================================================
    async createTurnoParaPaciente(idPaciente, datos) {
        const paciente = validarObjectId(idPaciente, turno_messages_1.MENSAJES_TURNO.PACIENTE_ID_INVALIDO);
        if (!datos ||
            typeof datos !== 'object' ||
            Array.isArray(datos)) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.DATOS_INVALIDOS);
        }
        // Se construye explícitamente el objeto permitido. Cualquier
        // campo interno enviado por el cliente (paciente, estado,
        // fechaFin, duracionTurno, activo) se ignora.
        const datosDelTurno = {
            paciente,
            especialidad: datos.especialidad,
            medico: datos.medico,
            fechaTurno: datos.fechaTurno,
            observaciones: datos.observaciones,
        };
        const turnoCreado = await this.createTurno(datosDelTurno, {
            validarEspecialidadActiva: true,
            exigirHorarioDeGrilla: true,
            poblarRespuesta: false,
        });
        // Proyección mínima para el portal: sin datos personales del
        // paciente y sin datos de contacto del médico.
        const turno = await Turno_1.default.findById(turnoCreado._id)
            .select('fechaTurno fechaFin estado observaciones especialidad medico')
            .populate('especialidad', 'nombre')
            .populate('medico', 'nombre apellido matricula');
        if (turno) {
            return turno;
        }
        // Si la relectura falla, se devuelve solo lo permitido.
        return {
            id: turnoCreado._id,
            fechaTurno: turnoCreado.fechaTurno,
            fechaFin: turnoCreado.fechaFin,
            estado: turnoCreado.estado,
            observaciones: turnoCreado.observaciones,
            especialidad: turnoCreado.especialidad,
            medico: turnoCreado.medico,
        };
    }
    // ============================================================
    // ACTUALIZAR ESTADO
    // ============================================================
    async actualizarEstadoTurno(id, datos) {
        const turnoId = validarObjectId(id, turno_messages_1.MENSAJES_TURNO.TURNO_ID_INVALIDO);
        if (!datos ||
            typeof datos !== 'object' ||
            Array.isArray(datos)) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESTADO_REQUERIDO);
        }
        const camposRecibidos = Object.keys(datos);
        if (camposRecibidos.some((campo) => campo !== 'estado')) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.SOLO_ESTADO_MODIFICABLE);
        }
        const estado = datos.estado;
        if (estado === undefined || estado === null || estado === '') {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESTADO_REQUERIDO);
        }
        if (!(0, turno_types_1.esEstadoTurno)(estado)) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.ESTADO_INVALIDO);
        }
        // Se actualiza exclusivamente `estado`: el resto del documento
        // (paciente, médico, especialidad, fechas y observaciones)
        // permanece intacto.
        const turnoActualizado = await Turno_1.default.findByIdAndUpdate(turnoId, { $set: { estado } }, { new: true, runValidators: true })
            .populate('paciente')
            .populate('especialidad')
            .populate('medico');
        if (!turnoActualizado) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.TURNO_NO_ENCONTRADO);
        }
        return turnoActualizado;
    }
    // ============================================================
    // ELIMINAR TURNO (borrado lógico)
    // ============================================================
    async deleteTurno(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.TURNO_ID_INVALIDO);
        }
        // No se ejecutan validadores del schema para poder cancelar
        // documentos históricos que no tienen médico ni fecha de fin.
        const turnoBorrado = await Turno_1.default.findByIdAndUpdate(id, {
            activo: false,
            estado: 'cancelado',
        }, { new: true })
            .populate('paciente')
            .populate('especialidad')
            .populate('medico');
        if (!turnoBorrado) {
            throw new Error(turno_messages_1.MENSAJES_TURNO.TURNO_NO_ENCONTRADO);
        }
        return turnoBorrado;
    }
}
exports.default = new TurnoService();

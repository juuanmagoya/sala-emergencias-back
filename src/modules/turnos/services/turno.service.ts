import mongoose, { type ClientSession } from 'mongoose';

import EspecialidadModel from '../../especialidad/models/Especialidad';
import MedicoModel from '../../medico/models/Medico';
import PacienteModel from '../../pacientes/models/Paciente';
import UsuarioModel from '../../usuario/models/Usuario';

import TurnoModel from '../models/Turno';

import { leerZonaHoraria } from '../../../config/entorno';
import {
    obtenerPartesEnZona,
    parsearFechaHoraLocal,
} from '../../../utils/fechaHora';

import {
    obtenerDisponibilidad,
    obtenerLimitesDelDiaLocal,
    obtenerMedico,
    obtenerTurnosOcupados,
    validarHorarioDisponible,
} from './disponibilidad.service';

import { MENSAJES_TURNO } from '../constants/turno.messages';
import { esErrorDuplicado } from '../utils/erroresTurno';

import { esEstadoTurno } from '../types/turno.types';

import type {
    ActualizarEstadoTurnoDTO,
    CrearTurnoDTO,
} from '../dtos/TurnoDTO';
import type { ResultadoDisponibilidad } from './disponibilidad.service';

const LONGITUD_MAXIMA_OBSERVACIONES = 500;

export interface OpcionesCreacionTurno {
    session?: ClientSession;
    zonaHoraria?: string;
    ahora?: Date;
    // Recepción crea el paciente en la misma transacción: no hace falta
    // volver a consultarlo. La respuesta se popula después del commit.
    validarPaciente?: boolean;
    poblarRespuesta?: boolean;
}

// ============================================================
// VALIDACIONES COMUNES
// ============================================================

const validarObjectId = (valor: unknown, mensaje: string): string => {
    if (
        typeof valor !== 'string' ||
        !mongoose.Types.ObjectId.isValid(valor)
    ) {
        throw new Error(mensaje);
    }

    return valor;
};

const existePaciente = async (
    pacienteId: string,
    session?: ClientSession
): Promise<boolean> => {
    const consulta = PacienteModel.exists({ _id: pacienteId });

    return Boolean(
        await (session ? consulta.session(session) : consulta)
    );
};

const existeEspecialidad = async (
    especialidadId: string,
    session?: ClientSession
): Promise<boolean> => {
    const consulta = EspecialidadModel.exists({
        _id: especialidadId,
    });

    return Boolean(
        await (session ? consulta.session(session) : consulta)
    );
};

class TurnoService {
    // ============================================================
    // OBTENER TURNOS
    // ============================================================

    async getTurnos() {
        const turnos = await TurnoModel.find({ activo: true })
            .populate('paciente')
            .populate('especialidad')
            .populate('medico');

        return turnos;
    }

    // ============================================================
    // CONSULTAR DISPONIBILIDAD
    // ============================================================

    async getDisponibilidad(
        medicoId: string,
        fecha: string
    ): Promise<ResultadoDisponibilidad> {
        return obtenerDisponibilidad(medicoId, fecha, {
            zonaHoraria: leerZonaHoraria(),
        });
    }

    // ============================================================
    // TURNOS DEL MÉDICO AUTENTICADO
    // ============================================================

    async getTurnosDelMedico(idUsuario: string) {
        if (!mongoose.Types.ObjectId.isValid(idUsuario)) {
            throw new Error(MENSAJES_TURNO.SIN_PERFIL_MEDICO);
        }

        const usuario = await UsuarioModel.findById(idUsuario);

        if (
            !usuario ||
            usuario.rol !== 'medico' ||
            !usuario.medico
        ) {
            throw new Error(MENSAJES_TURNO.SIN_PERFIL_MEDICO);
        }

        // El perfil se resuelve desde la relación explícita Usuario.medico.
        // Nunca se acepta un médico enviado por el cliente.
        const medico = await MedicoModel.findById(usuario.medico);

        if (!medico) {
            throw new Error(MENSAJES_TURNO.SIN_PERFIL_MEDICO);
        }

        // Se incluyen los turnos cancelados para conservar el historial.
        return TurnoModel.find({ medico: medico._id })
            .populate('paciente')
            .populate('especialidad')
            .populate('medico')
            .sort({ fechaTurno: 1 });
    }

    // ============================================================
    // CREAR TURNO
    // ============================================================

    async createTurno(
        datos: CrearTurnoDTO,
        opciones: OpcionesCreacionTurno = {}
    ) {
        const zonaHoraria =
            opciones.zonaHoraria ?? leerZonaHoraria();

        const paciente = validarObjectId(
            datos.paciente,
            MENSAJES_TURNO.PACIENTE_ID_INVALIDO
        );
        const especialidad = validarObjectId(
            datos.especialidad,
            MENSAJES_TURNO.ESPECIALIDAD_ID_INVALIDO
        );
        const medicoId = validarObjectId(
            datos.medico,
            MENSAJES_TURNO.MEDICO_ID_INVALIDO
        );

        const inicio = parsearFechaHoraLocal(
            datos.fechaTurno,
            zonaHoraria
        );

        if (!inicio) {
            throw new Error(MENSAJES_TURNO.FECHA_INVALIDA);
        }

        const ahora = opciones.ahora ?? new Date();

        if (inicio.getTime() <= ahora.getTime()) {
            throw new Error(MENSAJES_TURNO.FECHA_PASADA);
        }

        if (
            opciones.validarPaciente !== false &&
            !(await existePaciente(paciente, opciones.session))
        ) {
            throw new Error(MENSAJES_TURNO.PACIENTE_NO_EXISTE);
        }

        if (
            !(await existeEspecialidad(
                especialidad,
                opciones.session
            ))
        ) {
            throw new Error(
                MENSAJES_TURNO.ESPECIALIDAD_NO_EXISTE
            );
        }

        const medico = await obtenerMedico(
            medicoId,
            opciones.session
        );

        if (
            String(medico.especialidad) !== String(especialidad)
        ) {
            throw new Error(
                MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE
            );
        }

        const fechaLocal = obtenerPartesEnZona(
            inicio,
            zonaHoraria
        );
        const { inicioDia, finDia } = obtenerLimitesDelDiaLocal(
            fechaLocal,
            zonaHoraria
        );

        const ocupados = await obtenerTurnosOcupados(
            medicoId,
            inicioDia,
            finDia,
            medico.duracionTurno,
            opciones.session
        );

        // Misma regla que usa la consulta de disponibilidad.
        const fin = validarHorarioDisponible(
            medico,
            inicio,
            ocupados,
            zonaHoraria
        );

        const observaciones =
            typeof datos.observaciones === 'string'
                ? datos.observaciones.trim() || undefined
                : undefined;

        if (
            observaciones &&
            observaciones.length > LONGITUD_MAXIMA_OBSERVACIONES
        ) {
            throw new Error(
                MENSAJES_TURNO.OBSERVACIONES_DEMASIADO_LARGAS
            );
        }

        const datosDelTurno = {
            paciente,
            especialidad,
            medico: medicoId,
            fechaTurno: inicio,
            fechaFin: fin,
            estado: 'pendiente' as const,
            observaciones,
        };

        let turnoCreado;

        try {
            turnoCreado = opciones.session
                ? (
                      await TurnoModel.create(
                          [datosDelTurno],
                          { session: opciones.session }
                      )
                  )[0]
                : await TurnoModel.create(datosDelTurno);
        } catch (error) {
            // El índice único de la base impide confirmar dos reservas
            // simultáneas sobre el mismo horario.
            if (esErrorDuplicado(error)) {
                throw new Error(
                    MENSAJES_TURNO.HORARIO_OCUPADO
                );
            }

            throw error;
        }

        if (!turnoCreado) {
            throw new Error(MENSAJES_TURNO.TURNO_NO_CREADO);
        }

        if (opciones.poblarRespuesta === false) {
            return turnoCreado;
        }

        const consultaTurno = TurnoModel.findById(
            turnoCreado._id
        )
            .populate('paciente')
            .populate('especialidad')
            .populate('medico');

        const turnoCompleto = await (opciones.session
            ? consultaTurno.session(opciones.session)
            : consultaTurno);

        return turnoCompleto ?? turnoCreado;
    }

    // ============================================================
    // ACTUALIZAR ESTADO
    // ============================================================

    async actualizarEstadoTurno(
        id: string,
        datos: ActualizarEstadoTurnoDTO | undefined
    ) {
        const turnoId = validarObjectId(
            id,
            MENSAJES_TURNO.TURNO_ID_INVALIDO
        );

        if (
            !datos ||
            typeof datos !== 'object' ||
            Array.isArray(datos)
        ) {
            throw new Error(MENSAJES_TURNO.ESTADO_REQUERIDO);
        }

        const camposRecibidos = Object.keys(datos);

        if (
            camposRecibidos.some((campo) => campo !== 'estado')
        ) {
            throw new Error(
                MENSAJES_TURNO.SOLO_ESTADO_MODIFICABLE
            );
        }

        const estado: unknown = datos.estado;

        if (estado === undefined || estado === null || estado === '') {
            throw new Error(MENSAJES_TURNO.ESTADO_REQUERIDO);
        }

        if (!esEstadoTurno(estado)) {
            throw new Error(MENSAJES_TURNO.ESTADO_INVALIDO);
        }

        // Se actualiza exclusivamente `estado`: el resto del documento
        // (paciente, médico, especialidad, fechas y observaciones)
        // permanece intacto.
        const turnoActualizado =
            await TurnoModel.findByIdAndUpdate(
                turnoId,
                { $set: { estado } },
                { new: true, runValidators: true }
            )
                .populate('paciente')
                .populate('especialidad')
                .populate('medico');

        if (!turnoActualizado) {
            throw new Error(MENSAJES_TURNO.TURNO_NO_ENCONTRADO);
        }

        return turnoActualizado;
    }

    // ============================================================
    // ELIMINAR TURNO (borrado lógico)
    // ============================================================

    async deleteTurno(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(MENSAJES_TURNO.TURNO_ID_INVALIDO);
        }

        // No se ejecutan validadores del schema para poder cancelar
        // documentos históricos que no tienen médico ni fecha de fin.
        const turnoBorrado = await TurnoModel.findByIdAndUpdate(
            id,
            {
                activo: false,
                estado: 'cancelado',
            },
            { new: true }
        )
            .populate('paciente')
            .populate('especialidad')
            .populate('medico');

        if (!turnoBorrado) {
            throw new Error(MENSAJES_TURNO.TURNO_NO_ENCONTRADO);
        }

        return turnoBorrado;
    }
}

export default new TurnoService();

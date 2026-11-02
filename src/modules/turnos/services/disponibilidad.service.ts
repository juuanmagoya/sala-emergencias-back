
import mongoose, {
    type ClientSession,
    type HydratedDocument,
} from 'mongoose';

import MedicoModel from '../../medico/models/Medico';
import TurnoModel from '../models/Turno';

import {
    convertirAHoraUtc,
    formatearHora,
    obtenerDiaSemanaLocal,
    obtenerPartesEnZona,
    parsearFechaLocal,
    siguienteDiaLocal,
} from '../../../utils/fechaHora';

import type {
    IHorarioAtencion,
    IMedico,
} from '../../medico/interfaces/Medico.interface';

import type { PartesFecha } from '../../../utils/fechaHora';

// ============================================================
// TIPOS
// ============================================================

export type MedicoDocumento = HydratedDocument<IMedico>;

export interface HorarioDisponible {
    inicio: Date;
    fin: Date;
    horaLocal: string;
}

export interface IntervaloTurno {
    inicio: Date;
    fin: Date;
}

export interface ResultadoDisponibilidad {
    medicoId: string;
    fecha: string;
    zonaHoraria: string;
    duracionTurno: number;
    horarios: HorarioDisponible[];
}

interface IntervaloAtencion {
    desde: number;
    hasta: number;
}

// ============================================================
// DÍAS DE LA SEMANA
// ============================================================

const DIAS_SEMANA: readonly (IHorarioAtencion['dia'] | null)[] = [
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

const parsearHora = (valor: string): number | null => {
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

const obtenerIntervalosDelDia = (
    medico: MedicoDocumento,
    fecha: PartesFecha
): IntervaloAtencion[] => {
    const dia = DIAS_SEMANA[obtenerDiaSemanaLocal(fecha)];

    if (!dia) {
        return [];
    }

    return medico.horariosAtencion
        .filter((horario) => horario.dia === dia)
        .map((horario) => ({
            desde: parsearHora(horario.horaInicio),
            hasta: parsearHora(horario.horaFin),
        }))
        .filter(
            (
                intervalo
            ): intervalo is {
                desde: number;
                hasta: number;
            } =>
                intervalo.desde !== null &&
                intervalo.hasta !== null &&
                intervalo.hasta > intervalo.desde
        );
};

// ============================================================
// CONSULTAR MÉDICO
// ============================================================

export const obtenerMedico = async (
    medicoId: string,
    session?: ClientSession
): Promise<MedicoDocumento> => {
    if (
        typeof medicoId !== 'string' ||
        !mongoose.Types.ObjectId.isValid(medicoId)
    ) {
        throw new Error('El ID del médico no es válido');
    }

    const consulta = MedicoModel.findById(medicoId);

    const medico = await (
        session ? consulta.session(session) : consulta
    );

    if (!medico) {
        throw new Error('El médico indicado no existe');
    }

    if (!medico.activo) {
        throw new Error('El médico no está activo');
    }

    return medico;
};

// ============================================================
// LÍMITES DEL DÍA
// ============================================================

export const obtenerLimitesDelDiaLocal = (
    fecha: PartesFecha,
    zonaHoraria: string
): { inicioDia: Date; finDia: Date } => {
    const diaSiguiente = siguienteDiaLocal(fecha);

    return {
        inicioDia: convertirAHoraUtc(
            fecha.anio,
            fecha.mes,
            fecha.dia,
            0,
            0,
            0,
            zonaHoraria
        ),
        finDia: convertirAHoraUtc(
            diaSiguiente.anio,
            diaSiguiente.mes,
            diaSiguiente.dia,
            0,
            0,
            0,
            zonaHoraria
        ),
    };
};

// ============================================================
// TURNOS OCUPADOS
// ============================================================

export const obtenerTurnosOcupados = async (
    medicoId: string,
    inicioDia: Date,
    finDia: Date,
    duracionTurno: number,
    session?: ClientSession
): Promise<IntervaloTurno[]> => {
    const consulta = TurnoModel.find({
        medico: medicoId,
        fechaTurno: {
            $gte: inicioDia,
            $lt: finDia,
        },
        estado: { $ne: 'cancelado' },
        activo: { $ne: false },
    });

    const turnos = await (
        session ? consulta.session(session) : consulta
    );

    return turnos.map((turno) => {
        const inicio = turno.fechaTurno;

        const fin =
            turno.fechaFin instanceof Date
                ? turno.fechaFin
                : new Date(
                      inicio.getTime() + duracionTurno * 60_000
                  );

        return { inicio, fin };
    });
};

// ============================================================
// GENERAR HORARIOS DISPONIBLES
// ============================================================

export const generarHorariosDelDia = (
    medico: MedicoDocumento,
    fecha: PartesFecha,
    zonaHoraria: string
): HorarioDisponible[] => {
    const duracion = medico.duracionTurno;

    if (!Number.isInteger(duracion) || duracion <= 0) {
        return [];
    }

    const horarios: HorarioDisponible[] = [];
    const iniciosVistos = new Set<number>();

    for (const intervalo of obtenerIntervalosDelDia(medico, fecha)) {
        for (
            let minuto = intervalo.desde;
            minuto + duracion <= intervalo.hasta;
            minuto += duracion
        ) {
            const inicio = convertirAHoraUtc(
                fecha.anio,
                fecha.mes,
                fecha.dia,
                Math.floor(minuto / 60),
                minuto % 60,
                0,
                zonaHoraria
            );

            if (iniciosVistos.has(inicio.getTime())) {
                continue;
            }

            iniciosVistos.add(inicio.getTime());

            horarios.push({
                inicio,
                fin: new Date(
                    inicio.getTime() + duracion * 60_000
                ),
                horaLocal: formatearHora(minuto),
            });
        }
    }

    return horarios.sort(
        (a, b) => a.inicio.getTime() - b.inicio.getTime()
    );
};

// ============================================================
// VALIDAR HORARIO DEL TURNO
// ============================================================

const seSuperponen = (
    inicioA: Date,
    finA: Date,
    inicioB: Date,
    finB: Date
): boolean =>
    inicioA.getTime() < finB.getTime() &&
    inicioB.getTime() < finA.getTime();

export const validarHorarioDisponible = (
    medico: MedicoDocumento,
    inicio: Date,
    ocupados: IntervaloTurno[],
    zonaHoraria: string
): Date => {
    if (!medico.activo) {
        throw new Error('El médico no está activo');
    }

    const duracion = medico.duracionTurno;

    if (
        !Number.isInteger(duracion) ||
        duracion <= 0 ||
        Number.isNaN(inicio.getTime())
    ) {
        throw new Error('El horario del turno no es válido');
    }

    const partes = obtenerPartesEnZona(inicio, zonaHoraria);
    const intervalos = obtenerIntervalosDelDia(medico, partes);

    if (intervalos.length === 0) {
        throw new Error('El médico no atiende ese día');
    }

    const minutos = partes.hora * 60 + partes.minuto;
    const fin = new Date(inicio.getTime() + duracion * 60_000);

    const horarioValido = intervalos.some(
        (intervalo) =>
            minutos >= intervalo.desde &&
            minutos < intervalo.hasta &&
            minutos + duracion <= intervalo.hasta
    );

    if (!horarioValido) {
        throw new Error(
            'El turno debe comenzar y finalizar dentro del horario de atención'
        );
    }

    const ocupado = ocupados.some((turno) =>
        seSuperponen(inicio, fin, turno.inicio, turno.fin)
    );

    if (ocupado) {
        throw new Error('El horario solicitado ya está ocupado');
    }

    return fin;
};

// ============================================================
// DISPONIBILIDAD DE UN DÍA
// ============================================================

export const obtenerDisponibilidad = async (
    medicoId: string,
    fechaTexto: unknown,
    opciones: {
        zonaHoraria: string;
        ahora?: Date;
        session?: ClientSession;
    }
): Promise<ResultadoDisponibilidad> => {
    const fecha = parsearFechaLocal(fechaTexto);

    if (!fecha) {
        throw new Error('La fecha indicada no es válida');
    }

    const medico = await obtenerMedico(
        medicoId,
        opciones.session
    );

    const { inicioDia, finDia } = obtenerLimitesDelDiaLocal(
        fecha,
        opciones.zonaHoraria
    );

    const ocupados = await obtenerTurnosOcupados(
        medicoId,
        inicioDia,
        finDia,
        medico.duracionTurno,
        opciones.session
    );

    const ahora = opciones.ahora ?? new Date();

    const horarios = generarHorariosDelDia(
        medico,
        fecha,
        opciones.zonaHoraria
    ).filter(
        (horario) =>
            horario.inicio.getTime() > ahora.getTime() &&
            !ocupados.some((turno) =>
                seSuperponen(
                    horario.inicio,
                    horario.fin,
                    turno.inicio,
                    turno.fin
                )
            )
    );

    return {
        medicoId,
        fecha: `${fecha.anio}-${String(fecha.mes).padStart(
            2,
            '0'
        )}-${String(fecha.dia).padStart(2, '0')}`,
        zonaHoraria: opciones.zonaHoraria,
        duracionTurno: medico.duracionTurno,
        horarios,
    };
};

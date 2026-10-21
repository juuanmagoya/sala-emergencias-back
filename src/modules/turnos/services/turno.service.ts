import mongoose from 'mongoose';

import TurnoModel from '../models/Turno';

import type { CrearTurnoDTO } from '../dtos/TurnoDTO';

class TurnoService {
    // ============================================================
    // OBTENER TURNOS
    // ============================================================

    async getTurnos() {
        const turnos = await TurnoModel.find({ activo: true })
            .populate('paciente')
            .populate('especialidad');

        return turnos;
    }

    // ============================================================
    // CREAR TURNO
    // ============================================================

    async createTurno(datos: CrearTurnoDTO, urgente: boolean) {
        const datosDelTurno: CrearTurnoDTO = {
            paciente: datos.paciente,
            especialidad: datos.especialidad,
            fechaTurno: datos.fechaTurno,
        };

        if (urgente) {
            datosDelTurno.estado = 'atendido';
            datosDelTurno.observaciones = 'ingreso por guardia medica';

            console.log('🚨 ALERTA: registrado un turno de urgencia');
        }

        const nuevoTurno = await TurnoModel.create(datosDelTurno);

        // Devolver el turno con sus datos completos
        const turnoCompleto = await TurnoModel.findById(nuevoTurno._id)
            .populate('paciente')
            .populate('especialidad');

        return turnoCompleto;
    }

    // ============================================================
    // ELIMINAR TURNO (borrado lógico)
    // ============================================================

    async deleteTurno(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID del turno no es válido');
        }

        const turnoBorrado = await TurnoModel.findByIdAndUpdate(
            id,
            {
                activo: false,
                estado: 'cancelado',
            },
            { new: true }
        )
            .populate('paciente')
            .populate('especialidad');

        if (!turnoBorrado) {
            throw new Error('Turno no encontrado');
        }

        return turnoBorrado;
    }
}

export default new TurnoService();

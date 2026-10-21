import mongoose from 'mongoose';

import PacienteModel from '../../pacientes/models/Paciente';
import TurnoModel from '../../turnos/models/Turno';

import type { CrearIngresoDTO } from '../dtos/CrearIngresoDTO';

// Este módulo no define un modelo propio: el ingreso crea un Paciente
// y un Turno reutilizando los modelos de sus módulos respectivos.

class RecepcionService {
    // ============================================================
    // REGISTRAR INGRESO (transacción: crea el paciente y su turno)
    // ============================================================

    async registrarIngreso(ingreso: CrearIngresoDTO) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const {
                datosPaciente,
                especialidad,
                fechaTurno,
                estado,
                observaciones,
            } = ingreso;

            const [nuevoPaciente] = await PacienteModel.create(
                [datosPaciente],
                { session }
            );

            if (!nuevoPaciente) {
                throw new Error('No se pudo registrar el paciente');
            }

            const [nuevoTurno] = await TurnoModel.create(
                [
                    {
                        paciente: nuevoPaciente._id,
                        especialidad,
                        fechaTurno,
                        estado,
                        observaciones,
                    },
                ],
                { session }
            );

            if (!nuevoTurno) {
                throw new Error('No se pudo registrar el turno del ingreso');
            }

            await session.commitTransaction();
            session.endSession();

            // Devolver el turno con sus datos completos
            const turnoCompleto = await TurnoModel.findById(nuevoTurno._id)
                .populate('paciente')
                .populate('especialidad');

            return turnoCompleto;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();

            throw error;
        }
    }
}

export default new RecepcionService();

import mongoose from 'mongoose';

import PacienteModel from '../../pacientes/models/Paciente';
import TurnoModel from '../../turnos/models/Turno';
import turnoService from '../../turnos/services/turno.service';

import type { CrearIngresoDTO } from '../dtos/CrearIngresoDTO';

// Este módulo no define un modelo propio: el ingreso crea un Paciente
// y un Turno reutilizando los modelos y las reglas de sus módulos.

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
                medico,
                fechaTurno,
                observaciones,
            } = ingreso;

            const [nuevoPaciente] = await PacienteModel.create(
                [datosPaciente],
                { session }
            );

            if (!nuevoPaciente) {
                throw new Error(
                    'No se pudo registrar el paciente'
                );
            }

            // Reutiliza las validaciones de disponibilidad y crea el
            // turno dentro de la misma transacción.
            const turnoCreado = await turnoService.createTurno(
                {
                    paciente: nuevoPaciente._id.toString(),
                    especialidad,
                    medico,
                    fechaTurno,
                    observaciones,
                },
                {
                    session,
                    // El paciente se acaba de crear en esta transacción.
                    validarPaciente: false,
                    poblarRespuesta: false,
                }
            );

            await session.commitTransaction();
            session.endSession();

            // Se popula después del commit para no depender de lecturas
            // de documentos aún no confirmados.
            const turnoCompleto = await TurnoModel.findById(
                turnoCreado._id
            )
                .populate('paciente')
                .populate('especialidad')
                .populate('medico');

            return turnoCompleto ?? turnoCreado;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();

            throw error;
        }
    }
}

export default new RecepcionService();

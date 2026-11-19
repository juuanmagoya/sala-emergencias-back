import mongoose from 'mongoose';

import PacienteModel from '../../pacientes/models/Paciente';
import TurnoModel from '../../turnos/models/Turno';
import turnoService from '../../turnos/services/turno.service';

import type { IPaciente } from '../../pacientes/interfaces/paciente.interfaces';
import type { CrearIngresoDTO } from '../dtos/CrearIngresoDTO';

// Este módulo no define un modelo propio: el ingreso crea un Paciente
// y un Turno reutilizando los modelos y las reglas de sus módulos.

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
    typeof valor === 'object' && valor !== null && !Array.isArray(valor);

// Lista blanca del alta mínima. Cualquier dato adicional enviado por el
// cliente (email, dirección, obra social, estado, fechaFin, etc.) se
// descarta antes de llegar al modelo.
const obtenerDatosPacientePermitidos = (
    datosPaciente: unknown
): Partial<IPaciente> => {
    if (!esObjeto(datosPaciente)) {
        return {};
    }

    const datos: Partial<IPaciente> = {};

    if (typeof datosPaciente.nombre === 'string') {
        datos.nombre = datosPaciente.nombre.trim();
    }

    if (typeof datosPaciente.dni === 'string') {
        datos.dni = datosPaciente.dni.trim();
    }

    if (esObjeto(datosPaciente.telefono)) {
        const telefono = datosPaciente.telefono;

        datos.telefono = {
            ...(typeof telefono.codigoArea === 'string'
                ? { codigoArea: telefono.codigoArea.trim() }
                : {}),
            ...(typeof telefono.numero === 'string'
                ? { numero: telefono.numero.trim() }
                : {}),
            ...(typeof telefono.tipo === 'string'
                ? { tipo: telefono.tipo.trim().toUpperCase() }
                : {}),
        } as IPaciente['telefono'];
    }

    return datos;
};

class RecepcionService {
    // ============================================================
    // REGISTRAR INGRESO (transacción: crea el paciente y su turno)
    // ============================================================

    async registrarIngreso(ingreso: CrearIngresoDTO) {
        const datosPaciente = obtenerDatosPacientePermitidos(
            ingreso?.datosPaciente
        );

        // Valida y aplica los defaults del modelo antes de abrir una
        // transacción. Un DNI o teléfono inválido no llega a MongoDB.
        const paciente = new PacienteModel(datosPaciente);
        await paciente.validate();

        const session = await mongoose.startSession();
        let transaccionIniciada = false;
        let turnoCreado:
            | Awaited<ReturnType<typeof turnoService.createTurno>>
            | undefined;

        try {
            session.startTransaction();
            transaccionIniciada = true;

            const [nuevoPaciente] = await PacienteModel.create(
                [paciente.toObject()],
                { session }
            );

            if (!nuevoPaciente) {
                throw new Error(
                    'No se pudo registrar el paciente'
                );
            }

            // Reutiliza las validaciones de disponibilidad y crea el
            // turno dentro de la misma transacción.
            turnoCreado = await turnoService.createTurno(
                {
                    paciente: nuevoPaciente._id.toString(),
                    especialidad: ingreso.especialidad,
                    medico: ingreso.medico,
                    fechaTurno: ingreso.fechaTurno,
                    observaciones: ingreso.observaciones,
                },
                {
                    session,
                    // El paciente se acaba de crear en esta transacción.
                    validarPaciente: false,
                    poblarRespuesta: false,
                }
            );

            await session.commitTransaction();
            transaccionIniciada = false;

        } catch (error) {
            if (transaccionIniciada) {
                await session.abortTransaction();
            }

            throw error;

        } finally {
            await session.endSession();
        }

        if (!turnoCreado) {
            throw new Error('No se pudo registrar el turno');
        }

        // Se popula después del commit para no depender de lecturas
        // de documentos aún no confirmados.
        const turnoCompleto = await TurnoModel.findById(
            turnoCreado._id
        )
            .populate('paciente')
            .populate('especialidad')
            .populate('medico');

        return turnoCompleto ?? turnoCreado;
    }
}

export default new RecepcionService();

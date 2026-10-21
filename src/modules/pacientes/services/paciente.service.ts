import mongoose from 'mongoose';

import PacienteModel from '../models/Paciente';
import TurnoModel from '../../turnos/models/Turno';

import type { CreatePacienteDTO } from '../dtos/CreatePacienteDTO';
import type { UpdatePacienteDTO } from '../dtos/UpdatePacienteDTO';

class PacienteService {
    // ============================================================
    // OBTENER PACIENTES
    // ============================================================

    async getPacientes(filtro: {
        obraSocial?: string;
        dni?: string;
    }) {
        const { obraSocial, dni } = filtro;

        const filtroMongo: Record<string, any> = {};

        if (obraSocial) {
            filtroMongo['obraSocial.nombre'] = obraSocial.toUpperCase();
        }

        if (dni) {
            filtroMongo.dni = dni;
        }

        const pacientes = await PacienteModel.find(filtroMongo);

        return pacientes;
    }

    // ============================================================
    // CREAR PACIENTE
    // ============================================================

    async createPaciente(datos: CreatePacienteDTO) {
        return await PacienteModel.create(datos);
    }

    // ============================================================
    // ACTUALIZAR PACIENTE
    // ============================================================

    async updatePaciente(id: string, datos: UpdatePacienteDTO) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID del paciente no es válido');
        }

        const paciente = await PacienteModel.findById(id);

        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }

        // Verificar duplicados (DNI o email) si se están actualizando
        const { dni, email } = datos;

        if (dni || email) {
            const condicionesDuplicado = [];

            if (dni) {
                condicionesDuplicado.push({ dni });
            }

            if (email) {
                condicionesDuplicado.push({ email });
            }

            const duplicado = await PacienteModel.findOne({
                $or: condicionesDuplicado,
                _id: { $ne: id },
            });

            if (duplicado) {
                if (dni && duplicado.dni === dni) {
                    throw new Error(
                        'Ya existe otro paciente con ese DNI'
                    );
                }

                if (email && duplicado.email === email) {
                    throw new Error(
                        'Ya existe otro paciente con ese email'
                    );
                }

                throw new Error(
                    'Ya existe otro paciente con esos datos'
                );
            }
        }

        return await PacienteModel.findByIdAndUpdate(id, datos, {
            new: true,
            runValidators: true,
        });
    }

    // ============================================================
    // ELIMINAR PACIENTE
    // ============================================================

    async deletePaciente(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID del paciente no es válido');
        }

        const paciente = await PacienteModel.findById(id);

        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }

        // Validar que no tenga turnos activos asociados
        const turnoUsando = await TurnoModel.findOne({
            paciente: id,
            activo: true,
        });

        if (turnoUsando) {
            throw new Error(
                'No se puede eliminar el paciente porque tiene uno o más turnos activos'
            );
        }

        await PacienteModel.findByIdAndDelete(id);

        return paciente;
    }
}

export default new PacienteService();
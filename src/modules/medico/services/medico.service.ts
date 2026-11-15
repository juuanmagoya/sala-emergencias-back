import mongoose from 'mongoose';

import MedicoModel from '../models/Medico';
import EspecialidadModel from '../../especialidad/models/Especialidad';

import type { CreateMedicoDTO } from '../dtos/CreateMedicoDTO';
import type { UpdateMedicoDTO } from '../dtos/UpdateMedicoDTO';

class MedicoService {

    // ============================================================
    // OBTENER MÉDICOS
    // ============================================================

    async getMedicos(filtro: {
        nombre?: string;
        apellido?: string;
        matricula?: string;
        especialidad?: string;
        email?: string;
        activo?: string;
    }) {
        const {
            nombre,
            apellido,
            matricula,
            especialidad,
            email,
            activo,
        } = filtro;

        const filtroMongo: Record<string, any> = {};

        if (nombre) {
            filtroMongo.nombre = {
                $regex: nombre,
                $options: 'i',
            };
        }

        if (apellido) {
            filtroMongo.apellido = {
                $regex: apellido,
                $options: 'i',
            };
        }

        if (matricula) {
            filtroMongo.matricula = matricula;
        }

        if (especialidad) {
            if (!mongoose.Types.ObjectId.isValid(especialidad)) {
                throw new Error(
                    'El ID de la especialidad no es válido'
                );
            }

            filtroMongo.especialidad = especialidad;
        }

        if (email) {
            filtroMongo.email = {
                $regex: email,
                $options: 'i',
            };
        }

        if (activo !== undefined) {
            filtroMongo.activo = activo === 'true';
        }

        return await MedicoModel.find(filtroMongo)
            .populate('especialidad')
            .populate('consultorios');
    }


    // ============================================================
    // MÉDICOS DISPONIBLES PARA EL PORTAL DE PACIENTES
    //
    // Solo médicos activos de una especialidad activa. La proyección
    // excluye email, teléfono, consultorios y horarios completos.
    // ============================================================

    async getMedicosDisponibles(especialidadId: string) {
        if (
            !mongoose.Types.ObjectId.isValid(especialidadId)
        ) {
            throw new Error(
                'El ID de la especialidad no es válido'
            );
        }

        const especialidadActiva =
            await EspecialidadModel.findOne({
                _id: especialidadId,
                activo: true,
            }).select('_id');

        if (!especialidadActiva) {
            const especialidadExiste =
                await EspecialidadModel.exists({
                    _id: especialidadId,
                });

            if (!especialidadExiste) {
                throw new Error(
                    'La especialidad indicada no existe'
                );
            }

            throw new Error('La especialidad no está activa');
        }

        return await MedicoModel.find({
            especialidad: especialidadId,
            activo: true,
        })
            .select(
                'nombre apellido matricula especialidad duracionTurno'
            )
            .populate('especialidad', 'nombre');
    }


    // ============================================================
    // CREAR MÉDICO
    // ============================================================

    async createMedico(datos: CreateMedicoDTO) {

        if (
            !mongoose.Types.ObjectId.isValid(
                datos.especialidad
            )
        ) {
            throw new Error(
                'El ID de la especialidad no es válido'
            );
        }

        if (datos.consultorios) {
            for (const consultorioId of datos.consultorios) {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        consultorioId
                    )
                ) {
                    throw new Error(
                        'Uno de los IDs de los consultorios no es válido'
                    );
                }
            }
        }

        return await MedicoModel.create(datos);
    }


    // ============================================================
    // ACTUALIZAR MÉDICO
    // ============================================================

    async updateMedico(
        id: string,
        datos: UpdateMedicoDTO
    ) {

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(
                'El ID del médico no es válido'
            );
        }

        const medico = await MedicoModel.findById(id);

        if (!medico) {
            throw new Error(
                'Médico no encontrado'
            );
        }

        if (datos.especialidad) {
            if (
                !mongoose.Types.ObjectId.isValid(
                    datos.especialidad
                )
            ) {
                throw new Error(
                    'El ID de la especialidad no es válido'
                );
            }
        }

        if (datos.consultorios) {
            for (const consultorioId of datos.consultorios) {
                if (
                    !mongoose.Types.ObjectId.isValid(
                        consultorioId
                    )
                ) {
                    throw new Error(
                        'Uno de los IDs de los consultorios no es válido'
                    );
                }
            }
        }

        return await MedicoModel.findByIdAndUpdate(
            id,
            datos,
            {
                new: true,
                runValidators: true,
            }
        );
    }


    // ============================================================
    // ACTIVAR / DESACTIVAR
    // ============================================================

    async toggleActivoMedico(id: string) {

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(
                'El ID del médico no es válido'
            );
        }

        const medico = await MedicoModel.findById(id);

        if (!medico) {
            throw new Error(
                'Médico no encontrado'
            );
        }

        medico.activo = !medico.activo;

        await medico.save();

        return medico;
    }


    // ============================================================
    // ELIMINAR PERMANENTEMENTE
    // ============================================================

    async deleteMedicoPermanente(id: string) {

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(
                'El ID del médico no es válido'
            );
        }

        const medico = await MedicoModel.findById(id);

        if (!medico) {
            throw new Error(
                'Médico no encontrado'
            );
        }

        await MedicoModel.findByIdAndDelete(id);

        return medico;
    }
}

export default new MedicoService();
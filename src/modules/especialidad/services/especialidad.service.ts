import mongoose from 'mongoose';

import EspecialidadModel from '../models/Especialidad';

import MedicoModel from '../../medico/models/Medico';
import ConsultorioModel from '../../consultorio/models/Consultorio';
import TurnoModel from '../../turnos/models/Turno';

import type { CreateEspecialidadDTO } from '../dtos/CreateEspecialidadDTO';
import type { UpdateEspecialidadDTO } from '../dtos/UpdateEspecialidadDTO';

class EspecialidadService {
    async getEspecialidades(filtro: {
        nombre?: string;
        codigo?: string;
        id?: string;
        activo?: string;
    }) {
        const { nombre, codigo, id, activo } = filtro;

        const filtroMongo: Record<string, any> = {};

        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('El ID de la especialidad no es válido');
            }

            filtroMongo._id = id;
        }

        if (nombre) {
            filtroMongo.nombre = {
                $regex: nombre.toUpperCase(),
                $options: 'i',
            };
        }

        if (codigo) {
            filtroMongo.codigo = codigo.toUpperCase();
        }

        if (activo !== undefined) {
            filtroMongo.activo = activo === 'true';
        }

        const especialidades = await EspecialidadModel.find(filtroMongo);

        if (id && especialidades.length === 0) {
            throw new Error('Especialidad no encontrada');
        }

        return especialidades;
    }

    async createEspecialidad(
        datos: CreateEspecialidadDTO
    ) {
        return await EspecialidadModel.create(datos);
    }

    async updateEspecialidad(
        id: string,
        datos: UpdateEspecialidadDTO
    ) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la especialidad no es válido');
        }

        const especialidad = await EspecialidadModel.findOne({
            _id: id,
            activo: true,
        });

        if (!especialidad) {
            throw new Error('Especialidad no encontrada o está inactiva');
        }

        if (datos.nombre || datos.codigo) {
            const condicionesDuplicado = [];

            if (datos.nombre) {
                condicionesDuplicado.push({
                    nombre: datos.nombre.toUpperCase(),
                });
            }

            if (datos.codigo) {
                condicionesDuplicado.push({
                    codigo: datos.codigo.toUpperCase(),
                });
            }

            const duplicado = await EspecialidadModel.findOne({
                $or: condicionesDuplicado,
                _id: { $ne: id },
            });

            if (duplicado) {
                if (
                    datos.nombre &&
                    duplicado.nombre === datos.nombre.toUpperCase()
                ) {
                    throw new Error(
                        'Ya existe una especialidad con ese nombre'
                    );
                }

                if (
                    datos.codigo &&
                    duplicado.codigo === datos.codigo.toUpperCase()
                ) {
                    throw new Error(
                        'Ya existe una especialidad con ese código'
                    );
                }

                throw new Error(
                    'Ya existe una especialidad con esos datos'
                );
            }
        }

        return await EspecialidadModel.findByIdAndUpdate(
            id,
            datos,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async toggleActivoEspecialidad(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la especialidad no es válido');
        }

        const especialidad = await EspecialidadModel.findById(id);

        if (!especialidad) {
            throw new Error('Especialidad no encontrada');
        }

        // Si está activa, verificamos que no esté siendo utilizada
        // antes de desactivarla.
        if (especialidad.activo) {
            const medicoUsando = await MedicoModel.findOne({
                especialidad: id,
                activo: true,
            });

            if (medicoUsando) {
                throw new Error(
                    'No se puede desactivar la especialidad porque está siendo utilizada por uno o más médicos activos'
                );
            }

            const consultorioUsando = await ConsultorioModel.findOne({
                especialidades: id,
                activo: true,
            });

            if (consultorioUsando) {
                throw new Error(
                    'No se puede desactivar la especialidad porque está siendo utilizada por uno o más consultorios activos'
                );
            }

            const turnoUsando = await TurnoModel.findOne({
                especialidad: id,
                activo: true,
            });

            if (turnoUsando) {
                throw new Error(
                    'No se puede desactivar la especialidad porque está siendo utilizada por uno o más turnos activos'
                );
            }
        }

        especialidad.activo = !especialidad.activo;

        await especialidad.save();

        return {
            especialidad,
            mensaje: especialidad.activo
                ? 'Especialidad activada correctamente'
                : 'Especialidad desactivada correctamente',
        };
    }

    async deleteEspecialidadPermanente(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la especialidad no es válido');
        }

        const especialidad = await EspecialidadModel.findById(id);

        if (!especialidad) {
            throw new Error('Especialidad no encontrada');
        }

        const medicoUsando = await MedicoModel.findOne({
            especialidad: id,
            activo: true,
        });

        if (medicoUsando) {
            throw new Error(
                'No se puede eliminar la especialidad porque está siendo utilizada por uno o más médicos activos'
            );
        }

        const consultorioUsando = await ConsultorioModel.findOne({
            especialidades: id,
            activo: true,
        });

        if (consultorioUsando) {
            throw new Error(
                'No se puede eliminar la especialidad porque está siendo utilizada por uno o más consultorios activos'
            );
        }

        const turnoUsando = await TurnoModel.findOne({
            especialidad: id,
            activo: true,
        });

        if (turnoUsando) {
            throw new Error(
                'No se puede eliminar la especialidad porque está siendo utilizada por uno o más turnos activos'
            );
        }

        await EspecialidadModel.findByIdAndDelete(id);

        return especialidad;
    }
}

export default new EspecialidadService();
import mongoose from 'mongoose';

import Consultorio from '../models/Consultorio.js';
import Especialidad from '../../especialidad/models/Especialidad.js';

import type { CreateConsultorioDTO } from '../dtos/CreateConsultorioDTO.js';
import type { UpdateConsultorioDTO } from '../dtos/UpdateConsultorioDTO.js';

const getConsultorios = async ({
    id,
    numero,
    nombre,
    especialidad,
}: {
    id?: string;
    numero?: string;
    nombre?: string;
    especialidad?: string;
}) => {
    const filtro: Record<string, any> = {
        activo: true,
    };

    if (id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de consultorio inválido');
        }

        filtro._id = id;
    }

    if (numero) {
        filtro.numero = numero;
    }

    if (nombre) {
        filtro.nombre = {
            $regex: nombre.toUpperCase(),
            $options: 'i',
        };
    }

    if (especialidad) {
        const especialidadDoc = await Especialidad.findOne({
            nombre: especialidad.toUpperCase(),
        });

        if (!especialidadDoc) {
            return [];
        }

        filtro.especialidades = {
            $in: [especialidadDoc._id],
        };
    }

    const consultorios = await Consultorio.find(filtro)
        .populate('especialidades');

    if (id && consultorios.length === 0) {
        throw new Error('Consultorio no encontrado');
    }

    return consultorios;
};

const createConsultorio = async (
    datos: CreateConsultorioDTO
) => {
    const nuevoConsultorio = await Consultorio.create(datos);

    return Consultorio.findById(nuevoConsultorio._id)
        .populate('especialidades');
};

const updateConsultorio = async (
    id: string,
    datos: UpdateConsultorioDTO
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID de consultorio inválido');
    }

    const consultorioExistente = await Consultorio.findOne({
        _id: id,
        activo: true,
    });

    if (!consultorioExistente) {
        throw new Error('Consultorio no encontrado');
    }

    const { nombre, numero } = datos;

    if (nombre || numero) {
        const condiciones = [];

        if (nombre) {
            condiciones.push({ nombre });
        }

        if (numero) {
            condiciones.push({ numero });
        }

        const duplicado = await Consultorio.findOne({
            $or: condiciones,
            _id: { $ne: id },
        });

        if (duplicado) {
            if (duplicado.nombre === nombre) {
                throw new Error(
                    'Ya existe otro consultorio con ese nombre'
                );
            }

            if (duplicado.numero === numero) {
                throw new Error(
                    'Ya existe otro consultorio con ese número'
                );
            }
        }
    }

    return Consultorio.findByIdAndUpdate(
        id,
        datos,
        {
            new: true,
            runValidators: true,
        }
    ).populate('especialidades');
};

const deleteConsultorio = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID de consultorio inválido');
    }

    const consultorioEliminado =
        await Consultorio.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );

    if (!consultorioEliminado) {
        throw new Error('Consultorio no encontrado');
    }

    return consultorioEliminado;
};

export {
    getConsultorios,
    createConsultorio,
    updateConsultorio,
    deleteConsultorio,
};
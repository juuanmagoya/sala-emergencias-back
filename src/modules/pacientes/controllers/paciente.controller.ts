import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import pacienteService from '../services/paciente.service';

import type { PacienteFilterRequest } from '../request/PacienteFilterRequest';
import type { PacienteCreateRequest } from '../request/PacienteCreateRequest';
import type { PacienteUpdateRequest } from '../request/PacienteUpdateRequest';


// ============================================================
// OBTENER PACIENTES
// ============================================================

export const getPacientes = async (
    req: PacienteFilterRequest,
    res: Response
) => {
    try {
        const pacientes = await pacienteService.getPacientes(req.query);

        return respuestaEstandar(
            res,
            200,
            true,
            'Pacientes obtenidos exitosamente',
            pacientes
        );

    } catch (error: any) {
        console.error('🔴 Error al obtener pacientes:', error);

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al obtener los pacientes',
            error.message
        );
    }
};

// ============================================================
// CREAR PACIENTE
// ============================================================

export const createPaciente = async (
    req: PacienteCreateRequest,
    res: Response
) => {
    try {
        const nuevoPaciente = await pacienteService.createPaciente(req.body);

        return respuestaEstandar(
            res,
            201,
            true,
            'Paciente creado exitosamente',
            nuevoPaciente
        );

    } catch (error: any) {
        console.error('🔴 ERROR AL CREAR PACIENTE:', error);

        // Error de validación de Mongoose
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(
                (err: any) => err.message
            );

            return respuestaEstandar(
                res,
                400,
                false,
                'Error de validación',
                errores
            );
        }

        // Error de duplicado (MongoDB 11000)
        if (error.code === 11000) {
            const campoDuplicado = Object.keys(error.keyPattern)[0];

            if (campoDuplicado === 'email') {
                return respuestaEstandar(
                    res,
                    400,
                    false,
                    'El correo electrónico ya está registrado',
                    'Ya existe un paciente registrado con ese correo electrónico'
                );
            }

            if (campoDuplicado === 'dni') {
                return respuestaEstandar(
                    res,
                    400,
                    false,
                    'El DNI ya está registrado',
                    'Ya existe un paciente registrado con ese DNI'
                );
            }

            return respuestaEstandar(
                res,
                400,
                false,
                'Dato duplicado',
                'Ya existe un paciente con uno de los datos ingresados'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al crear el paciente',
            error.message
        );
    }
};

// ============================================================
// ACTUALIZAR PACIENTE
// ============================================================

export const updatePaciente = async (
    req: PacienteUpdateRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const pacienteActualizado =
            await pacienteService.updatePaciente(id, req.body);

        return respuestaEstandar(
            res,
            200,
            true,
            'Paciente actualizado exitosamente',
            pacienteActualizado
        );

    } catch (error: any) {
        console.error('🔴 Error al actualizar paciente:', error);

        if (error.message === 'El ID del paciente no es válido') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de paciente inválido'
            );
        }

        if (error.message === 'Paciente no encontrado') {
            return respuestaEstandar(
                res,
                404,
                false,
                'Paciente no encontrado'
            );
        }

        if (error.message === 'Ya existe otro paciente con ese DNI') {
            return respuestaEstandar(
                res,
                400,
                false,
                'Ya existe otro paciente con ese DNI'
            );
        }

        if (error.message === 'Ya existe otro paciente con ese email') {
            return respuestaEstandar(
                res,
                400,
                false,
                'Ya existe otro paciente con ese email'
            );
        }

        if (error.message === 'Ya existe otro paciente con esos datos') {
            return respuestaEstandar(
                res,
                400,
                false,
                'Ya existe otro paciente con esos datos'
            );
        }

        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(
                (err: any) => err.message
            );

            return respuestaEstandar(
                res,
                400,
                false,
                'Error de validación',
                errores
            );
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];

            return respuestaEstandar(
                res,
                400,
                false,
                `El ${campo} ya está registrado en el sistema`
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al actualizar el paciente',
            error.message
        );
    }
};

// ============================================================
// ELIMINAR PACIENTE
// ============================================================

export const deletePaciente = async (
    req: PacienteUpdateRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        await pacienteService.deletePaciente(id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Paciente eliminado correctamente'
        );

    } catch (error: any) {
        console.error('🔴 Error al eliminar paciente:', error);

        if (error.message === 'El ID del paciente no es válido') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de paciente inválido'
            );
        }

        if (error.message === 'Paciente no encontrado') {
            return respuestaEstandar(
                res,
                404,
                false,
                'Paciente no encontrado'
            );
        }

        if (
            error.message.includes(
                'No se puede eliminar el paciente'
            )
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                error.message
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al eliminar el paciente',
            error.message
        );
    }
};
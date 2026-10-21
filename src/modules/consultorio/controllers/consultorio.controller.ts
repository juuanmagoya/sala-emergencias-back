import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar.js';

import {
    getConsultorios as obtenerConsultorios,
    createConsultorio as crearConsultorio,
    updateConsultorio as actualizarConsultorio,
    deleteConsultorio as eliminarConsultorio,
} from '../services/consultorio.service.js';

import type { ConsultorioCreateRequest } from '../request/ConsultorioCreateRequest.js';
import type { ConsultorioUpdateRequest } from '../request/ConsultorioUpdateRequest.js';
import type { ConsultorioFilterRequest } from '../request/ConsultorioFilterRequest.js';

export const getConsultorios = async (
    req: ConsultorioFilterRequest,
    res: Response
) => {
    try {
        const consultorios = await obtenerConsultorios(
            req.query
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Consultorios obtenidos exitosamente',
            consultorios
        );
    } catch (error: unknown) {
        const mensaje =
            error instanceof Error
                ? error.message
                : 'Error al obtener los consultorios';

        if (mensaje === 'ID de consultorio inválido') {
            return respuestaEstandar(
                res,
                400,
                false,
                mensaje
            );
        }

        if (mensaje === 'Consultorio no encontrado') {
            return respuestaEstandar(
                res,
                404,
                false,
                mensaje
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al obtener los consultorios',
            mensaje
        );
    }
};

export const createConsultorio = async (
    req: ConsultorioCreateRequest,
    res: Response
) => {
    try {
        const consultorio =
            await crearConsultorio(req.body);

        return respuestaEstandar(
            res,
            201,
            true,
            'Consultorio creado exitosamente',
            consultorio
        );
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(
                error.errors
            ).map(
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
            const campo =
                Object.keys(error.keyPattern)[0];

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
            'Error al crear el consultorio',
            error.message
        );
    }
};

export const updateConsultorio = async (
    req: ConsultorioUpdateRequest,
    res: Response
) => {
    try {
        const consultorio =
            await actualizarConsultorio(
                req.params.id,
                req.body
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Consultorio actualizado exitosamente',
            consultorio
        );
    } catch (error: any) {
        if (
            error.name === 'ValidationError'
        ) {
            const errores = Object.values(
                error.errors
            ).map(
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

        if (
            error.message ===
            'ID de consultorio inválido'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                error.message
            );
        }

        if (
            error.message ===
            'Consultorio no encontrado'
        ) {
            return respuestaEstandar(
                res,
                404,
                false,
                error.message
            );
        }

        if (
            error.message ===
            'Ya existe otro consultorio con ese nombre'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                error.message
            );
        }

        if (
            error.message ===
            'Ya existe otro consultorio con ese número'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                error.message
            );
        }

        if (error.name === 'CastError') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de consultorio inválido'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al actualizar el consultorio',
            error.message
        );
    }
};

export const deleteConsultorio = async (
    req: ConsultorioUpdateRequest,
    res: Response
) => {
    try {
        const consultorio =
            await eliminarConsultorio(
                req.params.id
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Consultorio eliminado exitosamente',
            consultorio
        );
    } catch (error: any) {
        if (
            error.message ===
            'ID de consultorio inválido'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                error.message
            );
        }

        if (
            error.message ===
            'Consultorio no encontrado'
        ) {
            return respuestaEstandar(
                res,
                404,
                false,
                error.message
            );
        }

        if (error.name === 'CastError') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID con formato inválido'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al eliminar el consultorio',
            error.message
        );
    }
};

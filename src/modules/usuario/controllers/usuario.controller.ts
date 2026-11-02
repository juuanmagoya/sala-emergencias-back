import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import usuarioService from '../services/usuario.service';

import type { UsuarioCreateRequest } from '../request/UsuarioCreateRequest';
import type { UsuarioFilterRequest } from '../request/UsuarioFilterRequest';
import type { UsuarioIdRequest } from '../request/UsuarioIdRequest';
import type { UsuarioUpdateRequest } from '../request/UsuarioUpdateRequest';

// ============================================================
// MAPEO DE ERRORES
// ============================================================

interface ErrorUsuario {
    name?: string;
    message?: string;
    statusCode?: number;
    code?: number;
    keyPattern?: Record<string, unknown>;
    errors?: Record<string, { message: string }>;
}

const responderErrorUsuario = (
    res: Response,
    error: unknown,
    mensajeGeneral: string
) => {
    const errorTipado = error as ErrorUsuario;

    if (errorTipado?.name === 'ValidationError') {
        const errores = Object.values(
            errorTipado.errors ?? {}
        ).map((detalle) => detalle.message);

        return respuestaEstandar(
            res,
            400,
            false,
            'Error de validación',
            errores
        );
    }

    if (errorTipado?.name === 'CastError') {
        return respuestaEstandar(
            res,
            400,
            false,
            'Identificador inválido'
        );
    }

    if (errorTipado?.code === 11000) {
        const campo = errorTipado.keyPattern
            ? Object.keys(errorTipado.keyPattern)[0]
            : undefined;

        const mensaje =
            campo === 'email'
                ? 'El email ya está registrado'
                : campo === 'medico'
                  ? 'El médico ya está asociado a otro usuario'
                  : 'Ya existe un registro con esos datos';

        return respuestaEstandar(
            res,
            409,
            false,
            mensaje
        );
    }

    if (typeof errorTipado?.statusCode === 'number') {
        return respuestaEstandar(
            res,
            errorTipado.statusCode,
            false,
            errorTipado.message ?? mensajeGeneral
        );
    }

    console.error(`🔴 ${mensajeGeneral}:`, error);

    return respuestaEstandar(
        res,
        500,
        false,
        mensajeGeneral
    );
};

// ============================================================
// LISTAR USUARIOS
// ============================================================

export const getUsuarios = async (
    req: UsuarioFilterRequest,
    res: Response
) => {
    try {
        const usuarios = await usuarioService.getUsuarios(
            req.query
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Usuarios obtenidos exitosamente',
            usuarios
        );
    } catch (error: unknown) {
        return responderErrorUsuario(
            res,
            error,
            'Error al obtener los usuarios'
        );
    }
};

// ============================================================
// OBTENER USUARIO POR ID
// ============================================================

export const getUsuarioById = async (
    req: UsuarioIdRequest,
    res: Response
) => {
    try {
        const usuario = await usuarioService.getUsuarioById(
            req.params.id
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Usuario obtenido exitosamente',
            usuario
        );
    } catch (error: unknown) {
        return responderErrorUsuario(
            res,
            error,
            'Error al obtener el usuario'
        );
    }
};

// ============================================================
// CREAR USUARIO
// ============================================================

export const createUsuario = async (
    req: UsuarioCreateRequest,
    res: Response
) => {
    try {
        const usuario = await usuarioService.createUsuario(
            req.body
        );

        return respuestaEstandar(
            res,
            201,
            true,
            'Usuario creado exitosamente',
            usuario
        );
    } catch (error: unknown) {
        return responderErrorUsuario(
            res,
            error,
            'Error al crear el usuario'
        );
    }
};

// ============================================================
// ACTUALIZAR USUARIO
// ============================================================

export const updateUsuario = async (
    req: UsuarioUpdateRequest,
    res: Response
) => {
    try {
        const usuario = await usuarioService.updateUsuario(
            req.params.id,
            req.body
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Usuario actualizado exitosamente',
            usuario
        );
    } catch (error: unknown) {
        return responderErrorUsuario(
            res,
            error,
            'Error al actualizar el usuario'
        );
    }
};

// ============================================================
// DESACTIVAR USUARIO
// ============================================================

export const desactivarUsuario = async (
    req: UsuarioIdRequest,
    res: Response
) => {
    try {
        const usuario =
            await usuarioService.desactivarUsuario(
                req.params.id
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Usuario desactivado exitosamente',
            usuario
        );
    } catch (error: unknown) {
        return responderErrorUsuario(
            res,
            error,
            'Error al desactivar el usuario'
        );
    }
};

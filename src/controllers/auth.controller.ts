import type { Request, Response } from 'express';

import {
    registrarUsuario,
    loginUsuario,
} from '../services/auth.service.js';
import ErrorConfiguracion from '../utils/ErrorConfiguracion.js';
import respuestaEstandar from '../utils/respuestaEstandar.js';

interface RegistrarRequest extends Request {
    body: {
        nombre?: string;
        email?: string;
        password?: string;
    };
}

interface LoginRequest extends Request {
    body: {
        email?: string;
        password?: string;
    };
}

export const registrar = async (
    req: RegistrarRequest,
    res: Response
) => {
    try {
        // Solo se leen los campos permitidos: cualquier `rol` enviado por el
        // cliente se descarta y el service aplica el rol por defecto.
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return respuestaEstandar(
                res,
                400,
                false,
                'Nombre, email y password son obligatorios'
            );
        }

        const usuario = await registrarUsuario({
            nombre,
            email,
            password,
        });

        return respuestaEstandar(
            res,
            201,
            true,
            'Usuario registrado correctamente',
            usuario
        );
    } catch (error: unknown) {
        const mensaje =
            error instanceof Error
                ? error.message
                : 'Error al registrar el usuario';

        return respuestaEstandar(
            res,
            400,
            false,
            mensaje
        );
    }
};

export const login = async (
    req: LoginRequest,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return respuestaEstandar(
                res,
                400,
                false,
                'Email y password son obligatorios'
            );
        }

        const resultado = await loginUsuario({
            email,
            password,
        });

        return respuestaEstandar(
            res,
            200,
            true,
            'Login exitoso',
            resultado
        );
    } catch (error: unknown) {
        // Un secreto faltante o inválido es un problema de configuración del
        // servidor: se responde 500 sin exponer detalles internos.
        if (error instanceof ErrorConfiguracion) {
            console.error(
                '🔴 Error de configuración al iniciar sesión:',
                error.message
            );

            return respuestaEstandar(
                res,
                500,
                false,
                'Error interno del servidor'
            );
        }

        const mensaje =
            error instanceof Error
                ? error.message
                : 'Error al iniciar sesión';

        return respuestaEstandar(
            res,
            401,
            false,
            mensaje
        );
    }
};

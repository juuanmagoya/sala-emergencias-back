import type { Request, Response } from 'express';

import {
    loginPaciente as loginPacienteService,
    loginUsuario,
} from '../services/auth.service.js';
import ErrorConfiguracion from '../utils/ErrorConfiguracion.js';
import respuestaEstandar from '../utils/respuestaEstandar.js';

interface LoginRequest extends Request {
    body: {
        email?: string;
        password?: string;
    };
}

interface LoginPacienteRequest extends Request {
    body: {
        dni?: string;
        telefono?: string;
    };
}

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

export const loginPaciente = async (
    req: LoginPacienteRequest,
    res: Response
) => {
    try {
        const { dni, telefono } = req.body;

        if (!dni || !telefono) {
            return respuestaEstandar(
                res,
                400,
                false,
                'DNI y teléfono son obligatorios'
            );
        }

        const resultado = await loginPacienteService({
            dni,
            telefono,
        });

        return respuestaEstandar(
            res,
            200,
            true,
            'Login de paciente exitoso',
            resultado
        );
    } catch (error: unknown) {
        if (error instanceof ErrorConfiguracion) {
            console.error(
                '🔴 Error de configuración al iniciar sesión de paciente'
            );

            return respuestaEstandar(
                res,
                500,
                false,
                'Error interno del servidor'
            );
        }

        const errorConEstado = error as {
            statusCode?: number;
            message?: string;
        };

        if (typeof errorConEstado.statusCode === 'number') {
            return respuestaEstandar(
                res,
                errorConEstado.statusCode,
                false,
                errorConEstado.message ??
                    'Error al iniciar sesión de paciente'
            );
        }

        // No se registra el error completo: podría contener datos de entrada.
        console.error('🔴 Error al iniciar sesión de paciente');

        return respuestaEstandar(
            res,
            500,
            false,
            'Error interno del servidor'
        );
    }
};

import type { Request, Response } from 'express';

import {
    registrarUsuario,
    loginUsuario,
} from '../services/auth.service.js';

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
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y password son obligatorios',
            });
        }

        const usuario = await registrarUsuario({
            nombre,
            email,
            password,
        });

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            data: usuario,
        });
    } catch (error: unknown) {
        const mensaje =
            error instanceof Error
                ? error.message
                : 'Error al registrar el usuario';

        return res.status(400).json({
            success: false,
            message: mensaje,
        });
    }
};

export const login = async (
    req: LoginRequest,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son obligatorios',
            });
        }

        const resultado = await loginUsuario({
            email,
            password,
        });

        return res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: resultado,
        });
    } catch (error: unknown) {
        const mensaje =
            error instanceof Error
                ? error.message
                : 'Error al iniciar sesión';

        return res.status(401).json({
            success: false,
            message: mensaje,
        });
    }
};
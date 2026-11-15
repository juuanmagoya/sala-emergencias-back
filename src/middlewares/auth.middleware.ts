import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import PacienteModel from '../modules/pacientes/models/Paciente.js';
import {
    ROL_PACIENTE,
    esRolUsuario,
} from '../modules/usuario/types/usuario.types.js';
import type {
    IdentidadAutenticada,
    UsuarioAutenticado,
} from '../modules/usuario/types/usuario.types.js';
import respuestaEstandar from '../utils/respuestaEstandar.js';

interface PayloadJwt {
    id?: unknown;
    email?: unknown;
    rol?: unknown;
    medico?: unknown;
    tipo?: unknown;
}

// Valida el contenido real del token antes de confiar en él.
const construirIdentidadAutenticada = async (
    decoded: string | jwt.JwtPayload
): Promise<IdentidadAutenticada | null> => {
    if (typeof decoded === 'string') {
        return null;
    }

    const { id, email, rol, medico, tipo } = decoded as PayloadJwt;

    if (typeof id !== 'string') {
        return null;
    }

    // Token de paciente: se valida contra la colección Paciente, nunca
    // contra Usuario.
    if (tipo === 'paciente') {
        if (rol !== ROL_PACIENTE) {
            return null;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        // Paciente no tiene baja lógica en el modelo actual. La existencia
        // es la comprobación de validez; si se agrega `activo`, debe
        // evaluarse acá.
        const pacienteExiste = await PacienteModel.exists({ _id: id });

        if (!pacienteExiste) {
            return null;
        }

        return {
            tipo: 'paciente',
            id,
            rol: ROL_PACIENTE,
        };
    }

    // Tokens internos: los emitidos antes de incorporar `tipo` se aceptan
    // como usuarios para no invalidar sesiones vigentes.
    if (tipo !== undefined && tipo !== 'usuario') {
        return null;
    }

    if (!esRolUsuario(rol)) {
        return null;
    }

    if (typeof email !== 'string') {
        return null;
    }

    if (medico !== undefined && typeof medico !== 'string') {
        return null;
    }

    const usuario: UsuarioAutenticado = {
        tipo: 'usuario',
        id,
        email,
        rol,
        medico,
    };

    return usuario;
};

const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        respuestaEstandar(
            res,
            401,
            false,
            'No se proporcionó un token de autenticación'
        );
        return;
    }

    const [tipoEncabezado, token] = authHeader.split(' ');

    if (tipoEncabezado !== 'Bearer' || !token) {
        respuestaEstandar(res, 401, false, 'Formato de token inválido');
        return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error('ERROR AUTH: JWT_SECRET no está configurado');
        respuestaEstandar(res, 500, false, 'Error interno del servidor');
        return;
    }

    let decoded: string | jwt.JwtPayload;

    try {
        decoded = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256'],
        });
    } catch (error: unknown) {
        console.error('ERROR AUTH:', error);
        respuestaEstandar(res, 401, false, 'Token inválido o expirado');
        return;
    }

    let identidad: IdentidadAutenticada | null;

    try {
        identidad = await construirIdentidadAutenticada(decoded);
    } catch {
        // No se registra el error completo para no filtrar datos internos.
        console.error('ERROR AUTH: no se pudo validar la identidad');
        respuestaEstandar(res, 500, false, 'Error interno del servidor');
        return;
    }

    if (!identidad) {
        respuestaEstandar(res, 401, false, 'Token inválido o expirado');
        return;
    }

    req.usuario = identidad;

    next();
};

export default authMiddleware;

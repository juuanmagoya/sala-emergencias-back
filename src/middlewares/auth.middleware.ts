import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { esRolUsuario } from '../modules/usuario/types/usuario.types.js';
import type { UsuarioAutenticado } from '../modules/usuario/types/usuario.types.js';
import respuestaEstandar from '../utils/respuestaEstandar.js';

// Valida el contenido real del token antes de confiar en él.
const construirUsuarioAutenticado = (
    decoded: string | jwt.JwtPayload
): UsuarioAutenticado | null => {
    if (typeof decoded === 'string') {
        return null;
    }

    const { id, email, rol, medico } = decoded;

    if (
        typeof id !== 'string' ||
        typeof email !== 'string' ||
        !esRolUsuario(rol) ||
        (medico !== undefined && typeof medico !== 'string')
    ) {
        return null;
    }

    return {
        id,
        email,
        rol,
        medico,
    };
};

const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return respuestaEstandar(
            res,
            401,
            false,
            'No se proporcionó un token de autenticación'
        );
    }

    const [tipo, token] = authHeader.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return respuestaEstandar(
            res,
            401,
            false,
            'Formato de token inválido'
        );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error('ERROR AUTH: JWT_SECRET no está configurado');

        return respuestaEstandar(
            res,
            500,
            false,
            'Error interno del servidor'
        );
    }

    let usuario: UsuarioAutenticado | null;

    try {
        const decoded = jwt.verify(token, jwtSecret);

        usuario = construirUsuarioAutenticado(decoded);

    } catch (error: unknown) {
        console.error('ERROR AUTH:', error);

        return respuestaEstandar(
            res,
            401,
            false,
            'Token inválido o expirado'
        );
    }

    if (!usuario) {
        return respuestaEstandar(
            res,
            401,
            false,
            'Token inválido o expirado'
        );
    }

    req.usuario = usuario;

    return next();
};

export default authMiddleware;

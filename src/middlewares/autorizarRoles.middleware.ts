import type { NextFunction, Request, Response } from 'express';

import type { RolUsuario } from '../modules/usuario/types/usuario.types.js';
import respuestaEstandar from '../utils/respuestaEstandar.js';

// Middleware reutilizable de autorización por roles.
// Debe montarse siempre después de authMiddleware.
const autorizarRoles = (...rolesPermitidos: RolUsuario[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (rolesPermitidos.length === 0) {
            console.error(
                'ERROR AUTORIZACIÓN: la ruta no definió roles permitidos'
            );

            return respuestaEstandar(
                res,
                500,
                false,
                'Error interno del servidor'
            );
        }

        // No se asume autenticación: si el middleware de auth no corrió antes,
        // la solicitud se rechaza con 401.
        const usuario = req.usuario;

        if (!usuario) {
            return respuestaEstandar(
                res,
                401,
                false,
                'No se proporcionó un token de autenticación'
            );
        }

        // El rol proviene del JWT firmado, nunca del cuerpo o los query params.
        if (!rolesPermitidos.includes(usuario.rol)) {
            return respuestaEstandar(
                res,
                403,
                false,
                'No tenés permisos para acceder a este recurso'
            );
        }

        return next();
    };
};

export default autorizarRoles;

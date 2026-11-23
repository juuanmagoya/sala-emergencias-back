import { extname } from 'node:path';

import type { NextFunction, Request, Response } from 'express';

import multer from 'multer';
import rateLimit from 'express-rate-limit';

import { leerEnteroPositivo } from '../../../config/entorno';
import respuestaEstandar from '../../../utils/respuestaEstandar';

import ErrorImportacion from '../services/importacion/ErrorImportacion';
import {
    EXTENSION_XLSX,
    TAMANO_MAXIMO_ARCHIVO_BYTES,
} from '../services/importacion/constantes';

const VENTANA_IMPORTACION_POR_DEFECTO_MS = 15 * 60 * 1000;
const LIMITE_IMPORTACION_POR_DEFECTO = 20;

// La importación se limita en memoria y con tamaños acotados. No se
// escribe ningún archivo en disco.
const subida = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: TAMANO_MAXIMO_ARCHIVO_BYTES,
        files: 1,
        fields: 2,
        fieldSize: 1024,
        parts: 5,
    },
    fileFilter: (_req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();

        if (extension !== EXTENSION_XLSX) {
            callback(
                new ErrorImportacion(
                    400,
                    'El archivo debe tener extensión .xlsx. No se aceptan .xls, .xlsm ni .csv.'
                )
            );
            return;
        }

        callback(null, true);
    },
});

const responderErrorMulter = (res: Response, error: unknown) => {
    if (error instanceof ErrorImportacion) {
        return respuestaEstandar(
            res,
            error.status,
            false,
            error.message,
            error.detalles ?? null
        );
    }

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return respuestaEstandar(
                res,
                413,
                false,
                'El archivo supera el tamaño máximo permitido de 5 MB.',
                {
                    maximoBytes: TAMANO_MAXIMO_ARCHIVO_BYTES,
                }
            );
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return respuestaEstandar(
                res,
                400,
                false,
                'El campo del archivo debe llamarse "archivo" y solo se permite un archivo.'
            );
        }

        if (error.code === 'LIMIT_FILE_COUNT') {
            return respuestaEstandar(
                res,
                400,
                false,
                'Solo se permite un archivo por solicitud.'
            );
        }

        return respuestaEstandar(
            res,
            400,
            false,
            'El archivo adjunto no es válido.'
        );
    }

    return respuestaEstandar(
        res,
        400,
        false,
        'No se pudo procesar el archivo adjunto.'
    );
};

export const recibirArchivoImportacion = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    res.set('Cache-Control', 'no-store');

    subida.single('archivo')(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        responderErrorMulter(res, error);
    });
};

export const limitadorImportacion = rateLimit({
    windowMs: leerEnteroPositivo(
        process.env.IMPORTACION_RATE_LIMIT_WINDOW_MS,
        VENTANA_IMPORTACION_POR_DEFECTO_MS
    ),
    limit: leerEnteroPositivo(
        process.env.IMPORTACION_RATE_LIMIT_MAX,
        LIMITE_IMPORTACION_POR_DEFECTO
    ),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
        res.set('Cache-Control', 'no-store');

        return respuestaEstandar(
            res,
            429,
            false,
            'Demasiadas solicitudes de importación. Intentá nuevamente más tarde.'
        );
    },
});

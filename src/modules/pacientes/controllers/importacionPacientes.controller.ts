import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import ErrorImportacion from '../services/importacion/ErrorImportacion';
import importacionPacientesService from '../services/importacionPacientes.service';

import type { ImportarPacientesRequest } from '../request/ImportarPacientesRequest';
import type { ArchivoExcelImportacion } from '../types/importacionPacientes.types';

const contar = (
    cantidad: number,
    singular: string,
    plural: string
): string => `${cantidad} ${cantidad === 1 ? singular : plural}`;

const obtenerArchivo = (
    req: ImportarPacientesRequest
): ArchivoExcelImportacion => {
    if (!req.file) {
        throw new ErrorImportacion(
            400,
            'Tenés que adjuntar un archivo .xlsx en el campo "archivo".'
        );
    }

    return {
        buffer: req.file.buffer,
        nombreOriginal: req.file.originalname,
        tipoMime: req.file.mimetype,
        tamano: req.file.size,
    };
};

const obtenerHoja = (
    req: ImportarPacientesRequest
): string | undefined => {
    const hoja = req.body?.hoja;

    return typeof hoja === 'string' && hoja.trim()
        ? hoja.trim()
        : undefined;
};

const responderError = (res: Response, error: unknown) => {
    if (error instanceof ErrorImportacion) {
        return respuestaEstandar(
            res,
            error.status,
            false,
            error.message,
            error.detalles ?? null
        );
    }

    // No se registra el error completo para no filtrar datos personales
    // ni detalles internos de MongoDB.
    console.error(
        'ERROR IMPORTACIÓN: fallo inesperado al procesar pacientes'
    );

    return respuestaEstandar(
        res,
        500,
        false,
        'No se pudo completar la operación de importación. Intentá nuevamente.'
    );
};

// ============================================================
// PREVISUALIZAR IMPORTACIÓN
// ============================================================

export const previsualizarImportacion = async (
    req: ImportarPacientesRequest,
    res: Response
) => {
    res.set('Cache-Control', 'no-store');

    try {
        const archivo = obtenerArchivo(req);
        const resultado = await importacionPacientesService.previsualizar(
            archivo,
            obtenerHoja(req)
        );

        return respuestaEstandar(
            res,
            200,
            true,
            `Previsualización generada: ${contar(resultado.resumen.validas, 'fila válida', 'filas válidas')} de ${contar(resultado.resumen.totalFilas, 'fila analizada', 'filas analizadas')}.`,
            resultado
        );

    } catch (error: unknown) {
        return responderError(res, error);
    }
};

// ============================================================
// CONFIRMAR IMPORTACIÓN
// ============================================================

export const confirmarImportacion = async (
    req: ImportarPacientesRequest,
    res: Response
) => {
    res.set('Cache-Control', 'no-store');

    try {
        const archivo = obtenerArchivo(req);
        const resultado = await importacionPacientesService.confirmar(
            archivo,
            obtenerHoja(req)
        );

        return respuestaEstandar(
            res,
            200,
            true,
            `Importación finalizada: ${contar(resultado.resumen.importadas, 'paciente importado', 'pacientes importados')} de ${contar(resultado.resumen.totalFilas, 'fila analizada', 'filas analizadas')}.`,
            resultado
        );

    } catch (error: unknown) {
        return responderError(res, error);
    }
};

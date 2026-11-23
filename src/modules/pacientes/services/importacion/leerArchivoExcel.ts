import { extname } from 'node:path';

import readXlsxFile from 'read-excel-file/node';

import ErrorImportacion from './ErrorImportacion';
import {
    EXTENSION_XLSX,
    FIRMA_XLSX,
    MAXIMO_FILAS_PACIENTES,
    TAMANO_MAXIMO_ARCHIVO_BYTES,
    TIPOS_MIME_XLSX,
} from './constantes';
import { esCeldaVacia } from './tiposExcel';

import type { Sheet } from 'read-excel-file/node';
import type { ArchivoExcelImportacion } from '../../types/importacionPacientes.types';
import type { FilaExcelImportacion } from './tiposExcel';

export interface ArchivoExcelLeido {
    filas: FilaExcelImportacion[];
    hojaProcesada: string;
    hojasDisponibles: string[];
}

const filaEstaVacia = (fila: FilaExcelImportacion): boolean =>
    fila.every((celda) => esCeldaVacia(celda));

export const leerArchivoExcel = async (
    archivo: ArchivoExcelImportacion,
    hojaSolicitada?: string
): Promise<ArchivoExcelLeido> => {
    const tamano = archivo.buffer.length;

    if (tamano === 0) {
        throw new ErrorImportacion(
            400,
            'El archivo está vacío. Adjuntá un archivo .xlsx con pacientes.'
        );
    }

    if (tamano > TAMANO_MAXIMO_ARCHIVO_BYTES) {
        throw new ErrorImportacion(
            413,
            'El archivo supera el tamaño máximo permitido de 5 MB.',
            {
                maximoBytes: TAMANO_MAXIMO_ARCHIVO_BYTES,
            }
        );
    }

    const extension = extname(archivo.nombreOriginal).toLowerCase();

    if (extension !== EXTENSION_XLSX) {
        throw new ErrorImportacion(
            400,
            'El archivo debe tener extensión .xlsx. No se aceptan .xls, .xlsm ni .csv.'
        );
    }

    const tipoMime = archivo.tipoMime.trim().toLowerCase();

    if (tipoMime && !TIPOS_MIME_XLSX.has(tipoMime)) {
        throw new ErrorImportacion(
            400,
            'El tipo de archivo no es válido. Solo se aceptan archivos .xlsx.'
        );
    }

    if (
        archivo.buffer.length < FIRMA_XLSX.length ||
        !archivo.buffer
            .subarray(0, FIRMA_XLSX.length)
            .equals(FIRMA_XLSX)
    ) {
        throw new ErrorImportacion(
            400,
            'El archivo no tiene una estructura XLSX válida o está dañado.'
        );
    }

    let hojas: Sheet[];

    try {
        hojas = await readXlsxFile(archivo.buffer, { trim: true });
    } catch {
        throw new ErrorImportacion(
            400,
            'No se pudo leer el archivo. Verificá que sea un .xlsx válido, que no esté dañado y que no tenga contraseña.'
        );
    }

    if (!Array.isArray(hojas) || hojas.length === 0) {
        throw new ErrorImportacion(
            400,
            'El archivo no contiene hojas con datos.'
        );
    }

    const hojasDisponibles = hojas.map((hoja) => hoja.sheet);
    const hojaBuscada = hojaSolicitada?.trim();

    let hojaSeleccionada: Sheet | undefined;

    if (hojas.length === 1) {
        hojaSeleccionada = hojas[0];
    } else {
        if (!hojaBuscada) {
            throw new ErrorImportacion(
                400,
                `El archivo contiene varias hojas (${hojasDisponibles.join(', ')}). Indicá cuál procesar en el campo "hoja".`,
                { hojasDisponibles }
            );
        }

        const hojaBuscadaNormalizada = hojaBuscada.toLowerCase();

        hojaSeleccionada =
            hojas.find((hoja) => hoja.sheet === hojaBuscada) ??
            hojas.find(
                (hoja) =>
                    hoja.sheet.trim().toLowerCase() ===
                    hojaBuscadaNormalizada
            );

        if (!hojaSeleccionada) {
            throw new ErrorImportacion(
                400,
                `La hoja "${hojaBuscada}" no existe en el archivo.`,
                { hojasDisponibles }
            );
        }
    }

    const filas = [
        ...((hojaSeleccionada?.data ?? []) as FilaExcelImportacion[]),
    ];

    // Se descartan únicamente las filas vacías del final para que una fila
    // en blanco intermedia siga contando y pueda informarse como `vacia`.
    while (filas.length > 1 && filaEstaVacia(filas[filas.length - 1])) {
        filas.pop();
    }

    if (filas.length === 0 || filaEstaVacia(filas[0])) {
        throw new ErrorImportacion(
            400,
            `La hoja "${hojaSeleccionada?.sheet ?? ''}" no contiene encabezados con datos.`
        );
    }

    const cantidadFilas = Math.max(0, filas.length - 1);

    if (cantidadFilas > MAXIMO_FILAS_PACIENTES) {
        throw new ErrorImportacion(
            400,
            `El archivo contiene ${cantidadFilas} filas de pacientes. El máximo permitido es ${MAXIMO_FILAS_PACIENTES}.`,
            {
                filasDetectadas: cantidadFilas,
                maximoFilas: MAXIMO_FILAS_PACIENTES,
            }
        );
    }

    return {
        filas,
        hojaProcesada: hojaSeleccionada?.sheet ?? '',
        hojasDisponibles,
    };
};

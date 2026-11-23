import PacienteModel from '../models/Paciente';

import ErrorImportacion from './importacion/ErrorImportacion';
import { analizarFilas } from './importacion/analizarFilas';
import { leerArchivoExcel } from './importacion/leerArchivoExcel';
import { mapearColumnas } from './importacion/mapeoColumnas';

import type {
    ArchivoExcelImportacion,
    FilaImportacion,
    ResumenConfirmacion,
    ResumenPrevisualizacion,
    ResultadoConfirmacion,
    ResultadoPrevisualizacion,
} from '../types/importacionPacientes.types';
import type { FilaAnalizada } from './importacion/analizarFilas';
import type { MapeoColumnas } from './importacion/mapeoColumnas';

interface ResultadoInsertMany {
    insertedCount?: number;
    mongoose?: {
        results?: unknown[];
    };
    results?: unknown[];
}

interface ErrorInsercion {
    code?: unknown;
    err?: {
        code?: unknown;
    };
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
    name?: unknown;
    message?: unknown;
    errors?: Record<string, { message?: string }>;
}

const aFilaPublica = (fila: FilaAnalizada): FilaImportacion => ({
    numeroFila: fila.numeroFila,
    estado: fila.estado,
    datos: fila.datos,
    motivos: fila.motivos,
    advertencias: fila.advertencias,
});

const construirResumenPrevisualizacion = (
    filas: FilaAnalizada[]
): ResumenPrevisualizacion => {
    const contar = (estado: FilaAnalizada['estado']): number =>
        filas.filter((fila) => fila.estado === estado).length;

    return {
        totalFilas: filas.length,
        validas: contar('valida'),
        invalidas: contar('invalida'),
        existentes: contar('existente'),
        duplicadasEnArchivo: contar('duplicada_en_archivo'),
        conflictosEmail: contar('conflicto_email'),
        vacias: contar('vacia'),
        conAdvertencias: filas.filter(
            (fila) => fila.advertencias.length > 0
        ).length,
    };
};

const construirResumenConfirmacion = (
    filas: FilaAnalizada[],
    candidatas: number
): ResumenConfirmacion => {
    const importadas = filas.filter(
        (fila) => fila.estado === 'importada'
    ).length;

    return {
        ...construirResumenPrevisualizacion(filas),
        candidatas,
        importadas,
        noImportadas: filas.length - importadas,
    };
};

const columnasIdentificadas = (mapeo: MapeoColumnas) =>
    mapeo.columnas.map(({ encabezado, campo }) => ({
        encabezado,
        campo,
    }));

const obtenerResultadosInsercion = (
    resultado: unknown
): unknown[] | undefined => {
    if (!resultado || typeof resultado !== 'object') {
        return undefined;
    }

    const posible = resultado as ResultadoInsertMany;

    if (Array.isArray(posible.mongoose?.results)) {
        return posible.mongoose.results;
    }

    if (Array.isArray(posible.results)) {
        return posible.results;
    }

    return undefined;
};

const esErrorInsercion = (resultado: unknown): boolean => {
    if (resultado instanceof Error) {
        return true;
    }

    if (!resultado || typeof resultado !== 'object') {
        return false;
    }

    const posible = resultado as ErrorInsercion;

    return (
        posible.code !== undefined ||
        posible.err?.code !== undefined ||
        posible.name === 'ValidationError' ||
        posible.errors !== undefined ||
        typeof posible.message === 'string'
    );
};

const marcarErrorInsercion = (
    fila: FilaAnalizada,
    resultado: unknown
): void => {
    const error = (
        resultado && typeof resultado === 'object'
            ? resultado
            : {}
    ) as ErrorInsercion;

    const codigo = error.code ?? error.err?.code;

    if (codigo === 11000) {
        const campo =
            Object.keys(error.keyPattern ?? {})[0] ??
            Object.keys(error.keyValue ?? {})[0];

        if (campo === 'email') {
            fila.estado = 'conflicto_email';
            fila.motivos = [
                {
                    campo: 'email',
                    mensaje:
                        'El email ya está registrado. Es posible que otro usuario haya creado el paciente mientras se confirmaba la importación.',
                },
            ];

            return;
        }

        if (campo === 'dni') {
            fila.estado = 'existente';
            fila.motivos = [
                {
                    campo: 'dni',
                    mensaje:
                        'Ya existe un paciente con ese DNI. Es posible que otro usuario lo haya creado mientras se confirmaba la importación.',
                },
            ];

            return;
        }

        fila.estado = 'invalida';
        fila.motivos = [
            {
                mensaje:
                    'Ya existe un registro con uno de los datos del paciente.',
            },
        ];

        return;
    }

    if (error.errors) {
        const motivos = Object.entries(error.errors).map(
            ([campo, detalle]) => ({
                campo,
                mensaje:
                    typeof detalle.message === 'string'
                        ? detalle.message
                        : 'El valor no es válido.',
            })
        );

        fila.estado = 'invalida';
        fila.motivos = motivos.length
            ? motivos
            : [
                  {
                      mensaje:
                          'La fila no cumple las validaciones del paciente.',
                  },
              ];

        return;
    }

    fila.estado = 'invalida';
    fila.motivos = [
        {
            mensaje:
                'No se pudo importar la fila por un error interno. Intentá nuevamente.',
        },
    ];
};

const insertarFilasValidas = async (
    filasValidas: FilaAnalizada[]
): Promise<void> => {
    const documentos = filasValidas.map(
        (fila) => fila.documento as Record<string, unknown>
    );

    let resultado: ResultadoInsertMany;

    try {
        resultado = (await PacienteModel.insertMany(documentos, {
            ordered: false,
            rawResult: true,
        })) as unknown as ResultadoInsertMany;
    } catch (error: unknown) {
        const resultados = obtenerResultadosInsercion(error);

        if (!resultados) {
            throw new ErrorImportacion(
                500,
                'No se pudo confirmar la importación en la base de datos. Intentá nuevamente.'
            );
        }

        resultado = {
            mongoose: { results: resultados },
        };
    }

    const resultados = obtenerResultadosInsercion(resultado);

    // Con `ordered: false` y `rawResult: true`, Mongoose informa un
    // resultado por documento. Si no hay resultados, no es posible
    // confirmar qué filas se insertaron y ninguna se marca como importada.
    if (!resultados) {
        throw new ErrorImportacion(
            500,
            'No se pudo confirmar qué pacientes se importaron. Intentá nuevamente.'
        );
    }

    for (let indice = 0; indice < filasValidas.length; indice += 1) {
        const fila = filasValidas[indice];
        const resultadoFila = resultados[indice];

        if (resultadoFila === undefined) {
            fila.estado = 'invalida';
            fila.motivos = [
                {
                    mensaje:
                        'No se pudo confirmar la inserción de esta fila.',
                },
            ];

            continue;
        }

        if (esErrorInsercion(resultadoFila)) {
            marcarErrorInsercion(fila, resultadoFila);
            continue;
        }

        fila.estado = 'importada';
        fila.motivos = [];
    }
};

const analizarArchivo = async (
    archivo: ArchivoExcelImportacion,
    hoja?: string
) => {
    const leido = await leerArchivoExcel(archivo, hoja);
    const mapeo = mapearColumnas(leido.filas[0]);
    const filas = await analizarFilas(leido.filas, mapeo);

    return { leido, mapeo, filas };
};

class ImportacionPacientesService {
    async previsualizar(
        archivo: ArchivoExcelImportacion,
        hoja?: string
    ): Promise<ResultadoPrevisualizacion> {
        const { leido, mapeo, filas } = await analizarArchivo(
            archivo,
            hoja
        );

        return {
            resumen: construirResumenPrevisualizacion(filas),
            hojaProcesada: leido.hojaProcesada,
            hojasDisponibles: leido.hojasDisponibles,
            columnasIdentificadas: columnasIdentificadas(mapeo),
            columnasIgnoradas: mapeo.ignoradas,
            filas: filas.map(aFilaPublica),
        };
    }

    async confirmar(
        archivo: ArchivoExcelImportacion,
        hoja?: string
    ): Promise<ResultadoConfirmacion> {
        const { leido, mapeo, filas } = await analizarArchivo(
            archivo,
            hoja
        );

        const filasValidas = filas.filter(
            (fila) => fila.estado === 'valida' && !!fila.documento
        );

        if (filasValidas.length > 0) {
            await insertarFilasValidas(filasValidas);
        }

        return {
            resumen: construirResumenConfirmacion(
                filas,
                filasValidas.length
            ),
            hojaProcesada: leido.hojaProcesada,
            hojasDisponibles: leido.hojasDisponibles,
            columnasIdentificadas: columnasIdentificadas(mapeo),
            columnasIgnoradas: mapeo.ignoradas,
            filas: filas.map(aFilaPublica),
        };
    }
}

export default new ImportacionPacientesService();

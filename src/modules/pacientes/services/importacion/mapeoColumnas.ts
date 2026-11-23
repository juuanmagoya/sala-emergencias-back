import ErrorImportacion from './ErrorImportacion';
import {
    CAMPOS_OBLIGATORIOS,
    ETIQUETAS_CAMPO,
    MAXIMO_COLUMNAS,
    MAXIMO_LONGITUD_ENCABEZADO,
} from './constantes';
import { esCeldaVacia } from './tiposExcel';

import type {
    CampoImportacion,
    ColumnaIdentificada,
} from '../../types/importacionPacientes.types';
import type { FilaExcelImportacion } from './tiposExcel';

export interface ColumnaMapeada extends ColumnaIdentificada {
    indice: number;
}

export interface MapeoColumnas {
    columnas: ColumnaMapeada[];
    ignoradas: string[];
}

// Alias reconocidos. Se normalizan antes de comparar: mayúsculas,
// minúsculas, acentos, espacios y puntuación no afectan la coincidencia.
const ALIAS_COLUMNAS: Record<CampoImportacion, string[]> = {
    'nombre': [
        'nombre',
        'nombre completo',
        'paciente',
        'nombre del paciente',
        'nombre y apellido',
        'apellido y nombre',
    ],
    'dni': [
        'dni',
        'documento',
        'nro documento',
        'numero documento',
        'numero de documento',
        'doc',
    ],
    'telefono.codigoArea': [
        'codigo area',
        'codigo de area',
        'area',
        'cod area',
        'codigo telefonico',
    ],
    'telefono.numero': [
        'telefono',
        'numero telefono',
        'numero de telefono',
        'telefono numero',
        'tel',
        'celular',
        'numero celular',
        'telefono celular',
        'movil',
    ],
    'telefono.tipo': [
        'tipo telefono',
        'tipo de telefono',
        'tipo celular',
    ],
    'email': [
        'email',
        'correo',
        'correo electronico',
        'mail',
        'e mail',
    ],
    'obraSocial.nombre': [
        'obra social',
        'cobertura',
        'cobertura medica',
        'obra social nombre',
    ],
    'obraSocial.numeroAfiliado': [
        'numero afiliado',
        'nro afiliado',
        'numero de afiliado',
        'nro de afiliado',
        'afiliado',
    ],
    'direccion.calle': [
        'calle',
        'domicilio calle',
        'calle domicilio',
    ],
    'direccion.numero': [
        'numero calle',
        'numero de calle',
        'altura',
        'nro domicilio',
        'numero domicilio',
        'nro direccion',
        'numero direccion',
    ],
    'direccion.piso': [
        'piso',
        'piso domicilio',
    ],
    'direccion.departamento': [
        'departamento',
        'depto',
        'dpto',
        'departamento domicilio',
    ],
    'direccion.barrio': [
        'barrio',
        'barrio domicilio',
    ],
};

export const normalizarEncabezado = (valor: unknown): string =>
    String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

const ALIAS_POR_ENCABEZADO = new Map<string, CampoImportacion>();

for (const campo of Object.keys(ALIAS_COLUMNAS) as CampoImportacion[]) {
    for (const alias of ALIAS_COLUMNAS[campo]) {
        ALIAS_POR_ENCABEZADO.set(normalizarEncabezado(alias), campo);
    }
}

const crearErrorColumnas = (
    mensaje: string,
    detalles: Record<string, unknown>
) => new ErrorImportacion(400, mensaje, detalles);

export const mapearColumnas = (
    encabezados: FilaExcelImportacion
): MapeoColumnas => {
    if (encabezados.length > MAXIMO_COLUMNAS) {
        throw crearErrorColumnas(
            `El archivo supera el máximo de ${MAXIMO_COLUMNAS} columnas.`,
            {
                columnasDetectadas: encabezados.length,
                maximoColumnas: MAXIMO_COLUMNAS,
            }
        );
    }

    const encabezadosValidos: Array<{
        original: string;
        normalizado: string;
        indice: number;
    }> = [];

    for (let indice = 0; indice < encabezados.length; indice += 1) {
        const valor = encabezados[indice];

        if (esCeldaVacia(valor)) {
            continue;
        }

        const original = String(valor).trim();

        if (original.length > MAXIMO_LONGITUD_ENCABEZADO) {
            throw crearErrorColumnas(
                `El encabezado de la columna ${indice + 1} supera la longitud máxima permitida.`,
                {
                    columna: indice + 1,
                    maximoLongitud: MAXIMO_LONGITUD_ENCABEZADO,
                }
            );
        }

        const normalizado = normalizarEncabezado(original);

        if (!normalizado) {
            continue;
        }

        encabezadosValidos.push({
            original,
            normalizado,
            indice,
        });
    }

    const indicesPorEncabezado = new Map<string, number[]>();

    for (const encabezado of encabezadosValidos) {
        const indices = indicesPorEncabezado.get(encabezado.normalizado) ?? [];

        indices.push(encabezado.indice);
        indicesPorEncabezado.set(encabezado.normalizado, indices);
    }

    const duplicados = [...indicesPorEncabezado.entries()]
        .filter(([, indices]) => indices.length > 1)
        .map(([encabezado]) => encabezado);

    if (duplicados.length > 0) {
        throw crearErrorColumnas(
            'El archivo tiene encabezados duplicados. Cada columna debe tener un nombre distinto.',
            { encabezadosDuplicados: duplicados }
        );
    }

    const columnas = new Map<CampoImportacion, ColumnaMapeada>();

    for (const encabezado of encabezadosValidos) {
        const campo = ALIAS_POR_ENCABEZADO.get(encabezado.normalizado);

        if (!campo) {
            continue;
        }

        if (columnas.has(campo)) {
            const anterior = columnas.get(campo);

            throw crearErrorColumnas(
                `No se pudo identificar inequívocamente la columna para ${ETIQUETAS_CAMPO[campo]}.`,
                {
                    campo,
                    encabezados: [
                        anterior?.encabezado,
                        encabezado.original,
                    ].filter(Boolean),
                }
            );
        }

        columnas.set(campo, {
            campo,
            encabezado: encabezado.original,
            indice: encabezado.indice,
        });
    }

    // "Número" es el único alias genérico. Se resuelve según el contexto:
    // si hay código de área, pertenece al teléfono; si hay calle y no hay
    // área, pertenece al domicilio. Si ya existe una columna explícita para
    // el destino, el archivo es ambiguo y se rechaza.
    const encabezadoNumero = encabezadosValidos.find(
        (encabezado) => encabezado.normalizado === 'numero'
    );

    if (encabezadoNumero) {
        const destino: CampoImportacion =
            columnas.has('telefono.codigoArea') ||
            !columnas.has('direccion.calle')
                ? 'telefono.numero'
                : 'direccion.numero';

        if (columnas.has(destino)) {
            throw crearErrorColumnas(
                `La columna "Número" es ambigua porque ya existe una columna para ${ETIQUETAS_CAMPO[destino]}.`,
                {
                    encabezado: encabezadoNumero.original,
                    campo: destino,
                }
            );
        }

        columnas.set(destino, {
            campo: destino,
            encabezado: encabezadoNumero.original,
            indice: encabezadoNumero.indice,
        });
    }

    const columnasOrdenadas = [...columnas.values()].sort(
        (a, b) => a.indice - b.indice
    );

    const indicesMapeados = new Set(
        columnasOrdenadas.map((columna) => columna.indice)
    );

    const ignoradas = encabezadosValidos
        .filter((encabezado) => !indicesMapeados.has(encabezado.indice))
        .map((encabezado) => encabezado.original);

    const faltantes = CAMPOS_OBLIGATORIOS.filter(
        (campo) => !columnas.has(campo)
    );

    if (faltantes.length > 0) {
        const faltaArea = faltantes.includes('telefono.codigoArea');
        const tieneNumero = columnas.has('telefono.numero');

        const mensaje =
            faltaArea && tieneNumero
                ? 'El archivo debe tener columnas separadas para el código de área y el número de teléfono. No se separa automáticamente un teléfono completo.'
                : `Faltan columnas obligatorias: ${faltantes
                      .map((campo) => ETIQUETAS_CAMPO[campo])
                      .join(', ')}.`;

        throw crearErrorColumnas(mensaje, {
            faltantes: faltantes.map((campo) => ({
                campo,
                etiqueta: ETIQUETAS_CAMPO[campo],
            })),
            columnasDetectadas: encabezadosValidos.map(
                (encabezado) => encabezado.original
            ),
            columnasIgnoradas: ignoradas,
        });
    }

    return {
        columnas: columnasOrdenadas,
        ignoradas,
    };
};

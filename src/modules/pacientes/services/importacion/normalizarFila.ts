import { normalizarDni } from '../../../../utils/credencialesPaciente';

import {
    ETIQUETAS_CAMPO,
    MAXIMO_LONGITUD_CELDA,
    OBRAS_SOCIALES,
    TIPOS_TELEFONO,
} from './constantes';
import { esCeldaVacia } from './tiposExcel';

import type {
    CampoImportacion,
    DatosPacienteImportacion,
    MotivoImportacion,
} from '../../types/importacionPacientes.types';
import type { MapeoColumnas } from './mapeoColumnas';
import type {
    FilaExcelImportacion,
    ValorCeldaImportacion,
} from './tiposExcel';

export interface NormalizacionFila {
    datos: DatosPacienteImportacion;
    motivos: MotivoImportacion[];
    advertencias: MotivoImportacion[];
    dniVariantes: string[];
    email?: string;
}

const normalizarValorEnum = (valor: string): string =>
    valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[.,]/g, '')
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

const PATRON_DNI = /^[0-9\s.-]+$/;
const PATRON_TELEFONO = /^[0-9\s()-]+$/;

// Los puntos solo se aceptan como separadores de miles (12.345.678).
// Así se rechaza un valor decimal como 1234567.0 sin convertirlo
// silenciosamente en otro DNI.
const esDniConSeparadoresValido = (texto: string): boolean => {
    const sinEspaciosNiGuiones = texto.replace(/[\s-]/g, '');

    if (/^\d{7,8}$/.test(sinEspaciosNiGuiones)) {
        return true;
    }

    if (!sinEspaciosNiGuiones.includes('.')) {
        return false;
    }

    if (!/^\d{1,3}(\.\d{3})+$/.test(sinEspaciosNiGuiones)) {
        return false;
    }

    return /^\d{7,8}$/.test(sinEspaciosNiGuiones.replace(/\./g, ''));
};

export const esFilaVaciaImportacion = (
    fila: FilaExcelImportacion,
    mapeo: MapeoColumnas
): boolean =>
    mapeo.columnas.every((columna) =>
        esCeldaVacia(fila[columna.indice] as ValorCeldaImportacion)
    );

export const normalizarFila = (
    fila: FilaExcelImportacion,
    mapeo: MapeoColumnas
): NormalizacionFila => {
    const motivos: MotivoImportacion[] = [];
    const advertencias: MotivoImportacion[] = [];
    const datos: DatosPacienteImportacion = {};
    const columnas = new Map(
        mapeo.columnas.map((columna) => [columna.campo, columna])
    );
    const camposConLongitudInvalida = new Set<CampoImportacion>();

    const valor = (campo: CampoImportacion): ValorCeldaImportacion => {
        const columna = columnas.get(campo);

        if (!columna) {
            return undefined;
        }

        return fila[columna.indice];
    };

    const agregarMotivo = (campo: string, mensaje: string): void => {
        motivos.push({ campo, mensaje });
    };

    const agregarAdvertencia = (campo: string, mensaje: string): void => {
        advertencias.push({ campo, mensaje });
    };

    // Se valida la longitud antes de normalizar para no truncar datos
    // silenciosamente ni aceptar celdas desproporcionadas.
    for (const columna of mapeo.columnas) {
        const bruto = fila[columna.indice];

        if (
            typeof bruto === 'string' &&
            bruto.length > MAXIMO_LONGITUD_CELDA
        ) {
            camposConLongitudInvalida.add(columna.campo);

            agregarMotivo(
                columna.campo,
                `El valor de ${ETIQUETAS_CAMPO[columna.campo]} supera la longitud máxima permitida.`
            );
        }
    }

    const leerTexto = (
        campo: CampoImportacion,
        opciones: { permitirNumero?: boolean } = {}
    ): string | undefined => {
        const bruto = valor(campo);

        if (esCeldaVacia(bruto)) {
            return undefined;
        }

        if (camposConLongitudInvalida.has(campo)) {
            return undefined;
        }

        if (typeof bruto === 'string') {
            return bruto.trim().replace(/\s+/g, ' ');
        }

        if (
            opciones.permitirNumero &&
            typeof bruto === 'number' &&
            Number.isFinite(bruto)
        ) {
            return String(bruto);
        }

        agregarMotivo(
            campo,
            `El valor de ${ETIQUETAS_CAMPO[campo]} debe ser texto.`
        );

        return undefined;
    };

    // ========================================================
    // NOMBRE
    // ========================================================

    const nombreBruto = valor('nombre');
    const nombre = leerTexto('nombre');

    if (esCeldaVacia(nombreBruto)) {
        agregarMotivo('nombre', 'El nombre del paciente es obligatorio.');
    } else if (nombre) {
        datos.nombre = nombre;
    }

    // ========================================================
    // DNI
    // ========================================================

    let dniVariantes: string[] = [];
    const dniBruto = valor('dni');

    if (esCeldaVacia(dniBruto)) {
        agregarMotivo('dni', 'El DNI del paciente es obligatorio.');
    } else if (!camposConLongitudInvalida.has('dni')) {
        let dniTexto: string | undefined;

        if (typeof dniBruto === 'number') {
            if (!Number.isInteger(dniBruto) || dniBruto < 0) {
                agregarMotivo(
                    'dni',
                    'El DNI debe ser un número entero de 7 u 8 dígitos.'
                );
            } else {
                dniTexto = String(dniBruto);
            }
        } else if (typeof dniBruto === 'string') {
            const texto = dniBruto.trim();

            if (!PATRON_DNI.test(texto)) {
                agregarMotivo(
                    'dni',
                    'El DNI solo puede contener números y separadores (espacios, puntos o guiones).'
                );
            } else if (!esDniConSeparadoresValido(texto)) {
                agregarMotivo(
                    'dni',
                    'El DNI tiene un formato inválido. Los puntos solo se permiten como separadores de miles y no se aceptan decimales.'
                );
            } else {
                dniTexto = texto;
            }
        } else {
            agregarMotivo(
                'dni',
                'El DNI debe ser un número entero o texto con 7 u 8 dígitos.'
            );
        }

        if (dniTexto) {
            const variantes = normalizarDni(dniTexto);

            if (variantes.length === 0) {
                agregarMotivo(
                    'dni',
                    'El DNI debe tener 7 u 8 dígitos.'
                );
            } else {
                const dniLimpio = dniTexto.replace(/[\s.-]/g, '');

                datos.dni = dniLimpio;
                dniVariantes = variantes;
            }
        }
    }

    // ========================================================
    // TELÉFONO
    // ========================================================

    const leerParteTelefono = (
        campo: 'telefono.codigoArea' | 'telefono.numero',
        descripcion: string,
        minimo: number,
        maximo: number
    ): string | undefined => {
        const bruto = valor(campo);

        if (esCeldaVacia(bruto)) {
            agregarMotivo(campo, `El ${descripcion} es obligatorio.`);
            return undefined;
        }

        if (camposConLongitudInvalida.has(campo)) {
            return undefined;
        }

        let texto: string | undefined;

        if (typeof bruto === 'number') {
            if (!Number.isInteger(bruto) || bruto < 0) {
                agregarMotivo(
                    campo,
                    `El ${descripcion} debe ser un número entero.`
                );
            } else {
                texto = String(bruto);
            }
        } else if (typeof bruto === 'string') {
            const valorTexto = bruto.trim();

            if (!PATRON_TELEFONO.test(valorTexto)) {
                agregarMotivo(
                    campo,
                    `El ${descripcion} solo puede contener números y separadores (espacios, guiones o paréntesis).`
                );
            } else {
                texto = valorTexto;
            }
        } else {
            agregarMotivo(
                campo,
                `El ${descripcion} debe ser un número entero o texto.`
            );
        }

        if (!texto) {
            return undefined;
        }

        const digitos = texto.replace(/[\s()-]/g, '');

        if (digitos.length < minimo || digitos.length > maximo) {
            agregarMotivo(
                campo,
                `El ${descripcion} debe tener entre ${minimo} y ${maximo} dígitos.`
            );

            return undefined;
        }

        return digitos;
    };

    const codigoArea = leerParteTelefono(
        'telefono.codigoArea',
        'código de área',
        2,
        5
    );
    const numeroTelefono = leerParteTelefono(
        'telefono.numero',
        'número de teléfono',
        7,
        10
    );

    let tipoTelefono: (typeof TIPOS_TELEFONO)[number] | undefined;
    const tipoBruto = valor('telefono.tipo');

    if (!esCeldaVacia(tipoBruto)) {
        if (typeof tipoBruto === 'string' || typeof tipoBruto === 'number') {
            const tipoTexto = String(tipoBruto).trim();

            if (tipoTexto) {
                const tipoNormalizado = normalizarValorEnum(tipoTexto);
                const tipoReconocido = TIPOS_TELEFONO.find(
                    (tipo) => tipo === tipoNormalizado
                );

                if (tipoReconocido) {
                    tipoTelefono = tipoReconocido;
                } else {
                    agregarAdvertencia(
                        'telefono.tipo',
                        `El tipo de teléfono "${tipoTexto}" no es reconocido. Se usará CELULAR.`
                    );
                }
            }
        } else {
            agregarAdvertencia(
                'telefono.tipo',
                'El tipo de teléfono no es válido. Se usará CELULAR.'
            );
        }
    }

    if (codigoArea || numeroTelefono || tipoTelefono) {
        datos.telefono = {
            ...(codigoArea ? { codigoArea } : {}),
            ...(numeroTelefono ? { numero: numeroTelefono } : {}),
            ...(tipoTelefono ? { tipo: tipoTelefono } : {}),
        };
    }

    // ========================================================
    // EMAIL
    // ========================================================

    const emailNormalizado = leerTexto('email');

    if (emailNormalizado) {
        datos.email = emailNormalizado.toLowerCase();
    }

    // ========================================================
    // OBRA SOCIAL Y NÚMERO DE AFILIADO
    // ========================================================

    const obraSocialTexto = leerTexto('obraSocial.nombre');
    const numeroAfiliado = leerTexto('obraSocial.numeroAfiliado', {
        permitirNumero: true,
    });

    if (obraSocialTexto) {
        const obraSocialNormalizada = normalizarValorEnum(obraSocialTexto);
        const obraSocialReconocida = OBRAS_SOCIALES.find(
            (obraSocial) => obraSocial === obraSocialNormalizada
        );

        if (obraSocialReconocida) {
            datos.obraSocial = {
                nombre: obraSocialReconocida,
                ...(numeroAfiliado ? { numeroAfiliado } : {}),
            };
        } else {
            agregarMotivo(
                'obraSocial.nombre',
                `La obra social "${obraSocialTexto}" no es válida. Valores admitidos: ${OBRAS_SOCIALES.join(', ')}.`
            );

            datos.obraSocial = {
                nombre: obraSocialTexto,
            };

            if (numeroAfiliado) {
                agregarAdvertencia(
                    'obraSocial.numeroAfiliado',
                    'Se descartó el número de afiliado porque no se informó una obra social reconocida.'
                );
            }
        }
    } else if (numeroAfiliado) {
        agregarAdvertencia(
            'obraSocial.numeroAfiliado',
            'Se descartó el número de afiliado porque no se informó una obra social reconocida.'
        );
    }

    // ========================================================
    // DOMICILIO
    // ========================================================

    const calle = leerTexto('direccion.calle', { permitirNumero: true });
    const numeroDomicilio = leerTexto('direccion.numero', {
        permitirNumero: true,
    });
    const piso = leerTexto('direccion.piso', { permitirNumero: true });
    const departamento = leerTexto('direccion.departamento', {
        permitirNumero: true,
    });
    const barrio = leerTexto('direccion.barrio', { permitirNumero: true });

    const hayDatosDomicilio = [
        calle,
        numeroDomicilio,
        piso,
        departamento,
        barrio,
    ].some(Boolean);

    if (hayDatosDomicilio) {
        if (calle && numeroDomicilio) {
            datos.direccion = {
                calle,
                numero: numeroDomicilio,
                ...(piso ? { piso } : {}),
                ...(departamento ? { departamento } : {}),
                ...(barrio ? { barrio } : {}),
            };
        } else {
            agregarAdvertencia(
                'direccion',
                'Se descartó el domicilio porque está incompleto. Se requieren calle y número.'
            );
        }
    }

    return {
        datos,
        motivos,
        advertencias,
        dniVariantes,
        ...(datos.email ? { email: datos.email } : {}),
    };
};

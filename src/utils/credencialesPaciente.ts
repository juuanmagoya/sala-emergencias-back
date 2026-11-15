import type { ITelefono } from '../modules/pacientes/interfaces/paciente.interfaces.js';

const soloDigitos = (valor: string): string => valor.replace(/\D/g, '');

const PATRON_DNI = /^\d{7,8}$/;

// El modelo Paciente acepta DNI de 7 u 8 dígitos. Se toleran ambas formas
// para no depender de ceros a la izquierda en datos heredados.
export const normalizarDni = (dni: unknown): string[] => {
    if (typeof dni !== 'string') {
        return [];
    }

    const limpio = soloDigitos(dni);

    if (!PATRON_DNI.test(limpio)) {
        return [];
    }

    const variantes = new Set<string>([limpio]);

    if (limpio.length === 7) {
        variantes.add(limpio.padStart(8, '0'));
    }

    if (limpio.length === 8 && limpio.startsWith('0')) {
        variantes.add(limpio.slice(1));
    }

    return [...variantes];
};

// Genera representaciones equivalentes del teléfono ingresado. No se
// modifican los datos almacenados: la comparación se hace en memoria.
export const normalizarTelefono = (telefono: unknown): string[] => {
    if (typeof telefono !== 'string') {
        return [];
    }

    const base = soloDigitos(telefono);

    if (base.length < 6 || base.length > 15) {
        return [];
    }

    const variantes = new Set<string>();

    const agregarVariantes = (valor: string): void => {
        if (!valor || variantes.has(valor)) {
            return;
        }

        variantes.add(valor);

        // Prefijo internacional de Argentina: 54. El 9 que sigue es el
        // indicador de móvil y no forma parte del área ni del número.
        if (valor.startsWith('54') && valor.length > 10) {
            const sinPais = valor.slice(2);

            agregarVariantes(sinPais);

            if (sinPais.startsWith('9')) {
                agregarVariantes(sinPais.slice(1));
            }
        }

        // Prefijo local 0 del código de área (011, 03777, etc.).
        if (valor.startsWith('0')) {
            agregarVariantes(valor.slice(1));
        }
    };

    agregarVariantes(base);

    return [...variantes];
};

// Compara área + número completos. No se compara solo el número para no
// debilitar la credencial. Acepta `unknown` para tolerar documentos legacy
// con un teléfono que no tenga la forma del subdocumento actual.
export const coincideTelefono = (
    variantesEntrada: readonly string[],
    telefonoPaciente: unknown
): boolean => {
    if (
        typeof telefonoPaciente !== 'object' ||
        telefonoPaciente === null
    ) {
        return false;
    }

    const { codigoArea, numero } = telefonoPaciente as Partial<ITelefono>;

    if (typeof codigoArea !== 'string' || typeof numero !== 'string') {
        return false;
    }

    const area = soloDigitos(codigoArea).replace(/^0/, '');
    const num = soloDigitos(numero);

    if (!area || !num) {
        return false;
    }

    const candidatos = new Set<string>([
        area + num,
        area + '15' + num,
        '0' + area + num,
        '0' + area + '15' + num,
    ]);

    return variantesEntrada.some((variante) => candidatos.has(variante));
};

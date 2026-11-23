import PacienteModel from '../../models/Paciente';

import { normalizarDni } from '../../../../utils/credencialesPaciente';

import { esFilaVaciaImportacion, normalizarFila } from './normalizarFila';

import type {
    DatosPacienteImportacion,
    EstadoFilaImportacion,
    MotivoImportacion,
} from '../../types/importacionPacientes.types';
import type { MapeoColumnas } from './mapeoColumnas';
import type { FilaExcelImportacion } from './tiposExcel';

export interface FilaAnalizada {
    numeroFila: number;
    estado: EstadoFilaImportacion;
    datos: DatosPacienteImportacion;
    motivos: MotivoImportacion[];
    advertencias: MotivoImportacion[];
    dniVariantes: string[];
    email?: string;
    documento?: Record<string, unknown>;
}

export interface ConsultasImportacion {
    buscarDnisExistentes: (variantes: string[]) => Promise<Set<string>>;
    buscarEmailsExistentes: (emails: string[]) => Promise<Set<string>>;
}

const limpiarDocumento = (
    documento: Record<string, unknown>
): Record<string, unknown> => {
    const limpio = { ...documento };

    delete limpio._id;
    delete limpio.__v;
    delete limpio.createdAt;
    delete limpio.updatedAt;

    return limpio;
};

const consultasMongo: ConsultasImportacion = {
    async buscarDnisExistentes(variantes) {
        if (variantes.length === 0) {
            return new Set();
        }

        const documentos = (await PacienteModel.find({
            dni: { $in: variantes },
        })
            .select('dni')
            .lean()) as Array<{ dni?: string }>;

        const encontrados = new Set<string>();

        for (const documento of documentos) {
            if (typeof documento.dni === 'string') {
                for (const variante of normalizarDni(documento.dni)) {
                    encontrados.add(variante);
                }
            }
        }

        return encontrados;
    },

    async buscarEmailsExistentes(emails) {
        if (emails.length === 0) {
            return new Set();
        }

        const documentos = (await PacienteModel.find({
            email: { $in: emails },
        })
            .select('email')
            .lean()) as Array<{ email?: string }>;

        const encontrados = new Set<string>();

        for (const documento of documentos) {
            if (typeof documento.email === 'string') {
                encontrados.add(documento.email.trim().toLowerCase());
            }
        }

        return encontrados;
    },
};

const agregarErroresValidacion = (
    error: unknown,
    fila: FilaAnalizada
): void => {
    const errores = (
        error as {
            errors?: Record<string, { message?: string }>;
        }
    ).errors;

    if (!errores) {
        if (fila.motivos.length === 0) {
            fila.motivos.push({
                mensaje:
                    'La fila no cumple las validaciones del paciente.',
            });
        }

        return;
    }

    for (const [campo, detalle] of Object.entries(errores)) {
        // Si la normalización previa ya informó el mismo campo (o uno de
        // sus subcampos), se evita duplicar el mensaje de Mongoose.
        const yaInformado = fila.motivos.some((motivo) => {
            if (!motivo.campo) {
                return false;
            }

            return (
                motivo.campo === campo ||
                motivo.campo.startsWith(`${campo}.`) ||
                campo.startsWith(`${motivo.campo}.`)
            );
        });

        if (yaInformado) {
            continue;
        }

        fila.motivos.push({
            campo,
            mensaje:
                typeof detalle?.message === 'string'
                    ? detalle.message
                    : 'El valor no es válido.',
        });
    }

    if (fila.motivos.length === 0) {
        fila.motivos.push({
            mensaje: 'La fila no cumple las validaciones del paciente.',
        });
    }
};

const validarDocumento = async (fila: FilaAnalizada): Promise<void> => {
    try {
        const documento = new PacienteModel(fila.datos);

        await documento.validate();

        // Si la normalización ya detectó un motivo, la fila sigue siendo
        // inválida aunque el esquema no agregue errores nuevos.
        if (fila.motivos.length > 0) {
            return;
        }

        fila.documento = limpiarDocumento(
            documento.toObject() as unknown as Record<string, unknown>
        );
        // Para las filas que pasan el esquema se muestran los defaults
        // aplicados por Mongoose (por ejemplo, obraSocial NINGUNA).
        fila.datos =
            fila.documento as unknown as DatosPacienteImportacion;
        fila.estado = 'valida';
    } catch (error: unknown) {
        fila.estado = 'invalida';
        agregarErroresValidacion(error, fila);
    }
};

export const analizarFilas = async (
    filas: FilaExcelImportacion[],
    mapeo: MapeoColumnas,
    consultas: ConsultasImportacion = consultasMongo
): Promise<FilaAnalizada[]> => {
    const analizadas: FilaAnalizada[] = [];

    // ========================================================
    // VALIDACIÓN INDIVIDUAL
    // ========================================================

    for (let indice = 1; indice < filas.length; indice += 1) {
        const numeroFila = indice + 1;
        const filaExcel = filas[indice];

        if (esFilaVaciaImportacion(filaExcel, mapeo)) {
            analizadas.push({
                numeroFila,
                estado: 'vacia',
                datos: {},
                motivos: [],
                advertencias: [],
                dniVariantes: [],
            });

            continue;
        }

        const normalizacion = normalizarFila(filaExcel, mapeo);

        const fila: FilaAnalizada = {
            numeroFila,
            estado:
                normalizacion.motivos.length > 0
                    ? 'invalida'
                    : 'valida',
            datos: normalizacion.datos,
            motivos: normalizacion.motivos,
            advertencias: normalizacion.advertencias,
            dniVariantes: normalizacion.dniVariantes,
            ...(normalizacion.email
                ? { email: normalizacion.email }
                : {}),
        };

        // El modelo se aplica a toda fila con datos, incluso si la
        // normalización ya encontró un error, para que siga siendo la
        // fuente de verdad de las validaciones del paciente.
        await validarDocumento(fila);

        analizadas.push(fila);
    }

    // ========================================================
    // DNI DUPLICADO DENTRO DEL ARCHIVO
    // ========================================================

    const dnisReservados = new Set<string>();

    for (const fila of analizadas) {
        if (fila.estado !== 'valida') {
            continue;
        }

        const dniRepetido = fila.dniVariantes.some((variante) =>
            dnisReservados.has(variante)
        );

        if (dniRepetido) {
            fila.estado = 'duplicada_en_archivo';
            fila.motivos.push({
                campo: 'dni',
                mensaje:
                    'El DNI está repetido en el archivo. Se conserva la primera fila válida.',
            });

            continue;
        }

        for (const variante of fila.dniVariantes) {
            dnisReservados.add(variante);
        }
    }

    // ========================================================
    // DNI EXISTENTE EN MONGODB
    // ========================================================

    const candidatasDni = analizadas.filter(
        (fila) => fila.estado === 'valida'
    );
    const variantesDni = [
        ...new Set(candidatasDni.flatMap((fila) => fila.dniVariantes)),
    ];

    if (variantesDni.length > 0) {
        const dnisExistentes =
            await consultas.buscarDnisExistentes(variantesDni);

        for (const fila of candidatasDni) {
            const existe = fila.dniVariantes.some((variante) =>
                dnisExistentes.has(variante)
            );

            if (existe) {
                fila.estado = 'existente';
                fila.motivos.push({
                    campo: 'dni',
                    mensaje: 'Ya existe un paciente con ese DNI.',
                });
            }
        }
    }

    // ========================================================
    // EMAIL DUPLICADO O EXISTENTE
    // ========================================================

    const candidatasEmail = analizadas.filter(
        (fila) => fila.estado === 'valida' && !!fila.email
    );
    const emails = [
        ...new Set(
            candidatasEmail.map((fila) => fila.email as string)
        ),
    ];

    if (emails.length > 0) {
        const emailsExistentes =
            await consultas.buscarEmailsExistentes(emails);
        const emailsReservados = new Set<string>();

        for (const fila of candidatasEmail) {
            const email = fila.email as string;

            if (emailsExistentes.has(email)) {
                fila.estado = 'conflicto_email';
                fila.motivos.push({
                    campo: 'email',
                    mensaje: 'Ya existe un paciente con ese email.',
                });

                continue;
            }

            if (emailsReservados.has(email)) {
                fila.estado = 'conflicto_email';
                fila.motivos.push({
                    campo: 'email',
                    mensaje:
                        'El email está repetido en el archivo. Se conserva la primera fila válida.',
                });

                continue;
            }

            emailsReservados.add(email);
        }
    }

    return analizadas;
};

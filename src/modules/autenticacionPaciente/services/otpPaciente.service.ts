import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { enviarEmailTransaccional } from '../../../services/emailTransaccional.service';

import PacienteModel from '../../pacientes/models/Paciente';
import CodigoOtpPacienteModel from '../models/CodigoOtpPaciente';
import { generarCodigoOtp } from '../utils/generarCodigoOtp';
import {
    ErrorOtpPaciente,
    MOTIVOS_ERROR_OTP,
} from '../utils/erroresOtp';

// ============================================================
// REGLAS DE NEGOCIO
// ============================================================

export const DURACION_CODIGO_OTP_MINUTOS = 5;
export const DURACION_CODIGO_OTP_MS =
    DURACION_CODIGO_OTP_MINUTOS * 60 * 1000;
export const INTENTOS_VERIFICACION_OTP = 5;
export const INTERVALO_REENVIO_OTP_MS = 60 * 1000;

const COSTO_HASH_OTP = 10;
const PATRON_CODIGO_OTP = /^\d{6}$/;
const ASUNTO_OTP = 'Código de acceso';

// ============================================================
// TIPOS DE RESULTADO
// ============================================================

export interface ResultadoSolicitudOtp {
    expiraEn: Date;
    proximoEnvioPermitido: Date;
}

interface ErrorDuplicado {
    code?: unknown;
}

const esErrorDuplicado = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    (error as ErrorDuplicado).code === 11000;

const contenidoCodigoOtp = (codigo: string): string =>
    `Tu código de acceso es ${codigo}. ` +
    `Vence en ${DURACION_CODIGO_OTP_MINUTOS} minutos. ` +
    'Si no lo solicitaste, ignorá este mensaje.';

const obtenerEmailPaciente = async (
    pacienteId: string
): Promise<string> => {
    if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
        throw new ErrorOtpPaciente(
            MOTIVOS_ERROR_OTP.PACIENTE_INEXISTENTE
        );
    }

    const paciente = await PacienteModel.findById(
        pacienteId
    ).select('email');

    if (!paciente) {
        throw new ErrorOtpPaciente(
            MOTIVOS_ERROR_OTP.PACIENTE_INEXISTENTE
        );
    }

    const email =
        typeof paciente.email === 'string'
            ? paciente.email.trim()
            : '';

    if (!email) {
        throw new ErrorOtpPaciente(
            MOTIVOS_ERROR_OTP.PACIENTE_SIN_EMAIL
        );
    }

    // El destinatario sale exclusivamente del documento Paciente. El
    // llamador nunca puede elegir un email de destino.
    return email;
};

// Se ejecuta solo cuando la actualización atómica no encontró un registro
// válido. Vuelve a leer para distinguir expiración, bloqueo, reemplazo o
// consumo concurrente sin confiar en una lectura previa desactualizada.
const clasificarFalloVerificacion = async (
    pacienteId: string,
    ahora: Date
): Promise<never> => {
    const actual = await CodigoOtpPacienteModel.findOne({
        paciente: pacienteId,
    }).select('+codigoHash expiraEn intentosRestantes');

    if (!actual) {
        throw new ErrorOtpPaciente(
            MOTIVOS_ERROR_OTP.CODIGO_INEXISTENTE
        );
    }

    if (actual.expiraEn.getTime() <= ahora.getTime()) {
        await CodigoOtpPacienteModel.deleteOne({
            _id: actual._id,
            codigoHash: actual.codigoHash,
        });

        throw new ErrorOtpPaciente(
            MOTIVOS_ERROR_OTP.CODIGO_EXPIRADO
        );
    }

    if (actual.intentosRestantes <= 0) {
        await CodigoOtpPacienteModel.deleteOne({
            _id: actual._id,
            codigoHash: actual.codigoHash,
        });

        throw new ErrorOtpPaciente(
            MOTIVOS_ERROR_OTP.CODIGO_BLOQUEADO
        );
    }

    // El registro cambió entre la lectura y la actualización atómica:
    // otro proceso generó o consumió un código.
    throw new ErrorOtpPaciente(
        MOTIVOS_ERROR_OTP.CODIGO_INEXISTENTE
    );
};

class OtpPacienteService {
    // ========================================================
    // SOLICITAR CÓDIGO
    // ========================================================

    async solicitarCodigo(
        pacienteId: string
    ): Promise<ResultadoSolicitudOtp> {
        const email = await obtenerEmailPaciente(pacienteId);

        const ahora = new Date();

        // Verificación temprana para no generar ni hashear un código cuando
        // el cooldown ya está activo. La garantía ante concurrencia sigue
        // siendo la condición atómica del upsert.
        const registroActual =
            await CodigoOtpPacienteModel.findOne({
                paciente: pacienteId,
            }).select('proximoEnvioPermitido');

        if (
            registroActual?.proximoEnvioPermitido &&
            registroActual.proximoEnvioPermitido.getTime() >
                ahora.getTime()
        ) {
            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.REENVIO_DEMASIADO_RAPIDO
            );
        }

        const expiraEn = new Date(
            ahora.getTime() + DURACION_CODIGO_OTP_MS
        );
        const proximoEnvioPermitido = new Date(
            ahora.getTime() + INTERVALO_REENVIO_OTP_MS
        );

        const codigo = generarCodigoOtp();
        const codigoHash = await bcrypt.hash(
            codigo,
            COSTO_HASH_OTP
        );

        let registro;

        try {
            // Operación atómica de creación o reemplazo. El filtro solo
            // permite actualizar si el cooldown ya venció. Si otro proceso
            // ganó la carrera, el upsert choca con el índice único de
            // `paciente` y se traduce como reenvío demasiado rápido.
            registro =
                await CodigoOtpPacienteModel.findOneAndUpdate(
                    {
                        paciente: pacienteId,
                        $or: [
                            {
                                proximoEnvioPermitido: {
                                    $lte: ahora,
                                },
                            },
                            {
                                proximoEnvioPermitido: {
                                    $exists: false,
                                },
                            },
                        ],
                    },
                    {
                        $set: {
                            codigoHash,
                            expiraEn,
                            intentosRestantes:
                                INTENTOS_VERIFICACION_OTP,
                            proximoEnvioPermitido,
                        },
                    },
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                    }
                );
        } catch (error: unknown) {
            if (esErrorDuplicado(error)) {
                throw new ErrorOtpPaciente(
                    MOTIVOS_ERROR_OTP.REENVIO_DEMASIADO_RAPIDO
                );
            }

            throw error;
        }

        if (!registro) {
            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.ERROR_INTERNO
            );
        }

        try {
            // El envío es bloqueante: el código solo se considera emitido
            // cuando Brevo respondió correctamente.
            await enviarEmailTransaccional({
                destinatario: email,
                asunto: ASUNTO_OTP,
                contenidoTexto: contenidoCodigoOtp(codigo),
            });
        } catch {
            // Se invalida únicamente el registro que acabamos de generar.
            // El filtro por hash evita borrar un código más reciente que
            // haya sido creado por una solicitud concurrente.
            try {
                await CodigoOtpPacienteModel.deleteOne({
                    paciente: pacienteId,
                    codigoHash,
                });
            } catch {
                console.error(
                    '🔴 OTP: no se pudo invalidar el registro tras un fallo de envío'
                );
            }

            console.error(
                '🔴 OTP: falló el envío del código y se invalidó el registro generado'
            );

            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.ERROR_ENVIO
            );
        }

        return {
            expiraEn,
            proximoEnvioPermitido,
        };
    }

    // ========================================================
    // VERIFICAR CÓDIGO
    // ========================================================

    async verificarCodigo(
        pacienteId: string,
        codigo: string
    ): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.CODIGO_INEXISTENTE
            );
        }

        if (
            typeof codigo !== 'string' ||
            !PATRON_CODIGO_OTP.test(codigo)
        ) {
            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.CODIGO_INVALIDO
            );
        }

        const ahora = new Date();

        const registro = await CodigoOtpPacienteModel.findOne({
            paciente: pacienteId,
        }).select('+codigoHash expiraEn intentosRestantes');

        if (!registro) {
            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.CODIGO_INEXISTENTE
            );
        }

        const codigoHash = registro.codigoHash;

        // La expiración se valida siempre en el servicio. No se depende
        // del índice TTL, que puede demorar en eliminar el documento.
        if (registro.expiraEn.getTime() <= ahora.getTime()) {
            await CodigoOtpPacienteModel.deleteOne({
                _id: registro._id,
                codigoHash,
            });

            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.CODIGO_EXPIRADO
            );
        }

        if (registro.intentosRestantes <= 0) {
            await CodigoOtpPacienteModel.deleteOne({
                _id: registro._id,
                codigoHash,
            });

            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.CODIGO_BLOQUEADO
            );
        }

        // Descuento atómico de un intento. El filtro incluye el hash leído,
        // la expiración y los intentos disponibles. Si otro proceso generó
        // un código nuevo, consumió este o agotó los intentos, la operación
        // no modifica nada y se clasifica el error.
        const actualizado =
            await CodigoOtpPacienteModel.findOneAndUpdate(
                {
                    _id: registro._id,
                    paciente: pacienteId,
                    codigoHash,
                    expiraEn: { $gt: ahora },
                    intentosRestantes: { $gt: 0 },
                },
                {
                    $inc: { intentosRestantes: -1 },
                },
                {
                    new: true,
                }
            );

        if (!actualizado) {
            await clasificarFalloVerificacion(
                pacienteId,
                ahora
            );

            return;
        }

        const coincide = await bcrypt.compare(
            codigo,
            codigoHash
        );

        if (!coincide) {
            if (actualizado.intentosRestantes <= 0) {
                await CodigoOtpPacienteModel.deleteOne({
                    _id: actualizado._id,
                    codigoHash,
                });

                throw new ErrorOtpPaciente(
                    MOTIVOS_ERROR_OTP.CODIGO_BLOQUEADO
                );
            }

            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.CODIGO_INCORRECTO
            );
        }

        // Consumo atómico y de un solo uso. Solo una verificación
        // concurrente puede borrar el registro con este hash. La
        // expiración vuelve a evaluarse en el filtro para no aceptar un
        // código que venció mientras se comparaba el hash.
        const consumido =
            await CodigoOtpPacienteModel.findOneAndDelete({
                _id: actualizado._id,
                paciente: pacienteId,
                codigoHash,
                expiraEn: { $gt: new Date() },
            });

        if (!consumido) {
            // El código era correcto, pero otro proceso lo consumió o lo
            // reemplazó antes de este borrado atómico.
            throw new ErrorOtpPaciente(
                MOTIVOS_ERROR_OTP.CODIGO_UTILIZADO
            );
        }
    }
}

export default new OtpPacienteService();

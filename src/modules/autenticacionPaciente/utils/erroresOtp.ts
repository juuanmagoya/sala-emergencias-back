export const MOTIVOS_ERROR_OTP = {
    PACIENTE_INEXISTENTE: 'PACIENTE_INEXISTENTE',
    PACIENTE_SIN_EMAIL: 'PACIENTE_SIN_EMAIL',
    REENVIO_DEMASIADO_RAPIDO: 'REENVIO_DEMASIADO_RAPIDO',
    CODIGO_INEXISTENTE: 'CODIGO_INEXISTENTE',
    CODIGO_EXPIRADO: 'CODIGO_EXPIRADO',
    CODIGO_INCORRECTO: 'CODIGO_INCORRECTO',
    CODIGO_BLOQUEADO: 'CODIGO_BLOQUEADO',
    CODIGO_UTILIZADO: 'CODIGO_UTILIZADO',
    CODIGO_INVALIDO: 'CODIGO_INVALIDO',
    ERROR_ENVIO: 'ERROR_ENVIO',
    ERROR_INTERNO: 'ERROR_INTERNO',
} as const;

export type MotivoErrorOtp =
    (typeof MOTIVOS_ERROR_OTP)[keyof typeof MOTIVOS_ERROR_OTP];

interface DefinicionErrorOtp {
    mensaje: string;
    statusCode: number;
}

const DEFINICIONES: Record<MotivoErrorOtp, DefinicionErrorOtp> = {
    PACIENTE_INEXISTENTE: {
        mensaje: 'El paciente no existe',
        statusCode: 404,
    },
    PACIENTE_SIN_EMAIL: {
        mensaje: 'El paciente no tiene un email registrado',
        statusCode: 400,
    },
    REENVIO_DEMASIADO_RAPIDO: {
        mensaje:
            'Esperá al menos 60 segundos antes de solicitar otro código',
        statusCode: 429,
    },
    CODIGO_INEXISTENTE: {
        mensaje: 'El código no existe o ya no es válido',
        statusCode: 401,
    },
    CODIGO_EXPIRADO: {
        mensaje: 'El código expiró',
        statusCode: 401,
    },
    CODIGO_INCORRECTO: {
        mensaje: 'El código es incorrecto',
        statusCode: 401,
    },
    CODIGO_BLOQUEADO: {
        mensaje: 'Se agotaron los intentos para este código',
        statusCode: 429,
    },
    CODIGO_UTILIZADO: {
        mensaje: 'El código ya fue utilizado',
        statusCode: 401,
    },
    CODIGO_INVALIDO: {
        mensaje: 'El código debe tener exactamente 6 dígitos',
        statusCode: 400,
    },
    ERROR_ENVIO: {
        mensaje: 'No se pudo enviar el código de verificación',
        statusCode: 502,
    },
    ERROR_INTERNO: {
        mensaje: 'No se pudo generar el código de verificación',
        statusCode: 500,
    },
};

// Error de negocio del flujo OTP. `motivo` permite distinguir internamente
// cada situación sin acoplar el servicio a una respuesta HTTP concreta.
// El mensaje nunca incluye el código, el hash, el email ni detalles de Brevo.
export class ErrorOtpPaciente extends Error {
    public readonly statusCode: number;

    constructor(public readonly motivo: MotivoErrorOtp) {
        const definicion = DEFINICIONES[motivo];

        super(definicion.mensaje);
        this.name = 'ErrorOtpPaciente';
        this.statusCode = definicion.statusCode;
    }
}

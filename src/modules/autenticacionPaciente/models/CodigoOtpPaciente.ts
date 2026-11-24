import { Document, Model, Schema, model } from 'mongoose';

import type { ICodigoOtpPacienteDocument } from '../interfaces/CodigoOtpPaciente.interface';

// ============================================================
// MODELO - CÓDIGO OTP DE PACIENTE
//
// Un único registro por paciente. El código se guarda exclusivamente
// como hash y nunca se selecciona por defecto en las consultas.
// ============================================================

const codigoOtpPacienteSchema =
    new Schema<ICodigoOtpPacienteDocument>(
        {
            paciente: {
                type: Schema.Types.ObjectId,
                ref: 'Paciente',
                required: [
                    true,
                    'El paciente del código OTP es obligatorio',
                ],
            },

            codigoHash: {
                type: String,
                required: [
                    true,
                    'El hash del código OTP es obligatorio',
                ],
                select: false,
            },

            expiraEn: {
                type: Date,
                required: [
                    true,
                    'La fecha de expiración es obligatoria',
                ],
            },

            intentosRestantes: {
                type: Number,
                required: [
                    true,
                    'La cantidad de intentos restantes es obligatoria',
                ],
                min: [0, 'Los intentos restantes no pueden ser negativos'],
            },

            proximoEnvioPermitido: {
                type: Date,
                required: [
                    true,
                    'La fecha del próximo envío permitido es obligatoria',
                ],
            },
        },
        {
            timestamps: true,
        }
    );

// Un solo registro OTP por paciente. Un nuevo código reemplaza al anterior.
codigoOtpPacienteSchema.index(
    { paciente: 1 },
    {
        name: 'codigos_otp_paciente_unico',
        unique: true,
    }
);

// MongoDB elimina físicamente el documento después de `expiraEn`. El
// servicio nunca depende de este índice para validar la expiración.
codigoOtpPacienteSchema.index(
    { expiraEn: 1 },
    {
        name: 'codigos_otp_paciente_ttl',
        expireAfterSeconds: 0,
    }
);

// Defensa adicional: el hash no debe aparecer en una representación JSON
// aunque alguna consulta lo haya seleccionado explícitamente.
codigoOtpPacienteSchema.set('toJSON', {
    transform: (
        _documento: Document,
        codigoRetorno: Record<string, any>
    ) => {
        codigoRetorno.id = codigoRetorno._id;

        delete codigoRetorno._id;
        delete codigoRetorno.__v;
        delete codigoRetorno.codigoHash;
    },
});

const CodigoOtpPacienteModel: Model<ICodigoOtpPacienteDocument> =
    model<ICodigoOtpPacienteDocument>(
        'CodigoOtpPaciente',
        codigoOtpPacienteSchema
    );

export default CodigoOtpPacienteModel;

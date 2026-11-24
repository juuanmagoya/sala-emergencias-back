import type { Document, Types } from 'mongoose';

export interface ICodigoOtpPaciente {
    paciente: Types.ObjectId;
    codigoHash: string;
    expiraEn: Date;
    intentosRestantes: number;
    proximoEnvioPermitido: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICodigoOtpPacienteDocument
    extends ICodigoOtpPaciente,
        Document<Types.ObjectId> {
    _id: Types.ObjectId;
}

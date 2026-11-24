import type { Request, Response } from 'express';

import otpPacienteService from '../modules/autenticacionPaciente/services/otpPaciente.service.js';
import {
    ErrorOtpPaciente,
    MOTIVOS_ERROR_OTP,
} from '../modules/autenticacionPaciente/utils/erroresOtp.js';
import {
    iniciarSesionPaciente,
    loginUsuario,
    validarCredencialesPaciente,
} from '../services/auth.service.js';
import ErrorConfiguracion from '../utils/ErrorConfiguracion.js';
import respuestaEstandar from '../utils/respuestaEstandar.js';

interface LoginRequest extends Request {
    body: {
        email?: string;
        password?: string;
    };
}

interface LoginPacienteRequest extends Request {
    body: {
        dni?: string;
        telefono?: string;
    };
}

interface VerificarPacienteRequest extends Request {
    body: {
        dni?: string;
        telefono?: string;
        codigo?: string;
    };
}

const MENSAJE_PACIENTE_SIN_EMAIL =
    'No tenés un correo electrónico registrado. Comunicate con recepción para actualizar tus datos.';

export const login = async (
    req: LoginRequest,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return respuestaEstandar(
                res,
                400,
                false,
                'Email y password son obligatorios'
            );
        }

        const resultado = await loginUsuario({
            email,
            password,
        });

        return respuestaEstandar(
            res,
            200,
            true,
            'Login exitoso',
            resultado
        );
    } catch (error: unknown) {
        // Un secreto faltante o inválido es un problema de configuración del
        // servidor: se responde 500 sin exponer detalles internos.
        if (error instanceof ErrorConfiguracion) {
            console.error(
                '🔴 Error de configuración al iniciar sesión:',
                error.message
            );

            return respuestaEstandar(
                res,
                500,
                false,
                'Error interno del servidor'
            );
        }

        const mensaje =
            error instanceof Error
                ? error.message
                : 'Error al iniciar sesión';

        return respuestaEstandar(
            res,
            401,
            false,
            mensaje
        );
    }
};

const responderErrorPaciente = (
    res: Response,
    error: unknown
) => {
    if (error instanceof ErrorConfiguracion) {
        console.error(
            '🔴 Error de configuración en autenticación de paciente'
        );

        return respuestaEstandar(
            res,
            500,
            false,
            'Error interno del servidor'
        );
    }

    if (error instanceof ErrorOtpPaciente) {
        const mensaje =
            error.motivo === MOTIVOS_ERROR_OTP.PACIENTE_SIN_EMAIL
                ? MENSAJE_PACIENTE_SIN_EMAIL
                : error.message;

        return respuestaEstandar(
            res,
            error.statusCode,
            false,
            mensaje
        );
    }

    const errorConEstado = error as {
        statusCode?: number;
        message?: string;
    };

    if (typeof errorConEstado.statusCode === 'number') {
        return respuestaEstandar(
            res,
            errorConEstado.statusCode,
            false,
            errorConEstado.message ??
                'Error en la autenticación de paciente'
        );
    }

    // No se registra el error completo: podría contener datos de entrada.
    console.error(
        '🔴 Error en la autenticación de paciente'
    );

    return respuestaEstandar(
        res,
        500,
        false,
        'Error interno del servidor'
    );
};

export const loginPaciente = async (
    req: LoginPacienteRequest,
    res: Response
) => {
    try {
        const { dni, telefono } = req.body;

        if (!dni || !telefono) {
            return respuestaEstandar(
                res,
                400,
                false,
                'DNI y teléfono son obligatorios'
            );
        }

        // La identidad sale exclusivamente de los datos validados contra
        // Paciente. El cliente no puede elegir el destinatario del código.
        const paciente = await validarCredencialesPaciente({
            dni,
            telefono,
        });

        const resultado = await otpPacienteService.solicitarCodigo(
            paciente.id
        );

        return respuestaEstandar(
            res,
            202,
            true,
            'Te enviamos un código de verificación al correo registrado',
            {
                expiraEn: resultado.expiraEn,
                proximoEnvioPermitido:
                    resultado.proximoEnvioPermitido,
            }
        );
    } catch (error: unknown) {
        return responderErrorPaciente(res, error);
    }
};

export const verificarCodigoPaciente = async (
    req: VerificarPacienteRequest,
    res: Response
) => {
    try {
        const { dni, telefono, codigo } = req.body;

        if (!dni || !telefono || !codigo) {
            return respuestaEstandar(
                res,
                400,
                false,
                'DNI, teléfono y código son obligatorios'
            );
        }

        // Se vuelven a validar las credenciales: el body no puede definir
        // el paciente cuyo OTP se verifica.
        const paciente = await validarCredencialesPaciente({
            dni,
            telefono,
        });

        await otpPacienteService.verificarCodigo(
            paciente.id,
            codigo
        );

        // El JWT se emite únicamente después de consumir el OTP.
        const resultado = iniciarSesionPaciente(paciente);

        return respuestaEstandar(
            res,
            200,
            true,
            'Login de paciente exitoso',
            resultado
        );
    } catch (error: unknown) {
        return responderErrorPaciente(res, error);
    }
};

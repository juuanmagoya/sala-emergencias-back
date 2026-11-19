import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import MedicoModel from '../../medico/models/Medico';
import UsuarioModel from '../models/Usuario';

import {
    ROLES_GESTIONABLES,
    esRolGestionable,
} from '../types/usuario.types';
import type { RolGestionable } from '../types/usuario.types';

import type { ActualizarUsuarioDTO } from '../dtos/ActualizarUsuarioDTO';
import type { CrearUsuarioDTO } from '../dtos/CrearUsuarioDTO';

const LONGITUD_MINIMA_PASSWORD = 6;
const LONGITUD_MAXIMA_PASSWORD = 72;

const PATRON_EMAIL =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Solo se devuelven los datos públicos del perfil médico asociado.
// `especialidades` es la única fuente de verdad de la relación.
const CAMPOS_MEDICO_PUBLICOS =
    'nombre apellido matricula email especialidades activo';

// ============================================================
// ERRORES DE NEGOCIO
// ============================================================

interface ErrorConEstado extends Error {
    statusCode?: number;
}

interface ErrorDuplicado {
    code?: number;
    keyPattern?: Record<string, unknown>;
}

const crearError = (
    mensaje: string,
    statusCode: number
): ErrorConEstado =>
    Object.assign(new Error(mensaje), { statusCode });

const esErrorDuplicado = (
    error: unknown
): error is ErrorDuplicado =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000;

const mensajeDeDuplicado = (error: ErrorDuplicado): string => {
    const campo = error.keyPattern
        ? Object.keys(error.keyPattern)[0]
        : undefined;

    if (campo === 'email') {
        return 'El email ya está registrado';
    }

    if (campo === 'medico') {
        return 'El médico ya está asociado a otro usuario';
    }

    return 'Ya existe un registro con esos datos';
};

// ============================================================
// VALIDACIONES Y NORMALIZACIÓN
// ============================================================

const validarObjectId = (
    valor: unknown,
    mensaje: string
): string => {
    if (
        typeof valor !== 'string' ||
        !mongoose.Types.ObjectId.isValid(valor)
    ) {
        throw crearError(mensaje, 400);
    }

    return valor;
};

const normalizarNombre = (nombre: unknown): string => {
    if (typeof nombre !== 'string' || !nombre.trim()) {
        throw crearError('El nombre es obligatorio', 400);
    }

    return nombre.trim();
};

const normalizarEmail = (email: unknown): string => {
    if (typeof email !== 'string' || !email.trim()) {
        throw crearError('El email es obligatorio', 400);
    }

    const emailNormalizado = email.trim().toLowerCase();

    if (!PATRON_EMAIL.test(emailNormalizado)) {
        throw crearError('El email no es válido', 400);
    }

    return emailNormalizado;
};

const validarPassword = (password: unknown): string => {
    if (typeof password !== 'string' || !password.trim()) {
        throw crearError('La contraseña es obligatoria', 400);
    }

    if (password.length < LONGITUD_MINIMA_PASSWORD) {
        throw crearError(
            `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`,
            400
        );
    }

    if (password.length > LONGITUD_MAXIMA_PASSWORD) {
        throw crearError(
            `La contraseña no puede superar los ${LONGITUD_MAXIMA_PASSWORD} caracteres`,
            400
        );
    }

    return password;
};

const validarRolGestionable = (
    rol: unknown
): RolGestionable => {
    if (!esRolGestionable(rol)) {
        throw crearError(
            'El rol debe ser medico o recepcionista',
            400
        );
    }

    return rol;
};

const validarCuerpo = (datos: unknown): void => {
    if (
        typeof datos !== 'object' ||
        datos === null ||
        Array.isArray(datos)
    ) {
        throw crearError(
            'Los datos enviados no son válidos',
            400
        );
    }
};

const validarMedicoDisponible = async (
    medicoId: unknown,
    idUsuarioExcluir?: string
): Promise<string> => {
    const medico = validarObjectId(
        medicoId,
        'El ID del médico no es válido'
    );

    const medicoExistente = await MedicoModel.exists({
        _id: medico,
    });

    if (!medicoExistente) {
        throw crearError('El médico indicado no existe', 404);
    }

    // La consulta previa da un error claro. El índice único del schema
    // protege además ante dos solicitudes simultáneas.
    const filtroUsuario: Record<string, unknown> = { medico };

    if (idUsuarioExcluir) {
        filtroUsuario._id = { $ne: idUsuarioExcluir };
    }

    const usuarioConMedico = await UsuarioModel.exists(
        filtroUsuario
    );

    if (usuarioConMedico) {
        throw crearError(
            'El médico ya está asociado a otro usuario',
            409
        );
    }

    return medico;
};

class UsuarioService {
    // ============================================================
    // LISTAR USUARIOS
    // ============================================================

    async getUsuarios(filtro: {
        rol?: string;
        activo?: string;
    }) {
        const filtroMongo: Record<string, unknown> = {
            rol: { $in: [...ROLES_GESTIONABLES] },
        };

        if (filtro.rol !== undefined && filtro.rol !== '') {
            filtroMongo.rol = validarRolGestionable(
                filtro.rol
            );
        }

        if (
            filtro.activo !== undefined &&
            filtro.activo !== ''
        ) {
            if (
                filtro.activo !== 'true' &&
                filtro.activo !== 'false'
            ) {
                throw crearError(
                    'El filtro activo debe ser true o false',
                    400
                );
            }

            // Los documentos heredados sin el campo se consideran activos.
            filtroMongo.activo =
                filtro.activo === 'true'
                    ? { $ne: false }
                    : false;
        }

        return UsuarioModel.find(filtroMongo)
            .select('-password')
            .populate('medico', CAMPOS_MEDICO_PUBLICOS)
            .sort({ nombre: 1 });
    }

    // ============================================================
    // OBTENER USUARIO POR ID
    // ============================================================

    async getUsuarioById(id: string) {
        validarObjectId(
            id,
            'El ID del usuario no es válido'
        );

        const usuario = await UsuarioModel.findOne({
            _id: id,
            rol: { $in: [...ROLES_GESTIONABLES] },
        })
            .select('-password')
            .populate('medico', CAMPOS_MEDICO_PUBLICOS);

        if (!usuario) {
            throw crearError('Usuario no encontrado', 404);
        }

        return usuario;
    }

    // ============================================================
    // CREAR USUARIO
    // ============================================================

    async createUsuario(datos: CrearUsuarioDTO) {
        validarCuerpo(datos);

        const nombre = normalizarNombre(datos.nombre);
        const email = normalizarEmail(datos.email);
        const password = validarPassword(datos.password);
        const rol = validarRolGestionable(datos.rol);

        let medico: string | undefined;

        if (rol === 'medico') {
            if (
                datos.medico === undefined ||
                datos.medico === null ||
                datos.medico === ''
            ) {
                throw crearError(
                    'El médico es obligatorio para el rol médico',
                    400
                );
            }

            medico = await validarMedicoDisponible(
                datos.medico
            );
        } else if (
            datos.medico !== undefined &&
            datos.medico !== null &&
            datos.medico !== ''
        ) {
            throw crearError(
                'Un usuario con rol recepcionista no puede tener un médico asociado',
                400
            );
        }

        const emailExistente = await UsuarioModel.exists({
            email,
        });

        if (emailExistente) {
            throw crearError(
                'El email ya está registrado',
                409
            );
        }

        const passwordHasheada = await bcrypt.hash(
            password,
            10
        );

        let usuarioCreado;

        try {
            usuarioCreado = await UsuarioModel.create({
                nombre,
                email,
                password: passwordHasheada,
                rol,
                ...(medico ? { medico } : {}),
            });
        } catch (error: unknown) {
            if (esErrorDuplicado(error)) {
                throw crearError(
                    mensajeDeDuplicado(error),
                    409
                );
            }

            throw error;
        }

        return this.getUsuarioById(
            usuarioCreado._id.toString()
        );
    }

    // ============================================================
    // ACTUALIZAR USUARIO
    // ============================================================

    async updateUsuario(
        id: string,
        datos: ActualizarUsuarioDTO
    ) {
        validarObjectId(
            id,
            'El ID del usuario no es válido'
        );
        validarCuerpo(datos);

        if (datos.rol !== undefined) {
            validarRolGestionable(datos.rol);
        }

        const usuario = await UsuarioModel.findById(
            id
        ).select('-password');

        if (!usuario) {
            throw crearError('Usuario no encontrado', 404);
        }

        if (usuario.rol === 'admin') {
            throw crearError(
                'No se puede modificar un usuario administrador desde este CRUD',
                403
            );
        }

        const rolFinal = datos.rol ?? usuario.rol;

        if (!esRolGestionable(rolFinal)) {
            throw crearError(
                'El rol del usuario no es gestionable',
                403
            );
        }

        const camposActualizados: Record<
            string,
            unknown
        > = {};
        const camposEliminados: Record<string, 1> = {};

        if (datos.nombre !== undefined) {
            camposActualizados.nombre =
                normalizarNombre(datos.nombre);
        }

        if (datos.email !== undefined) {
            const email = normalizarEmail(datos.email);

            const emailExistente = await UsuarioModel.exists({
                email,
                _id: { $ne: id },
            });

            if (emailExistente) {
                throw crearError(
                    'El email ya está registrado',
                    409
                );
            }

            camposActualizados.email = email;
        }

        if (datos.password !== undefined) {
            const password = validarPassword(
                datos.password
            );

            camposActualizados.password =
                await bcrypt.hash(password, 10);
        }

        if (rolFinal === 'medico') {
            const medicoFinal =
                datos.medico !== undefined
                    ? datos.medico
                    : usuario.medico?.toString();

            if (!medicoFinal) {
                throw crearError(
                    'El médico es obligatorio para el rol médico',
                    400
                );
            }

            camposActualizados.medico =
                await validarMedicoDisponible(
                    medicoFinal,
                    id
                );
        } else {
            if (
                datos.medico !== undefined &&
                datos.medico !== null &&
                datos.medico !== ''
            ) {
                throw crearError(
                    'Un usuario con rol recepcionista no puede tener un médico asociado',
                    400
                );
            }

            // Al pasar a recepción se elimina la asociación. Se usa
            // $unset para que el campo quede ausente y el índice
            // unique/sparse no indexe un null.
            if (usuario.medico) {
                camposEliminados.medico = 1;
            }
        }

        if (datos.rol !== undefined) {
            camposActualizados.rol = rolFinal;
        }

        if (
            Object.keys(camposActualizados).length === 0 &&
            Object.keys(camposEliminados).length === 0
        ) {
            throw crearError(
                'No se enviaron datos para actualizar',
                400
            );
        }

        const actualizacion: Record<string, unknown> = {};

        if (
            Object.keys(camposActualizados).length > 0
        ) {
            actualizacion.$set = camposActualizados;
        }

        if (Object.keys(camposEliminados).length > 0) {
            actualizacion.$unset = camposEliminados;
        }

        try {
            const usuarioActualizado =
                await UsuarioModel.findByIdAndUpdate(
                    id,
                    actualizacion,
                    {
                        new: true,
                        runValidators: true,
                    }
                )
                    .select('-password')
                    .populate(
                        'medico',
                        CAMPOS_MEDICO_PUBLICOS
                    );

            if (!usuarioActualizado) {
                throw crearError(
                    'Usuario no encontrado',
                    404
                );
            }

            return usuarioActualizado;
        } catch (error: unknown) {
            if (esErrorDuplicado(error)) {
                throw crearError(
                    mensajeDeDuplicado(error),
                    409
                );
            }

            throw error;
        }
    }

    // ============================================================
    // DESACTIVAR USUARIO (BAJA LÓGICA)
    // ============================================================

    async desactivarUsuario(id: string) {
        validarObjectId(
            id,
            'El ID del usuario no es válido'
        );

        const usuario = await UsuarioModel.findById(
            id
        ).select('-password');

        if (!usuario) {
            throw crearError('Usuario no encontrado', 404);
        }

        if (usuario.rol === 'admin') {
            throw crearError(
                'No se puede desactivar un usuario administrador desde este CRUD',
                403
            );
        }

        if (usuario.activo === false) {
            throw crearError(
                'El usuario ya está desactivado',
                409
            );
        }

        const usuarioDesactivado =
            await UsuarioModel.findByIdAndUpdate(
                id,
                { $set: { activo: false } },
                { new: true }
            )
                .select('-password')
                .populate(
                    'medico',
                    CAMPOS_MEDICO_PUBLICOS
                );

        if (!usuarioDesactivado) {
            throw crearError(
                'Usuario no encontrado',
                404
            );
        }

        return usuarioDesactivado;
    }
}

export default new UsuarioService();

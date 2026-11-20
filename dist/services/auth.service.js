"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUsuario = exports.loginPaciente = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Paciente_js_1 = __importDefault(require("../modules/pacientes/models/Paciente.js"));
const Usuario_js_1 = __importDefault(require("../modules/usuario/models/Usuario.js"));
const usuario_types_js_1 = require("../modules/usuario/types/usuario.types.js");
const ErrorConfiguracion_js_1 = __importDefault(require("../utils/ErrorConfiguracion.js"));
const credencialesPaciente_js_1 = require("../utils/credencialesPaciente.js");
const EXPIRACION_TOKEN = '5h';
// Mismo mensaje para DNI inexistente, teléfono incorrecto y datos ambiguos:
// no se revela si el DNI existe ni si el teléfono pertenece a un paciente.
const MENSAJE_CREDENCIALES_INVALIDAS = 'DNI o teléfono incorrectos';
const crearError = (mensaje, statusCode) => Object.assign(new Error(mensaje), { statusCode });
const obtenerJwtSecret = () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new ErrorConfiguracion_js_1.default('JWT_SECRET no está configurado');
    }
    return jwtSecret;
};
const loginUsuario = async ({ email, password, }) => {
    // La configuración se valida antes de autenticar: un secreto faltante es
    // un error interno, no una credencial inválida.
    const jwtSecret = obtenerJwtSecret();
    const usuario = await Usuario_js_1.default.findOne({ email });
    if (!usuario) {
        throw new Error('Credenciales inválidas');
    }
    const passwordCorrecta = await bcryptjs_1.default.compare(password, usuario.password);
    if (!passwordCorrecta) {
        throw new Error('Credenciales inválidas');
    }
    // Los usuarios heredados pueden tener un rol fuera del conjunto permitido.
    if (!(0, usuario_types_js_1.esRolUsuario)(usuario.rol)) {
        throw new Error('El usuario no tiene un rol válido');
    }
    // La baja lógica de cuentas se refleja en el login. Los documentos
    // heredados sin el campo se consideran activos.
    if (usuario.activo === false) {
        throw new Error('El usuario está desactivado');
    }
    const payload = {
        tipo: 'usuario',
        id: usuario._id.toString(),
        email: usuario.email,
        rol: usuario.rol,
        medico: usuario.medico?.toString(),
    };
    const token = jsonwebtoken_1.default.sign(payload, jwtSecret, {
        expiresIn: EXPIRACION_TOKEN,
    });
    return {
        token,
        usuario: {
            id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            medico: usuario.medico?.toString() ?? null,
        },
    };
};
exports.loginUsuario = loginUsuario;
// DNI + teléfono es una credencial débil: son datos personales que pueden
// conocerse o filtrarse. No equivale a contraseña ni a un segundo factor.
// Próximo paso recomendado: verificación OTP por WhatsApp/SMS antes de emitir
// el token. No se implementa en esta etapa.
const loginPaciente = async ({ dni, telefono, }) => {
    const jwtSecret = obtenerJwtSecret();
    const variantesDni = (0, credencialesPaciente_js_1.normalizarDni)(dni);
    if (variantesDni.length === 0) {
        throw crearError('El DNI no es válido', 400);
    }
    const variantesTelefono = (0, credencialesPaciente_js_1.normalizarTelefono)(telefono);
    if (variantesTelefono.length === 0) {
        throw crearError('El teléfono no es válido', 400);
    }
    // Se busca por DNI (índice único) y se compara el teléfono dentro del
    // mismo documento. No se consulta por teléfono por separado para no
    // cruzar datos de dos pacientes distintos.
    const pacientes = await Paciente_js_1.default.find({
        dni: { $in: variantesDni },
    })
        .select('nombre telefono')
        .limit(2);
    // Sin coincidencia o con datos ambiguos se responde igual: no se revela
    // si el DNI existe.
    if (pacientes.length !== 1) {
        throw crearError(MENSAJE_CREDENCIALES_INVALIDAS, 401);
    }
    const paciente = pacientes[0];
    const telefonoPaciente = paciente.telefono;
    if (!telefonoPaciente ||
        !(0, credencialesPaciente_js_1.coincideTelefono)(variantesTelefono, telefonoPaciente)) {
        throw crearError(MENSAJE_CREDENCIALES_INVALIDAS, 401);
    }
    // Paciente no tiene un campo `activo` en el modelo actual. Si se agrega,
    // la comprobación debe hacerse acá con el mismo error genérico.
    const payload = {
        tipo: 'paciente',
        id: paciente._id.toString(),
        rol: usuario_types_js_1.ROL_PACIENTE,
    };
    const token = jsonwebtoken_1.default.sign(payload, jwtSecret, {
        expiresIn: EXPIRACION_TOKEN,
    });
    return {
        token,
        paciente: {
            id: paciente._id.toString(),
            nombre: paciente.nombre,
            rol: usuario_types_js_1.ROL_PACIENTE,
        },
    };
};
exports.loginPaciente = loginPaciente;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const entorno_1 = require("./config/entorno");
const ErrorConfiguracion_1 = __importDefault(require("./utils/ErrorConfiguracion"));
const configuracion = (() => {
    try {
        return (0, entorno_1.validarConfiguracion)();
    }
    catch (error) {
        const mensaje = error instanceof ErrorConfiguracion_1.default
            ? error.message
            : 'Error desconocido al validar la configuración';
        console.error('🔴 Configuración inválida:', mensaje);
        process.exit(1);
    }
})();
(0, database_1.default)();
app_1.default.listen(configuracion.puerto, () => {
    console.log('===============================================');
    console.log('============ SERVIDOR MUNICIPAL ACTIVO ==========');
    console.log(`Servidor escuchando en http://localhost:${configuracion.puerto}`);
    console.log(`Entorno: ${process.env.ENTORNO || 'Local'}`);
    console.log('===============================================');
});

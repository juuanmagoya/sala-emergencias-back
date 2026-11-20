"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const historiaclinica_routes_1 = __importDefault(require("../routes/historiaclinica.routes"));
// ============================================================
// RUTAS REGISTRADAS
// ============================================================
(0, node_test_1.default)('registra las rutas del módulo de historia clínica', () => {
    const stack = historiaclinica_routes_1.default.stack;
    const rutas = stack
        .filter((capa) => capa.route)
        .map((capa) => {
        const metodo = Object.keys(capa.route.methods)[0].toUpperCase();
        return `${metodo} ${capa.route.path}`;
    });
    strict_1.default.deepEqual(rutas, [
        'GET /',
        'GET /mi-historial',
        'GET /paciente/:pacienteId',
        'GET /:id',
        'POST /',
        'PUT /:id',
    ]);
});
(0, node_test_1.default)('no expone un endpoint DELETE para registros clínicos', () => {
    const stack = historiaclinica_routes_1.default.stack;
    const metodos = stack
        .filter((capa) => capa.route)
        .flatMap((capa) => Object.keys(capa.route.methods));
    strict_1.default.equal(metodos.includes('delete'), false);
});

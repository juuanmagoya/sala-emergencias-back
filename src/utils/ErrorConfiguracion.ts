// Error de configuración del entorno (por ejemplo, ausencia de JWT_SECRET).
// Se trata como error interno del servidor, nunca como credencial inválida.
class ErrorConfiguracion extends Error {
    constructor(mensaje: string) {
        super(mensaje);
        this.name = 'ErrorConfiguracion';
    }
}

export default ErrorConfiguracion;

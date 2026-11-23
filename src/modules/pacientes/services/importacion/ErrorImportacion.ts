// Error controlado de la importación. El controller traduce `status` y
// `detalles` a la respuesta estándar sin exponer errores internos.
export default class ErrorImportacion extends Error {
    readonly status: number;
    readonly detalles?: unknown;

    constructor(status: number, mensaje: string, detalles?: unknown) {
        super(mensaje);

        this.name = 'ErrorImportacion';
        this.status = status;
        this.detalles = detalles;
    }
}

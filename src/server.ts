import 'dotenv/config';

import app from './app';

import connectDB from './config/database';
import { validarConfiguracion } from './config/entorno';
import ErrorConfiguracion from './utils/ErrorConfiguracion';

const configuracion = (() => {
    try {
        return validarConfiguracion();
    } catch (error: unknown) {
        const mensaje =
            error instanceof ErrorConfiguracion
                ? error.message
                : 'Error desconocido al validar la configuración';

        console.error('🔴 Configuración inválida:', mensaje);
        process.exit(1);
    }
})();

connectDB();

app.listen(configuracion.puerto, () => {
    console.log('===============================================');
    console.log('============ SERVIDOR MUNICIPAL ACTIVO ==========');
    console.log(`Servidor escuchando en http://localhost:${configuracion.puerto}`);
    console.log(`Entorno: ${process.env.ENTORNO || 'Local'}`);
    console.log('===============================================');
});

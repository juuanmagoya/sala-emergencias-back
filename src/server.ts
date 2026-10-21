import app from './app';

import connectDB from './config/database';

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
    console.log('===============================================');
    console.log('============ SERVIDOR MUNICIPAL ACTIVO ==========');
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.ENTORNO || 'Local'}`);
    console.log('===============================================');
});

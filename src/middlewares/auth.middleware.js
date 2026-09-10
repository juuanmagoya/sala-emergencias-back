const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó un token de autenticación',
            });
        }

        const [tipo, token] = authHeader.split(' ');

        if (tipo !== 'Bearer' || !token) {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido',
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = decoded;

        next();

    } catch (error) {
        console.error('ERROR AUTH:', error);

        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
        });
    }
};

module.exports = authMiddleware;
import type { Response } from 'express';

const respuestaEstandar = (
    res: Response,
    status: number,
    success: boolean,
    message: string,
    data: unknown = null
) => {
    return res.status(status).json({
        success,
        timestamp: new Date().toISOString(),
        message,
        total: Array.isArray(data) ? data.length : data ? 1 : 0,
        data,
    });
};

export default respuestaEstandar;
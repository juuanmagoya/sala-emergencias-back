
import { Request, Response } from 'express';

import { registrarConsultaChatbot } from '../services/chatbot.service';
import { generarRespuestaRAG } from '../services/rag.service';

// ============================================
// CONSULTAR CHATBOT
// ============================================

export const consultarChatbot = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const pacienteId = req.usuario?.id;
        const { pregunta } = req.body;

        // Validar identidad del paciente.
        if (!pacienteId) {
            res.status(401).json({
                success: false,
                message: 'No se pudo identificar al paciente autenticado',
            });
            return;
        }

        // Validar pregunta.
        if (
            typeof pregunta !== 'string' ||
            !pregunta.trim() ||
            pregunta.trim().length > 1000
        ) {
            res.status(400).json({
                success: false,
                message: 'La pregunta es obligatoria y no puede superar los 1000 caracteres',
            });
            return;
        }

        const preguntaLimpia = pregunta.trim();

        // Verificar y registrar el consumo diario.
        const consumo = await registrarConsultaChatbot(pacienteId);

        if (!consumo.permitida) {
            res.status(429).json({
                success: false,
                message: 'Alcanzaste el límite de 3 consultas diarias del chatbot',
                data: {
                    consultas: consumo.consultas,
                    restantes: consumo.restantes,
                    fecha: consumo.fecha,
                },
            });
            return;
        }

        // Generar respuesta mediante RAG.
        const resultado = await generarRespuestaRAG(preguntaLimpia);

        res.status(200).json({
            success: true,
            message: 'Consulta procesada correctamente',
            data: {
                pregunta: preguntaLimpia,
                respuesta: resultado.respuesta,
                modeloUtilizado: resultado.modeloUtilizado,
                fuentes: resultado.fuentes,
                consumo: {
                    consultas: consumo.consultas,
                    restantes: consumo.restantes,
                    limiteDiario: 3,
                    fecha: consumo.fecha,
                },
            },
        });
    } catch (error: unknown) {
        console.error('Error al consultar el chatbot:', error);

        res.status(500).json({
            success: false,
            message: 'No se pudo procesar la consulta. Intentá nuevamente más tarde.',
        });
    }
};

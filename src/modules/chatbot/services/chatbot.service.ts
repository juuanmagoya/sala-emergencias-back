
import { Types } from 'mongoose';

import ConsumoChatbot from '../models/ConsumoChatbot';

// ============================================
// CONFIGURACIÓN
// ============================================

const LIMITE_CONSULTAS_DIARIAS = 3;
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

// ============================================
// OBTENER FECHA ACTUAL DE ARGENTINA
// ============================================

const obtenerFechaArgentina = (): string => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const obtenerParte = (tipo: string): string =>
    partes.find((parte) => parte.type === tipo)?.value ?? '';

  return `${obtenerParte('year')}-${obtenerParte('month')}-${obtenerParte('day')}`;
};

// ============================================
// RESULTADO DEL REGISTRO
// ============================================

interface ResultadoConsumoChatbot {
  permitida: boolean;
  consultas: number;
  restantes: number;
  fecha: string;
}

// ============================================
// REGISTRAR CONSULTA
// ============================================

export const registrarConsultaChatbot = async (
  pacienteId: string
): Promise<ResultadoConsumoChatbot> => {
  if (!Types.ObjectId.isValid(pacienteId)) {
    throw new Error('El identificador del paciente no es válido');
  }

  const paciente = new Types.ObjectId(pacienteId);
  const fecha = obtenerFechaArgentina();

  // 1. Intentamos incrementar un registro existente.
  // La condición garantiza que nunca supere las 3 consultas.
  const consumoExistente = await ConsumoChatbot.findOneAndUpdate(
    {
      paciente,
      fecha,
      consultas: { $lt: LIMITE_CONSULTAS_DIARIAS },
    },
    {
      $inc: { consultas: 1 },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (consumoExistente) {
    return {
      permitida: true,
      consultas: consumoExistente.consultas,
      restantes: LIMITE_CONSULTAS_DIARIAS - consumoExistente.consultas,
      fecha,
    };
  }

  // 2. Si no existe un registro, intentamos crear el primero.
  try {
    const nuevoConsumo = await ConsumoChatbot.create({
      paciente,
      fecha,
      consultas: 1,
    });

    return {
      permitida: true,
      consultas: nuevoConsumo.consultas,
      restantes: LIMITE_CONSULTAS_DIARIAS - nuevoConsumo.consultas,
      fecha,
    };
  } catch (error: unknown) {
    const errorMongo = error as { code?: number };

    // Otra solicitud pudo haber creado el registro simultáneamente.
    if (errorMongo.code !== 11000) {
      throw error;
    }
  }

  // 3. Si hubo una colisión, intentamos incrementar nuevamente.
  const consumoActualizado = await ConsumoChatbot.findOneAndUpdate(
    {
      paciente,
      fecha,
      consultas: { $lt: LIMITE_CONSULTAS_DIARIAS },
    },
    {
      $inc: { consultas: 1 },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (consumoActualizado) {
    return {
      permitida: true,
      consultas: consumoActualizado.consultas,
      restantes: LIMITE_CONSULTAS_DIARIAS - consumoActualizado.consultas,
      fecha,
    };
  }

  // 4. Si no se pudo incrementar, el paciente alcanzó el límite.
  const consumoFinal = await ConsumoChatbot.findOne({
    paciente,
    fecha,
  });

  const consultas = consumoFinal?.consultas ?? 0;

  return {
    permitida: false,
    consultas,
    restantes: 0,
    fecha,
  };
};

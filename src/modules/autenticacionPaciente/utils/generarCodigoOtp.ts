import { randomInt } from 'node:crypto';

export const LONGITUD_CODIGO_OTP = 6;

// Expuesta para poder probar de forma determinista los ceros a la izquierda.
export const formatearCodigoOtp = (numero: number): string =>
    numero.toString().padStart(LONGITUD_CODIGO_OTP, '0');

// randomInt es criptográficamente seguro y devuelve un entero uniforme en
// el rango [0, 1.000.000). El padding conserva los códigos que empiezan
// con cero, por ejemplo 42 -> "000042".
export const generarCodigoOtp = (): string =>
    formatearCodigoOtp(randomInt(0, 1_000_000));

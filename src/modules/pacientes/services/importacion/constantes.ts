import PacienteModel from '../../models/Paciente';

import type {
    CampoImportacion,
} from '../../types/importacionPacientes.types';
import type {
    ObraSocialNombre,
    TipoTelefono,
} from '../../types/paciente.types';

// ============================================================
// LÍMITES DEL ARCHIVO
// ============================================================

export const TAMANO_MAXIMO_ARCHIVO_BYTES = 5 * 1024 * 1024;
export const MAXIMO_FILAS_PACIENTES = 1000;
export const MAXIMO_COLUMNAS = 100;
export const MAXIMO_LONGITUD_ENCABEZADO = 200;
export const MAXIMO_LONGITUD_CELDA = 500;

export const EXTENSION_XLSX = '.xlsx';

export const TIPOS_MIME_XLSX = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
]);

// Un .xlsx es un contenedor ZIP. La firma PK\x03\x04 evita aceptar
// archivos renombrados o formatos binarios antiguos como .xls.
export const FIRMA_XLSX = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

// ============================================================
// CAMPOS DEL PACIENTE
// ============================================================

export const CAMPOS_OBLIGATORIOS: CampoImportacion[] = [
    'nombre',
    'dni',
    'telefono.codigoArea',
    'telefono.numero',
];

export const ETIQUETAS_CAMPO: Record<CampoImportacion, string> = {
    'nombre': 'nombre',
    'dni': 'DNI',
    'telefono.codigoArea': 'código de área',
    'telefono.numero': 'número de teléfono',
    'telefono.tipo': 'tipo de teléfono',
    'email': 'email',
    'obraSocial.nombre': 'obra social',
    'obraSocial.numeroAfiliado': 'número de afiliado',
    'direccion.calle': 'calle',
    'direccion.numero': 'número de domicilio',
    'direccion.piso': 'piso',
    'direccion.departamento': 'departamento',
    'direccion.barrio': 'barrio',
};

// Los enums reales viven en el modelo Paciente. Se leen desde el esquema
// para no duplicar las listas y mantener una única fuente de verdad.
const rutaTipoTelefono = PacienteModel.schema.path(
    'telefono.tipo'
) as unknown as { enumValues?: string[] } | undefined;

const TIPOS_TELEFONO_POR_DEFECTO: TipoTelefono[] = [
    'CELULAR',
    'FIJO',
    'TRABAJO',
];

export const TIPOS_TELEFONO: TipoTelefono[] =
    rutaTipoTelefono?.enumValues?.length
        ? (rutaTipoTelefono.enumValues as TipoTelefono[])
        : TIPOS_TELEFONO_POR_DEFECTO;

const rutaObraSocial = PacienteModel.schema.path(
    'obraSocial.nombre'
) as unknown as { enumValues?: string[] } | undefined;

const OBRAS_SOCIALES_POR_DEFECTO: ObraSocialNombre[] = [
    'PAMI',
    'OSPEL',
    'OSDE',
    'SANCOR',
    'OSECAC',
    'SWISS MEDICAL',
    'GALENO',
    'MEDICUS',
    'OMINT',
    'FEMEBA',
    'OTRAS',
    'NINGUNA',
];

export const OBRAS_SOCIALES: ObraSocialNombre[] =
    rutaObraSocial?.enumValues?.length
        ? (rutaObraSocial.enumValues as ObraSocialNombre[])
        : OBRAS_SOCIALES_POR_DEFECTO;

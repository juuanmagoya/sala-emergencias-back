// ============================================================
// CREAR TURNO
//
// El cliente solo envía relaciones y la fecha/hora elegida. El estado
// inicial, la duración y la fecha de fin se derivan en el servidor.
// ============================================================

export interface CrearTurnoDTO {
    paciente: string;
    especialidad: string;
    medico: string;
    fechaTurno: string;
    observaciones?: string;
}

export const MENSAJES_TURNO = {
    TURNO_ID_INVALIDO: 'El ID del turno no es válido',
    TURNO_NO_ENCONTRADO: 'Turno no encontrado',
    TURNO_NO_CREADO: 'No se pudo registrar el turno',

    ESTADO_REQUERIDO: 'El estado del turno es obligatorio',
    ESTADO_INVALIDO: 'El estado del turno no es válido',
    SOLO_ESTADO_MODIFICABLE:
        'Solo se puede actualizar el estado del turno',

    PACIENTE_ID_INVALIDO: 'El ID del paciente no es válido',
    PACIENTE_NO_EXISTE: 'El paciente indicado no existe',

    ESPECIALIDAD_ID_INVALIDO:
        'El ID de la especialidad no es válido',
    ESPECIALIDAD_NO_EXISTE:
        'La especialidad indicada no existe',

    MEDICO_ID_INVALIDO: 'El ID del médico no es válido',
    MEDICO_NO_EXISTE: 'El médico indicado no existe',
    MEDICO_INACTIVO: 'El médico no está activo',
    ESPECIALIDAD_NO_CORRESPONDE:
        'La especialidad indicada no corresponde al médico',

    FECHA_INVALIDA: 'La fecha y hora del turno no son válidas',
    FECHA_CONSULTA_INVALIDA: 'La fecha indicada no es válida',
    FECHA_PASADA: 'La fecha del turno no puede ser pasada',

    NO_ATIENDE_ESE_DIA: 'El médico no atiende ese día',
    FUERA_DE_HORARIO:
        'El turno debe comenzar y finalizar dentro del horario de atención',
    HORARIO_OCUPADO: 'El horario solicitado ya está ocupado',

    OBSERVACIONES_DEMASIADO_LARGAS:
        'Las observaciones no pueden superar los 500 caracteres',

    SIN_PERFIL_MEDICO:
        'El usuario no tiene un perfil médico asociado',
} as const;
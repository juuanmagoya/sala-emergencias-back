import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getPacientes,
    createPaciente,
    updatePaciente,
    deletePaciente,
} from '../controllers/paciente.controller';

const router = Router();

// Consulta de pacientes: recepción los administra y el personal médico
// necesita los datos para la atención.
router.get(
    '/',
    autorizarRoles('admin', 'medico', 'recepcionista'),
    getPacientes
);

// Registro y actualización de datos demográficos: administración y recepción.
router.post('/', autorizarRoles('admin', 'recepcionista'), createPaciente);

router.put('/:id', autorizarRoles('admin', 'recepcionista'), updatePaciente);

// El borrado es físico y está condicionado a que no existan turnos activos.
// Se reserva a administración.
router.delete('/:id', autorizarRoles('admin'), deletePaciente);

export default router;

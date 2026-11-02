import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    desactivarUsuario,
} from '../controllers/usuario.controller';

const router = Router();

// Gestión de cuentas de acceso: exclusiva de administración.
// No se crean ni modifican cuentas con rol `admin` desde este CRUD.
router.get('/', autorizarRoles('admin'), getUsuarios);

router.post('/', autorizarRoles('admin'), createUsuario);

router.get('/:id', autorizarRoles('admin'), getUsuarioById);

router.put('/:id', autorizarRoles('admin'), updateUsuario);

// Baja lógica: la cuenta se desactiva, pero el perfil médico,
// sus turnos y sus historias clínicas se conservan.
router.delete(
    '/:id',
    autorizarRoles('admin'),
    desactivarUsuario
);

export default router;

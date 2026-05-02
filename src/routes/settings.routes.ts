import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';

const prisma = new PrismaClient();
const router = Router();
function getMsg(e: unknown): string { return e instanceof Error ? e.message : 'Error desconocido'; }

/**
 * GET /api/settings/notifications
 * Obtiene la configuración de notificaciones
 */
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const config = await NotificationService.getConfig();
    res.json({ success: true, data: config });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

/**
 * PATCH /api/settings/notifications
 * Actualiza la configuración de notificaciones
 */
router.patch('/notifications', requireAuth, async (req, res) => {
  try {
    const updated = await prisma.notificationConfig.update({
      where: { id: 'global' },
      data: req.body
    });
    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

/**
 * POST /api/settings/notifications/test
 * Envía una notificación de prueba
 */
router.post('/notifications/test', requireAuth, async (req, res) => {
  try {
    await NotificationService.sendAlert(
      "🎯 TEST DE NOTIFICACIÓN\n\n¡Enhorabuena! Si estás leyendo esto, tu sistema de notificaciones en HomeVault está correctamente configurado.",
      'INFO'
    );
    res.json({ success: true, message: 'Notificación de prueba enviada' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

export default router;

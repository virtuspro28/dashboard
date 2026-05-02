import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { HardwareService } from '../services/hardware.service.js';

const router = Router();
function getMsg(e: unknown): string { return e instanceof Error ? e.message : 'Error desconocido'; }

/**
 * GET /api/hardware/telemetry
 * Retorna RPM, PWM, Voltaje, Amperaje y Watts
 */
router.get('/telemetry', requireAuth, async (req, res) => {
  try {
    const data = await HardwareService.getCombinedStatus();
    res.json({ success: true, data });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

/**
 * PATCH /api/hardware/fan
 * Establece el PWM del ventilador manualmente
 */
router.patch('/fan', requireAuth, async (req, res) => {
  try {
    const { pwm } = req.body;
    if (typeof pwm !== 'number') {
      return res.status(400).json({ success: false, error: 'PWM debe ser un número' });
    }
    await HardwareService.setFanPWM(pwm);
    res.json({ success: true, message: 'PWM actualizado' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

export default router;

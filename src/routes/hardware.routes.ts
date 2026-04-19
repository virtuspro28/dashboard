import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { HardwareService } from '../services/hardware.service.js';

const router = Router();

/**
 * GET /api/hardware/telemetry
 * Retorna RPM, PWM, Voltaje, Amperaje y Watts
 */
router.get('/telemetry', requireAuth, async (req, res) => {
  try {
    const data = await HardwareService.getCombinedStatus();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

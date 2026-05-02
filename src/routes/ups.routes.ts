import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { UpsService } from "../services/ups.service.js";

const router = Router();
function getMsg(e: unknown): string { return e instanceof Error ? e.message : 'Error desconocido'; }

router.use(requireAuth);

router.get("/status", async (_req, res) => {
  try {
    const status = await UpsService.getStatus();
    res.json({ success: true, data: status });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/events", async (_req, res) => {
  try {
    const events = await UpsService.getEvents();
    res.json({ success: true, data: events });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

export default router;

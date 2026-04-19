import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { UpsService } from "../services/ups.service.js";

const router = Router();

router.use(requireAuth);

router.get("/status", async (_req, res) => {
  try {
    const status = await UpsService.getStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/events", async (_req, res) => {
  try {
    const events = await UpsService.getEvents();
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

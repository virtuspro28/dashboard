import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { NetworkService } from "../services/network.service.js";

const router = Router();

router.get("/status", requireAuth, async (_req, res) => {
  try {
    const status = await NetworkService.getStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/hostname", requireAuth, async (req, res) => {
  try {
    const { hostname } = req.body;
    await NetworkService.setHostname(hostname);
    res.json({ success: true, message: "Hostname actualizado (requiere reinicio)" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/ip/static", requireAuth, async (req, res) => {
  try {
    const { ip, gateway, dns } = req.body;
    await NetworkService.setStaticIP(ip, gateway, dns);
    res.json({ success: true, message: "IP Estática configurada (requiere reinicio)" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/ip/dhcp", requireAuth, async (_req, res) => {
  try {
    await NetworkService.setDHCP();
    res.json({ success: true, message: "Cambiado a DHCP (requiere reinicio)" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

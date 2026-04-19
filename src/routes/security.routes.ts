import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { FirewallService } from "../services/firewall.service.js";
import { SecurityService } from "../services/security.service.js";

const router = Router();

router.use(requireAuth);

router.get("/config", async (_req, res) => {
  try {
    const config = await SecurityService.getConfig();
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/firewall/rules", async (_req, res) => {
  try {
    const rules = await FirewallService.getRules();
    res.json({ success: true, data: rules });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/firewall/rules/:index", async (req, res) => {
  try {
    await FirewallService.deleteRule(parseInt(req.params.index));
    res.json({ success: true, message: "Regla eliminada" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/banned", async (_req, res) => {
  try {
    const banned = await SecurityService.getBannedList();
    res.json({ success: true, data: banned });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/unban", async (req, res) => {
  try {
    const { ip } = req.body;
    await SecurityService.unbanIP(ip);
    res.json({ success: true, message: "IP desbloqueada" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/block-country", async (req, res) => {
  try {
    const { countryCode } = req.body;
    SecurityService.blockCountry(countryCode); // Corre en background
    res.json({ success: true, message: "Bloqueo de país iniciado en segundo plano" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { ProxyService } from "../services/proxy.service.js";

const router = Router();

router.use(requireAuth);

router.get("/domains", async (_req, res) => {
  try {
    const domains = await ProxyService.listDomains();
    res.json({ success: true, data: domains });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/domains", async (req, res) => {
  try {
    const { domain, targetPort } = req.body;
    const proxy = await ProxyService.addDomain(domain, targetPort);
    res.json({ success: true, data: proxy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/domains/:id/ssl", async (req, res) => {
  try {
    const proxy = await ProxyService.issueSSL(req.params.id);
    res.json({ success: true, data: proxy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/domains/:id", async (req, res) => {
  try {
    await ProxyService.deleteDomain(req.params.id);
    res.json({ success: true, message: "Dominio eliminado" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

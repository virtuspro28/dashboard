import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { ProxyService } from "../services/proxy.service.js";

const router = Router();
function getMsg(e: unknown): string { return e instanceof Error ? e.message : 'Error desconocido'; }

router.use(requireAuth);

router.get("/domains", async (_req, res) => {
  try {
    const domains = await ProxyService.listDomains();
    res.json({ success: true, data: domains });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.post("/domains", async (req, res) => {
  try {
    const { domain, targetPort } = req.body;
    const proxy = await ProxyService.addDomain(domain, targetPort);
    res.json({ success: true, data: proxy });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.post("/domains/:id/ssl", async (req, res) => {
  try {
    const proxy = await ProxyService.issueSSL(req.params.id);
    res.json({ success: true, data: proxy });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.delete("/domains/:id", async (req, res) => {
  try {
    await ProxyService.deleteDomain(req.params.id);
    res.json({ success: true, message: "Dominio eliminado" });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

export default router;

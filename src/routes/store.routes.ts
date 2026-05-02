import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { StoreService } from "../services/store.service.js";

const router = Router();
function getMsg(e: unknown): string { return e instanceof Error ? e.message : 'Error desconocido'; }

router.get("/apps", requireAuth, async (_req, res) => {
  try {
    const catalog = await StoreService.getCatalog();

    let installedList: string[] = [];
    try {
      installedList = await Promise.race([
        StoreService.getInstalledStatus(),
        new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
      ]);
    } catch {
      // Ignorar fallo de Docker para no bloquear la tienda.
    }

    const appsWithStatus = catalog.map((app) => ({
      ...app,
      isInstalled: installedList.includes(app.id.toLowerCase()),
    }));

    res.json({ success: true, data: appsWithStatus });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/custom-apps", requireAuth, async (_req, res) => {
  try {
    const apps = await StoreService.getCustomApps();
    res.json({ success: true, data: apps });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.post("/custom-apps", requireAuth, async (req, res) => {
  try {
    const app = await StoreService.createCustomApp(req.body);
    res.status(201).json({ success: true, data: app });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.put("/custom-apps/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params["id"] as string;
    const app = await StoreService.updateCustomApp(id, req.body);
    res.json({ success: true, data: app });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.delete("/custom-apps/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params["id"] as string;
    await StoreService.deleteCustomApp(id);
    res.json({ success: true, message: "App personalizada eliminada" });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.post("/install/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params["id"] as string;
    await StoreService.installApp(id, req.body);
    res.json({ success: true, message: `Instalación de ${id} iniciada correctamente` });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

export default router;

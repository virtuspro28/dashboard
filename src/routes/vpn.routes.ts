import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { VpnService } from "../services/vpn.service.js";

const router = Router();

router.use(requireAuth);

router.get("/clients", async (_req, res) => {
  try {
    const clients = await VpnService.listClients();
    res.json({ success: true, data: clients });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/clients", async (req, res) => {
  try {
    const { name } = req.body;
    const client = await VpnService.addClient(name);
    res.json({ success: true, data: client });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/clients/:id/qr", async (req, res) => {
  try {
    const qrData = await VpnService.generateQR(req.params.id);
    res.json({ success: true, data: qrData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/clients/:id/config", async (req, res) => {
  try {
    const config = await VpnService.getClientConfig(req.params.id);
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/clients/:id", async (req, res) => {
  try {
    await VpnService.deleteClient(req.params.id);
    res.json({ success: true, message: "Cliente eliminado" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

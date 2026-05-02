import { Router } from "express";
import type { Response } from "express";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
import { VpnService } from "../services/vpn.service.js";
import { DdnsService } from "../services/ddns.service.js";
import type { VpnServerStatus } from "../services/vpn.service.js";

const router = Router();

function getMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Error desconocido";
}

router.use(requireAuth);

function buildFallbackStatus(): VpnServerStatus {
  return {
    mode: "linux",
    enabled: false,
    installed: false,
    interfaceName: process.env["WG_INTERFACE"] ?? "wg0",
    endpoint: "",
    publicKey: null,
    clientCount: 0,
    configPath: process.env["WG_CONFIG_PATH"] ?? `/etc/wireguard/${process.env["WG_INTERFACE"] ?? "wg0"}.conf`,
  };
}

async function respondStatus(res: Response): Promise<void> {
  try {
    const status = await VpnService.getServerStatus();
    res.json({ success: true, data: status });
  } catch {
    res.json({ success: true, data: buildFallbackStatus() });
  }
}

async function respondClients(res: Response): Promise<void> {
  try {
    const clients = await VpnService.listClients();
    res.json({ success: true, data: clients });
  } catch {
    res.json({ success: true, data: [] });
  }
}

router.get("/status", async (_req, res) => {
  await respondStatus(res);
});

router.get("/wireguard/status", async (_req, res) => {
  await respondStatus(res);
});

router.get("/clients", async (_req, res) => {
  await respondClients(res);
});

router.get("/wireguard/clients", async (_req, res) => {
  await respondClients(res);
});

router.get("/wireguard/clients/:id/qr", async (req, res) => {
  try {
    const clientId = req.params["id"];
    if (!clientId || Array.isArray(clientId)) {
      res.status(400).json({ success: false, error: "ID de cliente requerido" });
      return;
    }
    const qrData = await VpnService.generateQR(clientId);
    res.json({ success: true, data: qrData });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.post("/clients", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const client = await VpnService.addClient(name);
    res.json({ success: true, data: client });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/clients/:id/qr", async (req, res) => {
  try {
    const clientId = req.params["id"];
    if (!clientId || Array.isArray(clientId)) {
      res.status(400).json({ success: false, error: "ID de cliente requerido" });
      return;
    }
    const qrData = await VpnService.generateQR(clientId);
    res.json({ success: true, data: qrData });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/clients/:id/config", async (req, res) => {
  try {
    const clientId = req.params["id"];
    if (!clientId || Array.isArray(clientId)) {
      res.status(400).json({ success: false, error: "ID de cliente requerido" });
      return;
    }
    const config = await VpnService.getClientConfig(clientId);
    res.json({ success: true, data: config });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/wireguard/clients/:id/config", async (req, res) => {
  try {
    const clientId = req.params["id"];
    if (!clientId || Array.isArray(clientId)) {
      res.status(400).json({ success: false, error: "ID de cliente requerido" });
      return;
    }
    const config = await VpnService.getClientConfig(clientId);
    res.json({ success: true, data: config });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/clients/:id/download", async (req, res) => {
  try {
    const clientId = req.params["id"];
    if (!clientId || Array.isArray(clientId)) {
      res.status(400).json({ success: false, error: "ID de cliente requerido" });
      return;
    }
    const config = await VpnService.getClientConfig(clientId);
    const filename = await VpnService.getDownloadFilename(clientId);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(config);
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/wireguard/clients/:id/download", async (req, res) => {
  try {
    const clientId = req.params["id"];
    if (!clientId || Array.isArray(clientId)) {
      res.status(400).json({ success: false, error: "ID de cliente requerido" });
      return;
    }
    const config = await VpnService.getClientConfig(clientId);
    const filename = await VpnService.getDownloadFilename(clientId);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(config);
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.delete("/clients/:id", requireAdmin, async (req, res) => {
  try {
    const clientId = req.params["id"];
    if (!clientId || Array.isArray(clientId)) {
      res.status(400).json({ success: false, error: "ID de cliente requerido" });
      return;
    }
    await VpnService.deleteClient(clientId);
    res.json({ success: true, message: "Cliente eliminado" });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/ddns/providers", async (_req, res) => {
  try {
    res.json({ success: true, data: DdnsService.getProviderOptions() });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.get("/ddns/profiles", async (_req, res) => {
  try {
    const profiles = await DdnsService.listProfiles();
    res.json({ success: true, data: profiles });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.post("/ddns/profiles", requireAdmin, async (req, res) => {
  try {
    const profile = await DdnsService.createProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.put("/ddns/profiles/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params["id"];
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: "ID de perfil requerido" });
      return;
    }
    const profile = await DdnsService.updateProfile(id, req.body);
    res.json({ success: true, data: profile });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.post("/ddns/profiles/:id/sync", requireAdmin, async (req, res) => {
  try {
    const id = req.params["id"];
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: "ID de perfil requerido" });
      return;
    }
    const profile = await DdnsService.syncProfile(id);
    res.json({ success: true, data: profile });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

router.delete("/ddns/profiles/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params["id"];
    if (!id || Array.isArray(id)) {
      res.status(400).json({ success: false, error: "ID de perfil requerido" });
      return;
    }
    await DdnsService.deleteProfile(id);
    res.json({ success: true, message: "Perfil DDNS eliminado" });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

export default router;

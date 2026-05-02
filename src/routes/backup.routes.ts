import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { BackupService } from '../services/backup.service.js';
import { getDatabase } from '../database/connection.js';

const router = Router();
function getMsg(e: unknown): string { return e instanceof Error ? e.message : 'Error desconocido'; }
const prisma = getDatabase();

/**
 * GET /api/backup/tasks
 */
router.get('/tasks', requireAuth, async (req, res) => {
  try {
    const tasks = await BackupService.listTasks();
    res.json({ success: true, data: tasks });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

/**
 * POST /api/backup/tasks
 */
router.post('/tasks', requireAuth, async (req, res) => {
  try {
    const { name, source, destination, schedule, type } = req.body;
    const task = await (prisma as any).backupTask.create({
      data: {
        machineName: name,
        sourcePath: source,
        destinationPath: destination,
        schedule: schedule || 'MANUAL',
        taskType: type || 'RSYNC_LOCAL',
        status: 'idle'
      }
    });
    res.json({ success: true, data: task });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

/**
 * POST /api/backup/run/:id
 */
router.post('/run/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params["id"] as string;
    // No esperamos el resultado para no bloquear la petición
    BackupService.executeRsyncTask(id);
    res.json({ success: true, message: 'Tarea de respaldo iniciada en segundo plano' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

/**
 * GET /api/backup/usb
 */
router.get('/usb', requireAuth, async (req, res) => {
  try {
    const drives = await BackupService.findExternalDrives();
    res.json({ success: true, data: drives });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: getMsg(error) });
  }
});

export default router;

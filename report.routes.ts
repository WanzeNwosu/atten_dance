// src/routes/report.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ReportService } from '../services/report.service';

const router = Router();
const service = new ReportService();

router.use(authenticate);
router.use(authorize(['MEETING_HOST', 'DEPT_ADMIN', 'ORG_ADMIN', 'SUPER_ADMIN']));

// GET /reports/summary
router.get('/summary', async (req, res) => {
  const { organizationId, departmentId, meetingId, userId, from, to, status } = req.query;
  const filters = {
    organizationId: (organizationId as string) || req.user!.organizationId || undefined,
    departmentId: departmentId as string,
    meetingId: meetingId as string,
    userId: userId as string,
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
    status: status as string,
  };
  const result = await service.getAttendanceSummary(filters);
  res.json({ success: true, data: result });
});

// GET /reports/dashboard
router.get('/dashboard', async (req, res) => {
  const orgId = (req.query.organizationId as string) || req.user!.organizationId!;
  const data = await service.getLiveDashboard(orgId);
  res.json({ success: true, data });
});

// GET /reports/monthly?year=2024&month=1
router.get('/monthly', async (req, res) => {
  const orgId = (req.query.organizationId as string) || req.user!.organizationId!;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const data = await service.getMonthlySummary(orgId, year, month);
  res.json({ success: true, data });
});

// GET /reports/trends?days=30
router.get('/trends', async (req, res) => {
  const orgId = (req.query.organizationId as string) || req.user!.organizationId!;
  const days = parseInt(req.query.days as string) || 30;
  const data = await service.getAttendanceTrends(orgId, days);
  res.json({ success: true, data });
});

// GET /reports/export?format=pdf|csv|excel
router.get('/export', async (req, res) => {
  const { format = 'pdf', organizationId, meetingId, from, to } = req.query;
  const filters = {
    organizationId: (organizationId as string) || req.user!.organizationId || undefined,
    meetingId: meetingId as string,
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
  };

  if (format === 'pdf') {
    const buf = await service.exportToPDF(filters);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
    return res.send(buf);
  }
  if (format === 'excel') {
    const buf = await service.exportToExcel(filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
    return res.send(buf);
  }
  const csv = await service.exportToCSV(filters);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
  return res.send(csv);
});

export default router;


// ─────────────────────────────────────────────
// src/routes/notification.routes.ts
import { Router as NRouter } from 'express';
import { authenticate as nAuth } from '../middleware/authenticate';

const notifRouter = NRouter();
notifRouter.use(nAuth);

notifRouter.get('/', async (req, res) => {
  const { prisma } = await import('../config/database');
  const notifs = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: notifs });
});

notifRouter.patch('/:id/read', async (req, res) => {
  const { prisma } = await import('../config/database');
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ success: true });
});

notifRouter.patch('/read-all', async (req, res) => {
  const { prisma } = await import('../config/database');
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ success: true });
});

export { notifRouter as default };

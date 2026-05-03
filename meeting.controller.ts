// src/controllers/meeting.controller.ts
import { Request, Response } from 'express';
import { MeetingService } from '../services/meeting.service';
import { ReportService } from '../services/report.service';

export class MeetingController {
  private service = new MeetingService();
  private reportService = new ReportService();

  list = async (req: Request, res: Response) => {
    const { organizationId, departmentId, from, to, page, limit, type } = req.query;
    const user = req.user!;
    const orgId = (organizationId as string) || user.organizationId || undefined;
    const result = await this.service.list({
      organizationId: orgId,
      departmentId: departmentId as string,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      type: type as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      userId: ['MEMBER', 'MEETING_HOST'].includes(user.role) ? user.id : undefined,
    });
    res.json({ success: true, data: result });
  };

  upcoming = async (req: Request, res: Response) => {
    const meetings = await this.service.getUpcoming(req.user!.id, req.user!.organizationId || undefined);
    res.json({ success: true, data: meetings });
  };

  get = async (req: Request, res: Response) => {
    const meeting = await this.service.getById(req.params.id, req.user!.id);
    res.json({ success: true, data: meeting });
  };

  create = async (req: Request, res: Response) => {
    const meeting = await this.service.create({
      ...req.body,
      hostId: req.user!.id,
      organizationId: req.user!.organizationId!,
    });
    res.status(201).json({ success: true, data: meeting });
  };

  update = async (req: Request, res: Response) => {
    const meeting = await this.service.update(req.params.id, req.body, req.user!.id, req.user!.role);
    res.json({ success: true, data: meeting });
  };

  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id, req.user!.id, req.user!.role);
    res.json({ success: true, message: 'Meeting deleted' });
  };

  getAttendance = async (req: Request, res: Response) => {
    const data = await this.service.getAttendanceSummary(req.params.id);
    res.json({ success: true, data });
  };

  getLiveAttendance = async (req: Request, res: Response) => {
    // Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const meetingId = req.params.id;
    const { redis } = await import('../config/redis');

    // Send current snapshot immediately
    const snapshot = await this.service.getAttendanceSummary(meetingId);
    res.write(`data: ${JSON.stringify({ type: 'snapshot', payload: snapshot })}\n\n`);

    // Subscribe to live updates
    const subscriber = redis.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(`meeting:${meetingId}:checkin`, (message) => {
      res.write(`data: ${JSON.stringify({ type: 'checkin', payload: JSON.parse(message) })}\n\n`);
    });

    req.on('close', async () => {
      await subscriber.unsubscribe();
      await subscriber.quit();
    });
  };

  sendInvites = async (req: Request, res: Response) => {
    const { userIds, emails } = req.body;
    const result = await this.service.sendInvites(req.params.id, userIds, emails);
    res.json({ success: true, data: result });
  };

  addSession = async (req: Request, res: Response) => {
    const session = await this.service.addSession(req.params.id, req.body);
    res.status(201).json({ success: true, data: session });
  };

  exportAttendance = async (req: Request, res: Response) => {
    const { format = 'pdf' } = req.query;
    const filters = { meetingId: req.params.id };

    if (format === 'pdf') {
      const buffer = await this.reportService.exportToPDF(filters);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${req.params.id}.pdf"`);
      return res.send(buffer);
    }
    if (format === 'excel') {
      const buffer = await this.reportService.exportToExcel(filters);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${req.params.id}.xlsx"`);
      return res.send(buffer);
    }
    const csv = await this.reportService.exportToCSV(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${req.params.id}.csv"`);
    return res.send(csv);
  };
}

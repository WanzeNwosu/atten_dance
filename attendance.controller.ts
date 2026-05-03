// src/controllers/attendance.controller.ts
import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

export class AttendanceController {
  private service = new AttendanceService();

  qrCheckin = async (req: Request, res: Response) => {
    const record = await this.service.qrCheckin({
      userId: req.user!.id,
      qrToken: req.body.qrToken,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      gpsAccuracy: req.body.gpsAccuracy,
      deviceId: req.body.deviceId || req.headers['x-device-id'] as string,
      ipAddress: req.ip,
      faceDescriptor: req.body.faceDescriptor,
    });
    res.status(201).json({ success: true, data: record });
  };

  codeCheckin = async (req: Request, res: Response) => {
    const record = await this.service.codeCheckin({
      userId: req.user!.id,
      code: req.body.code,
      selfieData: req.body.selfieDescriptor,
      deviceId: req.body.deviceId || req.headers['x-device-id'] as string,
      ipAddress: req.ip,
    });
    res.status(201).json({ success: true, data: record });
  };

  manualCheckin = async (req: Request, res: Response) => {
    const record = await this.service.manualCheckin({
      userId: req.body.userId,
      meetingId: req.body.meetingId,
      overrideBy: req.user!.id,
      overrideReason: req.body.overrideReason,
      status: req.body.status,
    });
    res.status(201).json({ success: true, data: record });
  };

  checkout = async (req: Request, res: Response) => {
    const record = await this.service.checkout(req.user!.id, req.params.recordId);
    res.json({ success: true, data: record });
  };

  myHistory = async (req: Request, res: Response) => {
    const { page, limit, from, to } = req.query;
    const result = await this.service.getMyHistory(req.user!.id, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });
    res.json({ success: true, data: result });
  };

  myStats = async (req: Request, res: Response) => {
    const stats = await this.service.getMyStats(req.user!.id);
    res.json({ success: true, data: stats });
  };

  userHistory = async (req: Request, res: Response) => {
    const { page, limit, from, to } = req.query;
    const result = await this.service.getMyHistory(req.params.userId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });
    res.json({ success: true, data: result });
  };

  updateRecord = async (req: Request, res: Response) => {
    const { prisma } = await import('../config/database');
    const record = await prisma.attendanceRecord.update({
      where: { id: req.params.recordId },
      data: {
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.notes !== undefined && { notes: req.body.notes }),
        ...(req.body.overrideReason && {
          isManualOverride: true,
          overrideBy: req.user!.id,
          overrideReason: req.body.overrideReason,
        }),
      },
    });
    res.json({ success: true, data: record });
  };

  bulkOverride = async (req: Request, res: Response) => {
    const { records, reason } = req.body;
    const { prisma } = await import('../config/database');
    const results = [];
    for (const r of records) {
      const record = await prisma.attendanceRecord.upsert({
        where: { userId_meetingId: { userId: r.userId, meetingId: r.meetingId } },
        create: {
          userId: r.userId,
          meetingId: r.meetingId,
          status: r.status,
          isManualOverride: true,
          overrideBy: req.user!.id,
          overrideReason: reason,
        },
        update: {
          status: r.status,
          isManualOverride: true,
          overrideBy: req.user!.id,
          overrideReason: reason,
        },
      });
      results.push(record);
    }
    res.json({ success: true, data: results });
  };

  revalidate = async (req: Request, res: Response) => {
    const { prisma } = await import('../config/database');
    const record = await prisma.attendanceRecord.findFirst({
      where: { id: req.params.recordId, userId: req.user!.id },
    });
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    // Mark last revalidation time in metadata
    await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { updatedAt: new Date() },
    });
    res.json({ success: true, message: 'Revalidation recorded' });
  };
}

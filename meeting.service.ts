// src/services/meeting.service.ts
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { EmailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';

const emailService = new EmailService();

export class MeetingService {
  async list(options: {
    organizationId?: string;
    departmentId?: string;
    from?: Date;
    to?: Date;
    type?: string;
    page: number;
    limit: number;
    userId?: string;
  }) {
    const { page, limit, organizationId, departmentId, from, to, type, userId } = options;
    const where: any = { isCancelled: false };

    if (organizationId) where.organizationId = organizationId;
    if (departmentId) where.departmentId = departmentId;
    if (type) where.type = type;
    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = from;
      if (to) where.startTime.lte = to;
    }

    const [meetings, total] = await prisma.$transaction([
      prisma.meeting.findMany({
        where,
        include: {
          host: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          department: { select: { id: true, name: true } },
          _count: { select: { attendance: true } },
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.meeting.count({ where }),
    ]);

    return { meetings, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getUpcoming(userId: string, organizationId?: string) {
    const now = new Date();
    return prisma.meeting.findMany({
      where: {
        isCancelled: false,
        endTime: { gte: now },
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        host: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
    });
  }

  async getById(id: string, requestingUserId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true } },
        department: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, logoUrl: true } },
        sessions: true,
        qrKeys: {
          where: { status: 'ACTIVE', expiresAt: { gt: new Date() } },
          select: { id: true, token: true, expiresAt: true, isDynamic: true, scansCount: true },
        },
        _count: { select: { attendance: true, invites: true } },
      },
    });
    if (!meeting) throw new AppError('Meeting not found', 404);
    return meeting;
  }

  async create(data: any) {
    return prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        hostId: data.hostId,
        type: data.type || 'PHYSICAL',
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        timezone: data.timezone || 'UTC',
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        geofenceRadius: data.geofenceRadius || 50,
        virtualLink: data.virtualLink,
        requireBiometric: data.requireBiometric || false,
        requireGPS: data.requireGPS || false,
        lateThresholdMin: data.lateThresholdMin || 15,
        checkInOpenMin: data.checkInOpenMin || 30,
        checkInCloseMin: data.checkInCloseMin || 60,
        maxAttendees: data.maxAttendees,
      },
      include: {
        host: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } },
      },
    });
  }

  async update(id: string, data: any, requestingUserId: string, role: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new AppError('Meeting not found', 404);
    if (meeting.hostId !== requestingUserId && !['ORG_ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(role)) {
      throw new AppError('Not authorized to update this meeting', 403);
    }

    return prisma.meeting.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startTime && { startTime: new Date(data.startTime) }),
        ...(data.endTime && { endTime: new Date(data.endTime) }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.geofenceRadius && { geofenceRadius: data.geofenceRadius }),
        ...(data.requireBiometric !== undefined && { requireBiometric: data.requireBiometric }),
        ...(data.requireGPS !== undefined && { requireGPS: data.requireGPS }),
        ...(data.maxAttendees !== undefined && { maxAttendees: data.maxAttendees }),
      },
    });
  }

  async delete(id: string, requestingUserId: string, role: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new AppError('Meeting not found', 404);
    if (meeting.hostId !== requestingUserId && !['ORG_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      throw new AppError('Not authorized to delete this meeting', 403);
    }
    await prisma.meeting.update({
      where: { id },
      data: { isCancelled: true, isActive: false },
    });
  }

  async getAttendanceSummary(meetingId: string) {
    const [meeting, records] = await prisma.$transaction([
      prisma.meeting.findUnique({
        where: { id: meetingId },
        select: { title: true, startTime: true, endTime: true, maxAttendees: true },
      }),
      prisma.attendanceRecord.findMany({
        where: { meetingId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, employeeId: true } },
        },
        orderBy: { checkInAt: 'desc' },
      }),
    ]);

    if (!meeting) throw new AppError('Meeting not found', 404);

    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      excused: records.filter(r => r.status === 'EXCUSED').length,
    };

    return { meeting, records, stats };
  }

  async sendInvites(meetingId: string, userIds: string[], emails: string[]) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { organization: true },
    });
    if (!meeting) throw new AppError('Meeting not found', 404);

    const results = [];
    const expiresAt = new Date(meeting.startTime.getTime() + 24 * 60 * 60 * 1000);

    // Invite registered users
    for (const userId of (userIds || [])) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
      if (!user) continue;
      const invite = await prisma.meetingInvite.create({
        data: { meetingId, userId, email: user.email, expiresAt },
      });
      await emailService.sendMeetingInvite(user.email, user.firstName, meeting, invite.token);
      results.push({ userId, email: user.email, status: 'sent' });
    }

    // Invite by email
    for (const email of (emails || [])) {
      const invite = await prisma.meetingInvite.create({
        data: { meetingId, email, expiresAt },
      });
      await emailService.sendMeetingInvite(email, 'Guest', meeting, invite.token);
      results.push({ email, status: 'sent' });
    }

    return results;
  }

  async addSession(meetingId: string, data: any) {
    return prisma.meetingSession.create({
      data: {
        meetingId,
        title: data.title,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        location: data.location,
      },
    });
  }
}

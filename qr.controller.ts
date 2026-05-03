// src/controllers/qr.controller.ts
import { Request, Response } from 'express';
import { QRService } from '../services/qr.service';

export class QRController {
  private service = new QRService();

  generate = async (req: Request, res: Response) => {
    const result = await this.service.generateForMeeting(
      req.body.meetingId,
      req.user!.organizationId!,
      {
        isDynamic: req.body.isDynamic,
        rotateSeconds: req.body.rotateSeconds,
        expiryMinutes: req.body.expiryMinutes,
        maxScans: req.body.maxScans,
      }
    );
    res.status(201).json({ success: true, data: result });
  };

  getActive = async (req: Request, res: Response) => {
    const result = await this.service.getActiveQRForMeeting(req.params.meetingId);
    res.json({ success: true, data: result });
  };

  validate = async (req: Request, res: Response) => {
    const qrKey = await this.service.validateToken(req.body.token);
    res.json({ success: true, data: { valid: true, meetingId: qrKey.meetingId } });
  };

  revoke = async (req: Request, res: Response) => {
    const key = await this.service.revokeQR(req.params.keyId);
    res.json({ success: true, data: key });
  };

  getImage = async (req: Request, res: Response) => {
    const buffer = await this.service.getQRImage(req.params.meetingId);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  };

  streamDynamic = async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const meetingId = req.params.meetingId;
    const { redis } = await import('../config/redis');
    const subscriber = redis.duplicate();
    await subscriber.connect();

    // Send initial QR
    const active = await this.service.getActiveQRForMeeting(meetingId);
    if (active) {
      res.write(`data: ${JSON.stringify(active)}\n\n`);
    }

    await subscriber.subscribe(`qr:dynamic:${meetingId}`, (message) => {
      res.write(`data: ${message}\n\n`);
    });

    req.on('close', async () => {
      await subscriber.unsubscribe();
      await subscriber.quit();
    });
  };
}

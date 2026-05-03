// src/routes/biometric.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { BiometricService } from '../services/biometric.service';

const router = Router();
const service = new BiometricService();

router.use(authenticate);

// POST /biometric/face/enroll — enroll face (send 128-float descriptor array)
router.post('/face/enroll', async (req, res) => {
  const { descriptor, livenessScore } = req.body;
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ success: false, error: 'descriptor must be array of 128 floats' });
  }
  await service.enrollFace(req.user!.id, descriptor, livenessScore);
  res.json({ success: true, message: 'Face enrolled successfully' });
});

// POST /biometric/face/verify — verify face against stored profile
router.post('/face/verify', async (req, res) => {
  const { descriptor, livenessScore } = req.body;
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ success: false, error: 'descriptor must be array of 128 floats' });
  }
  const result = await service.verifyFace(req.user!.id, descriptor, livenessScore);
  res.json({ success: true, data: result });
});

// DELETE /biometric/face — remove face data
router.delete('/face', async (req, res) => {
  const { prisma } = await import('../config/database');
  await prisma.faceData.deleteMany({ where: { userId: req.user!.id } });
  res.json({ success: true, message: 'Face data removed' });
});

// GET /biometric/fingerprint/challenge — get challenge for fingerprint assertion
router.get('/fingerprint/challenge', async (req, res) => {
  const challenge = await service.generateFingerprintChallenge(req.user!.id);
  res.json({ success: true, data: { challenge } });
});

// POST /biometric/fingerprint/enroll — register device fingerprint handle
router.post('/fingerprint/enroll', async (req, res) => {
  const { platformHandle, platform, deviceId } = req.body;
  if (!platformHandle || !platform || !deviceId) {
    return res.status(400).json({ success: false, error: 'platformHandle, platform, deviceId required' });
  }
  await service.enrollFingerprint(req.user!.id, platformHandle, platform, deviceId);
  res.json({ success: true, message: 'Fingerprint enrolled' });
});

// POST /biometric/fingerprint/verify — verify signed challenge
router.post('/fingerprint/verify', async (req, res) => {
  const { signedChallenge, deviceId } = req.body;
  const verified = await service.verifyFingerprintResponse(req.user!.id, signedChallenge, deviceId);
  res.json({ success: true, data: { verified } });
});

// GET /biometric/status — check enrollment status
router.get('/status', async (req, res) => {
  const { prisma } = await import('../config/database');
  const [faceData, biometricData] = await Promise.all([
    prisma.faceData.findUnique({ where: { userId: req.user!.id }, select: { isActive: true, enrolledAt: true } }),
    prisma.biometricData.findUnique({ where: { userId: req.user!.id }, select: { enrolledAt: true, platform: true } }),
  ]);
  res.json({ success: true, data: { faceEnrolled: !!faceData?.isActive, fingerprintEnrolled: !!biometricData, faceData, biometricData } });
});

export default router;

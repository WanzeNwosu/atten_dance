// src/screens/meeting/ScanQRScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Application from 'expo-application';
import { BarCodeScanner } from 'expo-camera';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { saveOfflineCheckin } from '../../db/localDB';
import { v4 as uuid } from 'uuid';

type ScanState = 'idle' | 'scanning' | 'locating' | 'verifying' | 'submitting' | 'done' | 'error';

export default function ScanQRScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scannedToken, setScannedToken] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { user } = useAuthStore();
  const lastScan = useRef(0);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCode = async ({ data }: { data: string }) => {
    // Debounce scans
    if (Date.now() - lastScan.current < 3000) return;
    if (scanState !== 'idle') return;
    lastScan.current = Date.now();

    // Extract token from QR URL: ?t=TOKEN
    const tokenMatch = data.match(/[?&]t=([^&]+)/);
    const token = tokenMatch ? tokenMatch[1] : data;
    if (!token) return;

    setScannedToken(token);
    await processCheckin(token);
  };

  const processCheckin = async (qrToken: string) => {
    try {
      // Step 1: Get GPS
      setScanState('locating');
      setStatusMessage('Getting your location...');
      let latitude: number | undefined;
      let longitude: number | undefined;
      let gpsAccuracy: number | undefined;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
        gpsAccuracy = loc.coords.accuracy;
      }

      // Step 2: Biometric verification (optional)
      setScanState('verifying');
      setStatusMessage('Verify your identity...');
      let biometricPassed = false;
      const hasBiometric = await LocalAuthentication.hasHardwareAsync();
      if (hasBiometric) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity to check in',
          fallbackLabel: 'Use passcode',
        });
        biometricPassed = result.success;
      }

      // Step 3: Submit check-in
      setScanState('submitting');
      setStatusMessage('Recording attendance...');
      const deviceId = (Application.androidId || Application.applicationId) ?? 'unknown';

      try {
        const res: any = await apiService.post('/attendance/checkin/qr', {
          qrToken, latitude, longitude, gpsAccuracy, deviceId,
        });

        setScanState('done');
        const { status: attendStatus } = res.data;
        setStatusMessage(`✅ Checked in — ${attendStatus === 'LATE' ? 'Marked as late' : 'On time!'}`);

      } catch (apiError: any) {
        // Offline fallback
        if (apiError.code === 'ECONNABORTED' || !apiError.response) {
          await saveOfflineCheckin({
            id: uuid(), meetingId: '', userId: user!.id,
            checkInAt: new Date().toISOString(), method: 'QR_CODE', qrToken,
            latitude, longitude, gpsAccuracy, qrVerified: true,
            gpsVerified: !!latitude, deviceId,
          });
          setScanState('done');
          setStatusMessage('📲 Saved offline — will sync when online');
        } else {
          throw apiError;
        }
      }

    } catch (err: any) {
      setScanState('error');
      setStatusMessage(err?.error || err?.message || 'Check-in failed');
    } finally {
      setTimeout(() => { setScanState('idle'); setStatusMessage(''); setScannedToken(''); }, 3000);
    }
  };

  if (hasPermission === null) return <View style={S.center}><ActivityIndicator color="#818cf8" /></View>;
  if (!hasPermission) return (
    <View style={S.center}>
      <Text style={S.errorText}>Camera permission required</Text>
      <TouchableOpacity style={S.btn} onPress={() => Camera.requestCameraPermissionsAsync()}>
        <Text style={S.btnText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={S.container}>
      <Text style={S.title}>Scan QR Code</Text>

      <View style={S.scanArea}>
        {scanState === 'idle' ? (
          <Camera style={S.camera} type={Camera.Constants.Type.back}
            barCodeScannerSettings={{ barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr] }}
            onBarCodeScanned={handleBarCode}>
            {/* Scan overlay */}
            <View style={S.overlay}>
              <View style={S.scanFrame}>
                <View style={[S.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                <View style={[S.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
                <View style={[S.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                <View style={[S.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
              </View>
              <Text style={S.scanHint}>Point camera at the meeting QR code</Text>
            </View>
          </Camera>
        ) : (
          <View style={S.statusBox}>
            <Text style={S.stateIcon}>
              {scanState === 'done' ? '✅' : scanState === 'error' ? '❌' : '⏳'}
            </Text>
            <Text style={S.statusState}>
              {scanState === 'locating' ? 'Getting Location' :
               scanState === 'verifying' ? 'Verifying Identity' :
               scanState === 'submitting' ? 'Submitting' :
               scanState === 'done' ? 'Success!' : 'Error'}
            </Text>
            <Text style={S.statusMsg}>{statusMessage}</Text>
            {scanState !== 'done' && scanState !== 'error' && <ActivityIndicator color="#818cf8" style={{ marginTop: 16 }} />}
          </View>
        )}
      </View>

      {/* Manual code entry */}
      <TouchableOpacity style={S.manualBtn} onPress={() => navigation.navigate('Checkin', { mode: 'code' })}>
        <Text style={S.manualText}>Enter meeting code manually</Text>
      </TouchableOpacity>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingTop: 60 },
  center: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 24, paddingHorizontal: 24 },
  scanArea: { flex: 1, marginHorizontal: 24, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111827' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#818cf8' },
  scanHint: { color: '#d1d5db', fontSize: 14, marginTop: 24, textAlign: 'center', paddingHorizontal: 20 },
  statusBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  stateIcon: { fontSize: 48, marginBottom: 16 },
  statusState: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  statusMsg: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  manualBtn: { padding: 24, alignItems: 'center' },
  manualText: { color: '#818cf8', fontSize: 14 },
});

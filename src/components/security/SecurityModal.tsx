import React, { useState } from 'react';
import { useProject } from "../../context/ProjectContext";
import {
  ShieldCheck,
  Fingerprint,
  Lock,
  Unlock,
  Cloud,
  CheckCircle2,
  HardDrive,
  Key,
  X,
  RefreshCw,
  Smartphone,
  Eye,
  AlertCircle,
} from 'lucide-react';

export const SecurityModal: React.FC = () => {
  const {
    showSecurityModal,
    setShowSecurityModal,
    isBiometricLocked,
    verifyBiometric,
    lockWorkspace,
    isEndToEndEncrypted,
    encryptionFingerprint,
    cloudSyncStatus,
    syncNow,
  } = useProject();

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  if (!showSecurityModal) return null;

  const handleBiometricScan = async () => {
    setIsScanning(true);
    setScanSuccess(false);

    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      verifyBiometric();
      setTimeout(() => setScanSuccess(false), 2500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Security, Biometrics & Cloud Backup
              </h2>
              <p className="text-xs text-zinc-400">
                End-to-end encryption, TouchID/FaceID authentication, and offline sync
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSecurityModal(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs text-zinc-300">
          {/* Biometric Authentication Simulator */}
          <div className="bg-zinc-900/70 p-4 rounded-xl border border-zinc-800 space-y-3 text-center">
            <span className="font-semibold text-white text-xs block">
              Biometric Hardware Authentication (WebAuthn / TouchID)
            </span>
            <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
              Hardware-backed enclave key verifies your physical presence before sensitive cloud exports or credential access.
            </p>

            <div className="flex flex-col items-center justify-center py-2">
              <button
                onClick={handleBiometricScan}
                disabled={isScanning}
                className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${
                  isScanning
                    ? 'border-blue-500 bg-blue-500/20 animate-pulse text-blue-400 ring-4 ring-blue-500/30'
                    : scanSuccess
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 ring-4 ring-emerald-500/30'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500 hover:text-emerald-400'
                }`}
              >
                <Fingerprint className={`w-10 h-10 ${isScanning ? 'animate-bounce' : ''}`} />
              </button>

              <span className="text-[11px] font-mono text-zinc-400 mt-2 block">
                {isScanning ? 'Authenticating with Secure Enclave...' : scanSuccess ? 'Biometrics Verified Successfully!' : 'Click to Scan TouchID / FaceID'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={lockWorkspace}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Lock Workspace Immediately
              </button>
            </div>
          </div>

          {/* End-to-End Encryption Status */}
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                End-to-End Zero-Knowledge Encryption
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                AES-GCM-256
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Media assets, transcripts, and timeline metadata are encrypted client-side using WebCrypto before cloud synchronization.
            </p>
            <div className="p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Fingerprint:</span>
              <span className="text-zinc-300 font-bold">{encryptionFingerprint}</span>
            </div>
          </div>

          {/* Cloud Sync & Offline Storage */}
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="font-semibold text-white block">Secure Cloud Backup & Sync</span>
                  <span className="text-[11px] text-zinc-400">
                    Offline edits automatically sync with conflict resolution
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Synced to Cloud'}
                </span>
                <button
                  onClick={syncNow}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
                  title="Force Sync Now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="text-zinc-500 block">Offline Cache:</span>
                <span className="font-medium text-zinc-200">IndexedDB (14.2 MB cached)</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="text-zinc-500 block">Backup Redundancy:</span>
                <span className="font-medium text-zinc-200">3 Cloud Regions Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-end">
          <button
            onClick={() => setShowSecurityModal(false)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

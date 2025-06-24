'use client';

import { useState } from 'react';
import { enrollMfaAction, verifyMfaAction, unenrollMfaAction } from './mfa_actions';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';
import { useConfirmationModal } from '@/context/ConfirmationModalContext';

interface MfaManagerProps {
  isMfaEnabled: boolean;
  factors: any[];
}

export default function MfaManager({ isMfaEnabled, factors }: MfaManagerProps) {
  const { showToast } = useToast();
  const { showConfirmation } = useConfirmationModal();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      const result = await enrollMfaAction();
      if (result.error) {
        showToast(result.error, 'error');
      } else if (result.qrCodeDataUrl && result.factorId) {
        setFactorId(result.factorId);
        setQrCode(result.qrCodeDataUrl);
      } else {
        showToast('An unknown error occurred during enrollment.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'An unexpected client-side error occurred.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: This function has been wrapped in a try/catch/finally block for robustness.
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('code', verifyCode);
      formData.append('factorId', factorId);

      const result = await verifyMfaAction(formData);

      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Two-Factor Authentication has been enabled!', 'success');
        setQrCode(null);
        // Reload the page to show the updated MFA status ("Disable 2FA" button)
        window.location.reload();
      }
    } catch (error: any) {
      showToast(error.message || 'An unexpected error occurred during verification.', 'error');
    } finally {
      // This guarantees the loading state is always turned off.
      setIsLoading(false);
    }
  };
  
  const handleUnenroll = async () => {
    const totpFactor = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');
    if (!totpFactor) {
      showToast('No verified authenticator app found.', 'error');
      return;
    }
    showConfirmation({
        title: 'Disable Two-Factor Authentication',
        message: 'Are you sure you want to disable 2FA? This will reduce the security of your account.',
        onConfirm: async () => {
            const result = await unenrollMfaAction(totpFactor.id);
            if (result.success) {
                showToast('Two-Factor Authentication has been disabled.', 'info');
                window.location.reload();
            } else if (result.error) {
                showToast(result.error, 'error');
            }
        },
    });
  };

  return (
    <div className="p-6 border-t mt-6">
        <h3 className="text-xl font-semibold text-text-primary mb-2">Two-Factor Authentication (2FA)</h3>
        {isMfaEnabled ? (
            <div>
                <p className="text-text-secondary mb-4">You have an authenticator app enabled.</p>
                <button
                    onClick={handleUnenroll}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                    Disable 2FA
                </button>
            </div>
        ) : (
            <div>
                <p className="text-text-secondary mb-4">Add an extra layer of security to your account.</p>
                <button
                    onClick={handleEnroll}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark disabled:bg-gray-400"
                >
                    {isLoading ? 'Generating...' : 'Enable 2FA'}
                </button>
            </div>
        )}

        {qrCode && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm p-8 text-center">
                    <h2 className="text-xl font-bold text-text-primary">Set Up Authenticator App</h2>
                    <p className="text-text-secondary mt-2 mb-4">Scan this QR code with an authenticator app like Google Authenticator or Authy.</p>
                    <Image src={qrCode} alt="MFA QR Code" width={200} height={200} className="mx-auto my-4" />
                    <p className="text-sm text-text-secondary">Then, enter the 6-digit code from your app below to verify and complete the setup.</p>
                    <form onSubmit={handleVerify} className="mt-4 flex flex-col items-center gap-4">
                        <input
                            type="text"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            required
                            className="w-48 text-center tracking-[0.5em] text-2xl p-2 border rounded-md"
                        />
                        <div className="flex gap-4">
                             <button type="button" onClick={() => setQrCode(null)} className="px-6 py-2 font-semibold text-text-primary bg-gray-200 hover:bg-gray-300 rounded-lg">Cancel</button>
                            <button type="submit" disabled={isLoading} className="px-6 py-2 font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg disabled:bg-gray-400">
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
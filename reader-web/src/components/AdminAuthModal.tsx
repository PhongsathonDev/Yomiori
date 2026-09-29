import { useState } from 'react';
import { X, Lock, Unlock, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

export function AdminAuthModal({
  isOpen,
  onClose,
  isUnlocked,
  onUnlock,
  onLock,
}: AdminAuthModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234
    if (pin.trim() === '1234') {
      setError(false);
      setPin('');
      onUnlock();
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-elevated)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isUnlocked ? 'rgba(74, 140, 92, 0.15)' : 'rgba(184, 74, 57, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isUnlocked ? '#4a8c5c' : 'var(--accent-primary)',
              }}
            >
              {isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {isUnlocked ? 'โหมดแก้ไขเปิดใช้งานอยู่' : 'ปลดล็อกโหมดแก้ไข (Admin PIN)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {isUnlocked ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '0.85rem',
                backgroundColor: 'rgba(74, 140, 92, 0.08)',
                border: '1px solid rgba(74, 140, 92, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                marginBottom: '1.25rem',
              }}
            >
              <ShieldCheck size={20} color="#4a8c5c" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>สถานะ: ปลดล็อกแล้ว</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  คุณสามารถคลิกปุ่มดินสอเพื่อแก้ไขข้อมูลนิยาย และบันทึกลงไฟล์ JSON ได้โดยตรง
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onLock();
                onClose();
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              🔒 ล็อกโหมดแก้ไข (Lock Mode)
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              กรอกรหัส Admin PIN เพื่อเปิดสิทธิ์การแก้ไขข้อมูลนิยายผ่านหน้าเว็บ (ค่าเริ่มต้น: <code>1234</code>)
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                maxLength={8}
                placeholder="กรอก PIN (1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: error ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '1.1rem',
                  letterSpacing: '3px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '0.8rem', marginTop: '6px' }}>
                  <AlertCircle size={14} />
                  <span>รหัส PIN ไม่ถูกต้อง (ค่าเริ่มต้นคือ 1234)</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                style={{
                  flex: 1.5,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(184, 74, 57, 0.25)',
                }}
              >
                ปลดล็อก
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

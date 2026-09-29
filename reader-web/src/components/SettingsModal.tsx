import React from 'react';
import type { ReaderTheme, ReaderFontFamily, AvatarStyle } from '../types';
import { Settings, X, Moon, Sun, Coffee } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ReaderTheme;
  setTheme: (t: ReaderTheme) => void;
  fontFamily: ReaderFontFamily;
  setFontFamily: (f: ReaderFontFamily) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  lineHeight: number;
  setLineHeight: (lh: number) => void;
  avatarStyle: AvatarStyle;
  setAvatarStyle: (as: AvatarStyle) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  avatarStyle,
  setAvatarStyle,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--shadow-elevated)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                ตั้งค่าการอ่าน (Reader Settings)
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ปรับธีม ขนาดตัวอักษร และรูปแบบการแสดงผล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings Body */}
        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Theme Selection */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              ธีมสีหน้าจอ
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <button
                onClick={() => setTheme('light')}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#f7f5f0',
                  border: `2px solid ${theme === 'light' ? 'var(--accent-primary)' : '#eae5dc'}`,
                  color: '#2b2825',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Sun size={18} color="#b84a39" />
                Muji Washi
              </button>

              <button
                onClick={() => setTheme('dark')}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#181816',
                  border: `2px solid ${theme === 'dark' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                  color: '#ede9e3',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Moon size={18} color="var(--accent-primary)" />
                Muji Sumi
              </button>

              <button
                onClick={() => setTheme('sepia')}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#f2ede2',
                  border: `2px solid ${theme === 'sepia' ? 'var(--accent-primary)' : '#ded7cb'}`,
                  color: '#2b2219',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Coffee size={18} color="#a16c3b" />
                Muji Hinoki
              </button>
            </div>
          </div>

          {/* Font Family Selection */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              รูปแบบตัวอักษร (Japanese Zen Typography)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {[
                { id: 'prompt', label: 'Muji Sans (IBM)', fontClass: 'font-prompt' },
                { id: 'sarabun', label: 'Book Serif (วรรณกรรม)', fontClass: 'font-sarabun' },
                { id: 'sans', label: 'Clean Latin', fontClass: 'font-sans' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id as ReaderFontFamily)}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${fontFamily === f.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: fontFamily === f.id ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                  className={f.fontClass}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Line Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>ขนาดตัวอักษร</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{fontSize}px</span>
              </div>
              <input
                type="range"
                min="15"
                max="26"
                step="1"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>ระยะบรรทัด</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{lineHeight}x</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="2.2"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Avatar Display Style */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              รูปแบบการแสดงบทสนทนา (Dialogue Style)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => setAvatarStyle('avatar_with_badge')}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${avatarStyle === 'avatar_with_badge' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: avatarStyle === 'avatar_with_badge' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>✨ รูป Avatar + แถบสี</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>มีรูปหน้าตัวละครและสีประจำตัว</div>
              </button>

              <button
                onClick={() => setAvatarStyle('badge_only')}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${avatarStyle === 'badge_only' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: avatarStyle === 'badge_only' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>🏷️ แถบสีชื่อกะทัดรัด</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>เรียบง่าย ไม่กินพื้นที่จอ</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

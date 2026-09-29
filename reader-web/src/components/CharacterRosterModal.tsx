import React from 'react';
import type { Character } from '../types';
import { Users, X } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

interface CharacterRosterModalProps {
  characters: Character[];
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterRosterModal: React.FC<CharacterRosterModalProps> = ({
  characters,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
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
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-elevated)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                สมุดรายชื่อตัวละคร (Global Cast)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ตัวละครทั้งหมดในเรื่อง พร้อมสีประจำตัวและภาพประกอบ
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
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Character Grid */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {characters.map((char) => (
            <div
              key={char.id}
              style={{
                display: 'flex',
                gap: '1.25rem',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: `1.5px solid ${char.color}35`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Left Accent Bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '5px',
                  backgroundColor: char.color,
                }}
              />

              {/* Portrait */}
              <div style={{ flexShrink: 0, position: 'relative' }}>
                {char.avatarUrl ? (
                  <img
                    src={getAssetUrl(char.avatarUrl)}
                    alt={char.name}
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      border: `2.5px solid ${char.color}`,
                      boxShadow: `0 4px 14px ${char.color}30`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: `${char.color}20`,
                      border: `2.5px solid ${char.color}`,
                      color: char.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.8rem',
                    }}
                  >
                    {char.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Bio & Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {char.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: `${char.color}20`,
                        color: char.color,
                        border: `1px solid ${char.color}40`,
                      }}
                    >
                      {char.role}
                    </span>
                  </div>

                  {/* Color Swatch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: char.color,
                        boxShadow: `0 0 8px ${char.color}`,
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-faint)' }}>
                      {char.color}
                    </span>
                  </div>
                </div>

                {char.aliases && char.aliases.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginBottom: '6px' }}>
                    ชื่อเรียกอื่น: {char.aliases.join(' · ')}
                  </div>
                )}

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {char.description || 'ยังไม่มีคำอธิบายเพิ่มเติม'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
            💡 ข้อมูลตัวละครทั้งหมดถูกเก็บไว้ใน <code style={{ color: 'var(--accent-primary)' }}>characters.json</code>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { Chapter } from '../types';
import { BookOpen, X, ChevronRight, CheckCircle2 } from 'lucide-react';

interface TableOfContentsModalProps {
  chapters: Chapter[];
  currentChapterId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectChapter: (chapterId: string) => void;
}

export const TableOfContentsModal: React.FC<TableOfContentsModalProps> = ({
  chapters,
  currentChapterId,
  isOpen,
  onClose,
  onSelectChapter,
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
          maxWidth: '560px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
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
              <BookOpen size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                สารบัญรายชื่อตอน
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ทั้งหมด {chapters.length} ตอนที่พร้อมอ่านในระบบ
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

        {/* Chapter List */}
        <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chapters.map((ch) => {
            const isCurrent = ch.id === currentChapterId;
            const dialogueCount = ch.blocks.filter((b) => b.type === 'dialogue').length;

            return (
              <button
                key={ch.id}
                onClick={() => {
                  onSelectChapter(ch.id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${isCurrent ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: isCurrent ? 'var(--bg-surface-elevated)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      color: isCurrent ? '#fff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {ch.chapterNumber}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--accent-primary)' : 'var(--text-main)',
                      }}
                    >
                      {ch.title}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                      บทสนทนา {dialogueCount} บรรทัด · รวม {ch.blocks.length} บล็อก
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isCurrent ? 'var(--accent-primary)' : 'var(--text-faint)' }}>
                  {isCurrent ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

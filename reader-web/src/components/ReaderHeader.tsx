import { BookOpen, Users, Settings, ChevronLeft, ChevronRight, Moon, Sun, Coffee, Lock, Unlock } from 'lucide-react';
import type { Chapter, ReaderTheme } from '../types';

interface ReaderHeaderProps {
  currentChapter: Chapter;
  totalChapters: number;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onOpenToc: () => void;
  onOpenRoster: () => void;
  onOpenSettings: () => void;
  onBackToLibrary: () => void;
  theme: ReaderTheme;
  onToggleTheme: () => void;
  onOpenAdminModal?: () => void;
  isAdminUnlocked?: boolean;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  currentChapter,
  totalChapters,
  onPrevChapter,
  onNextChapter,
  hasPrev,
  hasNext,
  onOpenToc,
  onOpenRoster,
  onOpenSettings,
  onBackToLibrary,
  theme,
  onToggleTheme,
  onOpenAdminModal,
  isAdminUnlocked = false,
}) => {
  return (
    <header
      className="glass-panel"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left: Home / Library Button & Table of Contents Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onBackToLibrary}
          title="กลับสู่หน้าคลังนิยาย Yomiori"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.35rem 0.85rem 0.35rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
        >
          <img
            src="/yomiori-logo.png"
            alt="Yomiori"
            style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }}
          />
          <span>คลังนิยาย</span>
        </button>
        <button
          onClick={onOpenToc}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
        >
          <BookOpen size={16} color="var(--accent-primary)" />
          <span>สารบัญตอน ({currentChapter.chapterNumber}/{totalChapters})</span>
        </button>
      </div>

      {/* Center: Chapter Prev/Next navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={onPrevChapter}
          disabled={!hasPrev}
          title="ตอนก่อนหน้า"
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: hasPrev ? 'var(--text-main)' : 'var(--text-faint)',
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            opacity: hasPrev ? 1 : 0.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', padding: '0 4px' }}>
          ตอนที่ {currentChapter.chapterNumber}
        </span>

        <button
          onClick={onNextChapter}
          disabled={!hasNext}
          title="ตอนถัดไป"
          style={{
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: hasNext ? 'var(--text-main)' : 'var(--text-faint)',
            cursor: hasNext ? 'pointer' : 'not-allowed',
            opacity: hasNext ? 1 : 0.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Right: Actions (Cast Roster, Theme toggle, Settings) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          onClick={onOpenRoster}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
        >
          <Users size={16} color="var(--accent-primary)" />
          <span>ตัวละคร</span>
        </button>

        <button
          onClick={onToggleTheme}
          title="สลับธีมสี"
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {theme === 'dark' && <Moon size={16} color="var(--accent-primary)" />}
          {theme === 'light' && <Sun size={16} color="#d97706" />}
          {theme === 'sepia' && <Coffee size={16} color="#a16c3b" />}
        </button>

        <button
          onClick={onOpenSettings}
          title="ตั้งค่าตัวอักษรและหน้าจอ"
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Settings size={16} />
        </button>

        {import.meta.env.DEV && (
          <button
            onClick={onOpenAdminModal}
            title={isAdminUnlocked ? "โหมดแก้ไขเปิดอยู่ (คลิกเพื่อจัดการหรือล็อก)" : "เปิดโหมดแก้ไข (Admin PIN)"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isAdminUnlocked ? 'rgba(74, 140, 92, 0.12)' : 'var(--bg-surface)',
              border: `1px solid ${isAdminUnlocked ? '#4a8c5c' : 'var(--border-subtle)'}`,
              color: isAdminUnlocked ? '#4a8c5c' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all var(--transition-fast)',
            }}
          >
            {isAdminUnlocked ? <Unlock size={14} color="#4a8c5c" /> : <Lock size={14} />}
            <span>{isAdminUnlocked ? 'แก้ไข: เปิด' : 'แก้ไข'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

import React from 'react';
import type { 
  Novel, 
  Chapter, 
  Character, 
  StoryBlock, 
  ReaderTheme, 
  AvatarStyle 
} from '../types';
import { ReaderHeader } from './ReaderHeader';
import { BlockItem } from './BlockItem';
import { ChevronLeft, ChevronRight, Sparkles, ArrowLeft } from 'lucide-react';

export interface ReaderViewProps {
  currentNovel: Novel;
  currentChapter: Chapter;
  currentNovelChapters: Chapter[];
  characters: Character[];
  fontSize: number;
  lineHeight: number;
  avatarStyle: AvatarStyle;
  canEdit: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenToc: () => void;
  onOpenRoster: () => void;
  onOpenSettings: () => void;
  onBackToLibrary: () => void;
  onBackToShelf?: () => void;
  theme: ReaderTheme;
  onToggleTheme: () => void;
  onOpenAdminModal: () => void;
  isAdminUnlocked: boolean;
  readingProgress: number;
  onOpenQuickFix: (block: StoryBlock) => void;
  onOpenCharacterDetail: (character: Character) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  currentNovel,
  currentChapter,
  currentNovelChapters,
  characters,
  fontSize,
  lineHeight,
  avatarStyle,
  canEdit,
  hasPrev,
  hasNext,
  onPrevChapter,
  onNextChapter,
  onOpenToc,
  onOpenRoster,
  onOpenSettings,
  onBackToLibrary,
  onBackToShelf,
  theme,
  onToggleTheme,
  onOpenAdminModal,
  isAdminUnlocked,
  readingProgress,
  onOpenQuickFix,
  onOpenCharacterDetail,
}) => {
  return (
    <div>
      {/* Top Reading Progress Bar */}
      <div className="reading-progress-track">
        <div className="reading-progress-bar" style={{ width: `${readingProgress}%` }} />
      </div>

      {/* Main Glass Header */}
      <ReaderHeader
        currentChapter={currentChapter}
        totalChapters={currentNovelChapters.length}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onOpenToc={onOpenToc}
        onOpenRoster={onOpenRoster}
        onOpenSettings={onOpenSettings}
        onBackToLibrary={onBackToLibrary}
        onBackToShelf={onBackToShelf}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenAdminModal={onOpenAdminModal}
        isAdminUnlocked={isAdminUnlocked}
      />

      {/* Main Reading Container */}
      <main
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '2.5rem 1.5rem 6rem 1.5rem',
        }}
      >
        {/* Chapter Header Banner (Muji Book Style) */}
        <div
          className="animate-fade-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            padding: '2.25rem 2rem',
            marginBottom: '2.75rem',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Chapter Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-subtle)',
                border: '1px solid var(--border-subtle)',
                padding: '3px 12px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <Sparkles size={12} />
              ตอนที่ {currentChapter.chapterNumber}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              lineHeight: 1.45,
              marginBottom: '0.75rem',
              letterSpacing: '-0.01em',
            }}
          >
            {currentChapter.title}
          </h1>

          {/* Novel Subtitle & Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '0.75rem',
            }}
          >
            <div style={{ width: '28px', height: '1px', backgroundColor: 'var(--border-medium)' }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {currentNovel.title || currentChapter.novelTitle}
            </p>
            <div style={{ width: '28px', height: '1px', backgroundColor: 'var(--border-medium)' }} />
          </div>
        </div>

        {/* Story Content Blocks */}
        <div
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
          }}
        >
          {currentChapter.blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              characters={characters}
              avatarStyle={avatarStyle}
              canEdit={canEdit}
              onOpenQuickFix={onOpenQuickFix}
              onOpenCharacterDetail={onOpenCharacterDetail}
            />
          ))}
        </div>

        {/* Bottom Chapter Navigation Bar */}
        <div
          style={{
            marginTop: '3.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <button
            onClick={onPrevChapter}
            disabled={!hasPrev}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-surface)',
              color: hasPrev ? 'var(--text-main)' : 'var(--text-faint)',
              cursor: hasPrev ? 'pointer' : 'not-allowed',
              opacity: hasPrev ? 1 : 0.4,
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)',
            }}
          >
            <ChevronLeft size={18} />
            <span>ตอนก่อนหน้า</span>
          </button>

          <button
            onClick={onBackToLibrary}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.88rem',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <ArrowLeft size={16} />
            <span>กลับหน้าเรื่อง</span>
          </button>

          <button
            onClick={onNextChapter}
            disabled={!hasNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: hasNext ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: hasNext ? '#fff' : 'var(--text-faint)',
              cursor: hasNext ? 'pointer' : 'not-allowed',
              opacity: hasNext ? 1 : 0.4,
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>ตอนถัดไป</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
};

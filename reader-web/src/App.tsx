import { useState, useEffect } from 'react';
import { allNovels, allChapters, allCharacters } from './data';
import type { 
  Character, 
  Chapter, 
  Novel, 
  ViewMode, 
  StoryBlock, 
  ReaderTheme, 
  ReaderFontFamily, 
  AvatarStyle, 
  DialogueBlock, 
  NarrationBlock 
} from './types';
import { ReaderHeader } from './components/ReaderHeader';
import { BlockItem } from './components/BlockItem';
import { QuickFixModal } from './components/QuickFixModal';
import { CharacterRosterModal } from './components/CharacterRosterModal';
import { TableOfContentsModal } from './components/TableOfContentsModal';
import { SettingsModal } from './components/SettingsModal';
import { LibraryView } from './components/LibraryView';
import { EditNovelModal } from './components/EditNovelModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { saveChapterBlock } from './services/localApi';
import { ChevronLeft, ChevronRight, Sparkles, ArrowLeft } from 'lucide-react';

export function App() {
  // Navigation View Mode ('library' | 'reader')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('novel_view_mode') as ViewMode) || 'library';
  });

  // Theme & Preferences
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    return (localStorage.getItem('novel_reader_theme') as ReaderTheme) || 'light';
  });
  const [fontFamily, setFontFamily] = useState<ReaderFontFamily>(() => {
    return (localStorage.getItem('novel_reader_font') as ReaderFontFamily) || 'prompt';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('novel_reader_font_size')) || 18;
  });
  const [lineHeight, setLineHeight] = useState<number>(() => {
    return Number(localStorage.getItem('novel_reader_line_height')) || 1.85;
  });
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('avatar_with_badge');

  // Novel Data State
  const [novels, setNovels] = useState<Novel[]>(allNovels);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);

  // Admin Auth State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('novel_admin_unlocked') === 'true';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const canEdit = import.meta.env.DEV && isAdminUnlocked;

  const handleUnlockAdmin = () => {
    setIsAdminUnlocked(true);
    localStorage.setItem('novel_admin_unlocked', 'true');
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    localStorage.setItem('novel_admin_unlocked', 'false');
  };

  const handleNovelSaved = (updatedNovel: Novel) => {
    setNovels((prev) => prev.map((n) => (n.id === updatedNovel.id ? updatedNovel : n)));
  };

  const [currentNovelId, setCurrentNovelId] = useState<string>(() => {
    return localStorage.getItem('novel_current_id') || 'kyudo-senpai';
  });
  const currentNovel = novels.find((n) => n.id === currentNovelId) || novels[0];

  const [characters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('novel_characters');
    return saved ? JSON.parse(saved) : allCharacters;
  });

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('novel_chapters_override');
    return saved ? JSON.parse(saved) : allChapters;
  });

  const [currentChapterId, setCurrentChapterId] = useState<string>(() => {
    return localStorage.getItem('novel_last_chapter_id') || 'ch-01';
  });

  // Filter chapters belonging to current active novel
  const currentNovelChapters = chapters.filter((c) => c.novelId === currentNovel.id);

  // Modal States
  const [editingBlock, setEditingBlock] = useState<StoryBlock | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Sync Preferences to localStorage
  useEffect(() => {
    localStorage.setItem('novel_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('novel_current_id', currentNovelId);
  }, [currentNovelId]);

  useEffect(() => {
    localStorage.setItem('novel_reader_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('novel_reader_font', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('novel_reader_font_size', String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('novel_reader_line_height', String(lineHeight));
  }, [lineHeight]);

  useEffect(() => {
    localStorage.setItem('novel_last_chapter_id', currentChapterId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentChapterId]);

  // Track Scroll Progress
  useEffect(() => {
    if (viewMode !== 'reader') return;

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const scrollPercent = (totalScroll / windowHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, scrollPercent)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapterId, viewMode]);

  // Find Current Chapter within current novel
  const currentChapterIndex = currentNovelChapters.findIndex((c) => c.id === currentChapterId);
  const currentChapter = currentNovelChapters[currentChapterIndex] || currentNovelChapters[0] || chapters[0];
  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex < currentNovelChapters.length - 1;

  // Handlers for Chapter Nav
  const handlePrev = () => {
    if (hasPrev) setCurrentChapterId(currentNovelChapters[currentChapterIndex - 1].id);
  };

  const handleNext = () => {
    if (hasNext) setCurrentChapterId(currentNovelChapters[currentChapterIndex + 1].id);
  };

  // Toggle Theme cycling (dark -> light -> sepia -> dark)
  const handleToggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'sepia';
      return 'dark';
    });
  };

  // Enter reader from library
  const handleSelectChapterFromLibrary = (chapterId: string) => {
    const targetChapter = chapters.find((c) => c.id === chapterId);
    if (targetChapter) {
      setCurrentNovelId(targetChapter.novelId);
    }
    setCurrentChapterId(chapterId);
    setViewMode('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick Fix Handlers
  const handleUpdateSpeaker = (blockId: string, speakerId: string, speakerName: string) => {
    setChapters((prevChapters) => {
      const updated = prevChapters.map((ch) => {
        if (ch.id !== currentChapter.id) return ch;
        return {
          ...ch,
          blocks: ch.blocks.map((b) => {
            if (b.id !== blockId) return b;
            return {
              ...b,
              type: 'dialogue',
              speakerId,
              speakerName,
            } as DialogueBlock;
          }),
        };
      });
      localStorage.setItem('novel_chapters_override', JSON.stringify(updated));
      return updated;
    });

    if (import.meta.env.DEV) {
      saveChapterBlock(currentNovel.id, currentChapter.id, blockId, {
        speakerId,
        speakerName,
      });
    }
  };

  const handleConvertToNarration = (blockId: string) => {
    let narrationText = '';
    setChapters((prevChapters) => {
      const updated = prevChapters.map((ch) => {
        if (ch.id !== currentChapter.id) return ch;
        return {
          ...ch,
          blocks: ch.blocks.map((b) => {
            if (b.id !== blockId) return b;
            const text = 'text' in b ? b.text : '';
            narrationText = text.replace(/^[“"']|[”"']$/g, '').trim();
            return {
              id: b.id,
              type: 'narration',
              text: narrationText,
            } as NarrationBlock;
          }),
        };
      });
      localStorage.setItem('novel_chapters_override', JSON.stringify(updated));
      return updated;
    });

    if (import.meta.env.DEV) {
      saveChapterBlock(currentNovel.id, currentChapter.id, blockId, {
        text: narrationText,
      });
    }
  };

  const handleSaveBlock = (
    blockId: string,
    newText: string,
    speakerId?: string,
    speakerName?: string
  ) => {
    setChapters((prevChapters) => {
      const updated = prevChapters.map((ch) => {
        if (ch.id !== currentChapter.id) return ch;
        return {
          ...ch,
          blocks: ch.blocks.map((b) => {
            if (b.id !== blockId) return b;
            if (b.type === 'dialogue') {
              return {
                ...b,
                text: newText,
                speakerId: speakerId || b.speakerId,
                speakerName: speakerName || b.speakerName,
              } as DialogueBlock;
            } else {
              return {
                ...b,
                text: newText,
              } as NarrationBlock;
            }
          }),
        };
      });
      localStorage.setItem('novel_chapters_override', JSON.stringify(updated));
      return updated;
    });

    if (import.meta.env.DEV) {
      saveChapterBlock(currentNovel.id, currentChapter.id, blockId, {
        text: newText,
        speakerId,
        speakerName,
      });
    }
  };

  return (
    <div
      className={`theme-${theme} font-${fontFamily}`}
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        transition: 'background-color var(--transition-normal)',
      }}
    >
      {/* View Mode: Library (Home) */}
      {viewMode === 'library' ? (
        <LibraryView
          novels={novels}
          currentNovel={currentNovel}
          onSelectNovel={(novel) => setCurrentNovelId(novel.id)}
          chapters={chapters}
          characters={characters}
          lastReadChapterId={currentChapterId}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenRoster={() => setIsRosterOpen(true)}
          onSelectChapter={handleSelectChapterFromLibrary}
          canEdit={canEdit}
          onEditNovel={(novel) => setEditingNovel(novel)}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
          isAdminUnlocked={isAdminUnlocked}
        />
      ) : (
        /* View Mode: Enhanced Reader */
        <div>
          {/* Top Reading Progress Bar */}
          <div className="reading-progress-track">
            <div className="reading-progress-bar" style={{ width: `${readingProgress}%` }} />
          </div>

          {/* Main Glass Header */}
          <ReaderHeader
            currentChapter={currentChapter}
            totalChapters={currentNovelChapters.length}
            onPrevChapter={handlePrev}
            onNextChapter={handleNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onOpenToc={() => setIsTocOpen(true)}
            onOpenRoster={() => setIsRosterOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onBackToLibrary={() => setViewMode('library')}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenAdminModal={() => setIsAdminModalOpen(true)}
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
                  {currentChapter.novelTitle}
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
                  onOpenQuickFix={(b) => setEditingBlock(b)}
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
                onClick={handlePrev}
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
                onClick={() => setViewMode('library')}
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
                }}
              >
                <ArrowLeft size={16} />
                <span>กลับคลังนิยาย</span>
              </button>

              <button
                onClick={handleNext}
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
      )}

      {/* Shared Modals & Popovers */}
      <QuickFixModal
        block={editingBlock}
        characters={characters}
        onClose={() => setEditingBlock(null)}
        onUpdateSpeaker={handleUpdateSpeaker}
        onConvertToNarration={handleConvertToNarration}
        onSaveBlock={handleSaveBlock}
      />

      <CharacterRosterModal
        characters={characters}
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
      />

      <TableOfContentsModal
        chapters={currentNovelChapters}
        currentChapterId={currentChapterId}
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        onSelectChapter={(id) => {
          setCurrentChapterId(id);
          setViewMode('reader');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
        avatarStyle={avatarStyle}
        setAvatarStyle={setAvatarStyle}
      />

      {/* Edit Novel Metadata Modal */}
      <EditNovelModal
        isOpen={!!editingNovel}
        onClose={() => setEditingNovel(null)}
        novel={editingNovel}
        onSaved={handleNovelSaved}
      />

      {/* Admin PIN Unlock Modal */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isUnlocked={isAdminUnlocked}
        onUnlock={handleUnlockAdmin}
        onLock={handleLockAdmin}
      />
    </div>
  );
}

export default App;

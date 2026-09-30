import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { allNovels, allChapters, allCharacters } from './data';
import type { 
  Character, 
  Chapter, 
  Novel, 
  StoryBlock, 
  ReaderTheme, 
  ReaderFontFamily, 
  AvatarStyle, 
  DialogueBlock, 
  NarrationBlock 
} from './types';
import { QuickFixModal } from './components/QuickFixModal';
import { CharacterRosterModal } from './components/CharacterRosterModal';
import { TableOfContentsModal } from './components/TableOfContentsModal';
import { SettingsModal } from './components/SettingsModal';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { LibraryView } from './components/LibraryView';
import { ReaderView } from './components/ReaderView';
import { EditNovelModal } from './components/EditNovelModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { saveChapterBlock } from './services/localApi';

// Component 1: Bookshelf Page (Home - /)
interface BookshelfPageProps {
  novels: Novel[];
  currentNovel: Novel;
  chapters: Chapter[];
  characters: Character[];
  currentChapterId: string;
  theme: ReaderTheme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenRoster: (novel: Novel) => void;
  onSelectNovel: (novel: Novel) => void;
  canEdit: boolean;
  onEditNovel: (novel: Novel) => void;
  onOpenAdminModal: () => void;
  isAdminUnlocked: boolean;
  onOpenCharacterDetail: (character: Character, novel: Novel) => void;
}

const BookshelfPage: React.FC<BookshelfPageProps> = ({
  novels,
  currentNovel,
  chapters,
  characters,
  currentChapterId,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenRoster,
  onSelectNovel,
  canEdit,
  onEditNovel,
  onOpenAdminModal,
  isAdminUnlocked,
  onOpenCharacterDetail,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Yomiori (読織) - คลังนิยายไลท์โนเวล';
    onSelectNovel(currentNovel);
  }, [currentNovel, onSelectNovel]);

  return (
    <LibraryView
      mode="shelf"
      novels={novels}
      currentNovel={currentNovel}
      onSelectNovel={(novel) => {
        onSelectNovel(novel);
        navigate(`/novel/${novel.id}`);
      }}
      onNavigateToShelf={() => navigate('/')}
      onNavigateToNovel={(novel) => {
        onSelectNovel(novel);
        navigate(`/novel/${novel.id}`);
      }}
      chapters={chapters}
      characters={characters}
      lastReadChapterId={currentChapterId}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onOpenSettings={onOpenSettings}
      onOpenRoster={() => onOpenRoster(currentNovel)}
      onOpenCharacterDetail={(char) => onOpenCharacterDetail(char, currentNovel)}
      onSelectChapter={(chapterId, novelId) => {
        const targetNovelId = novelId || currentNovel.id;
        navigate(`/novel/${targetNovelId}/read/${chapterId}`);
      }}
      canEdit={canEdit}
      onEditNovel={onEditNovel}
      onOpenAdminModal={onOpenAdminModal}
      isAdminUnlocked={isAdminUnlocked}
    />
  );
};

// Component 2: Novel Detail Page (/novel/:novelId)
interface NovelDetailPageProps {
  novels: Novel[];
  chapters: Chapter[];
  characters: Character[];
  currentChapterId: string;
  theme: ReaderTheme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenRoster: (novel: Novel) => void;
  onSelectNovel: (novel: Novel) => void;
  canEdit: boolean;
  onEditNovel: (novel: Novel) => void;
  onOpenAdminModal: () => void;
  isAdminUnlocked: boolean;
  onOpenCharacterDetail: (character: Character, novel: Novel) => void;
}

const NovelDetailPage: React.FC<NovelDetailPageProps> = ({
  novels,
  chapters,
  characters,
  currentChapterId,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenRoster,
  onSelectNovel,
  canEdit,
  onEditNovel,
  onOpenAdminModal,
  isAdminUnlocked,
  onOpenCharacterDetail,
}) => {
  const { novelId } = useParams<{ novelId: string }>();
  const navigate = useNavigate();
  const novel = novels.find((n) => n.id === novelId);

  useEffect(() => {
    if (novel) {
      document.title = `${novel.title} | Yomiori (読織)`;
      onSelectNovel(novel);
    }
  }, [novel, onSelectNovel]);

  if (!novel) {
    return <Navigate to="/" replace />;
  }

  return (
    <LibraryView
      mode="detail"
      novels={novels}
      currentNovel={novel}
      onSelectNovel={(n) => {
        onSelectNovel(n);
        navigate(`/novel/${n.id}`);
      }}
      onNavigateToShelf={() => navigate('/')}
      onNavigateToNovel={(n) => {
        onSelectNovel(n);
        navigate(`/novel/${n.id}`);
      }}
      chapters={chapters}
      characters={characters}
      lastReadChapterId={currentChapterId}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onOpenSettings={onOpenSettings}
      onOpenRoster={() => onOpenRoster(novel)}
      onOpenCharacterDetail={(char) => onOpenCharacterDetail(char, novel)}
      onSelectChapter={(chapterId, nId) => {
        const targetNovelId = nId || novel.id;
        navigate(`/novel/${targetNovelId}/read/${chapterId}`);
      }}
      canEdit={canEdit}
      onEditNovel={onEditNovel}
      onOpenAdminModal={onOpenAdminModal}
      isAdminUnlocked={isAdminUnlocked}
    />
  );
};

// Component 3: Chapter Reader Page (/novel/:novelId/read/:chapterId)
interface ReaderPageProps {
  novels: Novel[];
  chapters: Chapter[];
  characters: Character[];
  fontSize: number;
  lineHeight: number;
  avatarStyle: AvatarStyle;
  canEdit: boolean;
  theme: ReaderTheme;
  onToggleTheme: () => void;
  onOpenAdminModal: () => void;
  isAdminUnlocked: boolean;
  onChapterLoaded: (novel: Novel, chapterId: string) => void;
  onOpenToc: (novel: Novel) => void;
  onOpenRoster: (novel: Novel) => void;
  onOpenSettings: () => void;
  onOpenQuickFix: (block: StoryBlock) => void;
  onOpenCharacterDetail: (character: Character, novel: Novel) => void;
}

const ReaderPage: React.FC<ReaderPageProps> = ({
  novels,
  chapters,
  characters,
  fontSize,
  lineHeight,
  avatarStyle,
  canEdit,
  theme,
  onToggleTheme,
  onOpenAdminModal,
  isAdminUnlocked,
  onChapterLoaded,
  onOpenToc,
  onOpenRoster,
  onOpenSettings,
  onOpenQuickFix,
  onOpenCharacterDetail,
}) => {
  const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [readingProgress, setReadingProgress] = useState(0);

  const novel = novels.find((n) => n.id === novelId);
  const novelChapters = novel ? chapters.filter((c) => c.novelId === novel.id) : [];
  const chapterIndex = novelChapters.findIndex((c) => c.id === chapterId);
  const currentChapter = chapterIndex !== -1 ? novelChapters[chapterIndex] : null;

  // Track scroll progress for this chapter
  useEffect(() => {
    if (!currentChapter) return;

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const scrollPercent = (totalScroll / windowHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, scrollPercent)));
      } else {
        setReadingProgress(0);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapter]);

  useEffect(() => {
    if (novel && currentChapter) {
      document.title = `ตอนที่ ${currentChapter.chapterNumber}: ${currentChapter.title} | ${novel.title} - Yomiori (読織)`;
      onChapterLoaded(novel, currentChapter.id);
    }
  }, [novel, currentChapter, onChapterLoaded]);

  if (!novel) {
    return <Navigate to="/" replace />;
  }

  if (!currentChapter) {
    if (novelChapters.length > 0) {
      return <Navigate to={`/novel/${novel.id}/read/${novelChapters[0].id}`} replace />;
    }
    return <Navigate to={`/novel/${novel.id}`} replace />;
  }

  const hasPrev = chapterIndex > 0;
  const hasNext = chapterIndex < novelChapters.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      navigate(`/novel/${novel.id}/read/${novelChapters[chapterIndex - 1].id}`);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      navigate(`/novel/${novel.id}/read/${novelChapters[chapterIndex + 1].id}`);
    }
  };

  return (
    <ReaderView
      currentNovel={novel}
      currentChapter={currentChapter}
      currentNovelChapters={novelChapters}
      characters={characters}
      fontSize={fontSize}
      lineHeight={lineHeight}
      avatarStyle={avatarStyle}
      canEdit={canEdit}
      hasPrev={hasPrev}
      hasNext={hasNext}
      onPrevChapter={handlePrev}
      onNextChapter={handleNext}
      onOpenToc={() => onOpenToc(novel)}
      onOpenRoster={() => onOpenRoster(novel)}
      onOpenSettings={onOpenSettings}
      onBackToLibrary={() => navigate(`/novel/${novel.id}`)}
      onBackToShelf={() => navigate('/')}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onOpenAdminModal={onOpenAdminModal}
      isAdminUnlocked={isAdminUnlocked}
      readingProgress={readingProgress}
      onOpenQuickFix={onOpenQuickFix}
      onOpenCharacterDetail={(char) => onOpenCharacterDetail(char, novel)}
    />
  );
};

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top automatically on route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Theme & Reading Preferences
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
  const [avatarStyle, setAvatarStyleState] = useState<AvatarStyle>(() => {
    const saved = localStorage.getItem('novel_reader_dialogue_style');
    if (saved === 'avatar_with_badge') return 'vn_card';
    if (saved === 'badge_only') return 'washi_paper';
    return (saved as AvatarStyle) || 'vn_card';
  });

  const setAvatarStyle = (style: AvatarStyle) => {
    setAvatarStyleState(style);
    localStorage.setItem('novel_reader_dialogue_style', style);
  };

  // Novel Data State
  const [novels, setNovels] = useState<Novel[]>(allNovels);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);

  // Admin Auth State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('novel_admin_unlocked') === 'true';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const canEdit = import.meta.env.DEV;

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

  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('novel_characters');
    return saved ? JSON.parse(saved) : allCharacters;
  });

  const [selectedCharacterForDetail, setSelectedCharacterForDetail] = useState<Character | null>(null);

  const handleCharacterUpdated = (updatedChar: Character) => {
    setSelectedCharacterForDetail(updatedChar);

    setCharacters((prev) => {
      const idx = prev.findIndex((c) => c.id === updatedChar.id);
      let next: Character[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedChar;
      } else {
        next = [...prev, updatedChar];
      }
      localStorage.setItem('novel_characters', JSON.stringify(next));
      return next;
    });
  };

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('novel_chapters_override');
    return saved ? JSON.parse(saved) : allChapters;
  });

  const [currentChapterId, setCurrentChapterId] = useState<string>(() => {
    return localStorage.getItem('novel_last_chapter_id') || 'ch-01';
  });

  // Modal States
  const [editingBlock, setEditingBlock] = useState<StoryBlock | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeNovelForModals, setActiveNovelForModals] = useState<Novel>(currentNovel);

  // Sync Preferences to localStorage
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
  }, [currentChapterId]);

  // Toggle Theme cycling (dark -> light -> sepia -> dark)
  const handleToggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'sepia';
      return 'dark';
    });
  };

  // Quick Fix Handlers
  const handleUpdateSpeaker = (blockId: string, speakerId: string, speakerName: string) => {
    let targetNovelId = activeNovelForModals.id;
    let targetChapterId = currentChapterId;

    setChapters((prevChapters) => {
      const updated = prevChapters.map((ch) => {
        const hasBlock = ch.blocks.some((b) => b.id === blockId);
        if (!hasBlock) return ch;
        targetNovelId = ch.novelId;
        targetChapterId = ch.id;
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
      saveChapterBlock(targetNovelId, targetChapterId, blockId, {
        speakerId,
        speakerName,
      });
    }
  };

  const handleConvertToNarration = (blockId: string) => {
    let narrationText = '';
    let targetNovelId = activeNovelForModals.id;
    let targetChapterId = currentChapterId;

    setChapters((prevChapters) => {
      const updated = prevChapters.map((ch) => {
        const hasBlock = ch.blocks.some((b) => b.id === blockId);
        if (!hasBlock) return ch;
        targetNovelId = ch.novelId;
        targetChapterId = ch.id;
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
      saveChapterBlock(targetNovelId, targetChapterId, blockId, {
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
    let targetNovelId = activeNovelForModals.id;
    let targetChapterId = currentChapterId;

    setChapters((prevChapters) => {
      const updated = prevChapters.map((ch) => {
        const hasBlock = ch.blocks.some((b) => b.id === blockId);
        if (!hasBlock) return ch;
        targetNovelId = ch.novelId;
        targetChapterId = ch.id;
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
      saveChapterBlock(targetNovelId, targetChapterId, blockId, {
        text: newText,
        speakerId,
        speakerName,
      });
    }
  };

  const handleChapterLoaded = React.useCallback((novel: Novel, chapterId: string) => {
    setCurrentNovelId(novel.id);
    setCurrentChapterId(chapterId);
    setActiveNovelForModals(novel);
  }, []);

  const handleSelectNovel = React.useCallback((novel: Novel) => {
    setCurrentNovelId(novel.id);
    setActiveNovelForModals(novel);
  }, []);

  // Find active chapters for Table of Contents modal
  const activeTocChapters = chapters.filter((c) => c.novelId === activeNovelForModals.id);

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
      <Routes>
        <Route
          path="/"
          element={
            <BookshelfPage
              novels={novels}
              currentNovel={currentNovel}
              chapters={chapters}
              characters={characters}
              currentChapterId={currentChapterId}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenRoster={(novel) => {
                setActiveNovelForModals(novel);
                setIsRosterOpen(true);
              }}
              onSelectNovel={handleSelectNovel}
              canEdit={canEdit}
              onEditNovel={(novel) => setEditingNovel(novel)}
              onOpenAdminModal={() => setIsAdminModalOpen(true)}
              isAdminUnlocked={isAdminUnlocked}
              onOpenCharacterDetail={(char, novel) => {
                setActiveNovelForModals(novel);
                setSelectedCharacterForDetail(char);
              }}
            />
          }
        />
        <Route
          path="/novel/:novelId"
          element={
            <NovelDetailPage
              novels={novels}
              chapters={chapters}
              characters={characters}
              currentChapterId={currentChapterId}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenRoster={(novel) => {
                setActiveNovelForModals(novel);
                setIsRosterOpen(true);
              }}
              onSelectNovel={handleSelectNovel}
              canEdit={canEdit}
              onEditNovel={(novel) => setEditingNovel(novel)}
              onOpenAdminModal={() => setIsAdminModalOpen(true)}
              isAdminUnlocked={isAdminUnlocked}
              onOpenCharacterDetail={(char, novel) => {
                setActiveNovelForModals(novel);
                setSelectedCharacterForDetail(char);
              }}
            />
          }
        />
        <Route
          path="/novel/:novelId/read/:chapterId"
          element={
            <ReaderPage
              novels={novels}
              chapters={chapters}
              characters={characters}
              fontSize={fontSize}
              lineHeight={lineHeight}
              avatarStyle={avatarStyle}
              canEdit={canEdit}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenAdminModal={() => setIsAdminModalOpen(true)}
              isAdminUnlocked={isAdminUnlocked}
              onChapterLoaded={handleChapterLoaded}
              onOpenToc={(novel) => {
                setActiveNovelForModals(novel);
                setIsTocOpen(true);
              }}
              onOpenRoster={(novel) => {
                setActiveNovelForModals(novel);
                setIsRosterOpen(true);
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenQuickFix={(b) => setEditingBlock(b)}
              onOpenCharacterDetail={(char, novel) => {
                setActiveNovelForModals(novel);
                setSelectedCharacterForDetail(char);
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
        chapters={activeTocChapters}
        currentChapterId={currentChapterId}
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        onSelectChapter={(id) => {
          setCurrentChapterId(id);
          navigate(`/novel/${activeNovelForModals.id}/read/${id}`);
          setIsTocOpen(false);
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

      {/* Character Detail & Portrait Modal */}
      <CharacterDetailModal
        isOpen={!!selectedCharacterForDetail}
        onClose={() => setSelectedCharacterForDetail(null)}
        character={selectedCharacterForDetail}
        novelId={activeNovelForModals.id}
        onCharacterUpdated={handleCharacterUpdated}
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

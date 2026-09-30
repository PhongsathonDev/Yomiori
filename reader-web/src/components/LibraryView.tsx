import React, { useState } from 'react';
import type { Novel, Chapter, Character, ReaderTheme } from '../types';
import { getAssetUrl } from '../utils/assets';
import { 
  BookOpen, 
  Users, 
  Play, 
  Moon, 
  Sun, 
  Coffee, 
  Settings, 
  ChevronRight, 
  Layers,
  Search,
  PlusCircle,
  BookMarked,
  ArrowLeft,
  Sparkles,
  Edit3,
  Lock,
  Unlock,
  Clock,
  MessageSquare,
  ArrowUpDown
} from 'lucide-react';

interface LibraryViewProps {
  novels: Novel[];
  currentNovel: Novel;
  onSelectNovel: (novel: Novel) => void;
  chapters: Chapter[];
  characters: Character[];
  lastReadChapterId: string;
  theme: ReaderTheme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenRoster: () => void;
  onSelectChapter: (chapterId: string, novelId?: string) => void;
  canEdit?: boolean;
  onEditNovel?: (novel: Novel) => void;
  onOpenAdminModal?: () => void;
  isAdminUnlocked?: boolean;
  mode?: 'shelf' | 'detail';
  onNavigateToShelf?: () => void;
  onNavigateToNovel?: (novel: Novel) => void;
  onOpenCharacterDetail?: (character: Character) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  novels,
  currentNovel,
  onSelectNovel,
  chapters,
  characters,
  lastReadChapterId,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenRoster,
  onSelectChapter,
  canEdit = import.meta.env.DEV,
  onEditNovel,
  onOpenAdminModal,
  isAdminUnlocked = false,
  mode,
  onNavigateToShelf,
  onNavigateToNovel,
  onOpenCharacterDetail,
}) => {
  // Navigation between Bookshelf overview and Novel Detail
  const [internalActiveTab, setInternalActiveTab] = useState<'shelf' | 'detail'>('shelf');
  const activeTab = mode ?? internalActiveTab;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const setActiveTab = (tab: 'shelf' | 'detail') => {
    if (tab === 'shelf' && onNavigateToShelf) {
      onNavigateToShelf();
    } else if (tab === 'detail' && onNavigateToNovel) {
      onNavigateToNovel(currentNovel);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Filter chapters belonging to current selected novel
  const novelChapters = chapters.filter((c) => c.novelId === currentNovel.id);

  // Filter characters belonging to current selected novel
  const novelCharacters = characters.filter((c) => {
    if (currentNovel.id === 'kyudo-senpai') {
      return ['rino', 'toya', 'mei', 'shion', 'urushibara', 'basketball_guy', 'ayamori'].includes(c.id);
    }
    if (currentNovel.id === 'idol-neighbor') {
      return ['yuika', 'hiro'].includes(c.id);
    }
    return true;
  });

  // Find last read chapter overall or default to first chapter of current novel
  const lastReadChapter = chapters.find((c) => c.id === lastReadChapterId) || novelChapters[0] || chapters[0];
  const lastReadNovel = novels.find((n) => n.id === lastReadChapter.novelId) || currentNovel;

  // Filter and sort chapters for detail view based on search query and sort order
  const filteredChapters = novelChapters
    .filter(
      (ch) =>
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(ch.chapterNumber).includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.chapterNumber - b.chapterNumber;
      }
      return b.chapterNumber - a.chapterNumber;
    });

  // Collect all unique tags across all novels for filtering
  const allTags = Array.from(new Set(novels.flatMap((n) => n.tags)));

  // Filter novels by tag
  const filteredNovels = selectedTag === 'all'
    ? novels
    : novels.filter((n) => n.tags.includes(selectedTag));

  const handleOpenNovelDetail = (novel: Novel) => {
    onSelectNovel(novel);
    if (onNavigateToNovel) {
      onNavigateToNovel(novel);
    } else {
      setInternalActiveTab('detail');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        paddingBottom: '5rem',
      }}
    >
      {/* Top Navbar */}
      <nav
        className="glass-panel"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          {/* Logo / Home Link */}
          <div 
            onClick={() => setActiveTab('shelf')}
            title="กลับสู่หน้าชั้นวางนิยาย"
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
          >
            <img
              src={getAssetUrl('/yomiori-logo.png')}
              alt="Yomiori Logo"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-card)',
                padding: '2px',
              }}
            />
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                Yomiori <span style={{ color: 'var(--accent-primary)', fontSize: '0.95rem', fontWeight: 600 }}>読織</span>
              </span>
              {activeTab === 'shelf' && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginLeft: '8px', padding: '2px 7px', borderRadius: '4px', backgroundColor: 'var(--border-subtle)' }}>
                  มิติใหม่แห่งการอ่าน
                </span>
              )}
            </div>
          </div>

          {/* Breadcrumb Path in Navbar for Detail view */}
          {activeTab === 'detail' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
              <ChevronRight size={15} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
              <button
                onClick={() => setActiveTab('shelf')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                ชั้นวางนิยาย
              </button>
              <ChevronRight size={15} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={currentNovel.title}
              >
                {currentNovel.title}
              </span>
            </div>
          )}
        </div>

        {/* Right Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onToggleTheme}
            title="สลับธีมสี"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
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
            {theme === 'light' && <Sun size={16} color="#b84a39" />}
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
              <span>{isAdminUnlocked ? 'โหมดแก้ไขเปิดอยู่' : 'แก้ไข'}</span>
            </button>
          )}
        </div>
      </nav>

      {/* VIEW MODE 1: BOOKSHELF (ชั้นวางหนังสือภาพรวม) */}
      {activeTab === 'shelf' && (
        <div
          className="animate-fade-in"
          style={{
            maxWidth: '1160px',
            margin: '2rem auto 0 auto',
            padding: '0 1.5rem',
          }}
        >
          {/* HERO: CONTINUE READING BANNER */}
          <div
            className="glass-panel"
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              padding: '1.5rem 1.85rem',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem',
              flexWrap: 'wrap',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '300px' }}>
              <img
                src={getAssetUrl(lastReadNovel.coverUrl)}
                alt={lastReadNovel.title}
                style={{
                  width: '70px',
                  height: '100px',
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                  boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                      backgroundColor: 'var(--accent-subtle)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    <Sparkles size={12} />
                    อ่านค้างไว้ล่าสุด
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {lastReadNovel.title.split('ผม')[0].split('แอบ')[0]}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    lineHeight: 1.35,
                    marginBottom: '4px',
                  }}
                >
                  {lastReadChapter.title}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                  ตอนที่ {lastReadChapter.chapterNumber} • {lastReadChapter.blocks.filter((b) => b.type === 'dialogue').length} บรรทัดบทสนทนา
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <button
                onClick={() => onSelectChapter(lastReadChapter.id, lastReadChapter.novelId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.7rem 1.4rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Play size={15} fill="#fff" />
                <span>อ่านต่อทันที</span>
              </button>
            </div>
          </div>

          {/* SHELF HEADER & FILTERS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookMarked size={24} color="var(--accent-primary)" />
                ชั้นวางหนังสือของฉัน (Bookshelf)
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                รวมนิยายที่กำลังติดตามและแปลในระบบ ({novels.length} เรื่อง • พร้อมอ่าน {chapters.length} ตอน)
              </p>
            </div>

            {/* Tag Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedTag('all')}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: selectedTag === 'all' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: selectedTag === 'all' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                ทั้งหมด ({novels.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: selectedTag === tag ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: selectedTag === tag ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* NOVELS GRID (ELEGANT VERTICAL BOOK COVERS) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {filteredNovels.map((novel) => {
              const novelChs = chapters.filter((c) => c.novelId === novel.id);
              const isSelected = novel.id === currentNovel.id;

              return (
                <div
                  key={novel.id}
                  onClick={() => handleOpenNovelDetail(novel)}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isSelected ? '0 12px 30px rgba(236, 72, 153, 0.25)' : 'var(--shadow-card)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(236, 72, 153, 0.2)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isSelected ? '0 12px 30px rgba(236, 72, 153, 0.25)' : 'var(--shadow-card)';
                    e.currentTarget.style.borderColor = isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)';
                  }}
                >
                  {/* Book Cover Container */}
                  <div
                    style={{
                      position: 'relative',
                      height: '320px',
                      overflow: 'hidden',
                      backgroundColor: '#121218',
                    }}
                  >
                    <img
                      src={getAssetUrl(novel.coverUrl)}
                      alt={novel.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform var(--transition-slow)',
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(15, 15, 23, 0.95) 0%, rgba(15, 15, 23, 0.2) 50%, transparent 100%)',
                      }}
                    />

                    {/* Top Badges */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        right: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(24, 24, 22, 0.75)',
                            backdropFilter: 'blur(4px)',
                            color: '#ede9e3',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                          }}
                        >
                          WN {novel.totalOriginalChapters} ตอน
                        </span>

                        <span
                          style={{
                            backgroundColor: '#50785c',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          ✨ พร้อมอ่าน {novelChs.length} ตอน
                        </span>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditNovel?.(novel);
                          }}
                          title="แก้ไขข้อมูลเรื่อง"
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(24, 24, 22, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(24, 24, 22, 0.85)';
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Overlay Title at bottom of cover */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '14px',
                        right: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {novel.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'rgba(24, 24, 22, 0.75)',
                              color: '#ede9e3',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <h3
                        style={{
                          fontSize: '0.98rem',
                          fontWeight: 700,
                          lineHeight: 1.35,
                          color: '#fff',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        {novel.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content & Action Buttons */}
                  <div
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flex: 1,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-faint)', marginBottom: '8px' }}>
                        แต่งโดย: <strong style={{ color: 'var(--text-muted)' }}>{novel.author}</strong>
                      </div>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          lineHeight: 1.55,
                          color: 'var(--text-muted)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: '1rem',
                        }}
                      >
                        {novel.synopsis}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenNovelDetail(novel);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.55rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                      >
                        <Layers size={14} />
                        <span>สารบัญ & ข้อมูล</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNovel(novel);
                          if (novelChs.length > 0) {
                            onSelectChapter(novelChs[0].id, novel.id);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '0.55rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--accent-primary)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        <Play size={13} fill="#fff" />
                        <span>เปิดอ่าน</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Novel Card Placeholder */}
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--border-medium)',
                backgroundColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                minHeight: '420px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.03)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(236, 72, 153, 0.1)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <PlusCircle size={28} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>+ เพิ่มนิยายเรื่องใหม่</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', maxWidth: '220px', lineHeight: 1.5 }}>
                วางไฟล์เนื้อหาในโฟลเดอร์ <code style={{ color: 'var(--accent-primary)' }}>raw_chapters/</code> เพื่อแปลงเข้าสู่ระบบ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: NOVEL DETAIL & CHAPTERS (หน้าเจาะลึกเฉพาะเรื่อง) */}
      {activeTab === 'detail' && (
        <div
          className="animate-fade-in"
          style={{
            maxWidth: '1160px',
            margin: '2rem auto 0 auto',
            padding: '0 1.5rem',
          }}
        >
          {/* Breadcrumb Navigation */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.86rem' }}>
            <button
              onClick={() => setActiveTab('shelf')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                border: 'none',
                padding: '2px 4px',
                marginLeft: '-4px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: '0.86rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.textDecoration = 'none';
              }}
              title="กลับไปที่ชั้นวางนิยาย"
            >
              <ArrowLeft size={14} />
              <span>กลับชั้นวางนิยาย</span>
            </button>
            <span style={{ color: 'var(--text-faint)', userSelect: 'none' }}>/</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem', fontWeight: 500 }}>
              {currentNovel.title}
            </span>
          </div>

          {/* MAIN NOVEL SHOWCASE */}
          <div
            className="glass-panel"
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              padding: '2.5rem',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'row',
                gap: '2.5rem',
                alignItems: 'stretch',
                flexWrap: 'wrap',
              }}
            >
              {/* Novel Cover */}
              <div style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <img
                  src={getAssetUrl(currentNovel.coverUrl)}
                  alt={currentNovel.title}
                  style={{
                    width: '210px',
                    height: '300px',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                    boxShadow: 'var(--shadow-elevated)',
                    border: '1px solid var(--border-medium)',
                  }}
                />
              </div>

              {/* Novel Meta Details */}
              <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {/* Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                  {currentNovel.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-primary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    lineHeight: 1.4,
                    marginBottom: '0.4rem',
                    color: 'var(--text-main)',
                  }}
                >
                  {currentNovel.title}
                </h1>

                {/* Japanese Title */}
                {currentNovel.originalTitle && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.9rem', fontStyle: 'italic' }}>
                    {currentNovel.originalTitle}
                  </div>
                )}

                {/* Credits */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-faint)' }}>ผู้แต่ง: </span>
                    <strong style={{ color: 'var(--text-main)' }}>{currentNovel.author}</strong>
                  </div>
                  {currentNovel.artist && (
                    <div>
                      <span style={{ color: 'var(--text-faint)' }}>ภาพประกอบ: </span>
                      <strong style={{ color: 'var(--text-main)' }}>{currentNovel.artist}</strong>
                    </div>
                  )}
                  {currentNovel.translator && (
                    <div>
                      <span style={{ color: 'var(--text-faint)' }}>ผู้แปล: </span>
                      <strong style={{ color: 'var(--text-main)' }}>{currentNovel.translator}</strong>
                    </div>
                  )}
                </div>

                {/* Synopsis */}
                <p
                  style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    color: 'var(--text-muted)',
                    marginBottom: '1.5rem',
                    textAlign: 'justify',
                  }}
                >
                  {currentNovel.synopsis}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {novelChapters.length > 0 ? (
                    <>
                      <button
                        onClick={() => onSelectChapter(lastReadChapter.id, currentNovel.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '0.75rem 1.6rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--accent-primary)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-card)',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        <Play size={16} fill="#fff" />
                        <span>อ่านต่อ {lastReadChapter.title.split('—')[0]}</span>
                      </button>

                      <button
                        onClick={() => onSelectChapter(novelChapters[0].id, currentNovel.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '0.75rem 1.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                      >
                        <BookOpen size={16} />
                        <span>เริ่มอ่านตอนที่ 1</span>
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      กำลังรอแปลงตอนเข้าสู่ระบบ
                    </div>
                  )}

                  {canEdit && (
                    <button
                      onClick={() => onEditNovel?.(currentNovel)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.75rem 1.3rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--accent-primary)',
                        color: 'var(--accent-primary)',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                      }}
                    >
                      <Edit3 size={15} />
                      <span>แก้ไขข้อมูลเรื่อง</span>
                    </button>
                  )}

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-faint)', marginLeft: 'auto' }}>
                    พร้อมอ่านแล้ว {novelChapters.length} ตอน / ทั้งหมด {currentNovel.totalOriginalChapters} ตอน
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NOVEL CHARACTERS HIGHLIGHT */}
          {novelCharacters.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--accent-primary)" />
                  ตัวละครในเรื่องนี้ ({novelCharacters.length} ตัวละครหลัก)
                </h3>
                <button
                  onClick={onOpenRoster}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>ดูสมุดรายชื่อตัวละครทั้งหมด</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {novelCharacters.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => {
                      if (onOpenCharacterDetail) {
                        onOpenCharacterDetail(char);
                      } else {
                        onOpenRoster();
                      }
                    }}
                    title={`คลิกเพื่อดูข้อมูลและรูปตัวละคร ${char.name}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: `1.5px solid ${char.color}30`,
                      boxShadow: 'var(--shadow-card)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = char.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = `${char.color}30`;
                    }}
                  >
                    {char.avatarUrl ? (
                      <img
                        src={getAssetUrl(char.avatarUrl)}
                        alt={char.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `2px solid ${char.color}`,
                          boxShadow: `0 3px 10px ${char.color}35`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          backgroundColor: `${char.color}25`,
                          border: `2px solid ${char.color}`,
                          color: char.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.2rem',
                        }}
                      >
                        {char.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {char.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: char.color, fontWeight: 500, marginTop: '2px' }}>
                        {char.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAPTERS DIRECTORY */}
          <div style={{ marginTop: '2.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={20} color="var(--accent-primary)" />
                  สารบัญตอน ({novelChapters.length} ตอนพร้อมอ่าน)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  เลือกตอนที่ต้องการเพื่อเริ่มอ่าน
                </p>
              </div>

              {/* Controls: Sort Order + Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  title={sortOrder === 'asc' ? 'สลับเป็นตอนล่าสุดก่อน' : 'สลับเป็นตอนแรกก่อน'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.55rem 0.95rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                >
                  <ArrowUpDown size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>{sortOrder === 'asc' ? 'ตอนแรกก่อน (1 → ล่าสุด)' : 'ตอนล่าสุดก่อน (ล่าสุด → 1)'}</span>
                </button>

                {/* Search Box */}
                <div
                  style={{
                    position: 'relative',
                    minWidth: '220px',
                  }}
                >
                  <Search
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
                  />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อตอน หรือเลขตอน..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 1rem 0.55rem 2.2rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Chapters Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filteredChapters.map((ch) => {
                const isLastRead = ch.id === lastReadChapterId;
                const dialogueCount = ch.blocks.filter((b) => b.type === 'dialogue').length;
                const totalLength = ch.blocks.reduce((acc, b) => acc + ('text' in b ? b.text.length : 0), 0);
                const estMinutes = Math.max(1, Math.round(totalLength / 450));

                return (
                  <div
                    key={ch.id}
                    onClick={() => onSelectChapter(ch.id, currentNovel.id)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: `1.5px solid ${isLastRead ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      boxShadow: 'var(--shadow-card)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                      e.currentTarget.style.borderColor = isLastRead ? 'var(--accent-primary)' : 'var(--border-subtle)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                            backgroundColor: 'var(--accent-subtle)',
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-xs)',
                            letterSpacing: '0.02em',
                          }}
                        >
                          ตอนที่ {ch.chapterNumber}
                        </span>

                        {isLastRead && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-xs)',
                              backgroundColor: 'rgba(236, 72, 153, 0.12)',
                              color: 'var(--accent-primary)',
                              border: '1px solid rgba(236, 72, 153, 0.3)',
                            }}
                          >
                            <Sparkles size={11} /> อ่านค้างไว้
                          </span>
                        )}
                      </div>

                      <h4
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          lineHeight: 1.45,
                          marginTop: '0.65rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {ch.title}
                      </h4>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '1.25rem',
                        paddingTop: '0.85rem',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} style={{ color: 'var(--text-faint)' }} />
                          ~{estMinutes} นาที
                        </span>
                        <span style={{ color: 'var(--border-medium)' }}>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={13} style={{ color: 'var(--text-faint)' }} />
                          บทสนทนา {dialogueCount} บรรทัด
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.82rem' }}>
                        <span>อ่าน</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

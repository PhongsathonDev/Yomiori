import React, { useState, useMemo } from 'react';
import type { Character } from '../types';
import { Users, X, ChevronRight, Search, Sparkles } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

interface CharacterRosterModalProps {
  characters: Character[];
  isOpen: boolean;
  onClose: () => void;
  novelTitle?: string;
  onSelectCharacter?: (character: Character) => void;
}

export const CharacterRosterModal: React.FC<CharacterRosterModalProps> = ({
  characters,
  isOpen,
  onClose,
  novelTitle,
  onSelectCharacter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-avatar'>('all');

  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      const matchesSearch =
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (char.role && char.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (char.aliases && char.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;
      if (filterType === 'with-avatar') {
        return Boolean(char.avatarUrl);
      }
      return true;
    });
  }, [characters, searchQuery, filterType]);

  const hasAvatarCount = useMemo(() => characters.filter((c) => Boolean(c.avatarUrl)).length, [characters]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
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
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                flexShrink: 0,
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                ทำเนียบตัวละคร{novelTitle ? `: ${novelTitle}` : ''}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                รายชื่อและบทบาทตัวละครในเรื่อง ({characters.length} ตัวละคร)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: '1 1 200px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--text-faint)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อตัวละคร, บทบาท..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-faint)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '2px 4px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: filterType === 'all' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                backgroundColor: filterType === 'all' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                color: filterType === 'all' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              ทั้งหมด ({characters.length})
            </button>
            {hasAvatarCount > 0 && (
              <button
                onClick={() => setFilterType('with-avatar')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: filterType === 'with-avatar' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  backgroundColor: filterType === 'with-avatar' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  color: filterType === 'with-avatar' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                มีภาพประกอบ ({hasAvatarCount})
              </button>
            )}
          </div>
        </div>

        {/* Character Scrollable List */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            flex: 1,
          }}
        >
          {filteredCharacters.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              ไม่พบตัวละครที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredCharacters.map((char) => {
              const charColor = char.color || 'var(--accent-primary)';
              const isClickable = Boolean(onSelectCharacter);

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    if (onSelectCharacter) {
                      onSelectCharacter(char);
                      onClose();
                    }
                  }}
                  title={isClickable ? `คลิกเพื่อดูภาพเต็มและรายละเอียดของ ${char.name}` : undefined}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0, // Critical: prevents card vertical collapsing in flex container!
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (isClickable) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = `${charColor}80`;
                      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isClickable) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Left Accent Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '4px',
                      backgroundColor: charColor,
                    }}
                  />

                  {/* Portrait Box */}
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      minWidth: '68px',
                      minHeight: '68px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: `2px solid ${charColor}40`,
                      boxShadow: `0 2px 8px ${charColor}20`,
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    {char.avatarUrl ? (
                      <img
                        src={getAssetUrl(char.avatarUrl)}
                        alt={char.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: `${charColor}15`,
                          color: charColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.4rem',
                          userSelect: 'none',
                        }}
                      >
                        {char.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Character Info */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3
                          style={{
                            fontSize: '1.02rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            lineHeight: 1.25,
                          }}
                        >
                          {char.name}
                        </h3>
                        {char.role && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: `${charColor}15`,
                              color: charColor,
                              border: `1px solid ${charColor}35`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {char.role}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: charColor,
                            boxShadow: `0 0 6px ${charColor}60`,
                          }}
                          title="สีประจำตัวละคร"
                        />
                        {isClickable && (
                          <ChevronRight
                            size={16}
                            style={{
                              color: 'var(--text-faint)',
                              transition: 'transform var(--transition-fast)',
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {char.aliases && char.aliases.length > 0 && (
                      <div
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--text-faint)',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ชื่อเรียกอื่น: {char.aliases.join(' · ')}
                      </div>
                    )}

                    {char.description && (
                      <p
                        style={{
                          fontSize: '0.83rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {char.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <Sparkles size={14} color="var(--accent-primary)" />
            <span>คลิกที่ตัวละครเพื่อดูภาพวาดเต็มและประวัติ</span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem 1.15rem',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              e.currentTarget.style.borderColor = 'var(--text-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

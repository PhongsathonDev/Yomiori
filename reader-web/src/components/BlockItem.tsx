import React from 'react';
import type { StoryBlock, Character, AvatarStyle } from '../types';
import { UserCheck, Edit3 } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

interface BlockItemProps {
  block: StoryBlock;
  characters: Character[];
  avatarStyle: AvatarStyle;
  canEdit?: boolean;
  onOpenQuickFix: (block: StoryBlock) => void;
  onOpenCharacterDetail?: (character: Character) => void;
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  characters,
  avatarStyle,
  canEdit = import.meta.env.DEV,
  onOpenQuickFix,
  onOpenCharacterDetail,
}) => {
  if (block.type === 'scene_break') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 0',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-medium))' }} />
        <span
          style={{
            color: 'var(--accent-primary)',
            fontSize: '1rem',
            letterSpacing: '0.3em',
            fontWeight: 700,
          }}
        >
          {block.symbol || '◆ ◆ ◆'}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--border-medium), transparent)' }} />
      </div>
    );
  }

  if (block.type === 'narration') {
    return (
      <div className="narration-block-wrapper" style={{ position: 'relative' }}>
        <p className="narration-block">
          {block.text}
        </p>

        {/* Quick-fix on hover to change narration into dialogue if misclassified (Local Dev only) */}
        {canEdit && (
          <button
            onClick={() => onOpenQuickFix(block)}
            className="quick-fix-btn"
            title="แก้ไข: ระบุว่าบรรทัดนี้เป็นบทพูด"
            style={{
              position: 'absolute',
              right: '-10px',
              top: '0px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '0.72rem',
              color: 'var(--text-faint)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Edit3 size={12} />
            <span>แก้เป็นบทพูด</span>
          </button>
        )}
      </div>
    );
  }

  // Dialogue Block
  const character = characters.find((c) => c.id === block.speakerId);
  const color = character?.color || 'var(--accent-primary)';
  const name = character?.name || block.speakerName;
  const role = character?.role;
  const avatarUrl = character?.avatarUrl;

  const effectiveStyle: AvatarStyle =
    avatarStyle === 'avatar_with_badge' ? 'vn_card' :
      avatarStyle === 'badge_only' ? 'washi_paper' :
        avatarStyle;

  // Click handler to open CharacterDetailModal
  const handleCharacterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onOpenCharacterDetail) return;
    const targetChar: Character = character || {
      id: block.speakerId || `char_${Date.now()}`,
      name: name,
      color: color,
      role: role || 'ตัวละครประกอบ',
    };
    onOpenCharacterDetail(targetChar);
  };

  // Shared Quick-Fix Action Button (Local Dev only)
  const renderQuickFixBtn = () => {
    if (!canEdit) return null;
    return (
      <button
        onClick={() => onOpenQuickFix(block)}
        className="quick-fix-btn"
        title="สลับตัวละครหรือแก้ไขคนพูด"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-faint)',
          cursor: 'pointer',
          fontSize: '0.72rem',
          fontWeight: 500,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-main)';
          e.currentTarget.style.borderColor = color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-faint)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
      >
        <UserCheck size={12} color={color} />
        <span>สลับคนพูด</span>
      </button>
    );
  };

  // 1. Minimal Literary Quote Style (วรรณกรรมไร้กรอบ พร้อม Avatar)
  if (effectiveStyle === 'minimal_quote') {
    return (
      <div
        className="dialogue-card dialogue-card-quote"
        style={{
          borderLeftColor: color,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <div
            onClick={handleCharacterClick}
            title="คลิกเพื่อดูรูปเต็มและรายละเอียดตัวละคร"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'opacity var(--transition-fast), transform var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'none';
            }}
          >
            {avatarUrl ? (
              <img
                src={getAssetUrl(avatarUrl)}
                alt={name}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `1.5px solid ${color}`,
                  boxShadow: `0 1px 4px ${color}25`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}90`,
                  display: 'inline-block',
                  flexShrink: 0,
                  margin: '0 2px',
                }}
              />
            )}
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: color,
                letterSpacing: '0.01em',
              }}
            >
              {name}
            </span>
            {role && (
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: `${color}15`,
                  color: color,
                  fontWeight: 500,
                  border: `1px solid ${color}25`,
                }}
              >
                {role}
              </span>
            )}
          </div>
          {renderQuickFixBtn()}
        </div>
        <div className="dialogue-text">
          {block.text}
        </div>
      </div>
    );
  }

  // 2. Speech Bubble Style
  if (effectiveStyle === 'chat_bubble') {
    return (
      <div
        className="dialogue-card dialogue-card-bubble"
        style={{
          borderColor: `${color}40`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.55rem',
          }}
        >
          <div
            onClick={handleCharacterClick}
            title="คลิกเพื่อดูรูปเต็มและรายละเอียดตัวละคร"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {avatarUrl ? (
              <img
                src={getAssetUrl(avatarUrl)}
                alt={name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `1.5px solid ${color}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: `${color}20`,
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                💬
              </div>
            )}
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: color,
              }}
            >
              {name}
            </span>
            {role && (
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: `${color}15`,
                  color: color,
                  fontWeight: 500,
                }}
              >
                {role}
              </span>
            )}
          </div>
          {renderQuickFixBtn()}
        </div>
        <div className="dialogue-text">
          {block.text}
        </div>
      </div>
    );
  }

  // 3. Washi Paper Minimal
  if (effectiveStyle === 'washi_paper') {
    return (
      <div
        className="dialogue-card dialogue-card-washi"
        style={{
          borderLeftColor: color,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.55rem',
          }}
        >
          <div
            onClick={handleCharacterClick}
            title="คลิกเพื่อดูรูปเต็มและรายละเอียดตัวละคร"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {avatarUrl ? (
              <img
                src={getAssetUrl(avatarUrl)}
                alt={name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `1.5px solid ${color}`,
                  marginRight: '2px',
                  flexShrink: 0,
                }}
              />
            ) : (
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  display: 'inline-block',
                  marginRight: '2px',
                }}
              />
            )}
            <span
              style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: color,
                letterSpacing: '0.01em',
              }}
            >
              {name}
            </span>
            {role && (
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {role}
              </span>
            )}
          </div>
          {renderQuickFixBtn()}
        </div>
        <div className="dialogue-text">
          {block.text}
        </div>
      </div>
    );
  }

  // 4. Visual Novel Floating Nameplate (Flagship Default)
  return (
    <div
      className="dialogue-card dialogue-card-vn"
      style={{
        borderLeftColor: color,
        background: `linear-gradient(135deg, ${color}0b 0%, var(--bg-surface) 38%, var(--bg-surface) 100%)`,
      }}
    >
      {/* Top Header: Character Info + Quick-Fix Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.7rem',
        }}
      >
        {/* Floating Nameplate Pill */}
        <div
          onClick={handleCharacterClick}
          title="คลิกเพื่อดูรูปเต็มและรายละเอียดตัวละคร"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: `1px solid ${color}35`,
            borderRadius: 'var(--radius-full)',
            padding: avatarUrl ? '3px 12px 3px 4px' : '4px 12px',
            boxShadow: `0 1px 4px ${color}12`,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = `0 2px 8px ${color}25`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = `0 1px 4px ${color}12`;
          }}
        >
          {avatarUrl ? (
            <img
              src={getAssetUrl(avatarUrl)}
              alt={name}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `1.5px solid ${color}`,
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}90`,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
          )}

          <span
            style={{
              fontSize: '0.86rem',
              fontWeight: 700,
              color: color,
              letterSpacing: '0.01em',
              lineHeight: 1.2,
            }}
          >
            {name}
          </span>

          {role && (
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: `${color}18`,
                color: color,
                fontWeight: 600,
                border: `1px solid ${color}30`,
                lineHeight: 1.3,
              }}
            >
              {role}
            </span>
          )}
        </div>

        {/* Quick-Fix Trigger Button */}
        {renderQuickFixBtn()}
      </div>

      {/* Dialogue Text */}
      <div className="dialogue-text">
        {block.text}
      </div>
    </div>
  );
};

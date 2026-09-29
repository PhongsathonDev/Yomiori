import React from 'react';
import type { StoryBlock, Character, AvatarStyle } from '../types';
import { UserCheck, Edit3 } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

interface BlockItemProps {
  block: StoryBlock;
  characters: Character[];
  avatarStyle: AvatarStyle;
  onOpenQuickFix: (block: StoryBlock) => void;
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  characters,
  avatarStyle,
  onOpenQuickFix,
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

        {/* Quick-fix on hover to change narration into dialogue if misclassified */}
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
      </div>
    );
  }

  // Dialogue Block
  const character = characters.find((c) => c.id === block.speakerId);
  const color = character?.color || 'var(--accent-primary)';
  const name = character?.name || block.speakerName;
  const role = character?.role;
  const avatarUrl = character?.avatarUrl;

  return (
    <div
      className="dialogue-card"
      style={{
        borderLeftColor: color,
      }}
    >
      {/* Top Header: Character Info + Quick-Fix Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Avatar Thumbnail */}
          {avatarStyle === 'avatar_with_badge' && (
            avatarUrl ? (
              <img
                src={getAssetUrl(avatarUrl)}
                alt={name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `1.5px solid ${color}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: `${color}18`,
                  border: `1.5px solid ${color}`,
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                {name.charAt(0)}
              </div>
            )
          )}

          {/* Name & Role Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.85rem',
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
                  backgroundColor: `${color}18`,
                  color: color,
                  fontWeight: 500,
                  border: `1px solid ${color}30`,
                }}
              >
                {role}
              </span>
            )}
          </div>
        </div>

        {/* Quick-Fix Trigger Button */}
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
          <UserCheck size={13} color={color} />
          <span>สลับคนพูด</span>
        </button>
      </div>

      {/* Dialogue Text */}
      <div className="dialogue-text">
        {block.text}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { Character, StoryBlock } from '../types';
import { UserCheck, BookOpen, X, Check, Save } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

interface QuickFixModalProps {
  block: StoryBlock | null;
  characters: Character[];
  onClose: () => void;
  onUpdateSpeaker: (blockId: string, speakerId: string, speakerName: string) => void;
  onConvertToNarration: (blockId: string) => void;
  onSaveBlock?: (blockId: string, text: string, speakerId?: string, speakerName?: string) => void;
}

export const QuickFixModal: React.FC<QuickFixModalProps> = ({
  block,
  characters,
  onClose,
  onUpdateSpeaker,
  onConvertToNarration,
  onSaveBlock,
}) => {
  if (!block) return null;

  const initialText = 'text' in block ? block.text : '';
  const initialSpeakerId = block.type === 'dialogue' ? block.speakerId : '';
  const initialSpeakerName = block.type === 'dialogue' ? block.speakerName : '';

  const [text, setText] = useState(initialText);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(initialSpeakerId);
  const [selectedSpeakerName, setSelectedSpeakerName] = useState(initialSpeakerName);

  useEffect(() => {
    setText('text' in block ? block.text : '');
    setSelectedSpeakerId(block.type === 'dialogue' ? block.speakerId : '');
    setSelectedSpeakerName(block.type === 'dialogue' ? block.speakerName : '');
  }, [block]);

  const handleSave = () => {
    if (onSaveBlock) {
      onSaveBlock(block.id, text, selectedSpeakerId, selectedSpeakerName);
    } else {
      if (selectedSpeakerId && selectedSpeakerId !== initialSpeakerId) {
        onUpdateSpeaker(block.id, selectedSpeakerId, selectedSpeakerName);
      }
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
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
          maxWidth: '520px',
          boxShadow: 'var(--shadow-elevated)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                แก้ไขข้อความและผู้พูด (Quick-Fix)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                แก้คำผิด สลับตัวละคร หรือเปลี่ยนเป็นบทบรรยาย
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
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Text Editor */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              ข้อความ (แก้ไขคำผิดได้ที่นี่):
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Character Selection for Dialogue */}
          {block.type === 'dialogue' && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                เลือกตัวละครที่พูด:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {characters.map((char) => {
                  const isSelected = selectedSpeakerId === char.id;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpeakerId(char.id);
                        setSelectedSpeakerName(char.name);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${isSelected ? char.color : 'var(--border-subtle)'}`,
                        backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {char.avatarUrl ? (
                          <img
                            src={getAssetUrl(char.avatarUrl)}
                            alt={char.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: `2px solid ${char.color}`,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: `${char.color}25`,
                              border: `2px solid ${char.color}`,
                              color: char.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {char.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                              {char.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: `${char.color}20`,
                                color: char.color,
                                fontWeight: 500,
                              }}
                            >
                              {char.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: char.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          <Check size={12} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action: Convert to Narration if it's dialogue */}
          {block.type === 'dialogue' && (
            <div style={{ marginTop: '0.85rem' }}>
              <button
                type="button"
                onClick={() => {
                  onConvertToNarration(block.id);
                  onClose();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-medium)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <BookOpen size={15} />
                เปลี่ยนเป็น "บทบรรยาย (Narration)"
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(184, 74, 57, 0.25)',
            }}
          >
            <Save size={15} />
            <span>บันทึกการแก้ไข</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import type { Character } from '../types';
import { X, Camera, Upload, Link, Check, AlertCircle, Sparkles, User, Edit2 } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';
import { uploadCharacterImage, saveCharacters, isDevEnvironment } from '../services/localApi';

interface CharacterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  novelId: string;
  onCharacterUpdated?: (updatedChar: Character) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  isOpen,
  onClose,
  character,
  novelId,
  onCharacterUpdated,
}) => {
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields for Editing
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [colorInput, setColorInput] = useState('#b84a39');
  const [descInput, setDescInput] = useState('');

  useEffect(() => {
    if (character) {
      setNameInput(character.name || '');
      setRoleInput(character.role || '');
      setColorInput(character.color || '#b84a39');
      setDescInput(character.description || '');
      setIsEditingImage(false);
      setIsEditingInfo(false);
      setPreviewData(null);
      setSaveStatus(null);
    }
  }, [character]);

  if (!isOpen || !character) return null;

  const color = character.color || 'var(--accent-primary)';
  const avatarSrc = character.avatarUrl ? getAssetUrl(character.avatarUrl) : null;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveStatus({ success: false, msg: 'กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, WebP)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewData(event.target?.result as string);
      setSaveStatus(null);
    };
    reader.readAsDataURL(file);
  };

  // Save uploaded file
  const handleSaveUpload = async () => {
    if (!previewData) return;
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const savedUrl = await uploadCharacterImage(novelId, character.id, previewData);
      if (savedUrl) {
        const updated: Character = { ...character, avatarUrl: savedUrl };
        onCharacterUpdated?.(updated);
        setSaveStatus({ success: true, msg: 'บันทึกรูปภาพลงดิสก์สำเร็จ!' });
        setTimeout(() => {
          setIsEditingImage(false);
          setPreviewData(null);
          setSaveStatus(null);
        }, 800);
      } else {
        setSaveStatus({ success: false, msg: 'ไม่สามารถบันทึกไฟล์ได้ กรุณาลองใหม่อีกครั้ง' });
      }
    } catch {
      setSaveStatus({ success: false, msg: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsSaving(false);
    }
  };

  // Save image URL
  const handleSaveUrl = async () => {
    if (!urlInput.trim()) return;
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const updated: Character = { ...character, avatarUrl: urlInput.trim() };
      const res = await saveCharacters(novelId, [updated]);
      if (res) {
        onCharacterUpdated?.(updated);
        setSaveStatus({ success: true, msg: 'บันทึก URL รูปภาพสำเร็จ!' });
        setTimeout(() => {
          setIsEditingImage(false);
          setUrlInput('');
          setSaveStatus(null);
        }, 800);
      } else {
        setSaveStatus({ success: false, msg: 'ไม่สามารถอัปเดตข้อมูลได้' });
      }
    } catch {
      setSaveStatus({ success: false, msg: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsSaving(false);
    }
  };

  // Save full character info
  const handleSaveFullInfo = async () => {
    if (!nameInput.trim()) return;
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const updated: Character = {
        ...character,
        name: nameInput.trim(),
        role: roleInput.trim() || character.role || 'ตัวละคร',
        color: colorInput.trim() || character.color,
        description: descInput.trim() || undefined,
      };
      const res = await saveCharacters(novelId, [updated]);
      if (res) {
        onCharacterUpdated?.(updated);
        setSaveStatus({ success: true, msg: 'บันทึกข้อมูลตัวละครลง characters.json สำเร็จ!' });
        setTimeout(() => {
          setIsEditingInfo(false);
          setSaveStatus(null);
        }, 800);
      } else {
        setSaveStatus({ success: false, msg: 'ไม่สามารถบันทึกข้อมูลได้' });
      }
    } catch {
      setSaveStatus({ success: false, msg: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(12px)',
        zIndex: 300,
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
          boxShadow: 'var(--shadow-elevated)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Ambient Banner */}
        <div
          style={{
            height: '8px',
            background: `linear-gradient(90deg, ${color}, ${color}80, transparent)`,
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            zIndex: 10,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-main)';
            e.currentTarget.style.borderColor = color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Main Content */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr',
              gap: '1.75rem',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Portrait & Change Image Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1.15',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: `2px solid ${color}40`,
                  boxShadow: `0 4px 18px ${color}20`,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={character.name}
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
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: color,
                      padding: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        backgroundColor: `${color}18`,
                        border: `1.5px solid ${color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <User size={28} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      ยังไม่มีภาพประกอบ
                    </span>
                  </div>
                )}
              </div>

              {/* Local Dev Image Change Button */}
              {isDevEnvironment && (
                <button
                  onClick={() => setIsEditingImage(!isEditingImage)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isEditingImage ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                    color: isEditingImage ? '#fff' : 'var(--text-main)',
                    border: `1px solid ${isEditingImage ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Camera size={14} />
                  <span>{character.avatarUrl ? 'เปลี่ยนรูปภาพ' : '+ เพิ่มรูปภาพ'}</span>
                </button>
              )}
            </div>

            {/* Right Column: Character Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!isEditingInfo ? (
                // Read View (Default for both Online and Local)
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            boxShadow: `0 0 8px ${color}`,
                            display: 'inline-block',
                          }}
                        />
                        <h2
                          style={{
                            fontSize: '1.45rem',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {character.name}
                        </h2>
                      </div>

                      {character.role && (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.76rem',
                            padding: '2px 10px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: `${color}18`,
                            color: color,
                            fontWeight: 600,
                            border: `1px solid ${color}35`,
                            marginTop: '4px',
                          }}
                        >
                          {character.role}
                        </span>
                      )}
                    </div>

                    {/* Local Dev: Edit Profile Button */}
                    {isDevEnvironment && (
                      <button
                        onClick={() => setIsEditingInfo(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-main)';
                          e.currentTarget.style.borderColor = color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                      >
                        <Edit2 size={13} />
                        <span>แก้ไขข้อมูล</span>
                      </button>
                    )}
                  </div>

                  {/* Character Details & Bio */}
                  <div
                    style={{
                      padding: '1rem 1.15rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '6px',
                      }}
                    >
                      ประวัติ / บทบาทในเรื่อง
                    </div>
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-main)',
                        lineHeight: 1.65,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {character.description || 'ยังไม่มีคำอธิบายบทบาทตัวละคร'}
                    </p>
                  </div>

                  {/* Color Metadata Tag */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.76rem',
                      color: 'var(--text-faint)',
                    }}
                  >
                    <span>สีประจำตัว:</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: color,
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: color,
                        }}
                      />
                      {color}
                    </span>
                  </div>
                </>
              ) : (
                // Local Edit Form View
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      แก้ไขข้อมูลตัวละคร (Local Dev)
                    </span>
                    <button
                      onClick={() => setIsEditingInfo(false)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-faint)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      ยกเลิก
                    </button>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      ชื่อตัวละคร
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  {/* Role & Color Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                        บทบาท (Role)
                      </label>
                      <input
                        type="text"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="เช่น ตัวเอก, ประธานชมรม"
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                        สีประจำตัว
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="color"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: '1px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-medium)',
                            cursor: 'pointer',
                          }}
                        />
                        <input
                          type="text"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-medium)',
                            backgroundColor: 'var(--bg-app)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio / Description */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      ประวัติ / บทบาทในเรื่อง
                    </label>
                    <textarea
                      rows={3}
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      placeholder="คำอธิบายตัวละคร..."
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleSaveFullInfo}
                    disabled={isSaving || !nameInput.trim()}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#fff',
                      border: 'none',
                      cursor: (isSaving || !nameInput.trim()) ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {isSaving ? 'กำลังบันทึกลงดิสก์...' : <><Check size={14} /> บันทึกข้อมูลตัวละคร</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Local Dev: Change Image Sub-Panel */}
          {isDevEnvironment && isEditingImage && (
            <div
              className="animate-slide-up"
              style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    แก้ไขรูปภาพตัวละคร (Local Dev Mode)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => { setActiveTab('upload'); setSaveStatus(null); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: activeTab === 'upload' ? 'var(--bg-app)' : 'transparent',
                      color: activeTab === 'upload' ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'upload' ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Upload size={13} />
                    <span>อัปโหลดไฟล์</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('url'); setSaveStatus(null); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: activeTab === 'url' ? 'var(--bg-app)' : 'transparent',
                      color: activeTab === 'url' ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'url' ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Link size={13} />
                    <span>ระบุ URL</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Upload File */}
              {activeTab === 'upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-medium)'}
                  >
                    {previewData ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <img
                          src={previewData}
                          alt="Preview"
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            border: `1.5px solid ${color}`,
                          }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            เลือกรูปภาพแล้ว พร้อมบันทึก
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                            คลิกเพื่อเปลี่ยนรูปภาพอื่น
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <Upload size={22} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                          รองรับ PNG, JPG, WebP (ระบบจะเซฟลง public/illustrations/ อัตโนมัติ)
                        </span>
                      </div>
                    )}
                  </div>

                  {previewData && (
                    <button
                      onClick={handleSaveUpload}
                      disabled={isSaving}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                        border: 'none',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {isSaving ? 'กำลังบันทึกไฟล์...' : <><Check size={14} /> บันทึกและแทนที่รูปตัวละคร</>}
                    </button>
                  )}
                </div>
              )}

              {/* Tab 2: Specify URL */}
              {activeTab === 'url' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="เช่น /illustrations/new_char.webp หรือ https://..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                      }}
                    />
                    <button
                      onClick={handleSaveUrl}
                      disabled={isSaving || !urlInput.trim()}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                        border: 'none',
                        cursor: (isSaving || !urlInput.trim()) ? 'not-allowed' : 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isSaving ? 'กำลังบันทึก...' : <><Check size={14} /> บันทึก</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Status Notice */}
              {saveStatus && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: saveStatus.success ? '#15803d' : '#b91c1c',
                    fontWeight: 600,
                  }}
                >
                  {saveStatus.success ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{saveStatus.msg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

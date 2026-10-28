import React, { memo } from 'react';
import { View, Text, Pressable, Image, LayoutChangeEvent } from 'react-native';
import { Character, StoryBlock, ReaderFont, ReaderLineHeight } from '../types';
import { ThemeColors } from '../theme/colors';
import { readerStyles as styles } from '../theme/readerStyles';
import { FONT_MAP } from './TypographyModal';
import { getAvatarSource } from './CharacterDetailModal';
import { OfflineImage } from './OfflineImage';
import { useReaderFonts } from './ReaderFontProvider';

interface Props {
  novelId: string;
  blocks: StoryBlock[];
  characterMap: Map<string, Character>;
  colors: ThemeColors;
  fontSize: number;
  fontFamily: ReaderFont;
  lineHeightRatio: ReaderLineHeight;
  onToggleControls: () => void;
  onSelectCharacter: (character: Character) => void;
  onOpenIllustration: (uri: string, caption?: string) => void;
  onStoryLayout?: (event: LayoutChangeEvent) => void;
  onBlockLayout?: (id: string, index: number, y: number, height: number) => void;
}

/**
 * Ensures dialogue text is neatly formatted with quotes
 * without ever causing double quotes like ““...””
 */
function formatDialogueText(rawText: string): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();

  // If it already starts and ends with paired quotes, return as-is
  if (
    (trimmed.startsWith('“') && trimmed.endsWith('”')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('「') && trimmed.endsWith('」')) ||
    (trimmed.startsWith('『') && trimmed.endsWith('』'))
  ) {
    return trimmed;
  }

  // If it has loose leading/trailing quotes, clean and neatly wrap
  const cleaned = trimmed
    .replace(/^[“”"「」『』]+/, '')
    .replace(/[“”"「」『』]+$/, '')
    .trim();
  return `“${cleaned}”`;
}

export const ReaderStory = memo(function ReaderStory({ novelId, blocks, characterMap, colors, fontSize, fontFamily, lineHeightRatio, onToggleControls, onSelectCharacter, onOpenIllustration, onStoryLayout, onBlockLayout }: Props) {
  const fonts = useReaderFonts();
  const font = FONT_MAP[fonts === 'ready' ? fontFamily : 'System'];
  return <View onLayout={onStoryLayout} testID="reader-story">{blocks.map((block, index) => <View key={block.id} testID={`story-block-${index}`} onLayout={event => { if (block.type === 'narration' || block.type === 'dialogue') onBlockLayout?.(block.id, index, event.nativeEvent.layout.y, event.nativeEvent.layout.height); }}>{(() => {
    if (block.type === 'narration') return (
      <Pressable key={block.id} onPress={onToggleControls}>
        <Text style={[styles.narrationBlock, { color: colors.narrationText, fontSize, fontFamily: font.regular, lineHeight: fontSize * lineHeightRatio, marginBottom: Math.round(fontSize * 0.85) }]}>
          {block.text}
        </Text>
      </Pressable>
    );
    if (block.type === 'dialogue') {
      const character = characterMap.get(block.speakerId);
      const color = character?.color || colors.primary;
      const avatar = getAvatarSource(character?.avatarUrl);
      return <View key={block.id} style={[styles.dialogueNovelCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: color }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`ดูข้อมูล ${block.speakerName}`} style={styles.speakerRow}
          onPress={() => onSelectCharacter(character ?? { id: block.speakerId, name: block.speakerName, role: 'ตัวละครประกอบ', color })}>
          {avatar ? <Image source={avatar} style={[styles.speakerAvatar, { borderColor: color }]} resizeMode="cover" />
            : <View style={[styles.speakerAvatarPlaceholder, { backgroundColor: `${color}20`, borderColor: color }]}>
              <Text style={[styles.speakerInitial, { color }]}>{block.speakerName.charAt(0)}</Text>
            </View>}
          <View style={styles.speakerTextContainer}><View style={styles.speakerNameAndRole}>
            <Text style={[styles.speakerName, { color, fontFamily: font.bold || font.regular, fontSize: Math.max(14, Math.min(18, Math.round(fontSize * 0.8))) }]}>{block.speakerName}</Text>
            {character?.role ? <View style={[styles.speakerRoleBadge, { backgroundColor: `${color}15` }]}>
              <Text style={[styles.speakerRoleText, { color, fontSize: Math.max(11, Math.min(13, Math.round(fontSize * 0.55))) }]} numberOfLines={1}>{character.role}</Text>
            </View> : null}
          </View></View>
        </Pressable>
        <Pressable onPress={onToggleControls}>
          <Text style={[styles.dialogueText, { color: colors.text, fontSize, fontFamily: font.regular, lineHeight: fontSize * lineHeightRatio * 0.95 }]}>{formatDialogueText(block.text)}</Text>
        </Pressable>
      </View>;
    }
    if (block.type === 'scene_break') return <Pressable key={block.id} onPress={onToggleControls} style={styles.sceneBreakRow}>
      <View style={[styles.sceneBreakLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.sceneBreakSymbol, { color: colors.textMuted }]}>{block.symbol || '◆'}</Text>
      <View style={[styles.sceneBreakLine, { backgroundColor: colors.border }]} />
    </Pressable>;
    return <View key={block.id} style={styles.illustrationBlockContainer}>
      <View style={[styles.illustrationCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <OfflineImage novelId={novelId} src={block.src} style={styles.illustrationImg} color={colors.primary}
          accessibilityLabel={block.alt || block.caption || 'ภาพประกอบนิยาย'} onOpen={uri => onOpenIllustration(uri, block.caption)} />
        <View style={styles.illustrationFooter}>
          <Text style={[styles.illustrationCaption, { color: colors.narrationText, fontFamily: font.regular }]}>{block.caption || 'ภาพประกอบนิยาย'}</Text>
          <Text style={[styles.illustrationZoomHint, { color: colors.primary }]}>ขยายภาพ</Text>
        </View>
      </View>
    </View>;
  })()}</View>)}</View>;
});

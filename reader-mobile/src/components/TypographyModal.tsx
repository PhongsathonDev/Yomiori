import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Minus, Plus, Check, Sun, Moon, Coffee } from 'lucide-react-native';
import { ReaderTheme, ReaderFont, ReaderLineHeight } from '../types';
import { themes } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReaderFonts } from './ReaderFontProvider';

export type FontOption = ReaderFont;
export type LineHeightOption = ReaderLineHeight;

export const FONT_MAP: Record<FontOption, { regular: string | undefined; bold: string | undefined; label: string; desc: string }> = {
  Sarabun: {
    regular: 'Sarabun_400Regular',
    bold: 'Sarabun_700Bold',
    label: 'สารบรรณ (Sarabun)',
    desc: 'สไตล์วรรณกรรมสิ่งพิมพ์ อ่อนช้อย สบายตา',
  },
  Kanit: {
    regular: 'Kanit_400Regular',
    bold: 'Kanit_600SemiBold',
    label: 'คณิต (Kanit)',
    desc: 'โมเดิร์น ไร้หัว คมชัด อ่านง่าย',
  },
  Prompt: {
    regular: 'Prompt_400Regular',
    bold: 'Prompt_600SemiBold',
    label: 'พร้อม (Prompt)',
    desc: 'เรขาคณิต เรียบหรู ทรงพลัง',
  },
  System: {
    regular: undefined,
    bold: undefined,
    label: 'ระบบเครื่อง (System)',
    desc: 'ฟอนต์เริ่มต้นของอุปกรณ์',
  },
};

interface Props {
  visible: boolean;
  theme: ReaderTheme;
  fontSize: number;
  fontFamily: FontOption;
  lineHeightRatio: LineHeightOption;
  onChangeFontSize: (delta: number) => void;
  onChangeFontFamily: (family: FontOption) => void;
  onChangeLineHeight: (ratio: LineHeightOption) => void;
  onChangeTheme?: (theme: ReaderTheme) => void;
  onClose: () => void;
}

export const TypographyModal: React.FC<Props> = ({
  visible,
  theme,
  fontSize,
  fontFamily,
  lineHeightRatio,
  onChangeFontSize,
  onChangeFontFamily,
  onChangeLineHeight,
  onChangeTheme,
  onClose,
}) => {
  const themeColors = themes[theme];
  const fonts = useReaderFonts();
  const activeFontMeta = FONT_MAP[fonts === 'ready' ? fontFamily : 'System'];
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder, paddingBottom: Math.max(30, insets.bottom + 12) }]}
          activeOpacity={1}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>ตั้งค่าตัวอักษรและการอ่าน</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="ปิดการตั้งค่าตัวอักษร" onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {fonts === 'error' && <Text style={{ color: themeColors.textMuted }}>โหลดแบบอักษรไม่ได้ กำลังใช้แบบอักษรระบบ</Text>}
            {onChangeTheme && <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>ธีม</Text>
              <View style={styles.themeOptions}>
                {([
                  { id: 'light', label: 'สว่าง', Icon: Sun },
                  { id: 'sepia', label: 'โทนอุ่น', Icon: Coffee },
                  { id: 'dark', label: 'มืด', Icon: Moon },
                ] as const).map(({ id, label, Icon }) => <TouchableOpacity key={id} accessibilityRole="radio"
                  accessibilityLabel={`ธีม${label}`} accessibilityState={{ selected: theme === id }} onPress={() => onChangeTheme(id)}
                  style={[styles.themeOption, { backgroundColor: themes[id].background, borderColor: theme === id ? themeColors.primary : themeColors.border }]}>
                  <Icon size={20} color={themes[id].text} />
                  <Text style={[styles.themeLabel, { color: themes[id].text }]}>{label}</Text>
                </TouchableOpacity>)}
              </View>
            </View>}
            {/* Live Preview Box */}
            <View
              style={[
                styles.previewBox,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: themeColors.text,
                  fontSize: fontSize,
                  fontFamily: activeFontMeta.regular,
                  lineHeight: fontSize * lineHeightRatio,
                  textAlign: 'left',
                }}
                numberOfLines={2}
              >
                {'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}นี่คือตัวอย่างการแสดงผลสำหรับอ่านนิยาย &ldquo;โยมิโอริ&rdquo; ในรูปแบบรูปเล่ม
              </Text>
            </View>

            {/* Section 1: Font Size */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>ขนาดตัวอักษร</Text>
              <View style={styles.fontSizeControlRow}>
                <TouchableOpacity
                  style={[styles.sizeBtn, { backgroundColor: themeColors.primaryBg }]}
                  onPress={() => onChangeFontSize(-1)}
                  accessibilityLabel="ลดขนาดตัวอักษร"
                  disabled={fontSize <= 14}
                  accessibilityState={{ disabled: fontSize <= 14 }}
                >
                  <Minus size={16} color={themeColors.primary} />
                </TouchableOpacity>

                <Text style={[styles.sizeNumber, { color: themeColors.text }]}>{fontSize} pt</Text>

                <TouchableOpacity
                  style={[styles.sizeBtn, { backgroundColor: themeColors.primaryBg }]}
                  onPress={() => onChangeFontSize(1)}
                  accessibilityLabel="เพิ่มขนาดตัวอักษร"
                  disabled={fontSize >= 26}
                  accessibilityState={{ disabled: fontSize >= 26 }}
                >
                  <Plus size={16} color={themeColors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Font Family */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>แบบอักษร (Font Family)</Text>
              <View style={styles.fontOptionsList}>
                {(['Sarabun', 'Kanit', 'Prompt', 'System'] as FontOption[]).map((f) => {
                  const meta = FONT_MAP[f];
                  const isSelected = fontFamily === f;

                  return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.fontItem,
                        {
                          backgroundColor: themeColors.background,
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
                          borderWidth: isSelected ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => onChangeFontFamily(f)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fontItemInfo}>
                        <Text
                          style={[
                            styles.fontItemName,
                            {
                              color: themeColors.text,
                              fontFamily: fonts === 'ready' ? meta.regular : undefined,
                            },
                          ]}
                        >
                          {meta.label}
                        </Text>
                        <Text style={[styles.fontItemDesc, { color: themeColors.textMuted }]}>
                          {meta.desc}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: themeColors.primary }]}>
                          <Check size={14} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Line Height */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>ระยะห่างบรรทัด</Text>
              <View style={styles.lineHeightPillsRow}>
                {[
                  { label: 'กระชับ', val: 1.55 as LineHeightOption },
                  { label: 'มาตรฐาน', val: 1.85 as LineHeightOption },
                  { label: 'โปร่งสบาย', val: 2.15 as LineHeightOption },
                ].map((item) => {
                  const isSelected = lineHeightRatio === item.val;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.pillBtn,
                        {
                          backgroundColor: isSelected ? themeColors.primary : themeColors.background,
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => onChangeLineHeight(item.val)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[
                          styles.pillBtnText,
                          { color: isSelected ? '#ffffff' : themeColors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '700',
  },
  closeBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  previewBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  section: {
    marginBottom: 18,
  },
  themeOptions: { flexDirection: 'row', gap: 8 },
  themeOption: { flex: 1, minWidth: 48, minHeight: 64, paddingVertical: 10, paddingHorizontal: 4, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  themeLabel: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  fontSizeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sizeBtn: {
    width: 48,
    height: 48,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  fontOptionsList: {
    gap: 8,
  },
  fontItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  fontItemInfo: {
    flex: 1,
  },
  fontItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fontItemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  lineHeightPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
});

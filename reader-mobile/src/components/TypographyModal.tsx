import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Minus, Plus, Sun, Moon, Coffee } from 'lucide-react-native';
import { ReaderTheme, ReaderFont, ReaderLineHeight } from '../types';
import { themes } from '../theme/colors';
import { radius, typeScale } from '../theme/layout';
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
      <TouchableOpacity style={[styles.overlay, { backgroundColor: themeColors.scrim }]} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: themeColors.card, borderColor: themeColors.border, paddingBottom: Math.max(24, insets.bottom + 10) }]}
          activeOpacity={1}
        >
          <View style={[styles.handle, { backgroundColor: themeColors.borderStrong }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>ตั้งค่าการอ่าน</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="ปิดการตั้งค่าตัวอักษร" onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {fonts === 'error' && <Text style={{ color: themeColors.textMuted, fontSize: typeScale.body }}>โหลดแบบอักษรไม่ได้ กำลังใช้แบบอักษรระบบ</Text>}

            {onChangeTheme && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>ธีม</Text>
                <View style={styles.themeOptions}>
                  {([
                    { id: 'light', label: 'สว่าง', Icon: Sun },
                    { id: 'sepia', label: 'โทนอุ่น', Icon: Coffee },
                    { id: 'dark', label: 'มืด', Icon: Moon },
                  ] as const).map(({ id, label, Icon }) => {
                    const selected = theme === id;
                    return (
                      <TouchableOpacity key={id} accessibilityRole="radio"
                        accessibilityLabel={`ธีม${label}`} accessibilityState={{ selected }} onPress={() => onChangeTheme(id)}
                        style={[
                          styles.themeOption,
                          {
                            backgroundColor: themes[id].background,
                            borderColor: selected ? themeColors.primary : themeColors.border,
                            borderWidth: selected ? 1.5 : 1,
                          },
                        ]}>
                        <Icon size={18} color={selected ? themeColors.primary : themes[id].textMuted} />
                        <Text style={[styles.themeLabel, { color: selected ? themeColors.primary : themes[id].textMuted }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Live preview: the fastest way to judge a reading setting. */}
            <View style={styles.previewSection}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>ตัวอย่าง</Text>
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: themeColors.background, borderColor: themeColors.border },
                ]}
              >
                <Text
                  style={{
                    color: themeColors.narrationText,
                    fontSize: fontSize,
                    fontFamily: activeFontMeta.regular,
                    lineHeight: fontSize * lineHeightRatio,
                    textAlign: 'left',
                  }}
                  numberOfLines={2}
                >
                  นี่คือตัวอย่างการแสดงผลสำหรับอ่านนิยาย &ldquo;โยมิโอริ&rdquo; ในรูปแบบรูปเล่ม
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>ขนาดตัวอักษร</Text>
              <View style={[styles.sizeRow, { borderColor: themeColors.border }]}>
                <TouchableOpacity
                  style={[styles.sizeBtn, { backgroundColor: themeColors.primaryBg, opacity: fontSize <= 14 ? 0.4 : 1 }]}
                  onPress={() => onChangeFontSize(-1)}
                  accessibilityLabel="ลดขนาดตัวอักษร"
                  disabled={fontSize <= 14}
                  accessibilityState={{ disabled: fontSize <= 14 }}
                >
                  <Minus size={16} color={themeColors.primary} />
                </TouchableOpacity>

                <View style={styles.sizeReadout}>
                  <Text style={[styles.sizeNumber, { color: themeColors.text }]}>{fontSize}</Text>
                  <Text style={[styles.sizeUnit, { color: themeColors.textFaint }]}>pt</Text>
                </View>

                <TouchableOpacity
                  style={[styles.sizeBtn, { backgroundColor: themeColors.primaryBg, opacity: fontSize >= 26 ? 0.4 : 1 }]}
                  onPress={() => onChangeFontSize(1)}
                  accessibilityLabel="เพิ่มขนาดตัวอักษร"
                  disabled={fontSize >= 26}
                  accessibilityState={{ disabled: fontSize >= 26 }}
                >
                  <Plus size={16} color={themeColors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>แบบอักษร</Text>
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
                          backgroundColor: isSelected ? themeColors.primaryBg : 'transparent',
                          borderColor: isSelected ? themeColors.primary : themeColors.border,
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

                      <View style={[styles.radio, { borderColor: isSelected ? themeColors.primary : themeColors.borderStrong }]}>
                        {isSelected && <View style={[styles.radioDot, { backgroundColor: themeColors.primary }]} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

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
                          backgroundColor: isSelected ? themeColors.primary : 'transparent',
                          borderColor: isSelected ? themeColors.primary : themeColors.borderStrong,
                        },
                      ]}
                      onPress={() => onChangeLineHeight(item.val)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[
                          styles.pillBtnText,
                          { color: isSelected ? themeColors.onPrimary : themeColors.textMuted },
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
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
    opacity: 0.6,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: typeScale.title,
    lineHeight: 24,
    fontWeight: '700',
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 22,
  },
  previewSection: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: typeScale.meta,
    fontWeight: '600',
    marginBottom: 9,
  },
  themeOptions: { flexDirection: 'row', gap: 8 },
  themeOption: {
    flex: 1,
    minWidth: 48,
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  themeLabel: { fontSize: typeScale.meta, lineHeight: 16, textAlign: 'center', fontWeight: '600' },
  previewBox: {
    padding: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: 'center',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  sizeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeReadout: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  sizeNumber: {
    fontSize: typeScale.display - 1,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sizeUnit: {
    fontSize: typeScale.meta,
    fontWeight: '600',
  },
  fontOptionsList: {
    gap: 6,
  },
  fontItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  fontItemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  fontItemName: {
    fontSize: typeScale.bodyLg,
    fontWeight: '600',
  },
  fontItemDesc: {
    fontSize: typeScale.meta,
    marginTop: 3,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  lineHeightPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnText: {
    fontSize: typeScale.caption,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
});

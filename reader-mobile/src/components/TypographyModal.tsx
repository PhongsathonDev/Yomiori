import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Minus, Plus, Check, BookOpen, Layers } from 'lucide-react-native';
import { ReaderTheme } from '../types';
import { themes } from '../theme/colors';

export type FontOption = 'Sarabun' | 'Kanit' | 'Prompt' | 'System';
export type LineHeightOption = 1.55 | 1.85 | 2.15;
export type LayoutStyle = 'modern' | 'novel';

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
  layoutStyle: LayoutStyle;
  onChangeFontSize: (delta: number) => void;
  onChangeFontFamily: (family: FontOption) => void;
  onChangeLineHeight: (ratio: LineHeightOption) => void;
  onChangeLayoutStyle: (style: LayoutStyle) => void;
  onClose: () => void;
}

export const TypographyModal: React.FC<Props> = ({
  visible,
  theme,
  fontSize,
  fontFamily,
  lineHeightRatio,
  layoutStyle,
  onChangeFontSize,
  onChangeFontFamily,
  onChangeLineHeight,
  onChangeLayoutStyle,
  onClose,
}) => {
  const themeColors = themes[theme];
  const activeFontMeta = FONT_MAP[fontFamily];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
          activeOpacity={1}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>ตั้งค่าการอ่านและจัดหน้า</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                  textAlign: layoutStyle === 'novel' ? 'left' : 'center',
                }}
                numberOfLines={2}
              >
                {layoutStyle === 'novel' ? '\u00A0\u00A0\u00A0\u00A0' : ''}นี่คือตัวอย่างการแสดงผลสำหรับอ่านนิยาย &ldquo;โยมิโอริ&rdquo;
              </Text>
            </View>

            {/* Section 0: Layout Style Selection (New Feature) */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>รูปแบบการจัดหน้า (Layout Style)</Text>
              <View style={styles.layoutToggleRow}>
                {/* Novel Book Style */}
                <TouchableOpacity
                  style={[
                    styles.layoutOptionCard,
                    {
                      backgroundColor: themeColors.background,
                      borderColor: layoutStyle === 'novel' ? themeColors.primary : themeColors.border,
                      borderWidth: layoutStyle === 'novel' ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => onChangeLayoutStyle('novel')}
                  activeOpacity={0.7}
                >
                  <View style={styles.layoutOptionHeader}>
                    <BookOpen size={16} color={layoutStyle === 'novel' ? themeColors.primary : themeColors.textMuted} />
                    <Text
                      style={[
                        styles.layoutOptionTitle,
                        { color: layoutStyle === 'novel' ? themeColors.primary : themeColors.text },
                      ]}
                    >
                      รูปเล่มนิยาย (ใหม่)
                    </Text>
                  </View>
                  <Text style={[styles.layoutOptionDesc, { color: themeColors.textMuted }]}>
                    ย่อหน้าบรรทัดแรก บทสนทนานุ่มนวล สไตล์สำนักพิมพ์
                  </Text>
                </TouchableOpacity>

                {/* Visual Novel Modern Style */}
                <TouchableOpacity
                  style={[
                    styles.layoutOptionCard,
                    {
                      backgroundColor: themeColors.background,
                      borderColor: layoutStyle === 'modern' ? themeColors.primary : themeColors.border,
                      borderWidth: layoutStyle === 'modern' ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => onChangeLayoutStyle('modern')}
                  activeOpacity={0.7}
                >
                  <View style={styles.layoutOptionHeader}>
                    <Layers size={16} color={layoutStyle === 'modern' ? themeColors.primary : themeColors.textMuted} />
                    <Text
                      style={[
                        styles.layoutOptionTitle,
                        { color: layoutStyle === 'modern' ? themeColors.primary : themeColors.text },
                      ]}
                    >
                      วิชวลโนเวล (เดิม)
                    </Text>
                  </View>
                  <Text style={[styles.layoutOptionDesc, { color: themeColors.textMuted }]}>
                    ข้อความชิดซ้าย การ์ดกล่องบทสนทนาเน้นชัดเจน
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 1: Font Size */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>ขนาดตัวอักษร</Text>
              <View style={styles.fontSizeControlRow}>
                <TouchableOpacity
                  style={[styles.sizeBtn, { backgroundColor: themeColors.primaryBg }]}
                  onPress={() => onChangeFontSize(-1)}
                >
                  <Minus size={16} color={themeColors.primary} />
                </TouchableOpacity>

                <Text style={[styles.sizeNumber, { color: themeColors.text }]}>{fontSize} pt</Text>

                <TouchableOpacity
                  style={[styles.sizeBtn, { backgroundColor: themeColors.primaryBg }]}
                  onPress={() => onChangeFontSize(1)}
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
                      activeOpacity={0.7}
                    >
                      <View style={styles.fontItemInfo}>
                        <Text
                          style={[
                            styles.fontItemName,
                            {
                              color: themeColors.text,
                              fontFamily: meta.regular,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  layoutToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  layoutOptionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  layoutOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  layoutOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  layoutOptionDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  fontSizeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sizeBtn: {
    width: 44,
    height: 44,
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
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

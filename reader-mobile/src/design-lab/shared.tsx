import React, { useId } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { BookCover } from '../components/BookCover';
import type { PreviewBook } from './data';
import type { LabPalette, LabScreen } from './tokens';

export interface ConceptProps {
  palette: LabPalette;
  screen: LabScreen;
  book: PreviewBook;
  onOpenBook: (book: PreviewBook) => void;
  onOpenReader: (book: PreviewBook) => void;
  onBack: () => void;
}

export function PreviewCover({
  book,
  style,
  radius = 8,
}: {
  book: PreviewBook;
  style: StyleProp<ViewStyle>;
  radius?: number;
}) {
  return (
    <View style={[styles.coverFrame, { borderRadius: radius }, style]}>
      <BookCover uri={book.coverUrl} style={StyleSheet.absoluteFill} />
    </View>
  );
}

export function ProgressLine({
  value,
  color,
  track,
  height = 3,
  radius = 2,
}: {
  value: number;
  color: string;
  track: string;
  height?: number;
  radius?: number;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ height, borderRadius: radius, backgroundColor: track, overflow: 'hidden' }}
    >
      <View style={{ width: `${clamped * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

export function usePreviewGrid() {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 560 ? 3 : 2;
  const widthPercent = columns === 4 ? '23.5%' : columns === 3 ? '31.5%' : '48%';
  return { columns, widthPercent: widthPercent as `${number}%` };
}

export function bookMeta(book: PreviewBook) {
  if (book.status === 'new') return 'ยังไม่เริ่มอ่าน';
  if (book.status === 'done') return 'อ่านจบแล้ว';
  return `ตอนที่ ${book.currentChapter} จาก ${book.totalChapters}`;
}

export function chapterNumber(book: PreviewBook) {
  if (book.status === 'new') return 'เริ่มตอนแรก';
  if (book.status === 'done') return 'อ่านอีกครั้ง';
  return `อ่านต่อตอนที่ ${book.currentChapter}`;
}

export function HardShadow({
  children,
  color,
  radius = 12,
  offset = 5,
  style,
}: {
  children: React.ReactNode;
  color: string;
  radius?: number;
  offset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, style]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          borderRadius: radius,
          backgroundColor: color,
        }}
      />
      <View style={{ borderRadius: radius, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

export function CoverScrim({ from = 0.02, to = 0.94 }: { from?: number; to?: number }) {
  const id = `scrim-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      aria-hidden
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity={from} />
          <Stop offset="0.55" stopColor="#000000" stopOpacity={Math.min(1, to * 0.55)} />
          <Stop offset="1" stopColor="#000000" stopOpacity={to} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function SectionHeading({
  palette,
  children,
  action,
}: {
  palette: LabPalette;
  children: React.ReactNode;
  action?: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{children}</Text>
      {action ? <Text style={[styles.sectionAction, { color: palette.muted }]}>{action}</Text> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  coverFrame: {
    overflow: 'hidden',
    backgroundColor: '#DDD6C9',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 27,
  },
  sectionAction: {
    fontSize: 12,
  },
});

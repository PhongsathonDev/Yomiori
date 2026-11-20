import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Moon, Sun, X } from 'lucide-react-native';
import type { RootStackParamList } from '../types';
import { PREVIEW_BOOKS, type PreviewBook } from '../design-lab/data';
import { CalmConcept } from '../design-lab/CalmConcept';
import { MaConcept } from '../design-lab/MaConcept';
import { NocturneConcept } from '../design-lab/NocturneConcept';
import { SwissConcept } from '../design-lab/SwissConcept';
import { WashiConcept } from '../design-lab/WashiConcept';
import { ZineConcept } from '../design-lab/ZineConcept';
import {
  PALETTES,
  CONCEPTS,
  type DesignConcept,
  type LabMode,
  type LabScreen,
} from '../design-lab/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DesignLab'>;
};

const SCREEN_TABS: { id: LabScreen; label: string }[] = [
  { id: 'shelf', label: 'ชั้นหนังสือ' },
  { id: 'detail', label: 'รายละเอียด' },
  { id: 'reader', label: 'อ่าน' },
];

const CONCEPT_VIEWS = {
  ma: MaConcept,
  swiss: SwissConcept,
  calm: CalmConcept,
  washi: WashiConcept,
  zine: ZineConcept,
  nocturne: NocturneConcept,
};

export function DesignLabScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const framed = width >= 560;
  const [concept, setConcept] = useState<DesignConcept>('ma');
  const [mode, setMode] = useState<LabMode>('light');
  const [screen, setScreen] = useState<LabScreen>('shelf');
  const [book, setBook] = useState<PreviewBook>(PREVIEW_BOOKS[0]);
  const [fade] = useState(() => new Animated.Value(1));

  const palette = PALETTES[concept][mode];
  const ConceptView = CONCEPT_VIEWS[concept];

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 190,
      useNativeDriver: true,
    }).start();
  }, [concept, mode, screen, fade]);

  const translateY = useMemo(
    () => fade.interpolate({ inputRange: [0, 1], outputRange: [7, 0] }),
    [fade],
  );

  const openBook = (next: PreviewBook) => {
    setBook(next);
    setScreen('detail');
  };
  const openReader = (next: PreviewBook) => {
    setBook(next);
    setScreen('reader');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.chrome}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <Text style={styles.labTitle}>Yomiori</Text>
            <Text style={styles.labSub}>design lab · 6 แบบ</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mode === 'light' ? 'ใช้โหมดมืด' : 'ใช้โหมดสว่าง'}
              onPress={() => setMode(current => (current === 'light' ? 'dark' : 'light'))}
              style={({ pressed }) => [styles.roundButton, pressed && { opacity: 0.65 }]}
            >
              {mode === 'light' ? (
                <Moon size={18} color="#EDE8DE" />
              ) : (
                <Sun size={18} color="#EDE8DE" />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ปิด Design Lab และกลับแอป"
              onPress={() => navigation.replace('Bookshelf')}
              style={({ pressed }) => [styles.roundButton, pressed && { opacity: 0.65 }]}
            >
              <X size={18} color="#EDE8DE" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.conceptTabs}
          style={styles.conceptTabsScroll}
        >
          {CONCEPTS.map(item => {
            const active = concept === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`แบบ ${item.name} ${item.tagline}`}
                onPress={() => setConcept(item.id)}
                style={({ pressed }) => [
                  styles.conceptTab,
                  active && styles.conceptTabActive,
                  active && { borderColor: item.swatches[2] },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <View style={styles.conceptTabTop}>
                  <View style={styles.swatches}>
                    {item.swatches.map(swatch => (
                      <View
                        key={swatch}
                        style={[styles.swatch, { backgroundColor: swatch, borderColor: '#3A3A41' }]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.conceptName, active && { color: '#FFF8ED' }]}>
                    {item.name}
                  </Text>
                  <Text style={styles.conceptEnglish}>{item.english}</Text>
                </View>
                <Text style={[styles.conceptTagline, active && { color: '#BDB6AA' }]}>
                  {item.tagline}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.screenRow}>
          <View style={styles.screenTabs}>
            {SCREEN_TABS.map(item => {
              const active = screen === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setScreen(item.id)}
                  style={({ pressed }) => [
                    styles.screenTab,
                    active && styles.screenTabActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.screenTabText, active && styles.screenTabTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.previewNote}>ตัวอย่าง · ยังไม่เปลี่ยนแอปจริง</Text>
        </View>
      </View>

      <View
        style={[
          styles.stage,
          framed ? styles.stageFramed : styles.stageFull,
          { backgroundColor: palette.bg, borderColor: framed ? '#2A2A31' : 'transparent' },
        ]}
      >
        <Animated.View
          style={{ flex: 1, opacity: fade, transform: [{ translateY }] }}
        >
          <ConceptView
            palette={palette}
            screen={screen}
            book={book}
            onOpenBook={openBook}
            onOpenReader={openReader}
            onBack={() => setScreen('shelf')}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0D' },
  chrome: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  labTitle: {
    fontFamily: 'Prompt_600SemiBold',
    fontSize: 19,
    lineHeight: 25,
    color: '#F3EEE3',
    letterSpacing: 0.4,
  },
  labSub: {
    fontFamily: 'Sarabun_400Regular',
    fontSize: 10.5,
    color: '#8B8B94',
    letterSpacing: 0.8,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E2E36',
    backgroundColor: '#17171B',
  },
  conceptTabsScroll: { marginTop: 10 },
  conceptTabs: { gap: 8, paddingRight: 4, flexGrow: 1 },
  conceptTab: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 142,
    borderWidth: 1,
    borderColor: '#292930',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#121215',
  },
  conceptTabActive: { backgroundColor: '#1D1D23', borderColor: '#4A4A55' },
  conceptTabTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatches: { flexDirection: 'row', gap: 3 },
  swatch: { width: 10, height: 10, borderRadius: 3, borderWidth: 0.5 },
  conceptName: {
    fontFamily: 'Sarabun_600SemiBold',
    fontSize: 13,
    color: '#B8B8C0',
  },
  conceptEnglish: {
    fontFamily: 'Sarabun_400Regular',
    fontSize: 9.5,
    color: '#6D6D77',
    letterSpacing: 0.4,
  },
  conceptTagline: {
    fontFamily: 'Sarabun_400Regular',
    fontSize: 9.5,
    color: '#71717B',
    marginTop: 3,
  },
  screenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
    gap: 10,
  },
  screenTabs: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: '#27272E',
    borderRadius: 20,
    padding: 3,
  },
  screenTab: {
    minHeight: 32,
    borderRadius: 17,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTabActive: { backgroundColor: '#F2ECE0' },
  screenTabText: {
    fontFamily: 'Sarabun_600SemiBold',
    fontSize: 11,
    color: '#9696A0',
  },
  screenTabTextActive: { color: '#151518' },
  previewNote: {
    fontFamily: 'Sarabun_400Regular',
    fontSize: 9.5,
    color: '#6E6E78',
    flexShrink: 1,
    textAlign: 'right',
  },
  stage: { flex: 1, overflow: 'hidden' },
  stageFramed: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  stageFull: { borderWidth: 0 },
});

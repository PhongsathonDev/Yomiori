import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveIllustrationUri } from '../services/storage';

interface Props {
  novelId?: string;
  src: string;
  style: ImageProps['style'];
  resizeMode?: ImageProps['resizeMode'];
  accessibilityLabel?: string;
  onOpen?: (uri: string) => void;
  color?: string;
}

/** Both the thumbnail and its lightbox open the same resolved local URI. */
export const OfflineImage = React.memo(function OfflineImage({ novelId, src, style, resizeMode = 'cover', accessibilityLabel, onOpen, color = '#b84a5f' }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; uri: string; failed: boolean } | null>(null);
  const key = `${novelId ?? ''}:${src}:${attempt}`;
  useEffect(() => {
    let active = true;
    const resolve = novelId ? resolveIllustrationUri(novelId, src) : Promise.resolve(src);
    void resolve.then(uri => {
      if (active) setResult({ key, uri, failed: false });
    }).catch(() => {
      if (active) setResult({ key, uri: src, failed: true });
    });
    return () => { active = false; };
  }, [key, novelId, src]);

  const current = result?.key === key ? result : null;
  if (!current) return <View style={[style, styles.placeholder]}><ActivityIndicator color={color} /></View>;
  if (current.failed) return (
    <Pressable accessibilityRole="button" accessibilityLabel="โหลดภาพอีกครั้ง" onPress={() => setAttempt(n => n + 1)} style={[style, styles.placeholder]}>
      <Text style={{ color }}>โหลดภาพไม่ได้ แตะเพื่อลองอีกครั้ง</Text>
    </Pressable>
  );
  const image = <Image source={{ uri: current.uri }} accessibilityLabel={accessibilityLabel} style={style} resizeMode={resizeMode}
    onError={() => setResult(previous => previous?.key === key ? { ...previous, failed: true } : previous)} />;
  return onOpen ? <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? 'ขยายภาพประกอบ'} onPress={() => onOpen(current.uri)}>{image}</Pressable> : image;
});

const styles = StyleSheet.create({ placeholder: { alignItems: 'center', justifyContent: 'center', padding: 16 } });

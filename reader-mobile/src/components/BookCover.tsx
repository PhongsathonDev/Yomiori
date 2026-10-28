import React from 'react';
import { Image, ImageProps, View } from 'react-native';
import { BookOpen } from 'lucide-react-native';

export function BookCover({ uri, style }: { uri: string; style: ImageProps['style'] }) {
  if (!uri) return <View accessibilityLabel="ไม่มีภาพปกในเครื่อง" style={[style, { alignItems: 'center', justifyContent: 'center' }]}><BookOpen size={28} color="#7c746d" /></View>;
  const url = uri.startsWith('http') ? uri : `https://phongsathondev.github.io/Yomiori/${uri.replace(/^\//, '')}`;
  return <Image source={{ uri: url }} style={style} resizeMode="cover" />;
}

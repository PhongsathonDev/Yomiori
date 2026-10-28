import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { OfflineImage } from './OfflineImage';

interface ImageLightboxModalProps {
  visible: boolean;
  imageUrl: string | null;
  title?: string;
  caption?: string;
  novelId?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  visible,
  imageUrl,
  title,
  caption,
  novelId,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible || !imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Top Header / Close Button */}
        <View style={[styles.header, { top: Math.max(16, insets.top + 8) }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="ปิดภาพขยาย"
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.8}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Zoomable Image Container */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          centerContent={true}
          minimumZoomScale={1}
          maximumZoomScale={3.5}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom={true}
        >
          <View style={styles.imageWrapper}>
            <OfflineImage
              novelId={novelId}
              src={imageUrl}
              accessibilityLabel={caption || title || 'ภาพประกอบนิยาย'}
              color="#ffffff"
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </ScrollView>

        {/* Bottom Editorial Caption */}
        {(title || caption) && (
          <View style={[styles.captionContainer, { bottom: Math.max(24, insets.bottom + 16) }]}>
            {title ? <Text style={styles.captionTitle}>{title}</Text> : null}
            {caption ? <Text style={styles.captionText}>{caption}</Text> : null}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  closeIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.78,
  },
  captionContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(24, 24, 22, 0.86)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'center',
    zIndex: 90,
  },
  captionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f2ede2',
    textAlign: 'center',
    marginBottom: 4,
  },
  captionText: {
    fontSize: 12.5,
    color: '#a6a096',
    textAlign: 'center',
    lineHeight: 18,
  },
});

import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageLightboxModalProps {
  visible: boolean;
  imageUrl: string | null;
  title?: string;
  caption?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  visible,
  imageUrl,
  title,
  caption,
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
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Header / Close Button */}
        <View style={[styles.header, { top: Math.max(16, insets.top + 8) }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
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
          <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
    width: 40,
    height: 40,
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
    backgroundColor: 'rgba(18, 18, 20, 0.85)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    zIndex: 90,
  },
  captionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  captionText: {
    fontSize: 12.5,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});

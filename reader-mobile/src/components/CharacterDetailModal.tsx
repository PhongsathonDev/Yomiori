import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Sparkles, User } from 'lucide-react-native';
import { Character, ReaderTheme } from '../types';
import { themes } from '../theme/colors';

interface Props {
  visible: boolean;
  character: Character | null;
  theme: ReaderTheme;
  onClose: () => void;
}

const LOCAL_AVATARS: Record<string, any> = {
  '/illustrations/char_rino.jpg': require('../../assets/illustrations/char_rino.jpg'),
  '/illustrations/char_toya.png': require('../../assets/illustrations/char_toya.png'),
  '/illustrations/char_mei.png': require('../../assets/illustrations/char_mei.png'),
  '/illustrations/char_shion.png': require('../../assets/illustrations/char_shion.png'),
  '/illustrations/char_urushibara.png': require('../../assets/illustrations/char_urushibara.png'),
  '/illustrations/char_ayamori.png': require('../../assets/illustrations/char_ayamori.png'),
};

export function getAvatarSource(avatarUrl?: string) {
  if (!avatarUrl) return null;
  if (LOCAL_AVATARS[avatarUrl]) return LOCAL_AVATARS[avatarUrl];
  if (avatarUrl.startsWith('http')) return { uri: avatarUrl };
  return { uri: `https://phongsathondev.github.io/Yomiori/${avatarUrl.replace(/^\//, '')}` };
}

export const CharacterDetailModal: React.FC<Props> = ({
  visible,
  character,
  theme,
  onClose,
}) => {
  if (!character) return null;

  const themeColors = themes[theme];
  const charColor = character.color || themeColors.primary;
  const avatarSource = getAvatarSource(character.avatarUrl);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              {/* Close Button */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={20} color={themeColors.textMuted} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Big Avatar */}
                <View style={styles.avatarWrapper}>
                  {avatarSource ? (
                    <Image
                      source={avatarSource}
                      style={[styles.bigAvatar, { borderColor: charColor }]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.bigAvatarPlaceholder,
                        { borderColor: charColor, backgroundColor: `${charColor}15` },
                      ]}
                    >
                      <User size={48} color={charColor} />
                    </View>
                  )}
                  <View style={[styles.colorBadge, { backgroundColor: charColor }]} />
                </View>

                {/* Character Name & Role */}
                <Text style={[styles.charName, { color: themeColors.text }]}>
                  {character.name}
                </Text>

                {character.role ? (
                  <View style={[styles.roleBadge, { backgroundColor: `${charColor}18` }]}>
                    <Sparkles size={12} color={charColor} />
                    <Text style={[styles.roleText, { color: charColor }]}>
                      {character.role}
                    </Text>
                  </View>
                ) : null}

                {/* Aliases */}
                {character.aliases && character.aliases.length > 0 ? (
                  <View style={styles.aliasContainer}>
                    <Text style={[styles.aliasLabel, { color: themeColors.textMuted }]}>
                      ชื่อเรียกอื่น / สรรพนาม:
                    </Text>
                    <View style={styles.aliasChips}>
                      {character.aliases.map((alias, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.aliasChip,
                            { backgroundColor: themeColors.primaryBg },
                          ]}
                        >
                          <Text style={[styles.aliasText, { color: themeColors.primary }]}>
                            {alias}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Description */}
                {character.description ? (
                  <View style={[styles.descCard, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                    <Text style={[styles.descTitle, { color: themeColors.text }]}>
                      ข้อมูลและบุคลิกตัวละคร
                    </Text>
                    <Text style={[styles.descBody, { color: themeColors.narrationText }]}>
                      {character.description}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 6,
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  bigAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  bigAvatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  charName: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 14,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  aliasContainer: {
    width: '100%',
    marginBottom: 14,
  },
  aliasLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  aliasChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aliasChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aliasText: {
    fontSize: 11,
    fontWeight: '600',
  },
  descCard: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  descTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  descBody: {
    fontSize: 13,
    lineHeight: 20,
  },
});

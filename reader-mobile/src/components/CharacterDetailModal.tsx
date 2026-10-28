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
import { radius, shadowRaised, typeScale } from '../theme/layout';

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
        <View style={[styles.overlay, { backgroundColor: themeColors.scrim }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="ปิดข้อมูลตัวละคร"
                style={styles.closeBtn}
                onPress={onClose}
              >
                <X size={18} color={themeColors.textMuted} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
                      <User size={42} color={charColor} />
                    </View>
                  )}
                </View>

                <Text style={[styles.charName, { color: themeColors.text }]}>
                  {character.name}
                </Text>

                {character.role ? (
                  <View style={[styles.roleBadge, { backgroundColor: `${charColor}1a` }]}>
                    <Sparkles size={11} color={charColor} />
                    <Text style={[styles.roleText, { color: charColor }]}>
                      {character.role}
                    </Text>
                  </View>
                ) : null}

                {character.aliases && character.aliases.length > 0 ? (
                  <View style={styles.aliasContainer}>
                    <Text style={[styles.aliasLabel, { color: themeColors.textMuted }]}>
                      ชื่อเรียกอื่น
                    </Text>
                    <View style={styles.aliasChips}>
                      {character.aliases.map((alias, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.aliasChip,
                            { backgroundColor: themeColors.backgroundElevated, borderColor: themeColors.border },
                          ]}
                        >
                          <Text style={[styles.aliasText, { color: themeColors.textMuted }]}>
                            {alias}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {character.description ? (
                  <View style={[styles.descCard, { backgroundColor: themeColors.backgroundElevated, borderColor: themeColors.border }]}>
                    <Text style={[styles.descTitle, { color: themeColors.textMuted }]}>
                      ข้อมูลและบุคลิก
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '84%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 22,
    ...shadowRaised,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  bigAvatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    borderWidth: 2,
  },
  bigAvatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charName: {
    fontSize: typeScale.display - 1,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 7,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.xs,
    gap: 5,
    marginBottom: 16,
  },
  roleText: {
    fontSize: typeScale.meta,
    fontWeight: '700',
  },
  aliasContainer: {
    width: '100%',
    marginBottom: 16,
  },
  aliasLabel: {
    fontSize: typeScale.meta,
    fontWeight: '600',
    marginBottom: 7,
  },
  aliasChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aliasChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  aliasText: {
    fontSize: typeScale.meta,
    fontWeight: '600',
  },
  descCard: {
    width: '100%',
    padding: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  descTitle: {
    fontSize: typeScale.meta,
    fontWeight: '700',
    marginBottom: 6,
  },
  descBody: {
    fontSize: typeScale.body,
    lineHeight: 22,
  },
});

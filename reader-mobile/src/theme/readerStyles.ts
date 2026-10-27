import { StyleSheet } from 'react-native';

export const readerStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    height: 2.5,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 110,
  },
  bookSpine: {
    width: '100%',
    alignSelf: 'center',
  },
  chapterHero: {
    paddingBottom: 18,
    marginBottom: 22,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  chapterHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'left',
    lineHeight: 32,
  },
  narrationBlock: {
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  // Classic Novel Dialogue (Soft, Left-border Accent)
  dialogueNovelCard: {
    borderLeftWidth: 3.5,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  speakerRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  speakerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  speakerAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerInitial: {
    fontSize: 11,
    fontWeight: '700',
  },
  speakerTextContainer: {
    flex: 1,
  },
  speakerNameAndRole: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  speakerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  speakerRoleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  speakerRoleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dialogueText: {
    minHeight: 44,
    fontWeight: '500',
  },
  sceneBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  sceneBreakLine: {
    flex: 1,
    height: 1,
  },
  sceneBreakSymbol: {
    fontSize: 14,
  },
  bottomChapterNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 24,
    marginTop: 8,
    borderTopWidth: 1,
    gap: 12,
  },
  navChapterBtn: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  navChapterBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navChapterBtnNextText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  chapterEndTitle: { marginTop: 32, fontSize: 17, lineHeight: 26, fontWeight: '600' },
  chapterContentsLink: { minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  illustrationBlockContainer: {
    marginVertical: 20,
    width: '100%',
  },
  illustrationCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  illustrationImg: {
    width: '100%',
    height: 340,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  illustrationFooter: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  illustrationCaption: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  illustrationZoomHint: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});

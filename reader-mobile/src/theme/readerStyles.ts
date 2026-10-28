import { StyleSheet } from 'react-native';
import { radius, shadowSoft, typeScale } from './layout';

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
    height: 2,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typeScale.body,
    lineHeight: 21,
    textAlign: 'center',
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
    marginBottom: 26,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  chapterKicker: {
    fontSize: typeScale.meta,
    fontWeight: '600',
    marginBottom: 7,
  },
  chapterHeroTitle: {
    fontSize: typeScale.display + 1,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'left',
    lineHeight: 32,
  },
  narrationBlock: {
    letterSpacing: 0,
    marginBottom: 14,
  },
  // Dialogue: a page of a printed novel — hairline card, one accent spine.
  dialogueNovelCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    ...shadowSoft,
  },
  speakerRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 9,
  },
  speakerAvatar: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  speakerAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerInitial: {
    fontSize: typeScale.micro,
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
    fontSize: typeScale.body,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  speakerRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  speakerRoleText: {
    fontSize: typeScale.micro,
    fontWeight: '600',
  },
  dialogueText: {
    minHeight: 40,
    fontWeight: '400',
  },
  sceneBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  sceneBreakLine: {
    flex: 1,
    height: 1,
  },
  sceneBreakSymbol: {
    fontSize: typeScale.caption,
    letterSpacing: 2,
  },
  bottomChapterNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 22,
    marginTop: 8,
    borderTopWidth: 1,
    gap: 10,
  },
  navChapterBtn: {
    minHeight: 46,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 6,
  },
  navChapterBtnText: {
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  navChapterBtnNextText: {
    fontSize: typeScale.body,
    fontWeight: '700',
    color: '#ffffff',
  },
  chapterEndTitle: {
    marginTop: 36,
    fontSize: typeScale.title,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chapterContentsLink: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  illustrationBlockContainer: {
    marginVertical: 22,
    width: '100%',
  },
  illustrationCard: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  illustrationImg: {
    width: '100%',
    height: 340,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  illustrationFooter: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  illustrationCaption: {
    fontSize: typeScale.caption,
    flex: 1,
    lineHeight: 18,
  },
  illustrationZoomHint: {
    fontSize: typeScale.meta,
    fontWeight: '700',
  },
});

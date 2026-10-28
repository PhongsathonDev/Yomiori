import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MessageCircle, Heart, Send, Flame, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { CommentItem, ReaderTheme } from '../types';
import { themes } from '../theme/colors';
import { radius, typeScale } from '../theme/layout';
import { fetchChapterComments } from '../services/api';
import { saveUserComment, toggleCommentLike } from '../services/storage';

interface Props {
  novelId: string;
  chapterId: string;
  theme: ReaderTheme;
}

export const ChapterCommentsSection: React.FC<Props> = props => (
  <ChapterCommentsContent key={`${props.novelId}:${props.chapterId}`} {...props} />
);

const ChapterCommentsContent: React.FC<Props> = ({ novelId, chapterId, theme }) => {
  const themeColors = themes[theme];
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const sending = useRef(false);
  const liking = useRef(new Set<string>());

  useEffect(() => {
    let isMounted = true;
    fetchChapterComments(novelId, chapterId)
      .then((data) => {
        if (isMounted) {
          setComments(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [novelId, chapterId]);

  const handleLike = async (commentId: string) => {
    if (liking.current.has(commentId)) return;
    liking.current.add(commentId);
    setSaveError(null);
    try {
      const isNowLiked = await toggleCommentLike(novelId, chapterId, commentId);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const newLikes = isNowLiked ? c.likes + 1 : Math.max(0, c.likes - 1);
            return {
              ...c,
              userLiked: isNowLiked,
              likes: newLikes,
            };
          }
          if (c.replies) {
            const updatedReplies = c.replies.map((r) => {
              if (r.id === commentId) {
                const newLikes = isNowLiked ? r.likes + 1 : Math.max(0, r.likes - 1);
                return {
                  ...r,
                  userLiked: isNowLiked,
                  likes: newLikes,
                };
              }
              return r;
            });
            return { ...c, replies: updatedReplies };
          }
          return c;
        })
      );
    } catch {
      setSaveError('ยังบันทึกถูกใจไม่ได้ กรุณาลองอีกครั้ง');
    } finally {
      liking.current.delete(commentId);
    }
  };

  const handleSendComment = async () => {
    const text = inputVal.trim();
    if (!text || loading || sending.current) return;
    sending.current = true;
    setSaveError(null);

    setSubmitting(true);
    const newComment: CommentItem = {
      id: `user-${Date.now()}`,
      username: 'คุณ (นักอ่าน)',
      avatarColor: themeColors.primary,
      badge: 'เพื่อนร่วมอ่าน',
      text,
      likes: 1,
      timeAgo: 'เมื่อสักครู่',
      isUser: true,
      userLiked: true,
    };

    try {
      await saveUserComment(novelId, chapterId, newComment);
      setComments((prev) => [newComment, ...prev]);
      setInputVal('');
    } catch {
      setSaveError('ยังบันทึกความคิดเห็นไม่ได้ กรุณาตรวจสอบพื้นที่เครื่องแล้วลองอีกครั้ง');
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  const displayedComments = expanded || comments.length <= 4 ? comments : comments.slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: themeColors.primaryBg }]}>
            <MessageCircle size={18} color={themeColors.primary} />
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>ความคิดเห็นของเพื่อนร่วมอ่าน</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: themeColors.backgroundElevated, borderColor: themeColors.border }]}>
          <Text style={[styles.badgeText, { color: themeColors.textMuted }]}>{comments.length} ข้อความ</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
        อ่านจบแล้วคิดเห็นอย่างไร มาร่วมแบ่งปันความรู้สึกกันได้นะ ✨
      </Text>

      {/* Comment Input Box */}
      <View style={[styles.inputBox, { backgroundColor: themeColors.background, borderColor: themeColors.cardBorder }]}>
        <View style={[styles.avatarMini, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.avatarInitial}>คุณ</Text>
        </View>
        <TextInput
          style={[styles.inputField, { color: themeColors.text }]}
          placeholder="เขียนความในใจหลังอ่านจบ..."
          placeholderTextColor={themeColors.textFaint}
          value={inputVal}
          onChangeText={setInputVal}
          editable={!submitting}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: themeColors.primary, opacity: inputVal.trim() ? 1 : 0.35 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="บันทึกความคิดเห็น"
          disabled={!inputVal.trim() || submitting || loading}
          onPress={handleSendComment}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={15} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {saveError && <Text accessibilityRole="alert" style={{ color: themeColors.primary }}>{saveError}</Text>}

      {/* Loading state */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>กำลังโหลดความคิดเห็น...</Text>
        </View>
      ) : (
        <View style={styles.commentList}>
          {displayedComments.map((item) => {
            const isLiked = item.userLiked;
            return (
              <View
                key={item.id}
                style={[
                  styles.commentCard,
                  {
                    backgroundColor: item.isUser ? themeColors.primaryBg : themeColors.background,
                    borderColor: item.isUser ? themeColors.primary : themeColors.cardBorder,
                  },
                ]}
              >
                {/* Pinned / Top Badge */}
                {item.isPinned && (
                  <View style={styles.pinnedRow}>
                    <Flame size={12} color={themeColors.accent} />
                    <Text style={[styles.pinnedText, { color: themeColors.accent }]}>ความคิดเห็นยอดนิยม</Text>
                  </View>
                )}

                {/* Comment Header */}
                <View style={styles.commentHeader}>
                  <View style={[styles.avatar, { backgroundColor: item.avatarColor || themeColors.primary }]}>
                    <Text style={styles.avatarLetter}>
                      {item.isUser ? 'ME' : item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.username, { color: themeColors.text }]}>{item.username}</Text>
                      {item.badge && (
                        <View style={[styles.roleBadge, { backgroundColor: themeColors.primaryBg }]}>
                          <Text style={[styles.roleBadgeText, { color: themeColors.primary }]}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.timeAgo, { color: themeColors.textMuted }]}>{item.timeAgo}</Text>
                  </View>
                </View>

                {/* Comment Text */}
                <Text style={[styles.commentText, { color: themeColors.text }]}>{item.text}</Text>

                {/* Footer: Like Action */}
                <View style={styles.commentFooter}>
                  <TouchableOpacity
                    style={[
                      styles.likeBtn,
                      isLiked && { backgroundColor: themeColors.primaryBg },
                    ]}
                    onPress={() => handleLike(item.id)}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={14}
                      color={isLiked ? themeColors.primary : themeColors.textMuted}
                      fill={isLiked ? themeColors.primary : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.likeCount,
                        { color: isLiked ? themeColors.primary : themeColors.textMuted },
                      ]}
                    >
                      {item.likes}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Nested Replies */}
                {item.replies && item.replies.length > 0 && (
                  <View style={[styles.repliesContainer, { borderLeftColor: themeColors.border }]}>
                    {item.replies.map((reply) => {
                      const isReplyLiked = reply.userLiked;
                      return (
                        <View
                          key={reply.id}
                          style={[
                            styles.replyCard,
                            {
                              backgroundColor: themeColors.card,
                              borderColor: themeColors.cardBorder,
                            },
                          ]}
                        >
                          <View style={styles.replyHeader}>
                            <CornerDownRight size={13} color={themeColors.textMuted} />
                            <View style={[styles.avatarSmall, { backgroundColor: reply.avatarColor }]}>
                              <Text style={styles.avatarLetterSmall}>
                                {reply.username.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={[styles.replyUsername, { color: themeColors.text }]}>
                              {reply.username}
                            </Text>
                            {reply.badge && (
                              <View style={[styles.roleBadgeSmall, { backgroundColor: themeColors.primaryBg }]}>
                                <Text style={[styles.roleBadgeTextSmall, { color: themeColors.primary }]}>
                                  {reply.badge}
                                </Text>
                              </View>
                            )}
                            <Text style={[styles.timeAgoSmall, { color: themeColors.textMuted }]}>
                              {reply.timeAgo}
                            </Text>
                          </View>
                          <Text style={[styles.replyText, { color: themeColors.text }]}>
                            {reply.text}
                          </Text>
                          <View style={styles.commentFooter}>
                            <TouchableOpacity
                              style={[
                                styles.likeBtn,
                                isReplyLiked && { backgroundColor: themeColors.primaryBg },
                              ]}
                              onPress={() => handleLike(reply.id)}
                              activeOpacity={0.7}
                            >
                              <Heart
                                size={12}
                                color={isReplyLiked ? themeColors.primary : themeColors.textMuted}
                                fill={isReplyLiked ? themeColors.primary : 'transparent'}
                              />
                              <Text
                                style={[
                                  styles.likeCountSmall,
                                  { color: isReplyLiked ? themeColors.primary : themeColors.textMuted },
                                ]}
                              >
                                {reply.likes}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Toggle Expand / Collapse button */}
          {comments.length > 4 && (
            <TouchableOpacity
              style={[styles.expandBtn, { borderColor: themeColors.cardBorder }]}
              onPress={() => setExpanded(!expanded)}
              activeOpacity={0.7}
            >
              <Text style={[styles.expandBtnText, { color: themeColors.primary }]}>
                {expanded ? 'ย่อความคิดเห็น' : `ดูความคิดเห็นทั้งหมด (${comments.length} ข้อความ)`}
              </Text>
              {expanded ? (
                <ChevronUp size={16} color={themeColors.primary} />
              ) : (
                <ChevronDown size={16} color={themeColors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 16,
    marginTop: 28,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typeScale.bodyLg + 1,
    fontWeight: '700',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: typeScale.micro + 0.5,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: typeScale.caption,
    marginBottom: 16,
    marginTop: 4,
    lineHeight: 19,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 18,
    gap: 10,
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: typeScale.micro,
    fontWeight: '700',
  },
  inputField: {
    flex: 1,
    fontSize: typeScale.body,
    minHeight: 36,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: typeScale.caption,
  },
  commentList: {
    gap: 10,
  },
  commentCard: {
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: 12,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pinnedText: {
    fontSize: typeScale.micro + 0.5,
    fontWeight: '700',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: typeScale.meta,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  username: {
    fontSize: typeScale.body,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  roleBadgeText: {
    fontSize: typeScale.micro - 0.5,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: typeScale.micro + 0.5,
    marginTop: 1,
  },
  commentText: {
    fontSize: typeScale.body + 0.5,
    lineHeight: 21,
    marginBottom: 8,
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  likeCount: {
    fontSize: typeScale.meta,
    fontWeight: '600',
  },
  likeCountSmall: {
    fontSize: typeScale.micro,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    gap: 8,
  },
  replyCard: {
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: 9,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  avatarSmall: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetterSmall: {
    color: '#ffffff',
    fontSize: typeScale.micro,
    fontWeight: '700',
  },
  replyUsername: {
    fontSize: typeScale.meta + 0.5,
    fontWeight: '700',
  },
  roleBadgeSmall: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  roleBadgeTextSmall: {
    fontSize: typeScale.micro - 1,
    fontWeight: '600',
  },
  timeAgoSmall: {
    fontSize: typeScale.micro - 0.5,
    marginLeft: 'auto',
  },
  replyText: {
    fontSize: typeScale.caption + 0.5,
    lineHeight: 19,
    marginLeft: 20,
    marginBottom: 4,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  expandBtnText: {
    fontSize: typeScale.caption + 0.5,
    fontWeight: '600',
  },
});

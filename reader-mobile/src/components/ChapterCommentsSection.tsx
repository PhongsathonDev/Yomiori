import React, { useState, useEffect } from 'react';
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
import { fetchChapterComments } from '../services/api';
import { saveUserComment, toggleCommentLike } from '../services/storage';

interface Props {
  novelId: string;
  chapterId: string;
  theme: ReaderTheme;
}

export const ChapterCommentsSection: React.FC<Props> = ({ novelId, chapterId, theme }) => {
  const themeColors = themes[theme];
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setExpanded(false);
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
  };

  const handleSendComment = async () => {
    const text = inputVal.trim();
    if (!text) return;

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

    await saveUserComment(novelId, chapterId, newComment);
    setComments((prev) => [newComment, ...prev]);
    setInputVal('');
    setSubmitting(false);
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
        <View style={[styles.badge, { backgroundColor: themeColors.cardBorder }]}>
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
          placeholderTextColor={themeColors.textMuted}
          value={inputVal}
          onChangeText={setInputVal}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: inputVal.trim() ? themeColors.primary : themeColors.cardBorder },
          ]}
          disabled={!inputVal.trim() || submitting}
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
                    <Flame size={12} color="#f97316" />
                    <Text style={styles.pinnedText}>ความคิดเห็นยอดนิยม</Text>
                  </View>
                )}

                {/* Comment Header */}
                <View style={styles.commentHeader}>
                  <View style={[styles.avatar, { backgroundColor: item.avatarColor || '#ec4899' }]}>
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
                      isLiked && { backgroundColor: '#fee2e2' },
                    ]}
                    onPress={() => handleLike(item.id)}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={14}
                      color={isLiked ? '#ef4444' : themeColors.textMuted}
                      fill={isLiked ? '#ef4444' : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.likeCount,
                        { color: isLiked ? '#ef4444' : themeColors.textMuted },
                      ]}
                    >
                      {item.likes}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Nested Replies */}
                {item.replies && item.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
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
                                isReplyLiked && { backgroundColor: '#fee2e2' },
                              ]}
                              onPress={() => handleLike(reply.id)}
                              activeOpacity={0.7}
                            >
                              <Heart
                                size={12}
                                color={isReplyLiked ? '#ef4444' : themeColors.textMuted}
                                fill={isReplyLiked ? '#ef4444' : 'transparent'}
                              />
                              <Text
                                style={[
                                  styles.likeCountSmall,
                                  { color: isReplyLiked ? '#ef4444' : themeColors.textMuted },
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 26,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
    marginTop: 4,
    lineHeight: 18,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 18,
    gap: 10,
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    minHeight: 36,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  commentList: {
    gap: 12,
  },
  commentCard: {
    borderRadius: 12,
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
    fontSize: 10.5,
    fontWeight: '700',
    color: '#f97316',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 10.5,
    marginTop: 1,
  },
  commentText: {
    fontSize: 13.5,
    lineHeight: 20,
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
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likeCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  likeCountSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(150, 150, 150, 0.2)',
    gap: 8,
  },
  replyCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
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
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetterSmall: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  replyUsername: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  roleBadgeSmall: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '600',
  },
  timeAgoSmall: {
    fontSize: 9.5,
    marginLeft: 'auto',
  },
  replyText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginLeft: 20,
    marginBottom: 4,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  expandBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});

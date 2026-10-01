import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, Send, Flame, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { CommentItem } from '../types';
import commentsCatalog from '../data/novels/kyudo-senpai/comments.json';

interface Props {
  novelId: string;
  chapterId: string;
}

export const ChapterCommentsSection: React.FC<Props> = ({ novelId, chapterId }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
    // 1. Load liked IDs from localStorage
    const localLikedKey = `yomiori_liked_${novelId}_${chapterId}`;
    let savedLiked: string[] = [];
    try {
      savedLiked = JSON.parse(localStorage.getItem(localLikedKey) || '[]');
    } catch {
      savedLiked = [];
    }
    setLikedIds(savedLiked);

    // 2. Load user created comments
    const userCommentsKey = `yomiori_comments_${novelId}_${chapterId}`;
    let savedUserComments: CommentItem[] = [];
    try {
      savedUserComments = JSON.parse(localStorage.getItem(userCommentsKey) || '[]');
    } catch {
      savedUserComments = [];
    }

    // 3. Load catalog simulated comments
    const catalogData = (commentsCatalog as any)[chapterId]?.comments || [];
    const resolvedSimulated = catalogData.map((c: CommentItem) => {
      const isLiked = savedLiked.includes(c.id);
      const mappedReplies = c.replies
        ? c.replies.map((r) => ({
            ...r,
            userLiked: savedLiked.includes(r.id),
            likes: savedLiked.includes(r.id) ? r.likes + 1 : r.likes,
          }))
        : undefined;

      return {
        ...c,
        userLiked: isLiked,
        likes: isLiked ? c.likes + 1 : c.likes,
        replies: mappedReplies,
      };
    });

    setComments([...savedUserComments, ...resolvedSimulated]);
  }, [novelId, chapterId]);

  const handleLike = (commentId: string) => {
    const localLikedKey = `yomiori_liked_${novelId}_${chapterId}`;
    let updatedLikes: string[];
    let isNowLiked = false;

    if (likedIds.includes(commentId)) {
      updatedLikes = likedIds.filter((id) => id !== commentId);
      isNowLiked = false;
    } else {
      updatedLikes = [...likedIds, commentId];
      isNowLiked = true;
    }

    setLikedIds(updatedLikes);
    try {
      localStorage.setItem(localLikedKey, JSON.stringify(updatedLikes));
    } catch (e) {
      console.warn('Failed to save liked comment state:', e);
    }

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

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text) return;

    const userCommentsKey = `yomiori_comments_${novelId}_${chapterId}`;
    const newComment: CommentItem = {
      id: `user-${Date.now()}`,
      username: 'คุณ (นักอ่าน)',
      avatarColor: 'var(--accent-primary)',
      badge: 'เพื่อนร่วมอ่าน',
      text,
      likes: 1,
      timeAgo: 'เมื่อสักครู่',
      isUser: true,
      userLiked: true,
    };

    let savedUserComments: CommentItem[] = [];
    try {
      savedUserComments = JSON.parse(localStorage.getItem(userCommentsKey) || '[]');
    } catch {
      savedUserComments = [];
    }

    savedUserComments.unshift(newComment);
    try {
      localStorage.setItem(userCommentsKey, JSON.stringify(savedUserComments));
    } catch (e) {
      console.warn('Failed to save comment:', e);
    }

    setComments((prev) => [newComment, ...prev]);
    setInputVal('');
  };

  const displayedComments = expanded || comments.length <= 4 ? comments : comments.slice(0, 4);

  return (
    <section
      className="animate-fade-in"
      style={{
        marginTop: '3.5rem',
        marginBottom: '2.5rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.75rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-light, rgba(226, 109, 131, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <MessageCircle size={18} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: 0,
              }}
            >
              ความคิดเห็นของเพื่อนร่วมอ่าน
            </h3>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                margin: '2px 0 0 0',
              }}
            >
              อ่านจบแล้วคิดเห็นอย่างไร มาร่วมแบ่งปันความรู้สึกกันได้นะ ✨
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          {comments.length} ข้อความ
        </span>
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSendComment}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-medium)',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          คุณ
        </div>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="เขียนความในใจหลังอ่านจบ..."
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.9rem',
            color: 'var(--text-main)',
          }}
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: inputVal.trim() ? 'var(--accent-primary)' : 'var(--border-medium)',
            color: '#fff',
            cursor: inputVal.trim() ? 'pointer' : 'not-allowed',
            transition: 'background-color var(--transition-fast)',
            flexShrink: 0,
          }}
        >
          <Send size={15} />
        </button>
      </form>

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayedComments.map((item) => {
          const isLiked = item.userLiked;
          return (
            <div
              key={item.id}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: item.isUser ? 'var(--accent-light, rgba(226, 109, 131, 0.08))' : 'var(--bg-main)',
                border: item.isUser ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {/* Pinned Badge */}
              {item.isPinned && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#f97316',
                    marginBottom: '6px',
                  }}
                >
                  <Flame size={13} />
                  <span>ความคิดเห็นยอดนิยม</span>
                </div>
              )}

              {/* Comment Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: item.avatarColor || '#ec4899',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.isUser ? 'ME' : item.username.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.username}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--border-subtle)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{item.timeAgo}</span>
              </div>

              {/* Comment Body */}
              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-main)',
                  margin: '4px 0 8px 34px',
                }}
              >
                {item.text}
              </p>

              {/* Comment Footer: Like button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleLike(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: isLiked ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                    color: isLiked ? '#ef4444' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Heart
                    size={14}
                    color={isLiked ? '#ef4444' : 'currentColor'}
                    fill={isLiked ? '#ef4444' : 'transparent'}
                  />
                  <span>{item.likes}</span>
                </button>
              </div>

              {/* Nested Replies */}
              {item.replies && item.replies.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    marginLeft: '20px',
                    paddingLeft: '12px',
                    borderLeft: '2px solid var(--border-medium)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {item.replies.map((reply) => {
                    const isReplyLiked = reply.userLiked;
                    return (
                      <div
                        key={reply.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <CornerDownRight size={13} color="var(--text-faint)" />
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: reply.avatarColor,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                            }}
                          >
                            {reply.username.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {reply.username}
                          </span>
                          {reply.badge && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--border-subtle)',
                                color: 'var(--accent-primary)',
                              }}
                            >
                              {reply.badge}
                            </span>
                          )}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginLeft: 'auto' }}>
                            {reply.timeAgo}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '2px 0 6px 26px' }}>
                          {reply.text}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleLike(reply.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              border: 'none',
                              backgroundColor: isReplyLiked ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                              color: isReplyLiked ? '#ef4444' : 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '0.72rem',
                            }}
                          >
                            <Heart
                              size={12}
                              color={isReplyLiked ? '#ef4444' : 'currentColor'}
                              fill={isReplyLiked ? '#ef4444' : 'transparent'}
                            />
                            <span>{reply.likes}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Expand / Collapse Button */}
        {comments.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'transparent',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginTop: '4px',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>{expanded ? 'ย่อความคิดเห็น' : `ดูความคิดเห็นทั้งหมด (${comments.length} ข้อความ)`}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
    </section>
  );
};

import { View, Text, Input, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { EventComment } from '@famtime/shared';
import './index.less';

interface CommentListProps {
  eventId: string;
  onCommentAdded?: () => void;
}

export default function CommentList({ eventId, onCommentAdded }: CommentListProps) {
  const [comments, setComments] = useState<EventComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      // TODO: 实际 API 调用
      // const data = await getEventComments(eventId);
      // setComments(data);

      // Mock 数据
      setComments([
        {
          id: '1',
          eventId,
          userId: '1',
          content: '记得带上雨伞哦',
          createdAt: new Date('2024-01-20T10:30:00'),
          updatedAt: new Date('2024-01-20T10:30:00'),
          user: {
            id: '1',
            nickname: '妈妈',
            avatar: '👩',
          },
        },
        {
          id: '2',
          eventId,
          userId: '2',
          content: '好的，我会准时到的',
          createdAt: new Date('2024-01-20T11:00:00'),
          updatedAt: new Date('2024-01-20T11:00:00'),
          user: {
            id: '2',
            nickname: '小明',
            avatar: '👦',
          },
        },
      ]);
    } catch (e) {
      console.error('获取评论失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    try {
      setSubmitting(true);
      Taro.vibrateShort({ type: 'light' });

      // TODO: 实际 API 调用
      // await createComment({ eventId, content: newComment });

      // Mock 添加评论
      const mockComment: EventComment = {
        id: Date.now().toString(),
        eventId,
        userId: 'current-user',
        content: newComment,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'current-user',
          nickname: '我',
          avatar: '😊',
        },
      };

      setComments([...comments, mockComment]);
      setNewComment('');
      Taro.showToast({ title: '评论成功', icon: 'success' });

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (e) {
      Taro.showToast({ title: '评论失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            // TODO: 实际 API 调用
            // await deleteComment(commentId);

            setComments(comments.filter((c) => c.id !== commentId));
            Taro.showToast({ title: '删除成功', icon: 'success' });
          } catch (e) {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    const d = new Date(date);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <View className="comment-list">
      <View className="comment-header">
        <Text className="header-title">评论 ({comments.length})</Text>
      </View>

      {loading ? (
        <View className="loading-state">
          <Text>加载中...</Text>
        </View>
      ) : comments.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-icon">💬</Text>
          <Text className="empty-text">还没有评论，快来抢沙发吧</Text>
        </View>
      ) : (
        <ScrollView scrollY className="comment-scroll">
          {comments.map((comment) => (
            <View key={comment.id} className="comment-item">
              <View className="comment-avatar">
                <Text>{comment.user?.avatar || '👤'}</Text>
              </View>
              <View className="comment-content">
                <View className="comment-header-row">
                  <Text className="comment-author">{comment.user?.nickname}</Text>
                  <Text className="comment-time">{formatTime(comment.createdAt)}</Text>
                </View>
                <Text className="comment-text">{comment.content}</Text>
              </View>
              {comment.userId === 'current-user' && (
                <View
                  className="comment-delete"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Text>删除</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <View className="comment-input-area">
        <Input
          className="comment-input"
          placeholder="说点什么..."
          value={newComment}
          onInput={(e) => setNewComment(e.detail.value)}
          maxlength={200}
        />
        <View
          className={`send-btn ${newComment.trim() ? 'active' : ''}`}
          onClick={handleSubmit}
        >
          <Text>{submitting ? '发送中' : '发送'}</Text>
        </View>
      </View>
    </View>
  );
}

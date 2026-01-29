import { View, Text, Input, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { EventComment } from '@famtime/shared';
import { getEventComments, createComment, deleteComment } from '../../services/api';
import { useUserStore } from '../../stores/user';
import { handleError, showSuccess, formatRelativeTime } from '../../utils/helpers';
import EmptyState from '../EmptyState';
import LoadingState from '../LoadingState';
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
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getEventComments(eventId);
      setComments(data);
    } catch (e) {
      console.error('获取评论失败', e);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const content = newComment.trim();

    if (!content) {
      Taro.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    if (content.length > 200) {
      Taro.showToast({ title: '评论不能超过200个字符', icon: 'none' });
      return;
    }

    try {
      setSubmitting(true);
      Taro.vibrateShort({ type: 'light' });

      await createComment({ eventId, content });

      setNewComment('');
      showSuccess('评论成功');

      // 重新加载评论列表
      await fetchComments();

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (e) {
      handleError(e, '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Taro.showModal({
        title: '确认删除',
        content: '确定要删除这条评论吗？',
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      });
    });

    if (!confirmed) return;

    try {
      await deleteComment(commentId);
      await fetchComments();
      showSuccess('删除成功');
    } catch (e) {
      handleError(e, '删除失败');
    }
  };

  return (
    <View className="comment-list">
      <View className="comment-header">
        <Text className="header-title">评论 ({comments.length})</Text>
      </View>

      {loading ? (
        <LoadingState text="加载评论中..." size="small" />
      ) : comments.length === 0 ? (
        <EmptyState
          icon="💬"
          title="还没有评论"
          description="快来抢沙发吧"
        />
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
                  <Text className="comment-time">{formatRelativeTime(comment.createdAt)}</Text>
                </View>
                <Text className="comment-text">{comment.content}</Text>
              </View>
              {comment.userId === user?.id && (
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

import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { FamilyMemory } from '@famtime/shared';
import { useUserStore } from '../../stores/user';
import { getFamilyMemories, generateMonthlyMemory } from '../../services/api';
import { handleError, showLoading, hideLoading, showSuccess } from '../../utils/helpers';
import MemoryCard from '../../components/MemoryCard';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import './index.less';

interface MemoryEvent {
  id: string;
  title: string;
  startTime: string;
  description?: string;
}

export default function MemoryPage() {
  const family = useUserStore((state) => state.family);
  const [memories, setMemories] = useState<FamilyMemory[]>([]);
  const [loading, setLoading] = useState(true);

  useDidShow(() => {
    if (family?.id) {
      fetchMemories();
    }
  });

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const data = await getFamilyMemories(family!.id);
      setMemories(data);
    } catch (e) {
      console.error('Fetch memories failed', e);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMemoryClick = (memory: FamilyMemory) => {
    Taro.vibrateShort({ type: 'light' });
    Taro.navigateTo({ url: `/pages/memory/detail/index?id=${memory.id}` });
  };

  const handleGenerateMemory = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Taro.vibrateShort({ type: 'medium' });
      Taro.showModal({
        title: '生成回忆录',
        content: '是否为本月生成回忆录？',
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      });
    });

    if (!confirmed) return;

    try {
      showLoading('生成中...');
      const now = new Date();
      await generateMonthlyMemory(family!.id, now.getFullYear(), now.getMonth() + 1);
      hideLoading();
      showSuccess('生成成功');
      await fetchMemories();
    } catch (e) {
      hideLoading();
      handleError(e, '生成失败');
    }
  };

  if (!family?.id) {
    return (
      <View className="memory-page empty">
        <View className="empty-state">
          <Text className="empty-icon">💭</Text>
          <Text className="empty-title">还没有家庭</Text>
          <Text className="empty-desc">请先加入家庭以查看回忆</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="memory-page">
      <View className="page-header">
        <Text className="page-title">家庭回忆录</Text>
        <View className="generate-btn" onClick={handleGenerateMemory}>
          <Text>✨ 生成本月回忆</Text>
        </View>
      </View>

      {loading ? (
        <LoadingState text="加载回忆中..." />
      ) : memories.length === 0 ? (
        <EmptyState
          icon="💭"
          title="还没有回忆"
          description="点击上方按钮生成本月回忆录"
          actionText="生成回忆"
          onAction={handleGenerateMemory}
        />
      ) : (
        <ScrollView scrollY className="memories-scroll">
          <View className="memories-list">
            {memories.map((memory, index) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                index={index}
                onClick={handleMemoryClick}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

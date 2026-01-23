import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { FamilyMemory } from '@famtime/shared';
import { useUserStore } from '../../stores/user';
import MemoryCard from '../../components/MemoryCard';
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
      // TODO: 实际 API 调用
      // const data = await getFamilyMemories(family!.id);
      // setMemories(data);

      // Mock 数据
      const mockMemories: FamilyMemory[] = [
        {
          id: '1',
          familyId: family!.id,
          type: 'monthly' as any,
          period: '2024-01',
          title: '2024年1月的美好时光',
          summary: '这个月，我们庆祝了2个生日，进行了5次家庭活动，完成了3次健康记录。共记录了15个珍贵时刻，每一个都值得回味。',
          eventCount: 15,
          highlights: [
            {
              eventId: '1',
              title: '小明的生日派对',
              date: '2024-01-15',
              category: 'birthday' as any,
            },
            {
              eventId: '2',
              title: '全家去公园野餐',
              date: '2024-01-20',
              category: 'family_activity' as any,
            },
            {
              eventId: '3',
              title: '爸爸体检',
              date: '2024-01-25',
              category: 'health' as any,
            },
          ],
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01'),
        },
        {
          id: '2',
          familyId: family!.id,
          type: 'monthly' as any,
          period: '2023-12',
          title: '2023年12月的美好时光',
          summary: '这个月，我们庆祝了1个生日，纪念了2个特殊日子，进行了8次家庭活动。共记录了20个珍贵时刻，每一个都值得回味。',
          eventCount: 20,
          highlights: [
            {
              eventId: '4',
              title: '圣诞节家庭聚会',
              date: '2023-12-25',
              category: 'family_activity' as any,
            },
            {
              eventId: '5',
              title: '结婚纪念日',
              date: '2023-12-10',
              category: 'anniversary' as any,
            },
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      setMemories(mockMemories);
    } catch (e) {
      console.error('Fetch memories failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMemoryClick = (memory: FamilyMemory) => {
    Taro.showToast({ title: '回忆详情即将上线', icon: 'none' });
  };

  const handleGenerateMemory = () => {
    Taro.vibrateShort({ type: 'medium' });
    Taro.showModal({
      title: '生成回忆录',
      content: '是否为本月生成回忆录？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '生成中...', icon: 'loading' });
          // TODO: 调用生成 API
          setTimeout(() => {
            Taro.showToast({ title: '生成成功', icon: 'success' });
            fetchMemories();
          }, 1500);
        }
      },
    });
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
        <View className="loading-state">
          <Text>加载中...</Text>
        </View>
      ) : memories.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-icon">📖</Text>
          <Text className="empty-title">还没有回忆录</Text>
          <Text className="empty-desc">点击上方按钮生成第一份回忆录吧</Text>
        </View>
      ) : (
        <ScrollView scrollY className="memories-scroll">
          <View className="memories-list">
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onClick={handleMemoryClick}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

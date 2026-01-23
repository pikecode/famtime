import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useUserStore } from '../../../stores/user';
import { getFamily, refreshInviteCode as apiRefreshCode } from '../../../services/api';
import './index.less';

export default function FamilyInvitePage() {
  const family = useUserStore((state) => state.family);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (family?.id) {
      fetchInviteCode();
    }
  }, [family?.id]);

  const fetchInviteCode = async () => {
    try {
      const data = await getFamily(family!.id);
      setInviteCode(data.inviteCode);
    } catch (e) {
      Taro.showToast({ title: '获取邀请码失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    Taro.vibrateShort({ type: 'light' });
    Taro.setClipboardData({
      data: inviteCode,
      success: () => {
        Taro.showToast({ title: '邀请码已复制', icon: 'success' });
      },
    });
  };

  const handleRefreshCode = () => {
    Taro.vibrateShort({ type: 'medium' });
    Taro.showModal({
      title: '刷新邀请码',
      content: '刷新后旧邀请码将失效，确定要刷新吗？',
      confirmColor: '#339AF0',
      success: async (res) => {
        if (res.confirm) {
          try {
            const data = await apiRefreshCode(family!.id);
            setInviteCode(data.inviteCode);
            Taro.showToast({ title: '已更新', icon: 'success' });
          } catch (e) {
            Taro.showToast({ title: '刷新失败', icon: 'none' });
          }
        }
      },
    });
  };

  if (loading || !family) {
    return <View className="invite-page loading"><Text>加载中...</Text></View>;
  }

  return (
    <View className="invite-page">
      {/* 邀请卡片 */}
      <View className="invite-card">
        <View className="card-header">
          <Text className="family-icon">👨‍👩‍👧‍👦</Text>
          <Text className="family-name">{family.name}</Text>
          <Text className="invite-text">邀请你加入家庭</Text>
        </View>

        <View className="code-section">
          <Text className="code-label">邀请码</Text>
          <View className="code-display">
            {inviteCode.split('').map((char, index) => (
              <View key={index} className="code-char">
                <Text>{char}</Text>
              </View>
            ))}
          </View>
          <Text className="code-hint">邀请码7天内有效</Text>
        </View>

        <View className="card-actions">
          <View className="action-btn copy" onClick={handleCopyCode}>
            <Text className="btn-icon">📋</Text>
            <Text className="btn-text">复制邀请码</Text>
          </View>
        </View>
      </View>

      {/* 使用说明 */}
      <View className="tips-section">
        <Text className="tips-title">如何邀请家人？</Text>
        <View className="tip-list">
          <View className="tip-item">
            <Text className="tip-number">1</Text>
            <Text className="tip-text">复制上方邀请码</Text>
          </View>
          <View className="tip-item">
            <Text className="tip-number">2</Text>
            <Text className="tip-text">发送给家人</Text>
          </View>
          <View className="tip-item">
            <Text className="tip-number">3</Text>
            <Text className="tip-text">家人打开小程序，选择「加入家庭」</Text>
          </View>
          <View className="tip-item">
            <Text className="tip-number">4</Text>
            <Text className="tip-text">输入邀请码即可加入</Text>
          </View>
        </View>
      </View>

      {/* 刷新邀请码 */}
      <View className="refresh-section" onClick={handleRefreshCode}>
        <Text className="refresh-icon">🔄</Text>
        <Text className="refresh-text">刷新邀请码</Text>
      </View>
    </View>
  );
}

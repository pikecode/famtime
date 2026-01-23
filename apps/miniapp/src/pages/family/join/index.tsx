import { View, Text, Input } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { joinFamily as apiJoinFamily } from '../../../services/api';
import { useUserStore } from '../../../stores/user';
import './index.less';

export default function FamilyJoinPage() {
  const setFamily = useUserStore((state) => state.setFamily);
  const [inviteCode, setInviteCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'code' | 'nickname'>('code');
  const [familyInfo] = useState<{
    name: string;
    memberCount: number;
    icon: string;
  } | null>(null);

  const handleCodeInput = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(cleaned);
  };

  const handleVerifyCode = () => {
    if (inviteCode.length !== 8) {
      Taro.showToast({ title: '请输入8位邀请码', icon: 'none' });
      return;
    }
    // 目前简化逻辑，直接进入昵称填写，点击加入时一起提交
    setStep('nickname');
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入你的昵称', icon: 'none' });
      return;
    }

    try {
      Taro.showLoading({ title: '加入中...' });
      const member = await apiJoinFamily({
        inviteCode,
        nickname,
      });

      // 获取家庭详细信息并存入 Store
      // 简化处理：假设接口返回了 member，我们需要再拉一次家庭信息或从接口结构中获取
      // 这里暂时只处理加入动作，随后刷新页面会自动同步
      Taro.hideLoading();
      Taro.showToast({ title: '加入成功', icon: 'success' });
      
      // 模拟加入成功后存入一个基础 family 对象触发 UI 刷新
      setFamily({ id: member.familyId, name: '已加入家庭' });

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/family/index' });
      }, 1500);
    } catch (e) {
      Taro.showToast({ title: e.message || '加入失败', icon: 'none' });
    }
  };

  return (
    <View className="join-family-page">
      {step === 'code' ? (
        <>
          {/* 头部 */}
          <View className="hero-section">
            <Text className="hero-icon">🔗</Text>
            <Text className="hero-title">加入家庭</Text>
            <Text className="hero-desc">输入邀请码加入家庭</Text>
          </View>

          {/* 邀请码输入 */}
          <View className="form-section">
            <Text className="form-label">邀请码</Text>
            <View className="code-input-wrapper">
              <Input
                className="code-input"
                placeholder="请输入8位邀请码"
                placeholderClass="placeholder"
                value={inviteCode}
                onInput={(e) => handleCodeInput(e.detail.value)}
                maxlength={8}
              />
            </View>
            <Text className="form-hint">邀请码可向家庭管理员获取</Text>
          </View>

          {/* 验证按钮 */}
          <View className="action-section">
            <View
              className={`join-btn ${inviteCode.length === 8 ? 'active' : ''}`}
              onClick={handleVerifyCode}
            >
              <Text>下一步</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* 家庭信息展示 */}
          {familyInfo && (
            <View className="family-preview">
              <View className="family-card">
                <View className="family-icon">
                  <Text>{familyInfo.icon}</Text>
                </View>
                <Text className="family-name">{familyInfo.name}</Text>
                <Text className="family-member-count">
                  已有 {familyInfo.memberCount} 位成员
                </Text>
              </View>
            </View>
          )}

          {/* 昵称输入 */}
          <View className="form-section">
            <Text className="form-label">你在家庭中的昵称</Text>
            <Input
              className="nickname-input"
              placeholder="例如：爸爸、妈妈、小明"
              placeholderClass="placeholder"
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              maxlength={10}
            />
            <Text className="form-hint">昵称将展示给其他家庭成员</Text>
          </View>

          {/* 加入按钮 */}
          <View className="action-section">
            <View
              className={`join-btn ${nickname.trim() ? 'active' : ''}`}
              onClick={handleJoin}
            >
              <Text>加入家庭</Text>
            </View>
            <View className="back-link" onClick={() => setStep('code')}>
              <Text>返回修改邀请码</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

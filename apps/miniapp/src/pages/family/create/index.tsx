import { View, Text, Input } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { createFamily as apiCreateFamily } from '../../../services/api';
import { useUserStore } from '../../../stores/user';
import './index.less';

const FAMILY_ICONS = ['👨‍👩‍👧‍👦', '🏠', '❤️', '🌟', '🌈', '🌻'];

export default function FamilyCreatePage() {
  const setFamily = useUserStore((state) => state.setFamily);
  const [familyName, setFamilyName] = useState('');
  const [selectedIcon] = useState('👨‍👩‍👧‍👦'); // 实际后端目前可能只支持名称，这里保留UI

  const handleCreate = async () => {
    if (!familyName.trim()) {
      Taro.showToast({ title: '请输入家庭名称', icon: 'none' });
      return;
    }

    try {
      Taro.showLoading({ title: '创建中...' });
      const family = await apiCreateFamily({
        name: familyName,
      });

      setFamily(family);
      Taro.hideLoading();
      Taro.showToast({ title: '创建成功', icon: 'success' });
      
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/family/index' });
      }, 1500);
    } catch (e) {
      Taro.showToast({ title: e.message || '创建失败', icon: 'none' });
    }
  };

  return (
    <View className="create-family-page">
      {/* 头图 */}
      <View className="hero-section">
        <View className="hero-icon">
          <Text>{selectedIcon}</Text>
        </View>
        <Text className="hero-title">创建你的家庭</Text>
        <Text className="hero-desc">邀请家人一起记录美好时光</Text>
      </View>

      {/* 表单 */}
      <View className="form-section">
        <View className="form-item">
          <Text className="item-label">家庭名称</Text>
          <Input
            className="name-input"
            placeholder="例如：温馨小窝、王家"
            placeholderClass="placeholder"
            value={familyName}
            onInput={(e) => setFamilyName(e.detail.value)}
            maxlength={20}
          />
        </View>

        <View className="form-item">
          <Text className="item-label">选择图标</Text>
          <View className="icon-grid">
            {FAMILY_ICONS.map((icon) => (
              <View
                key={icon}
                className={`icon-item ${selectedIcon === icon ? 'active' : ''}`}
                onClick={() => setSelectedIcon(icon)}
              >
                <Text>{icon}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 提示信息 */}
      <View className="tips-section">
        <View className="tip-item">
          <Text className="tip-icon">✓</Text>
          <Text className="tip-text">创建后可邀请最多7位家人加入</Text>
        </View>
        <View className="tip-item">
          <Text className="tip-icon">✓</Text>
          <Text className="tip-text">您将成为家庭管理员</Text>
        </View>
        <View className="tip-item">
          <Text className="tip-icon">✓</Text>
          <Text className="tip-text">可随时修改家庭信息</Text>
        </View>
      </View>

      {/* 创建按钮 */}
      <View className="action-section">
        <View
          className={`create-btn ${familyName.trim() ? 'active' : ''}`}
          onClick={handleCreate}
        >
          <Text>创建家庭</Text>
        </View>
      </View>
    </View>
  );
}

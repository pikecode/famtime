import { View, Text, Input, Textarea, Switch, Picker, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { EventCategory, EventColors, Visibility, RecurrenceRule } from '@famtime/shared';
import Button from '../../../components/Button';
import Skeleton from '../../../components/Skeleton';
import RecurrencePicker from '../../../components/RecurrencePicker';
import { createEvent as apiCreateEvent } from '../../../services/api';
import { useUserStore } from '../../../stores/user';

// Mock 家庭成员数据
const MOCK_MEMBERS = [
  { id: '1', nickname: '爸爸', color: '#339AF0', avatar: '👨‍🦰' },
  { id: '2', nickname: '妈妈', color: '#FF6B6B', avatar: '👩‍🦰' },
  { id: '3', nickname: '小明', color: '#51CF66', avatar: '👦' },
  { id: '4', nickname: '小红', color: '#FF85A2', avatar: '👧' },
];

const CATEGORIES = [
  { value: EventCategory.BIRTHDAY, label: '生日', icon: '🎂' },
  { value: EventCategory.ANNIVERSARY, label: '纪念日', icon: '💕' },
  { value: EventCategory.HEALTH, label: '健康', icon: '💚' },
  { value: EventCategory.FAMILY_ACTIVITY, label: '家庭活动', icon: '👨‍👩‍👧‍👦' },
  { value: EventCategory.REMINDER, label: '提醒', icon: '⏰' },
  { value: EventCategory.OTHER, label: '其他', icon: '📌' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: '事件开始时' },
  { value: 15, label: '提前15分钟' },
  { value: 60, label: '提前1小时' },
  { value: 1440, label: '提前1天' },
  { value: 4320, label: '提前3天' },
  { value: 10080, label: '提前1周' },
];

export default function EventCreatePage() {
  const router = useRouter();
  const initialDate = router.params.date || new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<EventCategory>(EventCategory.FAMILY_ACTIVITY);
  const [visibility, setVisibility] = useState<Visibility>(Visibility.FAMILY);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [selectedReminders, setSelectedReminders] = useState<number[]>([1440]);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>();

  const selectedCategory = CATEGORIES.find((c) => c.value === category);

  useEffect(() => {
    // 模拟加载效果
    setTimeout(() => setLoading(false), 600);
  }, []);

  const handleDateChange = (e: any) => setDate(e.detail.value);
  const handleStartTimeChange = (e: any) => setStartTime(e.detail.value);
  const handleEndTimeChange = (e: any) => setEndTime(e.detail.value);

  const toggleReminder = (value: number) => {
    Taro.vibrateShort({ type: 'light' });
    setSelectedReminders((prev) => 
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleCategoryClick = (val: EventCategory) => {
    Taro.vibrateShort({ type: 'light' });
    setCategory(val);
  };

  const handleVisibilityClick = (val: Visibility) => {
    Taro.vibrateShort({ type: 'light' });
    setVisibility(val);
  };

  const handleMemberSelect = (id: string) => {
    Taro.vibrateShort({ type: 'light' });
    setAssigneeId(id === assigneeId ? '' : id);
  };

  const family = useUserStore((state) => state.family);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Taro.vibrateShort({ type: 'error' });
      Taro.showToast({ title: '请输入事件标题', icon: 'none' });
      return;
    }

    if (!family?.id) {
      Taro.showToast({ title: '请先加入家庭', icon: 'none' });
      return;
    }

    try {
      Taro.showLoading({ title: '正在保存...' });
      
      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = isAllDay ? undefined : `${date}T${endTime}:00`;

      await apiCreateEvent({
        familyId: family.id,
        title,
        description,
        startTime: new Date(startDateTime).toISOString(),
        endTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
        isAllDay,
        category,
        visibility,
        assigneeId: assigneeId || undefined,
        recurrence,
        reminders: selectedReminders.map(val => ({
          type: val === 0 ? 'at_time' : 'before',
          beforeMinutes: val
        })) as any
      });

      Taro.vibrateShort({ type: 'medium' });
      Taro.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (e) {
      Taro.showToast({ title: e.message || '保存失败', icon: 'none' });
    } finally {
      Taro.hideLoading();
    }
  };

  if (loading) {
    return (
      <View className="create-page loading">
        <View className="form-section">
          <Skeleton height={100} width="100%" />
        </View>
        <View className="form-section">
          <Skeleton height={60} width="30%" className="mb-20" />
          <Skeleton height={80} count={3} width="100%" />
        </View>
        <View className="form-section">
          <Skeleton height={60} width="30%" className="mb-20" />
          <View style={{ display: 'flex', gap: '20rpx' }}>
            <Skeleton height={120} width="30%" circle={false} />
            <Skeleton height={120} width="30%" circle={false} />
            <Skeleton height={120} width="30%" circle={false} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="create-page">
      <View className="form-section">
        <View className="title-input-wrapper">
          <View
            className="category-hero-icon"
            style={{ backgroundColor: EventColors[category] }}
          >
            <Text>{selectedCategory?.icon}</Text>
          </View>
          <Input
            className="title-input"
            placeholder="今天有什么安排？"
            placeholderClass="placeholder"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
          />
        </View>
      </View>

      <View className="form-section">
        <View className="section-title">指派给家人</View>
        <ScrollView scrollX className="member-scroll" enhanced showScrollbar={false}>
          <View className="member-flex">
            <View 
              className={`member-avatar-node ${!assigneeId ? 'active' : ''}`}
              onClick={() => handleMemberSelect('')}
            >
              <View className="avatar-circle self">
                <Text>我</Text>
              </View>
              <Text className="avatar-label">自己</Text>
            </View>
            {MOCK_MEMBERS.map((member) => (
              <View 
                key={member.id} 
                className={`member-avatar-node ${assigneeId === member.id ? 'active' : ''}`}
                onClick={() => handleMemberSelect(member.id)}
              >
                <View className="avatar-circle" style={{ backgroundColor: member.color }}>
                  <Text>{member.avatar}</Text>
                </View>
                <Text className="avatar-label">{member.nickname}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="form-section">
        <View className="section-title">时间与周期</View>
        <View className="form-item">
          <Text className="item-label">全天事件</Text>
          <Switch checked={isAllDay} onChange={(e) => setIsAllDay(e.detail.value)} color="#339AF0" />
        </View>
        <Picker mode="date" value={date} onChange={handleDateChange}>
          <View className="form-item">
            <Text className="item-label">日期</Text>
            <View className="item-value">{date}<Text className="arrow">›</Text></View>
          </View>
        </Picker>
        {!isAllDay && (
          <View className="time-range-picker">
            <Picker mode="time" value={startTime} onChange={handleStartTimeChange} className="flex-1">
              <View className="time-box">
                <Text className="time-label">开始</Text>
                <Text className="time-val">{startTime}</Text>
              </View>
            </Picker>
            <View className="time-sep">至</View>
            <Picker mode="time" value={endTime} onChange={handleEndTimeChange} className="flex-1">
              <View className="time-box">
                <Text className="time-label">结束</Text>
                <Text className="time-val">{endTime}</Text>
              </View>
            </Picker>
          </View>
        )}

        {/* 重复规则选择器 */}
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />
      </View>

      <View className="form-section">
        <View className="section-title">分类</View>
        <View className="category-chips">
          {CATEGORIES.map((cat) => (
            <View
              key={cat.value}
              className={`category-chip ${category === cat.value ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.value)}
              style={{
                backgroundColor: category === cat.value ? EventColors[cat.value] : '#F8F9FA',
                color: category === cat.value ? '#fff' : '#495057'
              }}
            >
              <Text className="chip-icon">{cat.icon}</Text>
              <Text className="chip-label">{cat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="form-section">
        <View className="section-title">其他设置</View>
        <View className="form-item">
          <Text className="item-label">可见范围</Text>
          <View className="toggle-group">
            <Text className={`toggle-opt ${visibility === Visibility.FAMILY ? 'active' : ''}`} onClick={() => handleVisibilityClick(Visibility.FAMILY)}>家庭</Text>
            <Text className={`toggle-opt ${visibility === Visibility.PRIVATE ? 'active' : ''}`} onClick={() => handleVisibilityClick(Visibility.PRIVATE)}>私密</Text>
          </View>
        </View>
        <View className="reminder-chips">
          {REMINDER_OPTIONS.map((opt) => (
            <Text 
              key={opt.value} 
              className={`rem-chip ${selectedReminders.includes(opt.value) ? 'active' : ''}`}
              onClick={() => toggleReminder(opt.value)}
            >
              {opt.label}
            </Text>
          ))}
        </View>
      </View>

      <View className="form-section">
        <Textarea 
          className="memo-area" 
          placeholder="补充更多细节..." 
          value={description} 
          onInput={(e) => setDescription(e.detail.value)} 
        />
      </View>

      <View className="bottom-actions">
        <Button type="primary" size="lg" className="w-full" onClick={handleSubmit}>
          保存日程
        </Button>
      </View>
    </View>
  );
}

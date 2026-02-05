import { View, Text, Input, Textarea, Switch, Picker, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { EventCategory, EventColors, Visibility, RecurrenceRule } from '@famtime/shared';
import Button from '../../../components/Button';
import Skeleton from '../../../components/Skeleton';
import RecurrencePicker from '../../../components/RecurrencePicker';
import EmptyState from '../../../components/EmptyState';
import { createEvent as apiCreateEvent, updateEvent as apiUpdateEvent, getEvent, getFamilyMembers, getTemplates, useTemplate, createTemplate, EventTemplate } from '../../../services/api';
import { useUserStore } from '../../../stores/user';
import { handleError, showLoading, hideLoading, showSuccess } from '../../../utils/helpers';
import './index.less';

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
  const eventId = router.params.id; // 编辑模式时有值
  const isEditMode = !!eventId;
  const initialDate = router.params.date || new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
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
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const selectedCategory = CATEGORIES.find((c) => c.value === category);
  const family = useUserStore((state) => state.family);

  // 设置导航栏标题
  useEffect(() => {
    if (isEditMode) {
      Taro.setNavigationBarTitle({ title: '编辑日程' });
    }
  }, [isEditMode]);

  useEffect(() => {
    const loadData = async () => {
      if (family?.id) {
        try {
          const [familyMembers, templateList] = await Promise.all([
            getFamilyMembers(family.id),
            getTemplates(family.id),
          ]);
          setMembers(familyMembers);
          setTemplates(templateList);

          // 编辑模式：加载现有事件数据
          if (isEditMode && eventId) {
            const eventData = await getEvent(eventId);
            setTitle(eventData.title);
            setDescription(eventData.description || '');
            setCategory(eventData.category);
            setVisibility(eventData.visibility);
            setIsAllDay(eventData.isAllDay);
            setAssigneeId(eventData.assigneeId || '');

            // 解析日期和时间
            const startDate = new Date(eventData.startTime);
            setDate(startDate.toISOString().split('T')[0]);
            setStartTime(`${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`);

            if (eventData.endTime) {
              const endDate = new Date(eventData.endTime);
              setEndTime(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
            }

            // 解析重复规则
            if (eventData.isRecurring && eventData.recurrenceRule) {
              setRecurrence({
                type: eventData.recurrenceRule as any,
                endDate: eventData.recurrenceEnd ? new Date(eventData.recurrenceEnd).toISOString().split('T')[0] : undefined,
                count: eventData.recurrenceCount || undefined,
              });
            }

            // 解析提醒设置
            if (eventData.reminders && eventData.reminders.length > 0) {
              setSelectedReminders(eventData.reminders.map((r: any) => r.beforeMinutes || 0));
            }
          }
        } catch (error) {
          console.error('Failed to load data:', error);
          if (isEditMode) {
            Taro.showToast({ title: '加载事件失败', icon: 'none' });
          }
        }
      }
      setLoading(false);
    };

    setTimeout(loadData, 300);
  }, [family, eventId, isEditMode]);

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

  // 应用模板
  const handleApplyTemplate = async (template: EventTemplate) => {
    Taro.vibrateShort({ type: 'medium' });
    setShowTemplates(false);

    try {
      await useTemplate(template.id);
      setTitle(template.title);
      setDescription(template.description || '');
      setCategory(template.category as EventCategory);
      setVisibility(template.visibility as Visibility);
      setIsAllDay(template.isAllDay);
      setSelectedReminders(template.reminders.map(r => r.beforeMinutes || 0));

      Taro.showToast({ title: '已应用模板', icon: 'success' });
    } catch (e) {
      console.error('Apply template failed', e);
    }
  };

  // 保存为模板
  const handleSaveAsTemplate = async () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请先填写日程标题', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '保存为模板',
      editable: true,
      placeholderText: '请输入模板名称',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await createTemplate({
              familyId: family!.id,
              name: res.content,
              title: title.trim(),
              description: description.trim(),
              isAllDay,
              category,
              visibility,
              reminders: selectedReminders.map(val => ({
                type: val === 0 ? 'AT_TIME' : 'BEFORE',
                beforeMinutes: val
              })),
              isPublic: true,
            });
            Taro.showToast({ title: '模板已保存', icon: 'success' });
            // 刷新模板列表
            const templateList = await getTemplates(family!.id);
            setTemplates(templateList);
          } catch (e) {
            Taro.showToast({ title: '保存失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmit = async () => {
    // 表单验证
    if (!title.trim()) {
      Taro.vibrateShort({ type: 'error' });
      Taro.showToast({ title: '请输入事件标题', icon: 'none' });
      return;
    }

    if (title.length > 50) {
      Taro.showToast({ title: '标题不能超过50个字符', icon: 'none' });
      return;
    }

    if (!family?.id) {
      Taro.showToast({ title: '请先加入家庭', icon: 'none' });
      return;
    }

    // 验证时间
    if (!isAllDay) {
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(`${date}T${endTime}:00`);

      if (end <= start) {
        Taro.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
        return;
      }
    }

    try {
      showLoading(isEditMode ? '正在更新...' : '正在保存...');

      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = isAllDay ? undefined : `${date}T${endTime}:00`;

      const eventData = {
        familyId: family.id,
        title: title.trim(),
        description: description.trim(),
        startTime: new Date(startDateTime).toISOString(),
        endTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
        isAllDay,
        category,
        visibility,
        assigneeId: assigneeId || undefined,
        recurrence,
        reminders: selectedReminders.map(val => ({
          type: val === 0 ? 'AT_TIME' : 'BEFORE',
          beforeMinutes: val
        })) as any
      };

      if (isEditMode && eventId) {
        await apiUpdateEvent(eventId, eventData);
        hideLoading();
        showSuccess('更新成功');
      } else {
        await apiCreateEvent(eventData);
        hideLoading();
        showSuccess('创建成功');
      }

      setTimeout(() => Taro.navigateBack(), 1000);
    } catch (e) {
      hideLoading();
      handleError(e, isEditMode ? '更新失败' : '保存失败');
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
      {/* 模板快捷入口 */}
      {!isEditMode && templates.length > 0 && (
        <View className="template-section">
          <View className="template-header" onClick={() => setShowTemplates(!showTemplates)}>
            <Text className="template-title">📋 使用模板</Text>
            <Text className="template-arrow">{showTemplates ? '收起' : '展开'}</Text>
          </View>
          {showTemplates && (
            <ScrollView scrollX className="template-scroll" enhanced showScrollbar={false}>
              <View className="template-list">
                {templates.map((tpl) => (
                  <View
                    key={tpl.id}
                    className="template-card"
                    onClick={() => handleApplyTemplate(tpl)}
                  >
                    <Text className="tpl-name">{tpl.name}</Text>
                    <Text className="tpl-title">{tpl.title}</Text>
                    <Text className="tpl-usage">使用 {tpl.usageCount} 次</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

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
            {members.map((member) => (
              <View
                key={member.id}
                className={`member-avatar-node ${assigneeId === member.userId ? 'active' : ''}`}
                onClick={() => handleMemberSelect(member.userId)}
              >
                <View className="avatar-circle" style={{ backgroundColor: member.color }}>
                  <Text>{member.nickname.charAt(0)}</Text>
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
        {!isEditMode && (
          <View className="save-template-btn" onClick={handleSaveAsTemplate}>
            <Text>保存为模板</Text>
          </View>
        )}
        <Button type="primary" size="lg" className="submit-btn" onClick={handleSubmit}>
          {isEditMode ? '更新日程' : '保存日程'}
        </Button>
      </View>
    </View>
  );
}

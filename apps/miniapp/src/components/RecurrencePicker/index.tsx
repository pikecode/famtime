import { View, Text, Picker } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { RecurrenceType, RecurrenceRule } from '@famtime/shared';
import './index.less';

interface RecurrencePickerProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | undefined) => void;
}

const RECURRENCE_OPTIONS = [
  { label: '不重复', value: '' },
  { label: '每天', value: RecurrenceType.DAILY },
  { label: '每周', value: RecurrenceType.WEEKLY },
  { label: '每月', value: RecurrenceType.MONTHLY },
  { label: '每年', value: RecurrenceType.YEARLY },
];

const WEEKDAY_OPTIONS = [
  { label: '周日', value: 0 },
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
];

const END_TYPE_OPTIONS = [
  { label: '永不', value: 'never' },
  { label: '指定日期', value: 'date' },
  { label: '指定次数', value: 'count' },
];

export default function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | ''>(
    value?.type || ''
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    value?.weekdays || []
  );
  const [endType, setEndType] = useState<'never' | 'date' | 'count'>(
    value?.endDate ? 'date' : value?.count ? 'count' : 'never'
  );
  const [endDate, setEndDate] = useState(value?.endDate || '');
  const [count, setCount] = useState(value?.count || 10);

  const handleTypeChange = (type: RecurrenceType | '') => {
    Taro.vibrateShort({ type: 'light' });
    setRecurrenceType(type);

    if (!type) {
      onChange(undefined);
      setShowDetail(false);
    } else {
      setShowDetail(true);
      updateRule(type, selectedWeekdays, endType, endDate, count);
    }
  };

  const handleWeekdayToggle = (day: number) => {
    Taro.vibrateShort({ type: 'light' });
    const newWeekdays = selectedWeekdays.includes(day)
      ? selectedWeekdays.filter((d) => d !== day)
      : [...selectedWeekdays, day].sort();

    setSelectedWeekdays(newWeekdays);
    if (recurrenceType) {
      updateRule(recurrenceType, newWeekdays, endType, endDate, count);
    }
  };

  const handleEndTypeChange = (type: 'never' | 'date' | 'count') => {
    Taro.vibrateShort({ type: 'light' });
    setEndType(type);
    if (recurrenceType) {
      updateRule(recurrenceType, selectedWeekdays, type, endDate, count);
    }
  };

  const handleEndDateChange = (e: any) => {
    const date = e.detail.value;
    setEndDate(date);
    if (recurrenceType) {
      updateRule(recurrenceType, selectedWeekdays, endType, date, count);
    }
  };

  const handleCountChange = (e: any) => {
    const newCount = parseInt(e.detail.value[0]) + 1;
    setCount(newCount);
    if (recurrenceType) {
      updateRule(recurrenceType, selectedWeekdays, endType, endDate, newCount);
    }
  };

  const updateRule = (
    type: RecurrenceType,
    weekdays: number[],
    endType: 'never' | 'date' | 'count',
    endDate: string,
    count: number
  ) => {
    const rule: RecurrenceRule = {
      type,
      weekdays: type === RecurrenceType.WEEKLY && weekdays.length > 0 ? weekdays : undefined,
      endDate: endType === 'date' && endDate ? endDate : undefined,
      count: endType === 'count' ? count : undefined,
    };
    onChange(rule);
  };

  const getRecurrenceText = () => {
    if (!recurrenceType) return '不重复';

    let text = RECURRENCE_OPTIONS.find((opt) => opt.value === recurrenceType)?.label || '';

    if (recurrenceType === RecurrenceType.WEEKLY && selectedWeekdays.length > 0) {
      const days = selectedWeekdays
        .map((d) => WEEKDAY_OPTIONS.find((opt) => opt.value === d)?.label)
        .join('、');
      text += ` (${days})`;
    }

    if (endType === 'date' && endDate) {
      text += `，至${endDate}`;
    } else if (endType === 'count') {
      text += `，共${count}次`;
    }

    return text;
  };

  return (
    <View className="recurrence-picker">
      <View className="picker-header" onClick={() => setShowDetail(!showDetail)}>
        <Text className="label">重复</Text>
        <View className="value-area">
          <Text className="value">{getRecurrenceText()}</Text>
          <Text className="arrow">{showDetail ? '∧' : '∨'}</Text>
        </View>
      </View>

      {showDetail && (
        <View className="picker-detail">
          {/* 重复类型 */}
          <View className="detail-section">
            <Text className="section-label">重复频率</Text>
            <View className="type-chips">
              {RECURRENCE_OPTIONS.map((opt) => (
                <View
                  key={opt.value}
                  className={`type-chip ${recurrenceType === opt.value ? 'active' : ''}`}
                  onClick={() => handleTypeChange(opt.value as RecurrenceType | '')}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 每周选择星期几 */}
          {recurrenceType === RecurrenceType.WEEKLY && (
            <View className="detail-section">
              <Text className="section-label">重复日期</Text>
              <View className="weekday-chips">
                {WEEKDAY_OPTIONS.map((opt) => (
                  <View
                    key={opt.value}
                    className={`weekday-chip ${
                      selectedWeekdays.includes(opt.value) ? 'active' : ''
                    }`}
                    onClick={() => handleWeekdayToggle(opt.value)}
                  >
                    <Text>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 结束条件 */}
          {recurrenceType && (
            <View className="detail-section">
              <Text className="section-label">结束条件</Text>
              <View className="end-type-chips">
                {END_TYPE_OPTIONS.map((opt) => (
                  <View
                    key={opt.value}
                    className={`end-chip ${endType === opt.value ? 'active' : ''}`}
                    onClick={() => handleEndTypeChange(opt.value as any)}
                  >
                    <Text>{opt.label}</Text>
                  </View>
                ))}
              </View>

              {endType === 'date' && (
                <Picker mode="date" value={endDate} onChange={handleEndDateChange}>
                  <View className="date-picker-btn">
                    <Text>{endDate || '选择日期'}</Text>
                  </View>
                </Picker>
              )}

              {endType === 'count' && (
                <Picker
                  mode="selector"
                  range={Array.from({ length: 100 }, (_, i) => `${i + 1}次`)}
                  value={count - 1}
                  onChange={handleCountChange}
                >
                  <View className="count-picker-btn">
                    <Text>重复 {count} 次</Text>
                  </View>
                </Picker>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

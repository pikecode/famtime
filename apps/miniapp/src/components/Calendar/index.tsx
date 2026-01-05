import { View, Text } from '@tarojs/components';
import { useMemo } from 'react';
import Taro from '@tarojs/taro';
import { EventColors, EventStatus } from '@famtime/shared';
import { getLunarDisplay } from '../../utils/lunar';
import './index.less';

interface CalendarProps {
  currentYear: number;
  currentMonth: number;
  selectedDate: string;
  events: Record<string, any[]>;
  onDayClick: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayClick: () => void;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export default function Calendar(props: CalendarProps) {
  const {
    currentYear,
    currentMonth,
    selectedDate,
    events,
    onDayClick,
    onPrevMonth,
    onNextMonth,
    onTodayClick,
  } = props;

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(-(prevMonthDays - i));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(i + 100);
    }

    return days;
  }, [currentYear, currentMonth]);

  const handleDayClick = (day: number) => {
    if (day > 0 && day <= 100) {
      Taro.vibrateShort({ type: 'light' });
      onDayClick(day);
    }
  };

  const handlePrev = () => {
    Taro.vibrateShort({ type: 'light' });
    onPrevMonth();
  };

  const handleNext = () => {
    Taro.vibrateShort({ type: 'light' });
    onNextMonth();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return formatDate(currentYear, currentMonth, day) === selectedDate;
  };

  return (
    <View className="calendar-component">
      <View className="calendar-header">
        <View className="month-selector">
          <View className="nav-icon" onClick={handlePrev}>‹</View>
          <Text className="current-date" onClick={onTodayClick}>
            {currentYear}年{currentMonth + 1}月
          </Text>
          <View className="nav-icon" onClick={handleNext}>›</View>
        </View>
        <View className="today-btn" onClick={onTodayClick}>今</View>
      </View>

      <View className="weekdays-row">
        {weekDays.map((day, index) => (
          <Text
            key={day}
            className={`weekday-label ${index === 0 || index === 6 ? 'weekend' : ''}`}
          >
            {day}
          </Text>
        ))}
      </View>

      <View className="days-grid">
        {calendarDays.map((day, index) => {
          const isOtherMonth = day <= 0 || day > 100;
          const actualDay = day <= 0 ? -day : day > 100 ? day - 100 : day;
          
          let displayYear = currentYear;
          let displayMonth = currentMonth + 1;
          if (day <= 0) {
            displayMonth = currentMonth === 0 ? 12 : currentMonth;
            displayYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          } else if (day > 100) {
            displayMonth = currentMonth === 11 ? 1 : currentMonth + 2;
            displayYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          }
          
          const lunar = getLunarDisplay(displayYear, displayMonth, actualDay);
          const isFestival = ["春节", "元宵", "端午", "七夕", "中秋", "重阳", "腊八", "小年", "除夕"].includes(lunar);

          const dateStr = !isOtherMonth ? formatDate(currentYear, currentMonth, day) : '';
          const dayEvents = events[dateStr] || [];
          const hasPending = dayEvents.some((e) => e.status === EventStatus.PENDING);

          return (
            <View
              key={index}
              className={`day-node ${isOtherMonth ? 'inactive' : ''} ${
                !isOtherMonth && isToday(day) ? 'is-today' : ''
              } ${!isOtherMonth && isSelected(day) ? 'is-selected' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <View className="day-content">
                <Text className="day-val">{actualDay}</Text>
                <Text className={`lunar-val ${isFestival ? 'festival' : ''}`}>{lunar}</Text>
                {dayEvents.length > 0 && (
                  <View className="event-indicators">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <View
                        key={i}
                        className={`indicator-dot ${hasPending && event.status === EventStatus.PENDING ? 'is-pending' : ''}`}
                        style={{ backgroundColor: EventColors[event.category] }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

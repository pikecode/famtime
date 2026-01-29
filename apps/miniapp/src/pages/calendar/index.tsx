import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useEffect, useMemo } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { EventStatus, Event, EventCategory } from '@famtime/shared';
import Calendar from '../../components/Calendar';
import EventCard from '../../components/EventCard';
import Skeleton from '../../components/Skeleton';
import SearchBar, { SearchFilters } from '../../components/SearchBar';
import { getEvents } from '../../services/api';
import { useUserStore } from '../../stores/user';
import './index.less';

// ============ 工具函数 ============
const formatDate = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [eventsMap, setEventsMap] = useState<Record<string, Event[]>>({});
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(
    formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  const family = useUserStore((state) => state.family);

  // 当页面显示或家庭/月份变化时，拉取数据
  useDidShow(() => {
    fetchMonthEvents();
  });

  useEffect(() => {
    fetchMonthEvents();
  }, [currentYear, currentMonth, family?.id]);

  const fetchMonthEvents = async () => {
    if (!family?.id) {
      setLoading(false);
      return;
    }

    try {
      // 计算当前月及前后一个月的有效范围
      const startDateObj = new Date(currentYear, currentMonth - 1, 1);
      const endDateObj = new Date(currentYear, currentMonth + 1, 0); // 0日获取上月最后一天

      const startDate = startDateObj.toISOString().split('T')[0];
      const endDate = endDateObj.toISOString().split('T')[0];

      const events = await getEvents({
        familyId: family.id,
        startDate,
        endDate,
      });

      // 将事件按日期进行归档
      const map: Record<string, Event[]> = {};
      events.forEach((event) => {
        const dateKey = new Date(event.startTime).toISOString().split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(event);
      });

      setEventsMap(map);
    } catch (e) {
      console.error('Fetch events failed', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedDateEvents = useMemo(() => {
    let events = eventsMap[selectedDate] || [];

    // 应用搜索关键词过滤
    if (searchKeyword) {
      events = events.filter((event) =>
        event.title.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    // 应用分类过滤
    if (filters.category) {
      events = events.filter((event) => event.category === filters.category);
    }

    return events;
  }, [eventsMap, selectedDate, searchKeyword, filters]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    Taro.vibrateShort({ type: 'medium' });
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(formatDate(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    // 选中该月的第一天
    setSelectedDate(formatDate(year, month, 1));
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(formatDate(currentYear, currentMonth, day));
  };

  const handleCreateEvent = () => {
    Taro.vibrateShort({ type: 'medium' });
    Taro.navigateTo({ url: `/pages/event/create/index?date=${selectedDate}` });
  };

  const handleEventClick = (eventId: string) => {
    Taro.navigateTo({ url: `/pages/event/detail/index?id=${eventId}` });
  };

  return (
    <View className="calendar-page">
      {/* 搜索栏 */}
      <SearchBar
        onSearch={setSearchKeyword}
        onFilterChange={setFilters}
      />

      <View className="top-section">
        {loading ? (
          <View className="calendar-skeleton">
            <Skeleton height={600} width="100%" />
          </View>
        ) : (
          <Calendar
            currentYear={currentYear}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            events={eventsMap}
            onDayClick={handleDayClick}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onTodayClick={handleToday}
            onMonthChange={handleMonthChange}
          />
        )}
      </View>

      <View className="event-section">
        <View className="section-header">
          <View className="title-area">
            <Text className="section-title">
              {selectedDate === formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
                ? '今日日程'
                : '日程详情'}
            </Text>
            <Text className="date-subtitle">
              {selectedDate.split('-')[1]}月{selectedDate.split('-')[2]}日
            </Text>
          </View>
          {loading ? (
            <Skeleton height={40} width={120} />
          ) : (
            <Text className="event-count">
              {selectedDateEvents.length > 0 ? `${selectedDateEvents.length} 条日程` : '暂无日程'}
            </Text>
          )}
        </View>

        <View className="event-list-container">
          {!family?.id ? (
            <View className="empty-state">
              <View className="empty-icon-wrapper">
                <Text className="empty-emoji">🏠</Text>
              </View>
              <Text className="empty-text">尚未加入家庭</Text>
              <Text className="empty-hint">请前往"家庭"频道创建或加入</Text>
            </View>
          ) : loading ? (
            <View className="cards-container">
              <Skeleton height={180} count={3} width="100%" className="mb-20" />
            </View>
          ) : selectedDateEvents.length === 0 ? (
            <View className="empty-state">
              <View className="empty-icon-wrapper">
                <Text className="empty-emoji">🍃</Text>
              </View>
              <Text className="empty-text">今天也是轻松的一天呢</Text>
              <Text className="empty-hint">点击右下角按钮添加新日程</Text>
            </View>
          ) : (
            <View className="cards-container">
              {selectedDateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description}
                  startTime={new Date(event.startTime)}
                  endTime={event.endTime ? new Date(event.endTime) : undefined}
                  category={event.category}
                  status={event.status}
                  creatorName="家庭成员" // 实际应从成员列表匹配
                  isAllDay={event.isAllDay}
                  onClick={handleEventClick}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      {family?.id && !loading && (
        <View className="fab-button" onClick={handleCreateEvent}>
          <Text className="fab-plus">+</Text>
        </View>
      )}
    </View>
  );
}

import { View, Text, Input } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { EventCategory } from '@famtime/shared';
import './index.less';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  category?: EventCategory;
  assigneeId?: string;
  status?: string;
}

const CATEGORIES = [
  { value: '', label: '全部', icon: '📋' },
  { value: EventCategory.BIRTHDAY, label: '生日', icon: '🎂' },
  { value: EventCategory.ANNIVERSARY, label: '纪念日', icon: '💕' },
  { value: EventCategory.HEALTH, label: '健康', icon: '💚' },
  { value: EventCategory.FAMILY_ACTIVITY, label: '家庭活动', icon: '👨‍👩‍👧‍👦' },
  { value: EventCategory.REMINDER, label: '提醒', icon: '⏰' },
  { value: EventCategory.OTHER, label: '其他', icon: '📌' },
];

export default function SearchBar({ onSearch, onFilterChange }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleInput = (e: any) => {
    const value = e.detail.value;
    setKeyword(value);
    onSearch(value);
  };

  const handleCategoryChange = (category: string) => {
    Taro.vibrateShort({ type: 'light' });
    setSelectedCategory(category);
    onFilterChange({
      category: category as EventCategory || undefined,
    });
  };

  const toggleFilters = () => {
    Taro.vibrateShort({ type: 'light' });
    setShowFilters(!showFilters);
  };

  return (
    <View className="search-bar">
      <View className="search-input-row">
        <View className="search-input-wrapper">
          <Text className="search-icon">🔍</Text>
          <Input
            className="search-input"
            placeholder="搜索日程标题..."
            value={keyword}
            onInput={handleInput}
            confirmType="search"
          />
          {keyword && (
            <Text
              className="clear-icon"
              onClick={() => {
                setKeyword('');
                onSearch('');
              }}
            >
              ✕
            </Text>
          )}
        </View>
        <View
          className={`filter-btn ${showFilters ? 'active' : ''}`}
          onClick={toggleFilters}
        >
          <Text>筛选</Text>
        </View>
      </View>

      {showFilters && (
        <View className="filter-panel">
          <View className="filter-section">
            <Text className="filter-label">分类</Text>
            <View className="category-filters">
              {CATEGORIES.map((cat) => (
                <View
                  key={cat.value}
                  className={`category-filter-chip ${
                    selectedCategory === cat.value ? 'active' : ''
                  }`}
                  onClick={() => handleCategoryChange(cat.value)}
                >
                  <Text className="chip-icon">{cat.icon}</Text>
                  <Text className="chip-label">{cat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

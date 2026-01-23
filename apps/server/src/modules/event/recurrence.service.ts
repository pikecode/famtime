import { Injectable } from '@nestjs/common';
import { RecurrenceType } from '@famtime/shared';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number;
  endDate?: string;
  count?: number;
  weekdays?: number[];
  monthDay?: number;
}

@Injectable()
export class RecurrenceService {
  /**
   * 生成重复事件的所有实例日期
   * @param startDate 开始日期
   * @param rule 重复规则
   * @param maxOccurrences 最大生成数量（防止无限循环）
   * @returns 日期数组
   */
  generateOccurrences(
    startDate: Date,
    rule: RecurrenceRule,
    maxOccurrences = 365,
  ): Date[] {
    const occurrences: Date[] = [];
    const interval = rule.interval || 1;
    let currentDate = new Date(startDate);
    const endDate = rule.endDate ? new Date(rule.endDate) : null;
    const maxCount = rule.count || maxOccurrences;

    let count = 0;
    while (count < maxCount) {
      // 检查是否超过结束日期
      if (endDate && currentDate > endDate) {
        break;
      }

      // 根据规则类型生成下一个日期
      if (this.shouldIncludeDate(currentDate, rule, count === 0)) {
        occurrences.push(new Date(currentDate));
        count++;
      }

      // 移动到下一个候选日期
      currentDate = this.getNextDate(currentDate, rule.type, interval);

      // 防止无限循环
      if (occurrences.length >= maxOccurrences) {
        break;
      }
    }

    return occurrences;
  }

  /**
   * 判断某个日期是否应该包含在重复规则中
   */
  private shouldIncludeDate(
    date: Date,
    rule: RecurrenceRule,
    isFirst: boolean,
  ): boolean {
    // 第一个日期总是包含
    if (isFirst) {
      return true;
    }

    // 如果指定了周几，检查是否匹配
    if (rule.type === RecurrenceType.WEEKLY && rule.weekdays?.length) {
      const dayOfWeek = date.getDay();
      return rule.weekdays.includes(dayOfWeek);
    }

    // 如果指定了每月第几天，检查是否匹配
    if (rule.type === RecurrenceType.MONTHLY && rule.monthDay) {
      return date.getDate() === rule.monthDay;
    }

    return true;
  }

  /**
   * 根据重复类型获取下一个日期
   */
  private getNextDate(
    currentDate: Date,
    type: RecurrenceType,
    interval: number,
  ): Date {
    const next = new Date(currentDate);

    switch (type) {
      case RecurrenceType.DAILY:
        next.setDate(next.getDate() + interval);
        break;

      case RecurrenceType.WEEKLY:
        next.setDate(next.getDate() + 7 * interval);
        break;

      case RecurrenceType.MONTHLY:
        next.setMonth(next.getMonth() + interval);
        break;

      case RecurrenceType.YEARLY:
        next.setFullYear(next.getFullYear() + interval);
        break;
    }

    return next;
  }

  /**
   * 获取指定日期范围内的重复事件实例
   */
  getOccurrencesInRange(
    startDate: Date,
    rule: RecurrenceRule,
    rangeStart: Date,
    rangeEnd: Date,
  ): Date[] {
    const allOccurrences = this.generateOccurrences(startDate, rule);

    return allOccurrences.filter(
      (date) => date >= rangeStart && date <= rangeEnd,
    );
  }

  /**
   * 格式化重复规则为人类可读的文本
   */
  formatRecurrenceText(rule: RecurrenceRule): string {
    const { type, interval = 1, weekdays, count, endDate } = rule;

    let text = '';

    // 基础频率
    switch (type) {
      case RecurrenceType.DAILY:
        text = interval === 1 ? '每天' : `每${interval}天`;
        break;
      case RecurrenceType.WEEKLY:
        if (weekdays?.length) {
          const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          const days = weekdays.map((d) => dayNames[d]).join('、');
          text = `每周${days}`;
        } else {
          text = interval === 1 ? '每周' : `每${interval}周`;
        }
        break;
      case RecurrenceType.MONTHLY:
        text = interval === 1 ? '每月' : `每${interval}个月`;
        break;
      case RecurrenceType.YEARLY:
        text = interval === 1 ? '每年' : `每${interval}年`;
        break;
    }

    // 结束条件
    if (count) {
      text += `，共${count}次`;
    } else if (endDate) {
      const date = new Date(endDate);
      text += `，至${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    return text;
  }
}

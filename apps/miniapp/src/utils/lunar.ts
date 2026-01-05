/**
 * 农历转换工具函数 (1900-2100)
 */

const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0ad50, 0x055a0, 0x0a5b0, 0x145b5,
  0x049b0, 0x0a970, 0x064b0, 0x06a50, 0x1d6a6, 0x0ea50, 0x06b20, 0x0a6c4, 0x0aa70, 0x052b2,
  0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7,
  0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
  0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63, 0x09370, 0x049f8, 0x04970,
  0x064b0, 0x06a40, 0x16a55, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aa70, 0x052b0, 0x04b62, 0x0a6e6,
  0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0,
  0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0,
  0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x06a40,
  0x16a55, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aa70, 0x052b0, 0x04b62, 0x0a6e6, 0x0a4e0, 0x0d260,
  0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250
];

const lunarMonth = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "腊"];
const lunarDay = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", 
                  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", 
                  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

const lunarFestivals: Record<string, string> = {
  "0101": "春节",
  "0115": "元宵",
  "0505": "端午",
  "0707": "七夕",
  "0815": "中秋",
  "0909": "重阳",
  "1208": "腊八",
  "1223": "小年",
  "1230": "除夕",
};

/**
 * 获取指定日期的农历显示文本
 */
export function getLunarDisplay(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  const baseDate = new Date(1900, 0, 31);
  let offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000);

  if (offset < 0) return "";

  let i, leap = 0, temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = getLunarYearDays(i);
    offset -= temp;
  }

  if (offset < 0) {
    offset += temp;
    i--;
  }

  const lunarYear = i;
  leap = getLeapMonth(i);
  let isLeap = false;

  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      --i;
      isLeap = true;
      temp = getLeapMonthDays(lunarYear);
    } else {
      temp = getMonthDays(lunarYear, i);
    }

    if (isLeap && i === (leap + 1)) isLeap = false;
    offset -= temp;
  }

  if (offset < 0) {
    offset += temp;
    i--;
  }

  const lMonth = i;
  const lDay = offset + 1;

  const festivalKey = `${String(lMonth).padStart(2, '0')}${String(lDay).padStart(2, '0')}`;
  if (lunarFestivals[festivalKey]) {
    return lunarFestivals[festivalKey];
  }

  if (lDay === 1) {
    return lunarMonth[lMonth - 1] + "月";
  }

  return lunarDay[lDay - 1];
}

function getLunarYearDays(year: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[year - 1900] & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

function getLeapMonth(year: number): number {
  return lunarInfo[year - 1900] & 0xf;
}

function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year)) {
    return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function getMonthDays(year: number, month: number): number {
  return (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

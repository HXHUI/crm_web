/**
 * 农历转换工具
 * 支持公历转农历
 */

// 农历数据表（1900-2100年）
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
]

// 天干
const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
// 地支
const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
// 生肖
const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
// 农历月份
const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
// 农历日期
const lunarDays = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

/**
 * 获取农历年份信息
 */
function getLunarYear(year: number): { gan: string; zhi: string; animal: string } {
  const ganIndex = (year - 4) % 10
  const zhiIndex = (year - 4) % 12
  return {
    gan: gan[ganIndex],
    zhi: zhi[zhiIndex],
    animal: animals[zhiIndex]
  }
}

/**
 * 计算农历日期
 */
function solarToLunar(year: number, month: number, day: number): {
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeap: boolean
  lunarMonthName: string
  lunarDayName: string
} {
  // 计算从1900年1月31日到指定日期的天数
  let offset = 0
  for (let y = 1900; y < year; y++) {
    offset += isLeapYear(y) ? 366 : 365
  }
  for (let m = 1; m < month; m++) {
    offset += getDaysInMonth(year, m)
  }
  offset += day - 1

  // 农历1900年正月初一对应公历1900年1月31日
  let lunarYear = 1900
  let lunarMonth = 1
  let lunarDay = 1
  let days = 0

  // 计算农历日期
  while (days < offset) {
    const yearInfo = lunarInfo[lunarYear - 1900]
    const leapMonth = getLeapMonth(lunarYear)
    const monthDays = getLunarMonthDays(lunarYear, lunarMonth)

    if (days + monthDays <= offset) {
      days += monthDays
      lunarMonth++
      if (lunarMonth > 12) {
        lunarMonth = 1
        lunarYear++
      }
      // 处理闰月
      if (lunarMonth === leapMonth + 1) {
        const leapDays = getLeapMonthDays(lunarYear)
        if (days + leapDays <= offset) {
          days += leapDays
        } else {
          // 在闰月中
          return {
            lunarYear,
            lunarMonth: leapMonth,
            lunarDay: offset - days + 1,
            isLeap: true,
            lunarMonthName: `闰${lunarMonths[leapMonth - 1]}月`,
            lunarDayName: lunarDays[offset - days]
          }
        }
      }
    } else {
      lunarDay = offset - days + 1
      break
    }
  }

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeap: false,
    lunarMonthName: `${lunarMonths[lunarMonth - 1]}月`,
    lunarDayName: lunarDays[lunarDay - 1]
  }
}

/**
 * 判断是否为闰年
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * 获取月份天数
 */
function getDaysInMonth(year: number, month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (month === 2 && isLeapYear(year)) {
    return 29
  }
  return daysInMonth[month - 1]
}

/**
 * 获取农历闰月月份
 */
function getLeapMonth(year: number): number {
  const yearInfo = lunarInfo[year - 1900]
  return yearInfo & 0xf
}

/**
 * 获取农历月份天数
 */
function getLunarMonthDays(year: number, month: number): number {
  const yearInfo = lunarInfo[year - 1900]
  if ((yearInfo & (0x10000 >> month)) !== 0) {
    return 30
  }
  return 29
}

/**
 * 获取农历闰月天数
 */
function getLeapMonthDays(year: number): number {
  const yearInfo = lunarInfo[year - 1900]
  const leapMonth = getLeapMonth(year)
  if (leapMonth > 0) {
    if ((yearInfo & (0x10000 >> (leapMonth + 1))) !== 0) {
      return 30
    }
    return 29
  }
  return 0
}

/**
 * 格式化农历日期（简化版，用于日历显示）
 * @param date 公历日期对象
 * @returns 农历日期字符串，如 "正月初一"
 */
export function formatLunarDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 限制年份范围在1900-2100之间
  if (year < 1900 || year > 2100) {
    return ''
  }

  try {
    const lunar = solarToLunar(year, month, day)
    // 只显示月日，不显示年份
    return lunar.lunarDayName
  } catch (error) {
    console.error('农历转换失败:', error)
    return ''
  }
}

/**
 * 获取完整的农历信息
 */
export function getLunarInfo(date: Date): {
  lunarDate: string
  lunarYear: string
  animal: string
} {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (year < 1900 || year > 2100) {
    return { lunarDate: '', lunarYear: '', animal: '' }
  }

  try {
    const lunar = solarToLunar(year, month, day)
    const yearInfo = getLunarYear(lunar.lunarYear)
    return {
      lunarDate: `${lunar.lunarMonthName}${lunar.lunarDayName}`,
      lunarYear: `${yearInfo.gan}${yearInfo.zhi}年`,
      animal: yearInfo.animal
    }
  } catch (error) {
    console.error('获取农历信息失败:', error)
    return { lunarDate: '', lunarYear: '', animal: '' }
  }
}


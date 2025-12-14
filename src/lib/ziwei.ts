import { Solar } from 'lunar-javascript';
import { astro } from 'iztro';
import { GenderName } from 'iztro/lib/i18n';
import FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe';
import { Horoscope } from 'iztro/lib/data/types';
import { calculateTrueSolarTime, getTimeIndexFromDate } from './time-utils';

// Define input types
export type SolarDateStr = string; // YYYY-MM-DD
export type TimeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Gender = 'male' | 'female';

export class ZiweiError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = 'ZiweiError';
  }
}

// Define output types
export interface Star {
  name: string;
  mutagen?: string; // '禄' | '权' | '科' | '忌'
  brightness?: string; // '庙' | '旺' | '得' | '利' | '平' | '不' | '陷'
}

export interface PalaceData {
  palaceName: string;
  stem: string;
  branch: string;
  heavenlyEarthly: string;
  majorStars: Star[];
  minorStars: Star[];
  miscStars: Star[];
  transformations: string[]; // Keep for backward compat or quick access
  isYearly?: boolean;
}

export interface ZiWeiChart {
  fiveElements: string;
  lifeOwner: string;
  bodyOwner: string;
  palaces: PalaceData[];
  yearly: PalaceData[];
  solarDateStr?: string;
  timeIndex?: number;
  gender?: Gender;
}

/**
 * ZiWeiCalculator
 * Core utility class for Zi Wei Dou Shu calculations
 */
export class ZiWeiCalculator {
  /**
   * Get Zi Wei Dou Shu Chart with True Solar Time Correction
   * This is the recommended entry point for high precision.
   * 
   * @param date Input Date object (Beijing Standard Time)
   * @param longitude Local longitude (default 120)
   * @param gender Gender
   * @param year Optional year for flow year
   * @returns ZiWeiChart
   */
  static getZiWeiChartByDate(
    date: Date,
    longitude: number = 120,
    gender: Gender,
    year?: number
  ): ZiWeiChart {
    // 1. Calculate True Solar Time
    const trueSolarDate = calculateTrueSolarTime(date, longitude);
    
    // 2. Extract Solar Date String and Time Index from Corrected Time
    const y = trueSolarDate.getFullYear();
    const m = trueSolarDate.getMonth() + 1;
    const d = trueSolarDate.getDate();
    const solarDateStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    
    const timeIndex = getTimeIndexFromDate(trueSolarDate) as TimeIndex;
    
    // 3. Call internal generator
    return this.getZiWeiChart(solarDateStr, timeIndex, gender, year);
  }

  /**
   * Get Zi Wei Dou Shu Chart
   * @param solarDateStr Solar Date (YYYY-MM-DD)
   * @param timeIndex Time Index (0-12)
   * @param gender Gender ('male' | 'female')
   * @returns ZiWeiChart
   */
  static getZiWeiChart(
    solarDateStr: SolarDateStr,
    timeIndex: TimeIndex,
    gender: Gender,
    targetYear?: number | string
  ): ZiWeiChart {
    // 1. Validate Input
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(solarDateStr)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
    if (timeIndex < 0 || timeIndex > 12) {
      throw new Error('Invalid time index. Expected 0-12');
    }

    // 2. Lunar Conversion (Requirement: Use lunar-javascript)
    // We verify the date validity using lunar-javascript
    const [y, m, d] = solarDateStr.split('-').map(Number);
    // Use Solar.fromYmd because the input is a Solar date
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    if (!lunar) {
      throw new Error('Failed to convert to Lunar date');
    }

    // 3. Call iztro for Astrolabe
    // Map gender to iztro format
    const iztroGender: GenderName = gender === 'male' ? '男' : '女';
    
    // Create Astrolabe
    // fixLeap=true is standard
    const astrolabe = astro.bySolar(solarDateStr, timeIndex, iztroGender, true, 'zh-CN') as FunctionalAstrolabe;

    // 4. Extract Main Chart Data
    const palacesData = this.extractPalaces(astrolabe);

    // 5. Extract Yearly Data
    // Default to the year of the date if not provided
    const flowYear = targetYear || y;
    // Ensure flowYear is treated as a date string for iztro to correctly determine the yearly stem
    // Using mid-year to be safe within the lunar year, or just Jan 1st?
    // iztro likely uses the date to determine the Lunar Year.
    // If we want the chart for the Lunar Year corresponding to flowYear, we should probably pass a date that is definitely in that Lunar Year.
    // However, iztro.horoscope(date) likely calculates the daily/monthly/yearly stars for THAT date.
    // But we only want the YEARLY chart (Liu Nian).
    // The Yearly chart is constant for the whole Lunar Year.
    // Let's pass a date string.
    const horoscope = astrolabe.horoscope(`${flowYear}-06-15`);
    
    const yearlyPalacesData = this.extractYearlyPalaces(astrolabe, horoscope);

    // 6. Return Result
    return {
      fiveElements: astrolabe.fiveElementsClass,
      lifeOwner: astrolabe.soul,
      bodyOwner: astrolabe.body,
      palaces: palacesData,
      yearly: yearlyPalacesData,
      solarDateStr,
      timeIndex,
      gender
    };
  }

  /**
   * Get Flying Stars for a given Heavenly Stem
   * Returns a map of transformation type to star name.
   */
  static getFlyingStars(stem: string): Record<'Lu' | 'Quan' | 'Ke' | 'Ji', string> {
    const flyingStarMap: Record<string, Record<'Lu' | 'Quan' | 'Ke' | 'Ji', string>> = {
      '甲': { Lu: '廉贞', Quan: '破军', Ke: '武曲', Ji: '太阳' },
      '乙': { Lu: '天机', Quan: '天梁', Ke: '紫微', Ji: '太阴' },
      '丙': { Lu: '天同', Quan: '天机', Ke: '文昌', Ji: '廉贞' },
      '丁': { Lu: '太阴', Quan: '天同', Ke: '天机', Ji: '巨门' },
      '戊': { Lu: '贪狼', Quan: '太阴', Ke: '右弼', Ji: '天机' },
      '己': { Lu: '武曲', Quan: '贪狼', Ke: '天梁', Ji: '文曲' },
      '庚': { Lu: '太阳', Quan: '武曲', Ke: '太阴', Ji: '天同' },
      '辛': { Lu: '巨门', Quan: '太阳', Ke: '文曲', Ji: '文昌' },
      '壬': { Lu: '天梁', Quan: '紫微', Ke: '左辅', Ji: '武曲' },
      '癸': { Lu: '破军', Quan: '巨门', Ke: '太阴', Ji: '贪狼' },
    };
    
    return flyingStarMap[stem] || { Lu: '', Quan: '', Ke: '', Ji: '' };
  }

  /**
   * Find locations (palace indices) of specific stars
   * 
   * @param chart ZiWeiChart
   * @param starNames Array of star names to find
   * @returns Array of palace indices (0-11). If a star is not found, it is skipped (or order preserved? user said return indices array).
   *          Implementation: Returns an array where each element corresponds to the found index of the star at the same position in input.
   *          If a star is not found, -1 is returned for that position to maintain order mapping.
   */
  static findStarsLocation(chart: ZiWeiChart, starNames: string[]): number[] {
    const locations: number[] = new Array(starNames.length).fill(-1);
    
    // Create a map of star name to its indices in the input array (handle duplicates if any, though unlikely for unique stars)
    const starNameMap = new Map<string, number[]>();
    starNames.forEach((name, idx) => {
      if (!starNameMap.has(name)) {
        starNameMap.set(name, []);
      }
      starNameMap.get(name)!.push(idx);
    });

    // Traverse all palaces (O(12 * stars_per_palace))
    // Typically stars per palace is small (<20). So this is efficient.
    for (let i = 0; i < chart.palaces.length; i++) {
      const palace = chart.palaces[i];
      const allStars = [...palace.majorStars, ...palace.minorStars, ...palace.miscStars];
      
      for (const star of allStars) {
        if (starNameMap.has(star.name)) {
          const indices = starNameMap.get(star.name)!;
          indices.forEach(idx => {
            locations[idx] = i;
          });
        }
      }
    }

    return locations;
  }

  /**
   * Helper to extract palace data from astrolabe
   */
  private static extractPalaces(astrolabe: FunctionalAstrolabe): PalaceData[] {
    const palaces: PalaceData[] = [];
    
    // iztro palaces are 0-11
    for (let i = 0; i < 12; i++) {
      const p = astrolabe.palace(i);
      if (!p) continue;

      palaces.push({
        palaceName: p.name,
        stem: p.heavenlyStem,
        branch: p.earthlyBranch,
        heavenlyEarthly: p.heavenlyStem + p.earthlyBranch,
        majorStars: p.majorStars.map(s => ({ name: s.name, mutagen: s.mutagen, brightness: s.brightness })),
        minorStars: p.minorStars.map(s => ({ name: s.name, mutagen: s.mutagen, brightness: s.brightness })),
        miscStars: p.adjectiveStars.map(s => ({ name: s.name, mutagen: s.mutagen, brightness: s.brightness })),
        transformations: p.majorStars.map(s => s.mutagen).filter(Boolean) as string[],
        isYearly: false,
      });
    }
    return palaces;
  }

  /**
   * Helper to extract yearly palace data (Enhanced robustness version)
   * @throws ZiweiError When data does not meet basic conditions
   */
  private static extractYearlyPalaces(astrolabe: FunctionalAstrolabe, horoscope: Horoscope): PalaceData[] {
    try {
      // Defensive check for critical data
      if (!horoscope?.yearly) {
        throw new ZiweiError('流年数据缺失', { horoscope });
      }

      const palaces: PalaceData[] = [];
      const yearlyMutagens = horoscope.yearly.mutagen; // Array of star names [Lu, Quan, Ke, Ji]

      // 1. Validate Yearly Stars Length
      // Use explicit type assertion for robustness logic as requested, although we just check length here.
      const yearlyStarsArray = horoscope.yearly.stars;
      
      // Runtime validation for array length
      if (!Array.isArray(yearlyStarsArray) || yearlyStarsArray.length !== 12) {
         throw new ZiweiError('流年星曜数据不完整', { length: yearlyStarsArray?.length });
      }

      // Prioritize API: astrolabe.horoscope(date).yearly.palaceNames
      const palaceNames = horoscope.yearly.palaceNames;
      if (!Array.isArray(palaceNames) || palaceNames.length !== 12) {
         throw new ZiweiError('流年宫位名称数据不完整', { length: palaceNames?.length });
      }

      for (let i = 0; i < 12; i++) {
        // Defensive access to astrolabe palace
        const p = astrolabe.palace(i);
        if (!p) continue;

        // 1. Yearly Palace Name
        const yearlyName = palaceNames[i];
        if (!yearlyName) {
            // Should be covered by length check but double check
             throw new ZiweiError(`第${i}宫流年宫位名缺失`);
        }

        // 2. Yearly Stars
        // Defensive access with optional chaining
        const sectorStars = yearlyStarsArray?.[i]; 
        
        // Map to our Star interface
        const mappedYearlyStars: Star[] = Array.isArray(sectorStars) 
            ? sectorStars.map((s: any) => ({
                name: s?.name || '未知',
                mutagen: s?.mutagen,
                brightness: s?.brightness
              }))
            : [];

        // 3. Yearly Transformations
        // Strict mutagen matching with optional chaining
        const updatedMajorStars = p.majorStars.map(s => {
            // Defensive check for star name
            if (!s?.name) return { name: '未知' };

            let mutagen = '';
            // find index in yearlyMutagens
            if (yearlyMutagens && Array.isArray(yearlyMutagens)) {
                // Strict validation: check mName existence and match
                const mIndex = yearlyMutagens.findIndex(mName => mName && s.name && mName === s.name);
                
                if (mIndex === 0) mutagen = '禄';
                else if (mIndex === 1) mutagen = '权';
                else if (mIndex === 2) mutagen = '科';
                else if (mIndex === 3) mutagen = '忌';
            }
            
            return {
                name: s.name,
                mutagen: mutagen || undefined,
                brightness: s.brightness
            };
        });

        // Also check minor stars for transformations
        const updatedMinorStars = p.minorStars.map(s => {
             if (!s?.name) return { name: '未知' };
             
             let mutagen = '';
             if (yearlyMutagens && Array.isArray(yearlyMutagens)) {
                const mIndex = yearlyMutagens.findIndex(mName => mName && s.name && mName === s.name);
                
                if (mIndex === 0) mutagen = '禄';
                else if (mIndex === 1) mutagen = '权';
                else if (mIndex === 2) mutagen = '科';
                else if (mIndex === 3) mutagen = '忌';
             }
             return { ...s, mutagen: mutagen || undefined };
        });

        // 4. Jiang Qian 12 Stars (and Sui Qian 12 Stars)
        const extraStars: Star[] = [];
        // Access safe properties with optional chaining
        const yearlyDecStar = (horoscope.yearly as any)?.yearlyDecStar;
        
        if (yearlyDecStar) {
            if (yearlyDecStar?.jiangqian12?.[i]) {
                extraStars.push({ name: yearlyDecStar.jiangqian12[i] });
            }
            if (yearlyDecStar?.suiqian12?.[i]) {
                extraStars.push({ name: yearlyDecStar.suiqian12[i] });
            }
        }

        const allMiscStars = [
             ...p.adjectiveStars.map(s => ({ name: s?.name, mutagen: s?.mutagen, brightness: s?.brightness })),
             ...mappedYearlyStars,
             ...extraStars
        ];

        palaces.push({
            palaceName: yearlyName,
            stem: p.heavenlyStem,
            branch: p.earthlyBranch,
            heavenlyEarthly: (p.heavenlyStem || '') + (p.earthlyBranch || ''),
            majorStars: updatedMajorStars,
            minorStars: updatedMinorStars,
            miscStars: allMiscStars,
            transformations: updatedMajorStars.map(s => s.mutagen).filter(Boolean) as string[],
            isYearly: true,
        });
      }

      return palaces;

    } catch (error) {
        // If already a ZiweiError, rethrow
        if (error instanceof ZiweiError) {
            throw error;
        }
        // Log detailed error and wrap in ZiweiError
        console.error('extractYearlyPalaces failed:', error);
        throw new ZiweiError('流年排盘计算失败', { originalError: error });
    }
  }
}

import { ZiWeiCalculator, ZiweiError } from './ziwei';
import { astro } from 'iztro';

// Mock iztro
jest.mock('iztro', () => ({
  astro: {
    bySolar: jest.fn(),
  },
}));

describe('ZiWeiCalculator', () => {
  describe('extractYearlyPalaces (via getZiWeiChart)', () => {
    
    const mockAstrolabe = {
      fiveElementsClass: '木三局',
      soul: '贪狼',
      body: '文昌',
      palace: jest.fn(),
      horoscope: jest.fn(),
    };

    const mockHoroscope = {
      yearly: {
        mutagen: ['紫微', '天机', '太阳', '武曲'], // Lu, Quan, Ke, Ji
        palaceNames: ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'],
        stars: Array(12).fill([]).map(() => [{ name: '流年星1', mutagen: '', brightness: '' }]),
        yearlyDecStar: {
           jiangqian12: Array(12).fill('将星'),
           suiqian12: Array(12).fill('岁建'),
        }
      }
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (astro.bySolar as jest.Mock).mockReturnValue(mockAstrolabe);
      mockAstrolabe.horoscope.mockReturnValue(mockHoroscope);
      
      // Mock palace(i)
      mockAstrolabe.palace.mockImplementation((i) => ({
        name: `OriginalPalace${i}`,
        heavenlyStem: '甲',
        earthlyBranch: '子',
        majorStars: [{ name: '紫微', mutagen: '', brightness: '庙' }], // Should get Lu
        minorStars: [{ name: '天机', mutagen: '', brightness: '平' }], // Should get Quan
        adjectiveStars: [],
      }));
    });

    it('should correctly extract yearly palaces under normal conditions', () => {
      const chart = ZiWeiCalculator.getZiWeiChart('2024-01-01', 0, 'male', 2024);
      
      expect(chart.yearly).toHaveLength(12);
      expect(chart.yearly[0].palaceName).toBe('命宫');
      expect(chart.yearly[0].majorStars[0].mutagen).toBe('禄'); // 紫微 -> Lu
      expect(chart.yearly[0].minorStars[0].mutagen).toBe('权'); // 天机 -> Quan
      expect(chart.yearly[0].miscStars).toEqual(expect.arrayContaining([
          expect.objectContaining({ name: '流年星1' }),
          expect.objectContaining({ name: '将星' }),
          expect.objectContaining({ name: '岁建' })
      ]));
    });

    it('should throw ZiweiError if yearly data is missing', () => {
      mockAstrolabe.horoscope.mockReturnValue({}); // No yearly
      
      expect(() => {
        ZiWeiCalculator.getZiWeiChart('2024-01-01', 0, 'male', 2024);
      }).toThrow(ZiweiError);
      
      expect(() => {
        ZiWeiCalculator.getZiWeiChart('2024-01-01', 0, 'male', 2024);
      }).toThrow('流年数据缺失');
    });

    it('should throw ZiweiError if yearly stars length is not 12', () => {
      const badHoroscope = {
        ...mockHoroscope,
        yearly: {
          ...mockHoroscope.yearly,
          stars: [] // Empty array
        }
      };
      mockAstrolabe.horoscope.mockReturnValue(badHoroscope);

      expect(() => {
        ZiWeiCalculator.getZiWeiChart('2024-01-01', 0, 'male', 2024);
      }).toThrow(ZiweiError);
      expect(() => {
        ZiWeiCalculator.getZiWeiChart('2024-01-01', 0, 'male', 2024);
      }).toThrow('流年星曜数据不完整');
    });
    
    it('should handle undefined star names gracefully (defensive coding)', () => {
       // Mock a case where star name is undefined
       mockAstrolabe.palace.mockImplementation((i) => ({
        name: `OriginalPalace${i}`,
        heavenlyStem: '甲',
        earthlyBranch: '子',
        majorStars: [{ name: undefined, mutagen: '', brightness: '' }], 
        minorStars: [],
        adjectiveStars: [],
      }));
      
      const chart = ZiWeiCalculator.getZiWeiChart('2024-01-01', 0, 'male', 2024);
      expect(chart.yearly[0].majorStars[0].name).toBe('未知');
    });
  });
});

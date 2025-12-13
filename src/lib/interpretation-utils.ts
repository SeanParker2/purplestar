import { STAR_INTERPRETATIONS, type StarInterpretation } from "@/data/interpretations";
import { type Star } from "@/lib/ziwei";

export interface PalaceInterpretations {
  main: StarInterpretation[];      // 主星或双星格局解释
  transformations: StarInterpretation[]; // 四化 (禄权科忌) 解释
  minors: StarInterpretation[];    // 辅星/杂曜/长生 解释
}

/**
 * 获取指定宫位的综合断语（包含双星、四化、辅星）
 * @param palaceName 宫位名称 (e.g. "命宫", "夫妻宫")
 * @param majorStars 主星列表
 * @param minorStars 辅星列表
 * @param adjectiveStars 杂曜/长生等列表
 */
export function getPalaceInterpretations(
  palaceName: string,
  majorStars: Star[],
  minorStars: Star[],
  adjectiveStars: Star[] = []
): PalaceInterpretations {
  const result: PalaceInterpretations = {
    main: [],
    transformations: [],
    minors: []
  };

  // ==================== Step A: 主星/双星 (Major/Dual Stars) ====================
  // 逻辑：如果有2颗主星，优先匹配双星组合断语 (如 "紫微,贪狼")。
  // 如果没有双星断语，则回退到分别展示2颗单星断语。

  let foundDual = false;
  if (majorStars.length === 2) {
    const s1 = majorStars[0].name;
    const s2 = majorStars[1].name;
    
    // 尝试两种组合顺序
    const combinations = [`${s1},${s2}`, `${s2},${s1}`];
    
    for (const combo of combinations) {
      const dualInterp = STAR_INTERPRETATIONS.find(
        item => item.star === combo && item.palace === palaceName
      );
      if (dualInterp) {
        result.main.push(dualInterp);
        foundDual = true;
        break; // 找到双星组合后停止，不再查找单星
      }
    }
  }

  // 如果没有匹配到双星组合（或者只有1颗/0颗主星），则分别查找单星断语
  if (!foundDual) {
    majorStars.forEach(star => {
      const interp = STAR_INTERPRETATIONS.find(
        item => item.star === star.name && item.palace === palaceName
      );
      if (interp) {
        result.main.push(interp);
      }
    });
  }

  // ==================== Step B: 四化变数 (Transformations) ====================
  // 逻辑：检查星曜是否带有四化标记 (mutagen)，若有则查找对应的 "化禄/权/科/忌" 解释
  
  const allStarsForTransform = [...majorStars, ...minorStars]; // 四化通常发生在主星和部分辅星(文昌/文曲等)
  
  allStarsForTransform.forEach(star => {
    if (star.mutagen) {
      // 构造查找 Key，例如: palace = "化禄"
      const searchPalace = "化" + star.mutagen; 
      
      const interp = STAR_INTERPRETATIONS.find(
        item => item.star === star.name && item.palace === searchPalace
      );
      
      if (interp) {
        result.transformations.push(interp);
      }
    }
  });

  // ==================== Step C: 辅星/杂曜 (Minor/Adjective Stars) ====================
  // 逻辑：查找辅星在当前宫位的解释
  
  const miscStars = [...minorStars, ...adjectiveStars];
  
  miscStars.forEach(star => {
    const interp = STAR_INTERPRETATIONS.find(
      item => item.star === star.name && item.palace === palaceName
    );
    if (interp) {
      result.minors.push(interp);
    }
  });

  return result;
}

import { STAR_INTERPRETATIONS, type StarInterpretation } from "@/data/interpretations";
import { type Star } from "@/lib/ziwei";

export interface PalaceInterpretations {
  main: StarInterpretation[];      
  patterns: StarInterpretation[]; // 新增：格局解释
  transformations: StarInterpretation[];
  minors: StarInterpretation[];    
}

/**
 * 智能解盘算法：根据星曜组合、四化、格局进行多维度匹配
 */
export function getPalaceInterpretations(
  palaceName: string,
  majorStars: Star[],
  minorStars: Star[],
  adjectiveStars: Star[] = [],
  stemBranch: string = "" // 需要传入干支，例如 "甲子"，用于判断地支方位
): PalaceInterpretations {
  const result: PalaceInterpretations = {
    main: [],
    patterns: [],
    transformations: [],
    minors: []
  };

  // 辅助：获取所有星星名称
  const allStarNames = [...majorStars, ...minorStars, ...adjectiveStars].map(s => s.name);
  const hasStar = (name: string) => allStarNames.includes(name);
  const dizhi = stemBranch.charAt(1); // "甲子" -> "子"

  // ==================== Step 0: 格局检测 (Pattern Detection) ====================
  // 仅在命宫或特定宫位触发，这里为了通用性，我们检测符合条件的组合
  
  // 1. 火贪格/铃贪格 (暴发)
  if (hasStar("贪狼") && (hasStar("火星") || hasStar("铃星"))) {
    const patternName = hasStar("火星") ? "火贪格" : "铃贪格";
    addPattern(patternName);
  }

  // 2. 月朗天门 (太阴在亥)
  if (hasStar("太阴") && dizhi === "亥") {
    addPattern("月朗天门");
  }

  // 3. 日出扶桑 (太阳在卯)
  if (hasStar("太阳") && dizhi === "卯") {
    addPattern("日出扶桑");
  }

  // 4. 石中隐玉 (巨门在子午)
  if (hasStar("巨门") && (dizhi === "子" || dizhi === "午")) {
    // 简易判断，严谨应判断禄权科
    addPattern("石中隐玉");
  }

  // 5. 马头带箭 (擎羊在午)
  if (hasStar("擎羊") && dizhi === "午") {
    addPattern("马头带箭");
  }

  // 6. 命里逢空 (地空地劫)
  if (palaceName === "命宫" && (hasStar("地空") || hasStar("地劫"))) {
    addPattern("命里逢空");
  }

  // 辅助函数：查找并添加格局断语
  function addPattern(name: string) {
    const interp = STAR_INTERPRETATIONS.find(item => item.star === name && item.palace === "格局");
    if (interp) result.patterns.push(interp);
  }

  // ==================== Step A: 主星/双星 (Major/Dual Stars) ====================
  let foundDual = false;
  if (majorStars.length === 2) {
    const s1 = majorStars[0].name;
    const s2 = majorStars[1].name;
    const combinations = [`${s1},${s2}`, `${s2},${s1}`];
    
    for (const combo of combinations) {
      const dualInterp = STAR_INTERPRETATIONS.find(
        item => item.star === combo && item.palace === palaceName
      );
      if (dualInterp) {
        result.main.push(dualInterp);
        foundDual = true;
        break;
      }
    }
  }

  if (!foundDual) {
    majorStars.forEach(star => {
      const interp = STAR_INTERPRETATIONS.find(
        item => item.star === star.name && item.palace === palaceName
      );
      if (interp) result.main.push(interp);
    });
  }

  // ==================== Step B: 四化变数 (Transformations) ====================
  const allStarsForTransform = [...majorStars, ...minorStars];
  allStarsForTransform.forEach(star => {
    if (star.mutagen) {
      const searchPalace = "化" + star.mutagen; 
      const interp = STAR_INTERPRETATIONS.find(
        item => item.star === star.name && item.palace === searchPalace
      );
      if (interp) result.transformations.push(interp);
    }
  });

  // ==================== Step C: 辅星/杂曜 (Minor/Adjective Stars) ====================
  const miscStars = [...minorStars, ...adjectiveStars];
  miscStars.forEach(star => {
    const interp = STAR_INTERPRETATIONS.find(
      item => item.star === star.name && item.palace === palaceName
    );
    if (interp) result.minors.push(interp);
  });

  return result;
}
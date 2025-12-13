export interface City {
  name: string;
  lng: number;
}

export const CHINA_CITIES: City[] = [
  // 直辖市
  { name: "北京", lng: 116.40 },
  { name: "上海", lng: 121.47 },
  { name: "天津", lng: 117.20 },
  { name: "重庆", lng: 106.55 },

  // 特别行政区
  { name: "香港", lng: 114.17 },
  { name: "澳门", lng: 113.54 },

  // 华北
  { name: "石家庄", lng: 114.48 },
  { name: "太原", lng: 112.53 },
  { name: "呼和浩特", lng: 111.65 },

  // 东北
  { name: "沈阳", lng: 123.38 },
  { name: "大连", lng: 121.61 }, // 计划单列市
  { name: "长春", lng: 125.35 },
  { name: "哈尔滨", lng: 126.63 },

  // 华东
  { name: "南京", lng: 118.78 },
  { name: "苏州", lng: 120.62 },
  { name: "杭州", lng: 120.19 },
  { name: "宁波", lng: 121.56 }, // 计划单列市
  { name: "合肥", lng: 117.27 },
  { name: "福州", lng: 119.30 },
  { name: "厦门", lng: 118.10 }, // 计划单列市
  { name: "南昌", lng: 115.89 },
  { name: "济南", lng: 117.00 },
  { name: "青岛", lng: 120.33 }, // 计划单列市

  // 华中
  { name: "郑州", lng: 113.65 },
  { name: "武汉", lng: 114.31 },
  { name: "长沙", lng: 113.00 },

  // 华南
  { name: "广州", lng: 113.26 },
  { name: "深圳", lng: 114.05 }, // 计划单列市
  { name: "南宁", lng: 108.33 },
  { name: "海口", lng: 110.35 },

  // 西南
  { name: "成都", lng: 104.06 },
  { name: "贵阳", lng: 106.71 },
  { name: "昆明", lng: 102.71 },
  { name: "拉萨", lng: 91.11 },

  // 西北
  { name: "西安", lng: 108.95 },
  { name: "兰州", lng: 103.73 },
  { name: "西宁", lng: 101.74 },
  { name: "银川", lng: 106.27 },
  { name: "乌鲁木齐", lng: 87.68 },
  
  // 台湾
  { name: "台北", lng: 121.50 }
];

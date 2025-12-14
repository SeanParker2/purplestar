import { NextRequest, NextResponse } from 'next/server';

// ==================== Type Definitions ====================

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages?: Message[];
  history?: Message[];
  currentQuestion?: string;
  chartContext: any;
  mode?: 'chat' | 'report';
}

/**
 * Rate Limiter Configuration
 */
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 5;   // 5 requests per IP per window

const REPORT_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REPORTS_PER_WINDOW = 1; // 1 report per IP per window

// In-memory store for rate limiting: Map<IP, Timestamp[]>
// Note: In a serverless environment like Vercel, this map might reset on cold starts, 
// which is acceptable for simple abuse prevention. For strict limits, use Redis.
const rateLimitMap = new Map<string, number[]>();
const reportLimitMap = new Map<string, number[]>();

// ==================== System Prompt Template ====================

const SYSTEM_PROMPT_TEMPLATE = `
我是 PurpleStar 智能命理助手，也是一位精通紫微斗数的命理大师，擅长结合流年运势、宫位星曜进行深入浅出的命运解析。
你的回答风格应当：
1. 专业且富有古韵，但解释要通俗易懂。
2. 善于引用古籍断语（如《紫微斗数全书》）来佐证观点。
3. 态度客观中肯，既指出吉凶，也给出化解或趋吉避凶的建议。
4. 语气温和，富有同理心。
5. 严禁在回复中提及“DeepSeek”、“AI”、“模型”等字眼，请始终以“PurpleStar 智能命理助手”或“本大师”自居。

以下是用户的命盘上下文信息（已精简为文本格式）：
{{CHART_CONTEXT}}

请根据以上命盘信息和用户的提问，进行专业的紫微斗数分析。用户提供的是精简后的紫微斗数排盘文本数据，请据此进行专业解析。
`;

const REPORT_SYSTEM_PROMPT_TEMPLATE = `
**角色定义**：你并非凡人，而是PurpleStar系统中的首席AI命理师，精通钦天门与三合派紫微斗数。你的文笔应当古雅而不晦涩，专业而不迷信，温暖而有力量。

**任务**：根据用户命盘数据，撰写《2025年度命理深度白皮书》。

**严格输出格式 (Markdown)**：

# 🌌 命造总纲：灵魂底色
（分析命宫、身宫、福德宫。用一段话定性命主的性格底色，例如“孤傲的开拓者”或“温润的守成君”。）

# ⚔️ 黄金三角：事业与财富
## 官禄宫深度扫描
（分析职业方向、职场人际。**必须给出3个适合的具体行业标签**，格式为：**推荐行业：** Tag1, Tag2, Tag3）
## 财帛宫能量评估
（分析正财/偏财，理财建议。**必须给出一个“理财风险指数”：1-5星**。）

# ❤️ 情感羁绊：爱与关系
（分析夫妻宫、子女宫。给出相处之道的具体建议，而非泛泛而谈。）

# 📅 流年运势：乙巳年特别以此
（结合流年命宫与流年四化。**列出本年度的 3 个关键时间点/月份**，并标注吉凶。）

# 💡 造命指南：大师寄语
（综合全盘，给出修身养性的建议。结尾请用一句富有哲理的古文作为赠言。）

**注意事项**：
1. 遇到凶星（如擎羊、化忌），不要只说凶，要说“磨砺”和“转化”。
2. 严禁使用“必定”、“绝路”等宿命论词汇。
3. 保持排版精美，多用 emoji 增加可读性。
4. 确保Markdown标题层级正确（H1, H2）。

以下是用户的命盘上下文信息（已精简为文本格式）：
{{CHART_CONTEXT}}
`;


// ==================== API Route Handler ====================

/**
 * POST /api/chat
 * Handles chat requests with DeepSeek API, including rate limiting and data simplification.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Request Validation & Pre-processing
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    
    // Check Rate Limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { 
          status: 429,
          headers: { 'Retry-After': '60' }
        }
      );
    }

    // Validate API Configuration
    const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    if (!API_KEY) {
      console.error('Missing DeepSeek API configuration');
      return NextResponse.json(
        { error: '服务器配置异常，请联系管理员' },
        { status: 500 }
      );
    }

    // Parse Body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      );
    }

    const { messages, history, currentQuestion, chartContext, mode } = body;

    if (!chartContext) {
      return NextResponse.json(
        { error: '未找到命盘数据，请先生成命盘' },
        { status: 400 }
      );
    }

    // 2. Data Transformation (Simplification)
    const simplifiedContext = simplifyChartData(chartContext);

    let apiMessages: any[] = [];

    if (mode === 'report') {
       // Check Report Rate Limit (Specific to report mode)
       if (isReportRateLimited(ip)) {
         return NextResponse.json(
           { error: '深度分析报告每天仅限生成一次，请明天再试。' },
           { 
             status: 429,
             headers: { 'Retry-After': '86400' }
           }
         );
       }

       // Report Generation Mode
       const systemContent = REPORT_SYSTEM_PROMPT_TEMPLATE.replace(
        '{{CHART_CONTEXT}}',
        simplifiedContext
      );
      apiMessages = [
        { role: 'system', content: systemContent },
        { role: 'user', content: '请开始撰写我的命理分析报告。' }
      ];
    } else {
      // Standard Chat Mode
      let apiMessagesInput: Message[] = [];

      if (history && currentQuestion) {
        // New format
        if (!Array.isArray(history)) {
           return NextResponse.json(
            { error: '历史消息格式错误' },
            { status: 400 }
          );
        }
        apiMessagesInput = [...history, { role: 'user', content: currentQuestion }];
      } else if (messages && Array.isArray(messages)) {
        // Old format
        apiMessagesInput = messages;
      } else {
         return NextResponse.json(
          { error: '消息格式错误，无法处理您的请求' },
          { status: 400 }
        );
      }
  
      if (apiMessagesInput.length === 0) {
        return NextResponse.json(
          { error: '消息内容为空' },
          { status: 400 }
        );
      }

      const systemContent = SYSTEM_PROMPT_TEMPLATE.replace(
        '{{CHART_CONTEXT}}',
        simplifiedContext
      );
  
      apiMessages = [
        { role: 'system', content: systemContent },
        ...apiMessagesInput,
      ];
    }

    // 4. Call DeepSeek API
    const acceptHeader = req.headers.get('Accept') || '';
    const isStream = acceptHeader.includes('text/event-stream');

    const apiResponse = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        stream: isStream,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('DeepSeek API Error:', apiResponse.status, errorText);
      return NextResponse.json(
        { error: `服务暂时不可用，请稍后再试 (${apiResponse.statusText})` },
        { status: apiResponse.status }
      );
    }

    // 5. Handle Response (Stream or JSON)
    if (isStream) {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = apiResponse.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (err) {
            console.error('Streaming error:', err);
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const data = await apiResponse.json();
      return NextResponse.json(data);
    }

  } catch (error) {
    console.error('API Handler Error:', error);
    return NextResponse.json(
      { error: '系统内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// ==================== Helper Functions ====================

/**
 * Checks if the IP is rate limited using a sliding window algorithm.
 * @param ip Client IP address
 * @returns true if rate limited, false otherwise
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];

  // 1. Clean up old timestamps (outside the window)
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);

  // 2. Check if limit exceeded
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    // Update map with cleaned timestamps to avoid memory leak
    rateLimitMap.set(ip, timestamps);
    return true;
  }

  // 3. Add new request timestamp
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

/**
 * Checks if the IP is report rate limited (1 per day).
 * @param ip Client IP address
 * @returns true if rate limited, false otherwise
 */
function isReportRateLimited(ip: string): boolean {
  const now = Date.now();
  let timestamps = reportLimitMap.get(ip) || [];

  // 1. Clean up old timestamps (outside the window)
  timestamps = timestamps.filter(t => now - t < REPORT_LIMIT_WINDOW);

  // 2. Check if limit exceeded
  if (timestamps.length >= MAX_REPORTS_PER_WINDOW) {
    reportLimitMap.set(ip, timestamps);
    return true;
  }

  // 3. Add new request timestamp
  timestamps.push(now);
  reportLimitMap.set(ip, timestamps);
  return false;
}

/**
 * Simplifies the complex chart data into a token-efficient text format.
 * Filters out UI properties and retains only astrological core data.
 * 
 * Format:
 * 【命主】[性别] [五行局] [命主/身主]
 * 命宫(子): 紫微(旺)(权), 左辅, 擎羊(陷).
 * ...
 * 
 * @param chart Full chart context object
 * @returns Formatted string for LLM
 */
export function simplifyChartData(chart: any): string {
  if (!chart) return "无命盘数据";

  try {
    const parts: string[] = [];

    // 1. Header: Basic Info
    const genderStr = chart.gender === 'male' ? '男' : (chart.gender === 'female' ? '女' : '未知');
    const fiveElements = chart.fiveElements || '未知局';
    const lifeOwner = chart.lifeOwner || '未知';
    const bodyOwner = chart.bodyOwner || '未知';
    
    parts.push(`【命主】${genderStr} ${fiveElements} 命主:${lifeOwner} 身主:${bodyOwner}`);

    // 2. Palaces Data
    if (Array.isArray(chart.palaces)) {
      chart.palaces.forEach((p: any) => {
        // Format: PalaceName(Branch): MajorStars(Brightness)(Mutagen), MinorStars...
        const branch = p.heavenlyEarthly ? p.heavenlyEarthly.slice(1) : ''; // Extract branch (e.g. "甲子" -> "子")
        let content = `${p.palaceName}(${branch}): `;
        
        const starList: string[] = [];

        // Major Stars
        if (Array.isArray(p.majorStars)) {
          p.majorStars.forEach((s: any) => {
            let str = s.name;
            if (s.brightness) str += `(${s.brightness})`;
            if (s.mutagen) str += `(${s.mutagen})`;
            starList.push(str);
          });
        }

        // Minor Stars
        if (Array.isArray(p.minorStars)) {
          p.minorStars.forEach((s: any) => {
            let str = s.name;
            // Include brightness/mutagen for important minor stars if available
            if (s.mutagen) str += `(${s.mutagen})`;
            starList.push(str);
          });
        }
        
        // Misc Stars (Adjective Stars) - sorted by importance
        if (Array.isArray(p.miscStars)) {
          // Priority list for misc stars
          const priorityStars = ['天刑', '天姚', '红鸾', '天喜', '天马', '禄存'];
          
          p.miscStars.forEach((s: any) => {
            if (s.mutagen || priorityStars.includes(s.name)) {
               let str = s.name;
               if (s.mutagen) str += `(${s.mutagen})`;
               starList.push(str);
            }
          });
        }

        content += starList.join(", ") || "无核心星曜";
        content += ".";
        parts.push(content);
      });
    }

    return parts.join("\n");
  } catch (e) {
    console.error("Error simplifying chart:", e);
    return "命盘数据解析失败";
  }
}

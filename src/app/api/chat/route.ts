import { NextRequest, NextResponse } from 'next/server';

// Types
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
  chartContext: any;
}

// System Prompt Template
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

// Simple in-memory rate limiter (Map<IP, timestamp[]>)
const rateLimitMap = new Map<string, number[]>();

// Helper to simplify chart for AI context to save tokens and improve focus
function simplifyChartData(chart: any): string {
  if (!chart) return "无命盘数据";

  try {
    const parts: string[] = [];

    // 1. Basic Info (Enhanced with Birth Details)
    const basicInfo = [];
    
    // Add Birth Details if available
    if (chart.solarDateStr) basicInfo.push(`阳历生日: ${chart.solarDateStr}`);
    if (chart.timeIndex !== undefined) basicInfo.push(`时辰序号: ${chart.timeIndex}`);
    if (chart.gender) basicInfo.push(`性别: ${chart.gender === 'male' ? '男' : '女'}`);
    
    // Add Chart Structure Info
    if (chart.fiveElements) basicInfo.push(`五行局: ${chart.fiveElements}`);
    if (chart.lifeOwner) basicInfo.push(`命主: ${chart.lifeOwner}`);
    if (chart.bodyOwner) basicInfo.push(`身主: ${chart.bodyOwner}`);
    
    if (basicInfo.length > 0) parts.push(`【基本信息】 ${basicInfo.join(', ')}`);

    // 2. Palaces
    parts.push(`【十二宫位】`);
    if (Array.isArray(chart.palaces)) {
      chart.palaces.forEach((p: any) => {
        // Format: [宫名]([地支]): [主星]([亮度][四化]), [吉煞星]...
        // Example: 命宫(午): 紫微(权,庙), 左辅, 擎羊(陷).
        
        let content = `${p.palaceName}(${p.heavenlyEarthly}): `;
        const stars: string[] = [];

        // Major Stars
        if (Array.isArray(p.majorStars)) {
          p.majorStars.forEach((s: any) => {
            let str = s.name;
            const attrs = [];
            if (s.mutagen) attrs.push(s.mutagen);
            if (s.brightness) attrs.push(s.brightness);
            if (attrs.length > 0) str += `(${attrs.join(',')})`;
            stars.push(str);
          });
        }

        // Minor Stars
        if (Array.isArray(p.minorStars)) {
          p.minorStars.forEach((s: any) => {
            let str = s.name;
            if (s.mutagen) str += `(${s.mutagen})`;
            stars.push(str);
          });
        }

        // Misc Stars (Only if mutagen is present or explicitly needed, simplified here)
        if (Array.isArray(p.miscStars)) {
           p.miscStars.forEach((s: any) => {
             if (s.mutagen) {
               stars.push(`${s.name}(${s.mutagen})`);
             } else if (['天刑', '天姚', '红鸾', '天喜'].includes(s.name)) {
               // Include important minor stars even without mutagen
               stars.push(s.name);
             }
           });
        }
        
        content += stars.join(", ") || "无核心星曜";
        content += "."; // Add period at the end
        
        parts.push(content);
      });
    }

    return parts.join("\n");
  } catch (e) {
    console.error("Error simplifying chart:", e);
    return "命盘数据解析失败";
  }
}

export const maxDuration = 60; // Set max duration to 60 seconds (Pro plan can go higher)

export async function POST(req: NextRequest) {
  try {
    // 0. Rate Limiting
    // Rule 1: 1 request per 60 seconds
    // Rule 2: 5 requests per 24 hours
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();
    const oneMinute = 60000;
    const oneDay = 24 * 60 * 60 * 1000;
    
    const maxRequestsPerMinute = 1;
    const maxRequestsPerDay = 5;

    let requestTimestamps = rateLimitMap.get(ip) || [];
    
    // Filter timestamps to keep only those within the last 24 hours
    requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp < oneDay);
    
    // Check 24-hour limit
    if (requestTimestamps.length >= maxRequestsPerDay) {
      return NextResponse.json(
        { error: '您今天的免费提问次数已用完，请明天再来。' },
        { status: 429 }
      );
    }
    
    // Check 1-minute limit
    // Get timestamps within the last minute
    const recentRequests = requestTimestamps.filter(timestamp => now - timestamp < oneMinute);
    if (recentRequests.length >= maxRequestsPerMinute) {
       return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      );
    }
    
    // Add current timestamp
    requestTimestamps.push(now);
    rateLimitMap.set(ip, requestTimestamps);

    // 1. Validate Environment Variables
    const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'; // DeepSeek-V3

    if (!API_KEY) {
      console.error('Missing DeepSeek API configuration');
      return NextResponse.json(
        { error: '服务器配置异常，请联系管理员' },
        { status: 500 }
      );
    }

    // 2. Parse and Validate Request Body
    const body = await req.json();
    const { messages, chartContext } = body as RequestBody;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '消息格式错误，无法处理您的请求' },
        { status: 400 }
      );
    }

    if (!chartContext) {
      return NextResponse.json(
        { error: '未找到命盘数据，请先生成命盘' },
        { status: 400 }
      );
    }

    // 3. Construct System Prompt
    // Optimize chart context using simplifyChartData
    const simplifiedContext = simplifyChartData(chartContext);
    
    const systemContent = SYSTEM_PROMPT_TEMPLATE.replace(
      '{{CHART_CONTEXT}}',
      simplifiedContext
    );

    const apiMessages = [
      { role: 'system', content: systemContent },
      ...messages,
    ];

    // 4. Determine Response Mode (Stream vs JSON)
    const acceptHeader = req.headers.get('Accept') || '';
    const isStream = acceptHeader.includes('text/event-stream');

    // 5. Call DeepSeek API
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

    // 6. Handle Response
    if (isStream) {
      // Pass through the stream from DeepSeek
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
      // Return JSON
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

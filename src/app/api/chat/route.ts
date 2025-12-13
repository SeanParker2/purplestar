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
你是一位精通紫微斗数的命理大师，擅长结合流年运势、宫位星曜进行深入浅出的命运解析。
你的回答风格应当：
1. 专业且富有古韵，但解释要通俗易懂。
2. 善于引用古籍断语（如《紫微斗数全书》）来佐证观点。
3. 态度客观中肯，既指出吉凶，也给出化解或趋吉避凶的建议。
4. 语气温和，富有同理心。

以下是用户的命盘上下文信息：
{{CHART_CONTEXT}}

请根据以上命盘信息和用户的提问，进行专业的紫微斗数分析。
`;

// Helper to simplify chart for AI context to save tokens and improve focus
function simplifyChartForAI(chart: any): string {
  if (!chart) return "无命盘数据";

  try {
    const parts: string[] = [];

    // 1. Basic Info
    parts.push(`【基本信息】`);
    parts.push(`局数: ${chart.fiveElements || '未知'}`);
    parts.push(`命主: ${chart.lifeOwner || '未知'}`);
    parts.push(`身主: ${chart.bodyOwner || '未知'}`);
    if (chart.gender) parts.push(`性别: ${chart.gender === 'male' ? '男' : '女'}`);
    if (chart.solarDateStr) parts.push(`阳历: ${chart.solarDateStr}`);

    // 2. Palaces
    parts.push(`\n【十二宫位分布】`);
    if (Array.isArray(chart.palaces)) {
      chart.palaces.forEach((p: any) => {
        // Palace Header: Name + Stem/Branch
        let palaceStr = `${p.palaceName}(${p.heavenlyEarthly}): `;

        // Major Stars with Brightness and Mutagen
        const majorStars = Array.isArray(p.majorStars) 
          ? p.majorStars.map((s: any) => {
              let sStr = s.name;
              if (s.mutagen) sStr += `(${s.mutagen})`;
              if (s.brightness) sStr += `[${s.brightness}]`;
              return sStr;
            }).join(", ")
          : "";
        
        if (majorStars) palaceStr += `${majorStars}`;
        else palaceStr += "无主星";

        // Minor Stars (Name only to save space)
        const minorStars = Array.isArray(p.minorStars)
          ? p.minorStars.map((s: any) => s.name).join(", ")
          : "";
        
        if (minorStars) palaceStr += `, ${minorStars}`;

        parts.push(palaceStr);
      });
    }

    // 3. Yearly Info (Brief)
    if (Array.isArray(chart.yearly) && chart.yearly.length > 0) {
      parts.push(`\n【流年信息】`);
      // Find the Yearly Life Palace (Liu Nian Ming Gong)
      const yearlyLifePalace = chart.yearly.find((p: any) => p.palaceName === '命宫');
      if (yearlyLifePalace) {
         parts.push(`流年命宫在: ${yearlyLifePalace.heavenlyEarthly}`);
      }
      // Can add more yearly highlights if needed, but keeping it minimal for now
    }

    return parts.join("\n");
  } catch (e) {
    console.error("Error simplifying chart:", e);
    return "命盘数据解析失败";
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Environment Variables
    const BASE_URL = process.env.DEEPSEEK_BASE_URL;
    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!BASE_URL || !API_KEY) {
      console.error('Missing DeepSeek API configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 2. Parse and Validate Request Body
    const body = await req.json();
    const { messages, chartContext } = body as RequestBody;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    if (!chartContext) {
      return NextResponse.json(
        { error: 'Missing chart context' },
        { status: 400 }
      );
    }

    // 3. Construct System Prompt
    // Optimize chart context using simplifyChartForAI
    const simplifiedContext = simplifyChartForAI(chartContext);
    
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
        model: 'deepseek-chat', // Assuming this is the model name, can be adjusted
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
        { error: `Upstream API error: ${apiResponse.statusText}` },
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
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

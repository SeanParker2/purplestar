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
    // Format chart context into a readable string
    const contextString = JSON.stringify(chartContext, null, 2);
    const systemContent = SYSTEM_PROMPT_TEMPLATE.replace(
      '{{CHART_CONTEXT}}',
      contextString
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

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AICopilot from '../ai/AICopilot';
import { ZiWeiChart, PalaceData } from '@/lib/ziwei';

// Mock data
const mockPalace: PalaceData = {
  palaceName: '命宫',
  heavenlyEarthly: '甲子',
  stem: '甲',
  branch: '子',
  majorStars: [{ name: '紫微', mutagen: '', brightness: '庙' }],
  minorStars: [{ name: '左辅', mutagen: '', brightness: '' }],
  miscStars: [],
  transformations: [],
  isYearly: false
};

const mockChart: ZiWeiChart = {
  solarDateStr: '2024-01-01',
  timeIndex: 0,
  gender: 'male',
  fiveElements: '水二局',
  lifeOwner: '武曲',
  bodyOwner: '贪狼',
  palaces: [mockPalace, ...Array(11).fill(mockPalace)],
  yearly: [],
};

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock TextDecoder/Encoder if needed (JSDOM might have them)
if (typeof TextDecoder === 'undefined') {
    const { TextDecoder, TextEncoder } = require('util');
    global.TextDecoder = TextDecoder;
    global.TextEncoder = TextEncoder;
}

describe('AICopilot Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockImplementation(() => 
        Promise.resolve({
            ok: true,
            body: {
                getReader: () => {
                    let step = 0;
                    return {
                        read: () => {
                            if (step === 0) {
                                step++;
                                return Promise.resolve({ 
                                    done: false, 
                                    value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"AI Response"}}]}\n\n') 
                                });
                            }
                            return Promise.resolve({ done: true, value: undefined });
                        }
                    };
                }
            }
        })
    );
  });

  it('renders the chat window when open', () => {
    render(
      <AICopilot 
        chart={mockChart} 
        palaceData={mockPalace} 
        isOpen={true} 
      />
    );
    const header = screen.getByText('紫微斗数 AI 助手');
    expect(header).toBeInTheDocument();
  });

  it('displays "Analyze This Palace" button when palace data is provided', () => {
    render(
      <AICopilot 
        chart={mockChart} 
        palaceData={mockPalace} 
        isOpen={true} 
      />
    );
    
    const analyzeBtn = screen.getByText(/分析此宫/);
    expect(analyzeBtn).toBeInTheDocument();
  });

  it('handles input and calls API', async () => {
    render(
      <AICopilot 
        chart={mockChart} 
        palaceData={mockPalace} 
        isOpen={true} 
      />
    );
    
    const input = screen.getByPlaceholderText('输入您的问题...');
    fireEvent.change(input, { target: { value: 'Test Question' } });
    
    // Find send button
    const buttons = screen.getAllByRole('button');
    const sendBtn = buttons[buttons.length - 1]; 
    
    await act(async () => {
        fireEvent.click(sendBtn);
    });
    
    // Check if fetch was called
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test Question')
    }));

    // Check if AI response appears
    await waitFor(() => {
        expect(screen.getByText('AI Response')).toBeInTheDocument();
    });
  });
  
  it('displays featured interpretation for matched star', async () => {
    render(
      <AICopilot 
        chart={mockChart} 
        palaceData={mockPalace} 
        isOpen={true} 
      />
    );
    
    // Waiting for the effect timeout (600ms)
    await waitFor(() => {
        expect(screen.getByText('精选断语')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Check for "紫微" interpretation content (partial match)
    // Assuming interpretation data is loaded
  });
});


import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AICopilot } from '../ai/AICopilot';
import { ZiWeiChart, PalaceData } from '@/lib/ziwei';

// Mock data
const mockPalace: PalaceData = {
  palaceName: '命宫',
  heavenlyEarthly: '甲子',
  majorStars: [{ name: '紫微', brightness: '庙' }],
  minorStars: [{ name: '左辅' }],
  miscStars: [],
  transformations: [],
};

const mockChart: ZiWeiChart = {
  fiveElements: '水二局',
  lifeOwner: '武曲',
  bodyOwner: '贪狼',
  palaces: [mockPalace, ...Array(11).fill(mockPalace)],
  yearly: [],
};

describe('AICopilot Component', () => {
  it('renders the initial floating bubble', () => {
    render(<AICopilot chart={mockChart} currentPalace={mockPalace} />);
    const bubble = screen.getByText('问策');
    expect(bubble).toBeInTheDocument();
  });

  it('opens chat window on click', () => {
    render(<AICopilot chart={mockChart} currentPalace={mockPalace} />);
    const bubble = screen.getByText('问策');
    fireEvent.click(bubble);
    
    const header = screen.getByText('AI 问策');
    expect(header).toBeInTheDocument();
  });

  it('displays "Analyze This Palace" button when palace data is provided', () => {
    render(<AICopilot chart={mockChart} currentPalace={mockPalace} />);
    const bubble = screen.getByText('问策');
    fireEvent.click(bubble);
    
    const analyzeBtn = screen.getByText('分析命宫');
    expect(analyzeBtn).toBeInTheDocument();
  });

  it('does not display "Analyze This Palace" button when typing', async () => {
    render(<AICopilot chart={mockChart} currentPalace={mockPalace} />);
    fireEvent.click(screen.getByText('问策'));
    
    const input = screen.getByPlaceholderText('输入问题...');
    fireEvent.change(input, { target: { value: 'Test Message' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' })); 
    
    // Check if analyze button disappears during typing/processing
    // Note: implementation hides it when isTyping is true
    await waitFor(() => {
        expect(screen.queryByText('分析命宫')).not.toBeInTheDocument();
    });
  });
});

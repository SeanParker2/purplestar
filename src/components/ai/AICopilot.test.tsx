import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AICopilot from './AICopilot';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    body: {
      getReader: () => ({
        read: () => Promise.resolve({ done: true, value: undefined })
      })
    }
  })
) as jest.Mock;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock window.confirm
window.confirm = jest.fn(() => true);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('AICopilot', () => {
  const mockProps = {
    chart: null,
    palaceData: {
      palaceName: '命宫',
      majorStars: [],
      minorStars: [],
      miscStars: [],
      heavenlyEarthly: '甲子',
      transformations: []
    } as any, 
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('loads history from localStorage on mount', () => {
    const history = [
      { id: '1', role: 'user', content: 'test msg', timestamp: 123 },
      { id: '2', role: 'assistant', content: 'response', timestamp: 124 }
    ];
    localStorageMock.setItem('chat_history', JSON.stringify(history));

    render(<AICopilot {...mockProps} />);

    expect(screen.getByText('test msg')).toBeInTheDocument();
    expect(screen.getByText('response')).toBeInTheDocument();
  });

  it('saves history to localStorage when messages change', async () => {
    render(<AICopilot {...mockProps} />);

    const input = screen.getByPlaceholderText('输入您的问题...');
    
    fireEvent.change(input, { target: { value: 'New Message' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Wait for debounce (300ms)
    await waitFor(() => {
      const stored = localStorageMock.getItem('chat_history');
      expect(stored).not.toBeNull();
      if (stored) {
         expect(stored).toContain('New Message');
      }
    }, { timeout: 1000 });
  });

  it('clears history when trash button is clicked', () => {
    const history = [{ id: '1', role: 'user', content: 'To be deleted', timestamp: 123 }];
    localStorageMock.setItem('chat_history', JSON.stringify(history));

    render(<AICopilot {...mockProps} />);

    expect(screen.getByText('To be deleted')).toBeInTheDocument();

    const trashBtn = screen.getByTitle('清空历史');
    fireEvent.click(trashBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(localStorageMock.getItem('chat_history')).toBeNull();
    // Should reset to init message
    expect(screen.queryByText('To be deleted')).not.toBeInTheDocument();
    expect(screen.getByText(/紫微斗数 AI 助手/)).toBeInTheDocument();
  });

  it('filters system messages before saving', async () => {
    // Simulate adding a system message (by switching palace prop effectively, but simpler to just inspect code logic via interaction)
    // Actually, we can trigger a system message by changing palaceData prop?
    // Let's try to update props.
    
    const { rerender } = render(<AICopilot {...mockProps} />);
    
    // Change palace to trigger system message
    const newPalaceData = { ...mockProps.palaceData, palaceName: '财帛宫' };
    rerender(<AICopilot {...mockProps} palaceData={newPalaceData} />);
    
    // Check if system message appears
    await waitFor(() => {
      expect(screen.getByText(/检测到您已切换至 财帛宫/)).toBeInTheDocument();
    });

    // Wait for save
    await waitFor(() => {
       const stored = localStorageMock.getItem('chat_history');
       // System message should NOT be in storage
       expect(stored).not.toContain('检测到您已切换至 财帛宫');
    }, { timeout: 1000 });
  });
});

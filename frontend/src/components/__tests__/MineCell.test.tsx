// src/components/__tests__/MineCell.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MineCell } from '../MineCell';
import { Mine } from '../../gameLogic/gameDomain';

describe('MineCell Component', () => {
  // Mock functions for props
  const mockLeftClick = jest.fn();
  const mockRightClick = jest.fn();
  
  // Helper function to create a mine for testing
  const createTestMine = (
    x = 0, 
    y = 0, 
    bombs = 0, 
    isOpened = false, 
    isFlagged = false
  ): Mine => {
    return new Mine({x, y}, bombs, isFlagged, isOpened);
  };
  
  beforeEach(() => {
    // Clear mock functions before each test
    mockLeftClick.mockClear();
    mockRightClick.mockClear();
  });
  
  it('renders an unopened cell correctly', () => {
    const testMine = createTestMine(0, 0, 0, false, false);
    
    render(
      <MineCell 
        index={0} 
        field={testMine} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mine-button');
    expect(button).not.toHaveClass('mine-opened');
    expect(button).toBeEmptyDOMElement();
  });
  
  it('renders a flagged cell correctly', () => {
    const testMine = createTestMine(0, 0, 0, false, true);
    
    render(
      <MineCell 
        index={0} 
        field={testMine} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mine-button');
    expect(button).not.toHaveClass('mine-opened');
    
    // Check for flag emoji
    expect(button).toHaveTextContent('🚩');
  });
  
  it('renders an opened empty cell correctly', () => {
    const testMine = createTestMine(0, 0, 0, true, false);
    
    render(
      <MineCell 
        index={0} 
        field={testMine} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mine-button');
    expect(button).toHaveClass('mine-opened');
    expect(button).toBeEmptyDOMElement();
  });
  
  it('renders an opened cell with bombs count correctly', () => {
    const testMine = createTestMine(0, 0, 3, true, false);
    
    render(
      <MineCell 
        index={0} 
        field={testMine} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mine-button');
    expect(button).toHaveClass('mine-opened');
    expect(button).toHaveTextContent('3');
    
    // Check for correct CSS class based on number
    const bombCount = screen.getByText('3');
    expect(bombCount).toHaveClass('bombs-3');
  });
  
  it('renders an opened mine correctly', () => {
    const testMine = createTestMine(0, 0, -1, true, false);
    
    render(
      <MineCell 
        index={0} 
        field={testMine} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mine-button');
    expect(button).toHaveClass('mine-opened');
    
    // Check for bomb emoji
    expect(button).toHaveTextContent('💣');
  });
  
  it('calls onLeftClick when clicked', () => {
    const testMine = createTestMine();
    
    render(
      <MineCell 
        index={0} 
        field={testMine} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockLeftClick).toHaveBeenCalledTimes(1);
    expect(mockLeftClick).toHaveBeenCalledWith(testMine);
  });
  
  it('calls onRightClick when right-clicked and prevents default', () => {
    const testMine = createTestMine();
    
    render(
      <MineCell 
        index={0} 
        field={testMine} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.contextMenu(button);
    
    expect(mockRightClick).toHaveBeenCalledTimes(1);
    expect(mockRightClick.mock.calls[0][0]).toBe(testMine);
    // Check that the second argument is a MouseEvent
    expect(mockRightClick.mock.calls[0][1]).toBeTruthy();
  });
});
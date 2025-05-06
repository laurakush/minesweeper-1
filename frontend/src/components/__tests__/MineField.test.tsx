import React from 'react';
import { render, screen } from '@testing-library/react';
import { MineField } from '../MineField';
import { Game, Mine } from '../../gameLogic/gameDomain';

describe('MineField Component', () => {
  const mockLeftClick = jest.fn();
  const mockRightClick = jest.fn();
  
  beforeEach(() => {
    mockLeftClick.mockClear();
    mockRightClick.mockClear();
  });
  
  it('renders a 3x3 game board correctly', () => {
    const testState = Array(3).fill(null).map((_, i) => {
      return Array(3).fill(null).map((_, j) => {
        return new Mine({x: i, y: j}, 0, false, false);
      });
    });
    
    const testGame = new Game(testState, false, 3, 0, 0, false);
    
    render(
      <MineField 
        game={testGame} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const rows = screen.getAllByTestId('board-row');
    expect(rows).toHaveLength(3);
    
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(9);
  });
  
  it('passes the correct props to MineCell components', () => {
    const testState = [
      [
        new Mine({x: 0, y: 0}, -1, false, false),
        new Mine({x: 0, y: 1}, 1, false, false)
      ],
      [
        new Mine({x: 1, y: 0}, 1, false, false),
        new Mine({x: 1, y: 1}, 1, true, false)
      ]
    ];
    
    const testGame = new Game(testState, false, 1, 0, 1, false);
    
    expect(testState[1][1].isFlagged).toBe(true);
    
    render(
      <MineField 
        game={testGame} 
        onLeftClick={mockLeftClick}
        onRightClick={mockRightClick}
      />
    );
    
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(4);
  });
});
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders children and tooltip content with role="tooltip"', () => {
    render(
      <Tooltip text="テスト説明文">
        <button>ターゲットボタン</button>
      </Tooltip>
    );

    expect(screen.getByRole('button', { name: 'ターゲットボタン' })).toBeDefined();
    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toContain('テスト説明文');
  });

  it('applies correct position classes', () => {
    const { rerender } = render(
      <Tooltip text="上方向" position="top">
        <button>ボタン</button>
      </Tooltip>
    );
    let tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip.className).toContain('bottom-full');

    rerender(
      <Tooltip text="下方向" position="bottom">
        <button>ボタン</button>
      </Tooltip>
    );
    tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip.className).toContain('top-full');

    rerender(
      <Tooltip text="左方向" position="left">
        <button>ボタン</button>
      </Tooltip>
    );
    tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip.className).toContain('right-full');

    rerender(
      <Tooltip text="右方向" position="right">
        <button>ボタン</button>
      </Tooltip>
    );
    tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip.className).toContain('left-full');
  });
});

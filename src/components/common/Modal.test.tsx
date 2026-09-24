import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { Modal } from './Modal';

describe('Modal accessibility and interaction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with accessible name via title and aria-labelledby', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="テストモーダル">
        <div>モーダル本文</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();
    const titleElement = document.getElementById(labelledById!);
    expect(titleElement?.textContent).toBe('テストモーダル');
  });

  it('renders with accessible name via ariaLabel when title is not provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} ariaLabel="カスタムダイアログ" showCloseButton={false}>
        <div>モーダル本文</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-label')).toBe('カスタムダイアログ');
  });

  it('moves initial focus into the modal and traps focus on Tab / Shift+Tab', () => {
    const TestComponent = () => {
      return (
        <div>
          <button data-testid="outside-btn">外側ボタン</button>
          <Modal isOpen={true} onClose={() => {}} title="トラップテスト">
            <button data-testid="modal-btn-1">ボタン1</button>
            <button data-testid="modal-btn-2">ボタン2</button>
          </Modal>
        </div>
      );
    };

    render(<TestComponent />);

    // 初期フォーカス（50msタイマー経過後）
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const closeBtn = screen.getByRole('button', { name: '閉じる' });
    const btn2 = screen.getByTestId('modal-btn-2');

    // 最初のフォーカス可能要素（閉じるボタン）にフォーカスが当たっている
    expect(document.activeElement).toBe(closeBtn);

    // 最後の要素 (btn2) で Tab を押すと最初の要素 (closeBtn) に循環する
    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // 最初の要素 (closeBtn) で Shift+Tab を押すと最後の要素 (btn2) に循環する
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btn2);
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escapeテスト">
        <div>本文</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to previous active element when closed', () => {
    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button data-testid="trigger-btn" onClick={() => setIsOpen(true)}>
            モーダルを開く
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="復帰テスト">
            <button data-testid="inner-btn">内側ボタン</button>
          </Modal>
        </div>
      );
    };

    render(<TestComponent />);

    const triggerBtn = screen.getByTestId('trigger-btn');
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    // 開く
    fireEvent.click(triggerBtn);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const closeBtn = screen.getByRole('button', { name: '閉じる' });
    expect(document.activeElement).toBe(closeBtn);

    // Escapeで閉じる
    fireEvent.keyDown(window, { key: 'Escape' });

    // 閉じた後は元のトリガーボタンにフォーカスが戻る
    expect(document.activeElement).toBe(triggerBtn);
  });
});

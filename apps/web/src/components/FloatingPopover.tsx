'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

type FloatingAlign = 'start' | 'end';

interface FloatingPopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: FloatingAlign;
  className?: string;
  id?: string;
  role?: string;
}

function computePosition(anchor: HTMLElement, align: FloatingAlign) {
  const rect = anchor.getBoundingClientRect();
  const width = 288;
  const margin = 12;
  let top = rect.bottom + 8;
  let left = align === 'end' ? rect.right - width : rect.left;

  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

  const estimatedHeight = 220;
  if (top + estimatedHeight > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - estimatedHeight - 8);
  }

  return { top, left, width };
}

export function FloatingPopover({
  anchorRef,
  open,
  onClose,
  children,
  align = 'start',
  className = '',
  id,
  role = 'dialog',
}: FloatingPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 288 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    setPosition(computePosition(anchorRef.current, align));
  }, [align, anchorRef, open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [anchorRef, onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close popover"
        className="fixed inset-0 z-popover cursor-default bg-transparent"
        onClick={onClose}
      />
      <div
        id={id}
        ref={panelRef}
        role={role}
        className={`fixed z-popover rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl ${className}`}
        style={{ top: position.top, left: position.left, width: position.width }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders with default props', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingOverlay message="Custom loading message" />);
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('applies fullscreen classes when fullscreen prop is true', () => {
    const { container } = render(<LoadingOverlay fullscreen />);
    expect(container.firstChild).toHaveClass('fixed', 'inset-0', 'bg-black/50', 'z-50');
  });

  it('applies regular classes when fullscreen prop is false', () => {
    const { container } = render(<LoadingOverlay />);
    expect(container.firstChild).toHaveClass('absolute', 'inset-0', 'bg-white/80');
  });
});

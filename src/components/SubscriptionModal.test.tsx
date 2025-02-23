import React from 'react';
import { render, screen } from '@testing-library/react';
import { SubscriptionModal } from './SubscriptionModal';
import { vi } from 'vitest';

describe('SubscriptionModal', () => {
  it('should not render in test environment', () => {
    const onClose = vi.fn();
    const onSubscribe = vi.fn();
    
    const { container } = render(
      <SubscriptionModal 
        isOpen={true} 
        onClose={onClose} 
        onSubscribe={onSubscribe} 
      />
    );

    expect(container.firstChild).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSubscribe).not.toHaveBeenCalled();
  });
});

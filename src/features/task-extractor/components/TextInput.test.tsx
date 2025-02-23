import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<TextInput {...defaultProps} />);
    expect(screen.getByPlaceholderText('Describe your tasks here...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extract Tasks' })).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const onChange = vi.fn();
    render(<TextInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Describe your tasks here...');
    await act(async () => {
      await userEvent.type(input, 't');
    });
    expect(onChange).toHaveBeenCalledWith('t');
  });

  it('shows validation error for short text', async () => {
    render(<TextInput {...defaultProps} value="short" />);

    // Trigger validation by changing the value
    const textarea = screen.getByPlaceholderText('Describe your tasks here...');
    await act(async () => {
      await userEvent.type(textarea, ' ');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'short');
    });

    // Now check for error message
    const errorMessage = screen.getByText('Text is too short (minimum 10 characters)');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-500');
  });

  it('shows loading state', () => {
    render(<TextInput {...defaultProps} isLoading={true} />);
    const submitButton = screen.getByRole('button', { name: 'Extract Tasks' });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit when input is empty', () => {
    render(<TextInput {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: 'Extract Tasks' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit with valid input', async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <TextInput {...defaultProps} value="This is a valid input text" onSubmit={onSubmit} />
    );

    await act(async () => {
      rerender(
        <TextInput {...defaultProps} value="This is a valid input text" onSubmit={onSubmit} />
      );
    });

    const submitButton = screen.getByRole('button', { name: 'Extract Tasks' });
    expect(submitButton).not.toBeDisabled();

    await userEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('clears draft when clear button is clicked', async () => {
    const onChange = vi.fn();
    render(<TextInput {...defaultProps} value="test" onChange={onChange} />);

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    await userEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
    expect(localStorage.getItem('draft-text')).toBeNull();
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from './TextInput';

describe('TextInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  };

  it('renders correctly', () => {
    render(<TextInput {...defaultProps} />);
    expect(screen.getByPlaceholderText('Describe your tasks here...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Extract Tasks');
  });

  it('calls onChange when typing', async () => {
    const onChange = vi.fn();
    render(<TextInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Describe your tasks here...');
    await userEvent.type(input, 't');
    expect(onChange).toHaveBeenCalledWith('t');
  });

  it('shows validation error for short text', async () => {
    const { rerender } = render(<TextInput {...defaultProps} value="short" />);
    rerender(<TextInput {...defaultProps} value="short" />);

    const errorMessage = await screen.findByText('Text is too short (minimum 10 characters)');
    expect(errorMessage).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TextInput {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables submit when input is empty', () => {
    render(<TextInput {...defaultProps} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables submit with valid input', async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <TextInput {...defaultProps} value="This is a valid input text" onSubmit={onSubmit} />
    );

    rerender(
      <TextInput {...defaultProps} value="This is a valid input text" onSubmit={onSubmit} />
    );

    const submitButton = screen.getByRole('button');
    expect(submitButton).not.toBeDisabled();

    await userEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalled();
  });
});

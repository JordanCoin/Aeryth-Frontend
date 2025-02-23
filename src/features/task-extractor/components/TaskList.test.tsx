import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskList from './TaskList';
import { ExtractedTask } from '../../../types/task.types';

describe('TaskList', () => {
  const mockTasks: ExtractedTask[] = [
    {
      title: 'Implement user authentication',
      type: 'BACKEND',
      priority: 'HIGH',
      dependencies: ['Setup database'],
      estimatedTime: '4 hours',
    },
    {
      title: 'Design login page',
      type: 'UI',
      priority: 'MEDIUM',
      dependencies: [],
      estimatedTime: '2 hours',
    },
  ];

  it('renders nothing when tasks array is empty', () => {
    const { container } = render(<TaskList tasks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all tasks with their details', () => {
    render(<TaskList tasks={mockTasks} />);

    // Check titles
    expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
    expect(screen.getByText('Design login page')).toBeInTheDocument();

    // Check priorities
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();

    // Check types
    expect(screen.getByText('BACKEND')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();

    // Check estimated times
    expect(screen.getByText('4 hours')).toBeInTheDocument();
    expect(screen.getByText('2 hours')).toBeInTheDocument();

    // Check dependencies
    expect(screen.getByText('Setup database')).toBeInTheDocument();
  });

  it('applies correct color classes based on priority', () => {
    render(<TaskList tasks={mockTasks} />);

    const highPriorityBadge = screen.getByText('HIGH').closest('span');
    const mediumPriorityBadge = screen.getByText('MEDIUM').closest('span');

    expect(highPriorityBadge).toHaveClass('bg-red-100', 'text-red-800');
    expect(mediumPriorityBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('applies correct color classes based on type', () => {
    render(<TaskList tasks={mockTasks} />);

    const backendBadge = screen.getByText('BACKEND').closest('span');
    const uiBadge = screen.getByText('UI').closest('span');

    expect(backendBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    expect(uiBadge).toHaveClass('bg-purple-100', 'text-purple-800');
  });
});

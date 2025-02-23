import type { Meta, StoryObj } from '@storybook/react';
import TextInput from './TextInput';

const meta: Meta<typeof TextInput> = {
  title: 'Features/TaskExtractor/TextInput',
  component: TextInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  args: {
    value: '',
    onChange: value => console.log('Input changed:', value),
    onSubmit: () => console.log('Submitted'),
    isLoading: false,
  },
};

export const WithContent: Story = {
  args: {
    value: 'Sample task description',
    onChange: value => console.log('Input changed:', value),
    onSubmit: () => console.log('Submitted'),
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    value: 'Processing...',
    onChange: value => console.log('Input changed:', value),
    onSubmit: () => console.log('Submitted'),
    isLoading: true,
  },
};

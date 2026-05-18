import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
    placeholder: {
      control: { type: 'text' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    readOnly: {
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
  },
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
}

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter amount',
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'Sample input value',
    placeholder: 'Enter text...',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const ReadOnly: Story = {
  args: {
    defaultValue: 'Read-only value',
    readOnly: true,
  },
}

// DeFi-specific examples
export const TokenAmount: Story = {
  args: {
    type: 'number',
    placeholder: '0.00',
    defaultValue: '1.5',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input optimized for token amounts with decimal values.',
      },
    },
  },
}

export const WalletAddress: Story = {
  args: {
    type: 'text',
    placeholder: '0x742d35Cc...',
    defaultValue: '0x742d35Cc6B4C6fE1C6C0fC5E1F4b6B2c5a3d4E5F',
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Input for displaying wallet addresses, typically read-only.',
      },
    },
  },
}

export const PriceInput: Story = {
  args: {
    type: 'number',
    placeholder: '$0.00',
    defaultValue: '125.50',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input for price values in trading interfaces.',
      },
    },
  },
}

// Validation states (using className to simulate states)
export const Error: Story = {
  args: {
    placeholder: 'Invalid input',
    defaultValue: 'invalid@email',
    className: 'border-red-500 focus-visible:ring-red-500',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input with error state styling.',
      },
    },
  },
}

export const Success: Story = {
  args: {
    placeholder: 'Valid input',
    defaultValue: 'user@example.com',
    className: 'border-green-500 focus-visible:ring-green-500',
  },
  parameters: {
    docs: {
      description: {
        story: 'Input with success state styling.',
      },
    },
  },
}
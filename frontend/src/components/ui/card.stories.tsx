import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          This is the main content area of the card. You can put any content
          here, such as text, forms, or other components.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  ),
}

export const Simple: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardContent className="p-6">
        <p className="text-sm">
          A simple card with just content and no header or footer.
        </p>
      </CardContent>
    </Card>
  ),
}

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Notification</CardTitle>
        <CardDescription>You have a new message.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          This card has a header and content, but no footer actions.
        </p>
      </CardContent>
    </Card>
  ),
}

// DeFi-specific card examples
export const TokenBalance: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">ETH Balance</CardTitle>
        <CardDescription>Ethereum</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-2xl font-bold">2.485 ETH</div>
        <div className="text-sm text-muted-foreground">$4,970.25</div>
      </CardContent>
      <CardFooter className="pt-3">
        <Button variant="outline" className="flex-1">Send</Button>
        <Button className="flex-1">Buy</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card displaying cryptocurrency balance with action buttons.',
      },
    },
  },
}

export const SwapCard: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Swap Tokens</CardTitle>
        <CardDescription>Exchange one token for another</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            <input
              placeholder="0.0"
              className="flex-1 bg-transparent outline-none text-lg"
            />
            <Button variant="ghost" size="sm">ETH</Button>
          </div>
        </div>
        <div className="flex justify-center">
          <Button variant="ghost" size="icon" className="rounded-full">
            ⇅
          </Button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          <div className="flex items-center gap-2 p-3 rounded-lg border">
            <input
              placeholder="0.0"
              className="flex-1 bg-transparent outline-none text-lg"
            />
            <Button variant="ghost" size="sm">USDC</Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Connect Wallet</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Swap interface card for DeFi token exchanges.',
      },
    },
  },
}

export const StatsCard: Story = {
  render: () => (
    <Card className="w-[250px]">
      <CardHeader className="pb-2">
        <CardDescription>Total Volume</CardDescription>
        <CardTitle className="text-2xl">$1.2M</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-green-500 flex items-center gap-1">
          <span>↗</span>
          <span>+12.5% from last month</span>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Statistics card with metric value and growth indicator.',
      },
    },
  },
}

export const NFTCard: Story = {
  render: () => (
    <Card className="w-[280px]">
      <CardContent className="p-0">
        <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 rounded-t-xl"></div>
      </CardContent>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Cool NFT #1234</CardTitle>
        <CardDescription>Digital Collectible</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="font-semibold">0.5 ETH</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Buy Now</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'NFT marketplace card with image, details, and purchase action.',
      },
    },
  },
}

export const TransactionCard: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="text-green-500 text-lg">↗</span>
            </div>
            <div>
              <div className="font-medium">Sent ETH</div>
              <div className="text-sm text-muted-foreground">
                To: 0x742d...4E5F
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">-0.5 ETH</div>
            <div className="text-sm text-muted-foreground">$1,250.00</div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Transaction history card showing transfer details.',
      },
    },
  },
}

export const PortfolioCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Your total holdings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">$12,485.32</div>
          <div className="text-sm text-green-500">+$1,234.56 (11.2%)</div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm">ETH</span>
            </div>
            <span className="text-sm">45.2%</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">BTC</span>
            </div>
            <span className="text-sm">32.1%</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">USDC</span>
            </div>
            <span className="text-sm">22.7%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Portfolio summary card with total value and asset breakdown.',
      },
    },
  },
}
'use client'

import { useState, useCallback } from 'react'

interface FAQItem {
  question: string
  answer: string
}

function generateFAQs(ticker: string, companyName: string): FAQItem[] {
  return [
    {
      question: `What is ${ticker} on GoodDollar?`,
      answer: `${ticker} on GoodDollar is a synthetic token (s${ticker}) that tracks the real-world price of ${companyName} stock. It's backed by collateral in the GoodDollar protocol and uses on-chain price feeds to mirror the actual stock price in real time.`,
    },
    {
      question: `How does the synthetic ${ticker} token work?`,
      answer: `When you buy s${ticker}, the protocol mints a synthetic token pegged to ${companyName}'s stock price via oracle feeds. You can trade it 24/7 in fractional amounts with no minimum investment. When you sell, the token is burned and you receive G$ (GoodDollar) at the current market price.`,
    },
    {
      question: `What are the trading hours for ${ticker}?`,
      answer: `Unlike traditional stock markets, s${ticker} is available for trading 24 hours a day, 7 days a week. However, price feeds may have wider spreads or reduced activity outside US market hours (9:30 AM - 4:00 PM ET, Monday-Friday).`,
    },
    {
      question: `What fees are charged when trading ${ticker}?`,
      answer: `Trading s${ticker} incurs a small protocol fee. 33% of all trading fees automatically fund Universal Basic Income (UBI) through the GoodDollar protocol, so every trade you make contributes to reducing global wealth inequality.`,
    },
    {
      question: `What are the risks of trading synthetic ${ticker}?`,
      answer: `Key risks include: price oracle delays during high volatility, smart contract risk inherent to DeFi protocols, collateral ratio changes during extreme market moves, and the possibility that trading may be temporarily paused if oracle feeds become unreliable.`,
    },
    {
      question: `How is the ${ticker} price determined on-chain?`,
      answer: `The price of s${ticker} is determined by a decentralized oracle system that aggregates real-time market data from multiple sources. The oracle updates regularly to reflect ${companyName}'s actual stock price with minimal latency.`,
    },
    {
      question: `Can I hold fractional shares of ${ticker}?`,
      answer: `Yes. Since s${ticker} is a token, you can hold any fractional amount (there is no minimum share size). You can invest as little as $1 worth of ${companyName} exposure through the synthetic token.`,
    },
    {
      question: `How does trading ${ticker} support Universal Basic Income?`,
      answer: `GoodDollar allocates 33% of all protocol fees to fund UBI distributions. When you trade s${ticker}, a portion of your trading fee is automatically routed to the UBI pool, which distributes G$ tokens daily to verified users worldwide.`,
    },
  ]
}

function FAQAccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-700/20 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:text-white"
        aria-expanded={isOpen}
      >
        <span className="text-sm text-gray-200 font-medium pr-2">{item.question}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-3.5 pr-8">
          <p className="text-sm text-gray-400 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

interface StockFAQProps {
  ticker: string
  companyName: string
}

export function StockFAQ({ ticker, companyName }: StockFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqs = generateFAQs(ticker, companyName)

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }, [])

  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4">
      <h2 className="text-sm font-semibold text-white mb-1">Frequently Asked Questions</h2>
      <p className="text-xs text-gray-500 mb-3">About trading {ticker} on GoodDollar</p>
      <div>
        {faqs.map((faq, index) => (
          <FAQAccordionItem
            key={faq.question}
            item={faq}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </div>
  )
}

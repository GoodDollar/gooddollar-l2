// next-intl configuration for request-based internationalization

import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './config'

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale parameter is valid
  if (!locales.includes(locale as Locale)) notFound()

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'UTC', // Use UTC for crypto/trading timestamps
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
      },
      number: {
        precise: {
          maximumFractionDigits: 8, // For crypto precision
        },
        currency: {
          style: 'currency',
          currency: 'USD',
        },
        percentage: {
          style: 'percent',
          maximumFractionDigits: 2,
        },
      },
    },
  }
})
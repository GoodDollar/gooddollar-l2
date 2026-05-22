'use client'

interface CompanyProfile {
  description: string[]
  ceo: string
  employees: string
  founded: string
  headquarters: string
  sector: string
  website: string
}

const COMPANY_PROFILES: Record<string, CompanyProfile> = {
  AAPL: {
    description: [
      'Apple Inc. designs, manufactures, and sells smartphones, personal computers, tablets, wearables, and accessories worldwide. The company also offers a range of related services including advertising, cloud, digital content, and payment services.',
      'Apple is a dominant force in consumer electronics with the iPhone accounting for a significant share of global smartphone revenue. The company has expanded its services segment to include Apple TV+, Apple Music, iCloud, and Apple Pay, creating a recurring revenue stream alongside hardware sales.',
      'With a focus on privacy, vertical integration, and premium user experience, Apple maintains industry-leading customer loyalty and commands significant pricing power across its product lines.',
    ],
    ceo: 'Tim Cook',
    employees: '164,000',
    founded: '1976',
    headquarters: 'Cupertino, California',
    sector: 'Technology',
    website: 'apple.com',
  },
  MSFT: {
    description: [
      'Microsoft Corporation develops and licenses software, services, devices, and solutions worldwide. Its flagship products include Windows operating systems, Office productivity suite, and Azure cloud computing platform.',
      'The company has transformed into a cloud-first enterprise under CEO Satya Nadella, with Azure becoming the second-largest cloud infrastructure provider globally. Microsoft 365 and LinkedIn drive recurring subscription revenue across enterprise and consumer markets.',
      'Microsoft is also a leading player in AI through its partnership with OpenAI and integration of Copilot across its product suite, positioning it at the forefront of enterprise AI adoption.',
    ],
    ceo: 'Satya Nadella',
    employees: '228,000',
    founded: '1975',
    headquarters: 'Redmond, Washington',
    sector: 'Technology',
    website: 'microsoft.com',
  },
  NVDA: {
    description: [
      'NVIDIA Corporation designs and sells graphics processing units (GPUs) and system-on-chip units. The company leads the market in AI training and inference hardware with its data center GPU products.',
      'NVIDIA has become the primary hardware supplier for AI workloads globally, with its H100 and successor chips powering the majority of large language model training. The data center segment now represents the majority of revenue.',
      'Beyond AI, NVIDIA serves gaming, professional visualization, and autonomous vehicle markets, with a growing software platform (CUDA, Omniverse) creating ecosystem lock-in.',
    ],
    ceo: 'Jensen Huang',
    employees: '32,000',
    founded: '1993',
    headquarters: 'Santa Clara, California',
    sector: 'Technology',
    website: 'nvidia.com',
  },
  AMZN: {
    description: [
      'Amazon.com, Inc. is a multinational technology company focusing on e-commerce, cloud computing, online advertising, digital streaming, and artificial intelligence.',
      'Amazon Web Services (AWS) is the world\'s largest cloud platform, providing compute, storage, database, and AI services to millions of customers. AWS generates the majority of Amazon\'s operating profit despite representing a smaller share of total revenue.',
      'The company continues to expand into healthcare, satellite internet (Project Kuiper), and autonomous delivery, while maintaining dominance in e-commerce logistics and Prime membership.',
    ],
    ceo: 'Andy Jassy',
    employees: '1,525,000',
    founded: '1994',
    headquarters: 'Seattle, Washington',
    sector: 'Consumer Cyclical',
    website: 'amazon.com',
  },
  GOOGL: {
    description: [
      'Alphabet Inc. is a multinational conglomerate and the parent company of Google. The company generates the majority of its revenue from Google\'s advertising business across Search, YouTube, and its advertising network.',
      'Google Cloud Platform is the third-largest cloud infrastructure provider and growing rapidly. The company also operates Waymo (autonomous driving), DeepMind (AI research), and Verily (life sciences).',
      'Alphabet maintains dominant market share in internet search, mobile operating systems (Android), web browsers (Chrome), and online video (YouTube), providing multiple moats around its advertising business.',
    ],
    ceo: 'Sundar Pichai',
    employees: '182,000',
    founded: '1998',
    headquarters: 'Mountain View, California',
    sector: 'Technology',
    website: 'abc.xyz',
  },
  META: {
    description: [
      'Meta Platforms, Inc. builds technologies that help people connect, find communities, and grow businesses. The company operates Facebook, Instagram, Messenger, WhatsApp, and the Meta Quest virtual reality platform.',
      'Meta generates nearly all of its revenue from targeted digital advertising across its family of apps, which collectively serve over 3 billion daily active users. The company is investing heavily in AI and the metaverse through its Reality Labs division.',
      'Under CEO Mark Zuckerberg, Meta has pivoted toward AI-driven content discovery (Reels) and business messaging as growth vectors, while continuing long-term investment in AR/VR hardware.',
    ],
    ceo: 'Mark Zuckerberg',
    employees: '72,000',
    founded: '2004',
    headquarters: 'Menlo Park, California',
    sector: 'Technology',
    website: 'meta.com',
  },
  TSLA: {
    description: [
      'Tesla, Inc. designs, develops, manufactures, and sells fully electric vehicles, energy generation and storage systems, and related services. The company operates the world\'s largest network of fast-charging stations.',
      'Tesla leads the global EV market by brand recognition and technology, with proprietary battery systems, full self-driving software, and vertically integrated manufacturing. The company also sells solar panels, Powerwall batteries, and Megapack utility-scale storage.',
      'Beyond automotive, Tesla is developing humanoid robots (Optimus) and licensing its FSD technology, positioning itself as an AI and robotics company in addition to a vehicle manufacturer.',
    ],
    ceo: 'Elon Musk',
    employees: '140,000',
    founded: '2003',
    headquarters: 'Austin, Texas',
    sector: 'Automotive',
    website: 'tesla.com',
  },
  AMD: {
    description: [
      'Advanced Micro Devices, Inc. designs and sells microprocessors, GPUs, FPGAs, and adaptive computing solutions for data centers, gaming, embedded systems, and personal computers.',
      'AMD has gained significant market share against Intel in both consumer and server CPUs with its Ryzen and EPYC product lines. The company is also competing with NVIDIA in the AI accelerator market with its Instinct MI series.',
      'The acquisition of Xilinx strengthened AMD\'s position in adaptive computing for telecommunications, defense, and industrial applications.',
    ],
    ceo: 'Lisa Su',
    employees: '26,000',
    founded: '1969',
    headquarters: 'Santa Clara, California',
    sector: 'Technology',
    website: 'amd.com',
  },
  NFLX: {
    description: [
      'Netflix, Inc. is a global streaming entertainment service offering films, TV series, documentaries, and games across a wide range of genres and languages. The company produces its own original content and licenses titles from studios worldwide.',
      'Netflix pioneered the subscription video-on-demand model and has expanded to over 280 million paid memberships across 190+ countries. The company has introduced an ad-supported tier and live events to diversify revenue.',
      'The company invests heavily in original content production, spending over $17 billion annually on programming across all genres and regions.',
    ],
    ceo: 'Ted Sarandos & Greg Peters',
    employees: '14,000',
    founded: '1997',
    headquarters: 'Los Gatos, California',
    sector: 'Entertainment',
    website: 'netflix.com',
  },
  COIN: {
    description: [
      'Coinbase Global, Inc. is the largest cryptocurrency exchange in the United States, offering a platform for buying, selling, transferring, and storing digital assets. The company serves both retail and institutional customers.',
      'Beyond trading, Coinbase offers staking services, a self-custody wallet, a developer platform (Base L2), and Coinbase Prime for institutional custody and trading. Revenue is diversified across transaction fees, subscription services, and interest income.',
      'As a publicly traded, regulated crypto company, Coinbase serves as critical infrastructure for institutional adoption of digital assets in the U.S. market.',
    ],
    ceo: 'Brian Armstrong',
    employees: '3,400',
    founded: '2012',
    headquarters: 'Remote (no HQ)',
    sector: 'Finance',
    website: 'coinbase.com',
  },
  JPM: {
    description: [
      'JPMorgan Chase & Co. is the largest bank in the United States by assets and one of the largest financial institutions in the world. It operates across investment banking, financial services, and asset management.',
      'The company serves millions of consumers and small businesses through its Chase brand, while its institutional business provides advisory, capital markets, and treasury services to corporations and governments worldwide.',
      'JPMorgan has been a leader in fintech innovation among traditional banks, investing heavily in blockchain technology, AI-driven trading, and digital banking platforms.',
    ],
    ceo: 'Jamie Dimon',
    employees: '309,000',
    founded: '1799',
    headquarters: 'New York, New York',
    sector: 'Financial Services',
    website: 'jpmorganchase.com',
  },
  V: {
    description: [
      'Visa Inc. operates the world\'s largest electronic payments network, facilitating digital payments among consumers, merchants, financial institutions, and governments across more than 200 countries.',
      'Visa processes over 200 billion transactions annually across its VisaNet network, connecting millions of merchants with billions of cardholders. The company earns revenue through service fees, data processing fees, and international transaction fees.',
      'Visa is expanding into new payment flows including B2B cross-border payments, real-time account-to-account transfers (Visa Direct), and embedded finance, while maintaining strong network effects.',
    ],
    ceo: 'Ryan McInerney',
    employees: '30,000',
    founded: '1958',
    headquarters: 'San Francisco, California',
    sector: 'Financial Services',
    website: 'visa.com',
  },
  DIS: {
    description: [
      'The Walt Disney Company is a global entertainment and media conglomerate operating theme parks, cruise lines, film studios, television networks, and streaming services including Disney+, Hulu, and ESPN+.',
      'Disney owns iconic intellectual property including Marvel, Star Wars, Pixar, and its classic animation library, which drives revenue across theatrical releases, merchandise, theme park attractions, and streaming content.',
      'The company is navigating a transition from linear television to streaming while maintaining its parks and experiences segment as a high-margin growth driver.',
    ],
    ceo: 'Bob Iger',
    employees: '225,000',
    founded: '1923',
    headquarters: 'Burbank, California',
    sector: 'Entertainment',
    website: 'thewaltdisneycompany.com',
  },
}

interface StockAboutProps {
  ticker: string
  companyName: string
}

export function StockAbout({ ticker, companyName }: StockAboutProps) {
  const profile = COMPANY_PROFILES[ticker]

  if (!profile) {
    return (
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4">
        <h2 className="text-sm font-semibold text-white mb-3">About {ticker}</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          s{ticker} on GoodChain tracks {companyName}&apos;s real stock price via on-chain price feeds.
          Trade 24/7 in fractional amounts with no minimums. 20% of trading fees fund Universal Basic Income.
        </p>
      </div>
    )
  }

  const metaItems = [
    { label: 'CEO', value: profile.ceo },
    { label: 'Employees', value: profile.employees },
    { label: 'Founded', value: profile.founded },
    { label: 'HQ', value: profile.headquarters },
    { label: 'Sector', value: profile.sector },
    { label: 'Website', value: profile.website },
  ]

  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4">
      <h2 className="text-sm font-semibold text-white mb-3">About {companyName}</h2>

      <div className="space-y-2.5 mb-4">
        {profile.description.map((para, idx) => (
          <p key={`about-${ticker}-${idx}`} className="text-sm text-gray-400 leading-relaxed">
            {para}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-gray-700/30 bg-dark-50/20 p-3">
        {metaItems.map((item) => (
          <div key={item.label}>
            <p className="text-[11px] text-gray-500 mb-0.5">{item.label}</p>
            <p className="text-xs text-gray-200 font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-goodgreen/20 bg-goodgreen/5 px-3 py-2.5">
        <p className="text-xs text-goodgreen/90 leading-relaxed">
          s{ticker} on GoodChain tracks {companyName}&apos;s real stock price via on-chain oracles.
          Trade 24/7 in fractional amounts with no minimums. 20% of trading fees fund Universal Basic Income.
        </p>
      </div>
    </div>
  )
}

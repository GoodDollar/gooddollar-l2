'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const variants = {
  hidden: { opacity: 0, y: 8 },
  enter:  { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: -8 },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldReduce = useReducedMotion()

  // First paint (SSR + first hydration commit) must be fully visible.
  // Without this, framer-motion serializes initial="hidden" (opacity:0)
  // into the SSR HTML and the enter animation can fail to advance,
  // leaving every page rendered blank. After mount, future route
  // changes resume the hidden -> enter transition.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  const transition = shouldReduce
    ? { duration: 0 }
    : { duration: 0.18, ease: 'easeInOut' as const }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={hasMounted && !shouldReduce ? 'hidden' : 'enter'}
        animate="enter"
        exit={shouldReduce ? undefined : 'exit'}
        variants={variants}
        transition={transition}
        className="flex-1 flex flex-col items-center w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

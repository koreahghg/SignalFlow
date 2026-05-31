'use client'

import dynamic from 'next/dynamic'

export const StockChart = dynamic(() => import('./StockChart'), { ssr: false })

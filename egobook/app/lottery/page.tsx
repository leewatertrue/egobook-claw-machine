import { Suspense } from 'react'
import LotteryContent from './LotteryContent'

export default function LotteryPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          }}
        >
          <p style={{ color: '#4ade80', fontSize: 16 }}>불러오는 중... 🌿</p>
        </div>
      }
    >
      <LotteryContent />
    </Suspense>
  )
}

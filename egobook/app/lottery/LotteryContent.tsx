'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

/* ── Balls inside the dome ── */
const BALLS = [
  { color: '#ff6b9d', top: 72,  left: 16,  size: 28, dur: 3.2, del: 0.0 },
  { color: '#ffd166', top: 32,  left: 58,  size: 24, dur: 3.8, del: 0.5 },
  { color: '#74b9ff', top: 108, left: 106, size: 30, dur: 3.5, del: 1.0 },
  { color: '#a29bfe', top: 48,  left: 150, size: 26, dur: 4.0, del: 0.3 },
  { color: '#fd79a8', top: 128, left: 30,  size: 22, dur: 3.3, del: 0.8 },
  { color: '#55efc4', top: 20,  left: 174, size: 25, dur: 3.7, del: 1.2 },
  { color: '#fdcb6e', top: 88,  left: 74,  size: 20, dur: 3.1, del: 0.6 },
  { color: '#ff7675', top: 144, left: 148, size: 27, dur: 3.9, del: 0.2 },
]

function lighten(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)})`
}

/* ── Prize result configs ── */
const RESULT_CFG: Record<number, { emoji: string; title: string; sub: string; bg: string }> = {
  2: { emoji: '🥈', title: '2등 당첨!',    sub: '에고북 떡메모지 획득을 축하드립니다!', bg: 'linear-gradient(135deg,#f8fafc,#e2e8f0)' },
  3: { emoji: '🥉', title: '3등 당첨!',    sub: '간식 획득을 축하드립니다!',            bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)' },
  0: { emoji: '😢', title: '아쉬워요…',    sub: '경품이 모두 소진되었어요',             bg: 'linear-gradient(135deg,#f9fafb,#f3f4f6)' },
}

type Phase = 'idle' | 'shaking' | 'drawing' | 'done'

export default function LotteryContent() {
  const searchParams = useSearchParams()
  const router      = useRouter()
  const entryId     = searchParams.get('id')

  const [prizes,      setPrizes]      = useState({ rank2: 40, rank3: 60 })
  const [phase,       setPhase]       = useState<Phase>('idle')
  const [prizeResult, setPrizeResult] = useState<number | null>(null)

  /* ── Init: fetch prizes & check if already drawn ── */
  useEffect(() => {
    if (!entryId) { router.push('/'); return }

    const init = async () => {
      const { data: pd } = await supabase.from('prizes').select('rank, remaining')
      if (pd) {
        setPrizes({
          rank2: pd.find(p => p.rank === 2)?.remaining ?? 40,
          rank3: pd.find(p => p.rank === 3)?.remaining ?? 60,
        })
      }

      const { data: ed } = await supabase
        .from('entries')
        .select('prize_rank')
        .eq('id', entryId)
        .single()

      if (ed?.prize_rank != null) {
        setPrizeResult(ed.prize_rank)
        setPhase('done')
      }
    }
    init()
  }, [entryId, router])

  /* ── Draw handler ── */
  const handleDraw = async () => {
    if (!entryId || phase !== 'idle') return

    // 1. Shake
    setPhase('shaking')
    await new Promise(r => setTimeout(r, 1600))

    // 2. Call DB
    setPhase('drawing')
    const { data, error } = await supabase.rpc('draw_prize', { entry_id: entryId })

    if (error) {
      console.error('draw_prize error:', error)
      setPhase('idle')
      return
    }

    setPrizeResult(data)
    setPhase('done')

    // 3. Refresh counts
    const { data: fresh } = await supabase.from('prizes').select('rank, remaining')
    if (fresh) {
      setPrizes({
        rank2: fresh.find(p => p.rank === 2)?.remaining ?? prizes.rank2,
        rank3: fresh.find(p => p.rank === 3)?.remaining ?? prizes.rank3,
      })
    }
  }

  const isShaking = phase === 'shaking'
  const isDisabled = phase !== 'idle'
  const result = prizeResult != null ? RESULT_CFG[prizeResult] ?? null : null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 55%,#bbf7d0 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 16px',
        fontFamily: 'var(--font-geist-sans),Arial,sans-serif',
      }}
    >

      {/* ── Prize counter badges ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {[
          { emoji: '🏆', label: '1등', count: 1,            gold: true  },
          { emoji: '🥈', label: '2등', count: prizes.rank2, gold: false },
          { emoji: '🥉', label: '3등', count: prizes.rank3, gold: false },
        ].map((p, i) => (
          <div
            key={i}
            style={{
              background: p.gold
                ? 'linear-gradient(135deg,#fef9c3,#fef08a)'
                : 'rgba(255,255,255,0.88)',
              borderRadius: 14,
              padding: '8px 16px',
              textAlign: 'center',
              border: p.gold
                ? '1px solid #fde047'
                : '1px solid rgba(74,222,128,0.22)',
              boxShadow: p.gold
                ? '0 2px 12px rgba(234,179,8,0.25)'
                : '0 2px 12px rgba(34,197,94,0.1)',
            }}
          >
            <div style={{ fontSize: 10, color: p.gold ? '#a16207' : '#6b7280', marginBottom: 2 }}>
              {p.emoji} {p.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: p.gold ? '#ca8a04' : '#22c55e' }}>
              {p.count}개
            </div>
          </div>
        ))}
      </div>

      {/* ── Machine wrapper (shakes) ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: isShaking ? 'machine-shake 0.13s ease-in-out infinite' : 'none',
        }}
      >
        {/* Glass dome */}
        <div
          style={{
            width: 224,
            height: 196,
            borderRadius: '50% 50% 0 0 / 62% 62% 0 0',
            background:
              'linear-gradient(145deg,rgba(255,255,255,0.92) 0%,rgba(220,252,231,0.68) 60%,rgba(187,247,208,0.46) 100%)',
            border: '3px solid rgba(255,255,255,0.88)',
            borderBottom: 'none',
            position: 'relative',
            overflow: 'hidden',
            boxShadow:
              '0 -10px 36px rgba(74,222,128,0.13), inset 0 10px 32px rgba(255,255,255,0.68)',
          }}
        >
          {/* Shine highlight */}
          <div
            style={{
              position: 'absolute',
              top: 14, left: 20,
              width: 34, height: 68,
              background: 'rgba(255,255,255,0.68)',
              borderRadius: '50%',
              transform: 'rotate(-28deg)',
              filter: 'blur(6px)',
              pointerEvents: 'none',
            }}
          />

          {/* Colorful balls */}
          {BALLS.map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: b.size, height: b.size,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, ${lighten(b.color)}, ${b.color})`,
                boxShadow: `0 3px 8px rgba(0,0,0,0.14),inset 0 -3px 5px rgba(0,0,0,0.1),inset 0 2px 4px rgba(255,255,255,0.45)`,
                top: b.top, left: b.left,
                animation: `float-ball ${b.dur}s ease-in-out infinite`,
                animationDelay: `${b.del}s`,
              }}
            />
          ))}
        </div>

        {/* Neck connector */}
        <div
          style={{
            width: 48, height: 11,
            background: 'linear-gradient(to right,#22c55e,#4ade80,#22c55e)',
          }}
        />

        {/* Machine body */}
        <div
          style={{
            width: 244,
            background: 'linear-gradient(158deg,#4ade80 0%,#22c55e 52%,#16a34a 100%)',
            borderRadius: '0 0 22px 22px',
            padding: '18px 22px 22px',
            textAlign: 'center',
            boxShadow:
              '0 18px 48px rgba(34,197,94,0.34), inset 0 1px 0 rgba(255,255,255,0.32)',
          }}
        >
          {/* Brand badge */}
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '8px 14px',
              marginBottom: 14,
              border: '1px solid rgba(255,255,255,0.28)',
            }}
          >
            <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '1px' }}>
              🐢 egobook
            </span>
          </div>

          {/* Output slot */}
          <div
            style={{
              width: 70, height: 24,
              background: 'rgba(0,0,0,0.26)',
              borderRadius: 12,
              margin: '0 auto 12px',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.18)',
            }}
          />

          <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11, letterSpacing: '0.3px' }}>
            {phase === 'done' ? '뽑기 완료! ✨' : '아래 버튼을 눌러보세요'}
          </p>
        </div>
      </div>

      {/* ── Big round draw button ── */}
      <button
        onClick={handleDraw}
        disabled={isDisabled}
        style={{
          marginTop: 22,
          width: 92, height: 92,
          borderRadius: '50%',
          border: '4px solid white',
          background: isDisabled
            ? 'linear-gradient(145deg,#d1fae5,#bbf7d0)'
            : 'linear-gradient(145deg,#86efac,#4ade80)',
          color: isDisabled ? '#15803d' : '#14532d',
          cursor: isDisabled ? 'default' : 'pointer',
          boxShadow: isDisabled
            ? '0 2px 8px rgba(74,222,128,0.15)'
            : '0 8px 30px rgba(34,197,94,0.5), inset 0 2px 0 rgba(255,255,255,0.52)',
          fontSize: 13,
          fontWeight: 800,
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          lineHeight: 1.2,
        }}
      >
        <span style={{ fontSize: 20 }}>
          {phase === 'shaking' || phase === 'drawing' ? '✨'
            : phase === 'done' ? '✅'
            : '🎯'}
        </span>
        <span>
          {phase === 'shaking' ? '뽑는중'
            : phase === 'drawing' ? '처리중'
            : phase === 'done' ? '완료'
            : '뽑기!'}
        </span>
      </button>

      {/* ── Result card ── */}
      {phase === 'done' && result && (
        <div
          style={{
            marginTop: 24,
            background: result.bg,
            borderRadius: 24,
            padding: '22px 40px',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            animation: 'result-reveal 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            border: '1px solid rgba(255,255,255,0.75)',
            maxWidth: 288,
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 6, lineHeight: 1 }}>{result.emoji}</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#1f2937', marginBottom: 5 }}>
            {result.title}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{result.sub}</div>

          {(prizeResult === 2 || prizeResult === 3) && (
            <div
              style={{
                marginTop: 14,
                background: 'rgba(34,197,94,0.09)',
                borderRadius: 11,
                padding: '10px 14px',
              }}
            >
              <p style={{ fontSize: 11, color: '#16a34a', lineHeight: 1.8 }}>
                에고북은 곧 출시될 서비스입니다!<br />
                많은 관심 부탁드리며,<br />
                4시 전에 에고북 투표해주시면 감사하겠습니다! 🌿
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Back link ── */}
      <button
        onClick={() => router.push('/')}
        style={{
          marginTop: 30,
          background: 'none',
          border: 'none',
          color: '#16a34a',
          fontSize: 12,
          cursor: 'pointer',
          textDecorationLine: 'underline',
          textUnderlineOffset: '3px',
          fontWeight: 600,
        }}
      >
        처음으로 돌아가기
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [contact, setContact] = useState('')
  const [agreed, setAgreed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact.trim()) {
      setError('이메일 또는 전화번호를 입력해주세요')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('entries')
      .insert({ contact: contact.trim(), agreed })
      .select('id')
      .single()

    if (dbError || !data) {
      setError('저장 중 문제가 발생했습니다. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    router.push(`/lottery?id=${data.id}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 55%, #bbf7d0 100%)',
        fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'white',
          borderRadius: 32,
          padding: '44px 36px 36px',
          boxShadow:
            '0 20px 60px rgba(34,197,94,0.14), 0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 8, lineHeight: 1 }}>🐢</div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#16a34a',
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            egobook
          </h1>
          <p style={{ fontSize: 12, color: '#86efac', marginTop: 5 }}>
            뽑기를 해봅시다~
          </p>
        </div>

        {/* Divider dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 28,
          }}
        >
          {[0.3, 0.5, 0.7, 0.5, 0.3].map((op, i) => (
            <span
              key={i}
              style={{ color: '#bbf7d0', fontSize: 8, opacity: op }}
            >
              ●
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Contact input */}
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="이메일 또는 전화번호"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 18px',
              borderRadius: 16,
              border: '2px solid #dcfce7',
              background: '#f0fdf4',
              color: '#374151',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              marginBottom: 10,
            }}
            onFocus={e => (e.target.style.borderColor = '#4ade80')}
            onBlur={e => (e.target.style.borderColor = '#dcfce7')}
          />

          {/* Error */}
          {error && (
            <p
              style={{
                fontSize: 11,
                color: '#f87171',
                marginBottom: 8,
                marginTop: -4,
              }}
            >
              {error}
            </p>
          )}

          {/* Checkbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 7,
              marginBottom: 20,
              paddingLeft: 2,
            }}
          >
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{
                width: 13,
                height: 13,
                accentColor: '#4ade80',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <label
              htmlFor="agree"
              style={{
                fontSize: 10,
                color: '#d1d5db',
                lineHeight: 1.5,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              egobook 서비스 출시 시 안내 링크를 받겠습니다
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'block',
              width: '100%',
              padding: '15px',
              borderRadius: 18,
              border: 'none',
              background: loading
                ? 'linear-gradient(135deg, #bbf7d0, #86efac)'
                : 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading
                ? 'none'
                : '0 6px 20px rgba(34,197,94,0.38)',
              transition: 'all 0.2s',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? '저장 중...' : '행운의 뽑기 시작하기 🍀'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: 10,
            color: '#9ca3af',
            marginTop: 18,
            lineHeight: 1.6,
          }}
        >
          정보는 서비스 안내 목적으로만 사용됩니다.<br />사용 후 모두 파기됩니다
        </p>
      </div>
    </div>
  )
}

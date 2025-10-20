import { GoogleGenerativeAI } from '@google/generative-ai'
import React, { useEffect, useMemo, useRef, useState } from 'react'

function splitLines(text) {
  return (text ?? '').split(/\r?\n/)
}

function renderMarkdownLike(text) {
  const lines = splitLines(text)
  return (
    <>
      {lines.map((ln, i) => (
        <div
          key={i}
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', transform: 'scale(0.75)', transformOrigin: 'top left' }}
        >
          {ln}
        </div>
      ))}
    </>
  )
}

export default function AIGuide({ defaultModel = 'gemini-2.5-flash' }) {
  const [apiKey, setApiKey] = useState('')
  const [rememberKey, setRememberKey] = useState(true)
  const [model, setModel] = useState(defaultModel)
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [city, setCity] = useState('台北')
  const [days, setDays] = useState(1)
  const [budgetMin, setBudgetMin] = useState(0)
  const [budgetMax, setBudgetMax] = useState(2000)
  const [interests, setInterests] = useState(['在地小吃', '文化景點'])
  const [withKids, setWithKids] = useState(false)
  const [rainPlan, setRainPlan] = useState(true)
  const [lang, setLang] = useState('繁中')
  const [immersive, setImmersive] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key')
    if (saved) setApiKey(saved)
  }, [])

  useEffect(() => {
    setHistory([
      {
        role: 'model',
        parts: [
          { text: '👋 我是你的AI導遊。請輸入你的 Gemini API Key、旅遊條件，或直接和我聊天。按下「進入旅遊指南」會自動根據條件規劃行程，也能切回修改。' },
        ],
      },
    ])
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [history, loading])

  const ai = useMemo(() => {
    try {
      return apiKey ? new GoogleGenerativeAI(apiKey) : null
    } catch {
      return null
    }
  }, [apiKey])

  const systemPersona = `你是專業、貼心且務實的「AI導遊」。用${lang}回答，並以使用者的條件規劃旅遊。`

  function buildContextBlock() {
    return `【旅遊條件】\n城市：${city}｜天數：${days}｜預算：${budgetMin} ~ ${budgetMax} 元\n偏好：${interests.join('、') || '一般觀光'}\n親子同行：${withKids ? '是' : '否'}\n語言：${lang}`
  }

  async function sendMessage(message) {
    const userText = (message ?? input).trim()
    if (!userText || loading) return
    if (!ai) {
      setError('請先輸入有效的 Gemini API Key')
      return
    }

    setError('')
    setLoading(true)

    const contextMsg = { role: 'model', parts: [{ text: systemPersona + '\n' + buildContextBlock() }] }
    const newHistory = [contextMsg, ...history, { role: 'user', parts: [{ text: userText }] }]
    setHistory(h => [...h, { role: 'user', parts: [{ text: userText }] }])
    setInput('')

    try {
      const modelInstance = ai.getGenerativeModel({ model })
      const resp = await modelInstance.generateContent({ contents: newHistory })
      const reply = (resp.response && resp.response.text && resp.response.text()) || '[No content]'
      setHistory(h => [...h, { role: 'model', parts: [{ text: reply }] }])
    } catch (err) {
      setError((err && err.message) || String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (immersive && ai) {
      sendMessage(`請依照以下條件幫我規劃 ${city} ${days} 日旅遊行程，含交通、餐廳、美食與預算控制。`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immersive])

  const interestOptions = ['在地小吃', '美食', '咖啡廳', '文化景點', '自然步道', '購物']

  return (
    <div style={styles.wrap}>
      <div style={styles.zoomWrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={{ fontWeight: 800, color: '#5a3e2b' }}>AI導遊</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!immersive ? (
                <button type="button" onClick={() => setImmersive(true)} style={styles.primaryBtn}>進入旅遊指南</button>
              ) : (
                <button type="button" onClick={() => setImmersive(false)} style={styles.secondaryBtn}>← 返回旅遊篩選</button>
              )}
            </div>
          </div>

          {!immersive && (
            <div style={{ padding: 16, display: 'grid', gap: 16 }}>
              <label style={styles.label}>
                <span>Gemini API Key</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => {
                    const v = e.target.value
                    setApiKey(v)
                    if (rememberKey) localStorage.setItem('gemini_api_key', v)
                  }}
                  placeholder="請輸入你的 Gemini API Key"
                  style={styles.input}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5a3e2b' }}>
                  <input
                    type="checkbox"
                    checked={rememberKey}
                    onChange={e => {
                      setRememberKey(e.target.checked)
                      if (!e.target.checked) localStorage.removeItem('gemini_api_key')
                      else if (apiKey) localStorage.setItem('gemini_api_key', apiKey)
                    }}
                  />
                  <span>記住在本機</span>
                </label>
              </label>

              <div style={styles.prefGrid}>
                <label style={styles.label}>
                  <span>城市</span>
                  <input value={city} onChange={e => setCity(e.target.value)} style={styles.input} />
                </label>
                <label style={styles.label}>
                  <span>天數</span>
                  <input type="number" min={1} value={days} onChange={e => setDays(Math.max(1, Number(e.target.value)))} style={styles.input} />
                </label>
                <label style={styles.label}>
                  <span>預算下限 (NT$)</span>
                  <input type="number" value={budgetMin} onChange={e => setBudgetMin(Number(e.target.value))} style={styles.input} />
                </label>
                <label style={styles.label}>
                  <span>預算上限 (NT$)</span>
                  <input type="number" value={budgetMax} onChange={e => setBudgetMax(Number(e.target.value))} style={styles.input} />
                </label>
              </div>

              <div style={styles.prefGrid}>
                <label style={styles.label}>
                  <span>語言</span>
                  <select value={lang} onChange={e => setLang(e.target.value)} style={styles.input}>
                    <option>繁中</option>
                    <option>English</option>
                    <option>日本語</option>
                  </select>
                </label>
                <label style={styles.toggle}>
                  <input type="checkbox" checked={withKids} onChange={e => setWithKids(e.target.checked)} /> 親子友善
                </label>
                <label style={styles.toggle}>
                  <input type="checkbox" checked={rainPlan} onChange={e => setRainPlan(e.target.checked)} /> 雨天備案
                </label>
              </div>

              <div style={styles.interests}>
                {interestOptions.map(tag => {
                  const active = interests.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => setInterests(prev => (active ? prev.filter(t => t !== tag) : [...prev, tag]))}
                      style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>

              <div style={{ borderTop: '1px dashed #eadcc6', paddingTop: 8 }}>
                <div style={{ fontWeight: 700, color: '#8b6e54', marginBottom: 8 }}>直接與導遊對話</div>
                <div ref={listRef} style={{ ...styles.messages, maxHeight: '40vh' }}>
                  {history.map((m, i) => (
                    <div key={i} style={{ ...styles.msg, ...(m.role === 'user' ? styles.user : styles.assistant) }}>
                      <div style={styles.msgRole}>{m.role === 'user' ? 'You' : 'Guide'}</div>
                      <div style={styles.msgBody}>{renderMarkdownLike(m.parts.map(p => p.text).join('\n'))}</div>
                    </div>
                  ))}
                  {loading && <div style={{ ...styles.msg, ...styles.assistant }}>規劃中…</div>}
                </div>
                <form onSubmit={e => { e.preventDefault(); sendMessage() }} style={styles.composer}>
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder={`例如：幫我排 ${city} ${days} 日行程`} style={styles.textInput} />
                  <button type="submit" disabled={!input.trim() || loading} style={styles.sendBtn}>送出</button>
                </form>
              </div>
            </div>
          )}

          {immersive && (
            <>
              <div ref={listRef} style={{ ...styles.messages, maxHeight: '65vh' }}>
                {history.map((m, i) => (
                  <div key={i} style={{ ...styles.msg, ...(m.role === 'user' ? styles.user : styles.assistant) }}>
                    <div style={styles.msgRole}>{m.role === 'user' ? 'You' : 'Guide'}</div>
                    <div style={styles.msgBody}>{renderMarkdownLike(m.parts.map(p => p.text).join('\n'))}</div>
                  </div>
                ))}
                {loading && <div style={{ ...styles.msg, ...styles.assistant }}>規劃中…</div>}
              </div>
              {error && <div style={styles.error}>{error}</div>}
              <form onSubmit={e => { e.preventDefault(); sendMessage() }} style={styles.composer}>
                <input value={input} onChange={e => setInput(e.target.value)} placeholder={`問我任何旅遊問題，例如：「幫我排 ${city} ${days} 日」`} style={styles.textInput} />
                <button type="submit" disabled={!input.trim() || loading} style={styles.sendBtn}>送出</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: 'linear-gradient(180deg, #f5e6d3 0%, #f2dfc6 100%)', padding: 16, paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' },
  zoomWrapper: { transform: 'scale(0.75)', transformOrigin: 'top center', width: '133%', height: '133%' },
  card: { width: 'min(96%, 980px)', background: '#fffaf3', borderRadius: 20, boxShadow: '0 10px 25px rgba(80,60,40,0.12)', overflow: 'hidden', border: '1px solid #e8d7c3', margin: '24px 0' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e8d7c3', background: 'linear-gradient(180deg, #f6e9d7 0%, #f2dfc6 100%)' },
  label: { display: 'grid', gap: 4, color: '#5a3e2b', fontWeight: 600, fontSize: 14 },
  input: { padding: '10px 12px', borderRadius: 12, border: '1px solid #e8d7c3', background: '#fffaf3' },
  prefGrid: { display: 'grid', gap: 12, gridTemplateColumns: '1fr 140px 160px 140px' },
  toggle: { display: 'flex', alignItems: 'center', gap: 6, color: '#5a3e2b' },
  interests: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '6px 10px', borderRadius: 999, border: '1px solid #e8d7c3', background: '#fffaf3', cursor: 'pointer', fontSize: 12 },
  chipActive: { background: '#8b6e54', color: '#fff', borderColor: '#8b6e54' },
  messages: { padding: 16, display: 'grid', gap: 10, overflowY: 'auto' },
  msg: { borderRadius: 12, padding: 12, border: '1px solid #eadcc6', background: '#fff9ef' },
  user: { background: '#f3e5c0' },
  assistant: { background: '#f8efdc' },
  msgRole: { fontSize: 12, opacity: 0.6 },
  msgBody: { color: '#5a3e2b', lineHeight: 1.6 },
  composer: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: 16, borderTop: '1px solid #e8d7c3', background: '#f6e9d7' },
  textInput: { padding: '12px 14px', borderRadius: 12, border: '1px solid #e8d7c3' },
  sendBtn: { padding: '12px 16px', borderRadius: 999, background: '#5a3e2b', color: '#fff', border: 'none', cursor: 'pointer' },
  primaryBtn: { padding: '8px 12px', borderRadius: 999, background: '#5a3e2b', color: '#fff', fontWeight: 800, border: '1px solid #5a3e2b', cursor: 'pointer' },
  secondaryBtn: { padding: '8px 12px', borderRadius: 999, background: '#fffaf3', color: '#5a3e2b', fontWeight: 800, border: '1px solid #5a3e2b', cursor: 'pointer' },
  error: { color: 'red', padding: 8, textAlign: 'center' }
}

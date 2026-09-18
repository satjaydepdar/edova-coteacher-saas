import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'

const BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('edova_auth_token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, open])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const nextMessages: Turn[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`${BASE}/api/student/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ message: text, history: nextMessages.slice(-6) }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Sorry, something went wrong.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the study assistant." }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Ask the study assistant"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#1a2421] hover:bg-black text-white shadow-xl flex items-center justify-center cursor-pointer"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5 text-[#DDB56E]" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[340px] h-[440px] bg-[#FBF9F3] border border-[#EDE8DD] rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EDE8DD] bg-[#FCFBF8] shrink-0">
            <Sparkles className="w-4 h-4 text-[#DDB56E]" />
            <span className="text-sm font-semibold text-[#111814]">Study Assistant</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.length === 0 && (
              <p className="text-xs text-[#111814]/50 text-center pt-8">
                Ask me anything about what you're studying.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'ml-auto bg-[#1a2421] text-white rounded-br-sm'
                    : 'mr-auto bg-[#FCFBF8] border border-[#EDE8DD] text-[#111814] rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && <div className="mr-auto text-xs text-[#111814]/40 px-1">Thinking...</div>}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 p-2.5 border-t border-[#EDE8DD] shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 rounded-xl border border-[#EDE8DD] bg-white text-xs text-[#111814] outline-none focus:border-[#DDB56E]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-8 h-8 shrink-0 rounded-full bg-[#1a2421] hover:bg-black text-[#DDB56E] flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se o backend está em execução.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || 'Não foi possível concluir a solicitação.')
  }
  return payload
}

function App() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')
  const messageListRef = useRef(null)

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => {
        setApiStatus(response.ok ? 'online' : 'offline')
      })
      .catch(() => setApiStatus('offline'))
  }, [])

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isLoading])

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleAuth(event) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const isRegistering = mode === 'register'
      const result = await apiRequest(isRegistering ? '/register' : '/login', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          ...(isRegistering ? { email: form.email } : {}),
        }),
      })
      setUser({ username: result.user, password: form.password })
      setMessages([])
      setForm({ username: '', email: '', password: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAsk(event) {
    event.preventDefault()
    const text = question.trim()
    if (!text || isLoading) return

    setError('')
    setQuestion('')
    setMessages((current) => [...current, { role: 'user', content: text }])
    setIsLoading(true)
    try {
      const result = await apiRequest('/ask', {
        method: 'POST',
        body: JSON.stringify({
          user: user.username,
          password: user.password,
          question: text,
        }),
      })
      setMessages((current) => [...current, { role: 'assistant', content: result.answer }])
    } catch (requestError) {
      setError(requestError.message)
      setMessages((current) => current.slice(0, -1))
      setQuestion(text)
    } finally {
      setIsLoading(false)
    }
  }

  function logOut() {
    setUser(null)
    setMessages([])
    setQuestion('')
    setError('')
    setMode('login')
  }

  async function deleteAccount() {
    if (!window.confirm('Tem certeza de que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await apiRequest('/delete', {
        method: 'DELETE',
        body: JSON.stringify({ username: user.username, password: user.password }),
      })
      logOut()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    const isRegistering = mode === 'register'
    return (
      <main className="auth-page">
        <section className="auth-card">
          <a className="brand auth-brand" href="/" aria-label="Orbe, início">
            <span className="brand-mark">✳</span>
            <span>orbe<span className="brand-period">.</span></span>
          </a>
          <div className="auth-intro">
            <span className="eyebrow">SEU ESPAÇO DE IDEIAS</span>
            <h1>{isRegistering ? 'Comece uma conversa.' : 'Bom ter você de volta.'}</h1>
            <p>
              {isRegistering
                ? 'Crie sua conta e descubra novas possibilidades com a inteligência artificial.'
                : 'Entre na sua conta e continue explorando novas ideias.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            <label>
              Nome de usuário
              <input
                autoComplete="username"
                name="username"
                onChange={updateForm}
                placeholder="Como podemos chamar você?"
                required
                value={form.username}
              />
            </label>
            {isRegistering && (
              <label>
                E-mail
                <input
                  autoComplete="email"
                  name="email"
                  onChange={updateForm}
                  placeholder="voce@exemplo.com"
                  required
                  type="email"
                  value={form.email}
                />
              </label>
            )}
            <label>
              Senha
              <input
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                name="password"
                onChange={updateForm}
                placeholder="Sua senha"
                required
                type="password"
                value={form.password}
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" disabled={isLoading} type="submit">
              {isLoading ? 'Aguarde…' : isRegistering ? 'Criar minha conta' : 'Entrar'}
              {!isLoading && <span aria-hidden="true">↗</span>}
            </button>
          </form>
          <p className="auth-switch">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
            {' '}
            <button
              onClick={() => {
                setError('')
                setMode(isRegistering ? 'login' : 'register')
              }}
              type="button"
            >
              {isRegistering ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
          <div className={`api-indicator ${apiStatus}`}>
            <span />
            {apiStatus === 'online'
              ? 'API conectada'
              : apiStatus === 'checking'
                ? 'Conectando à API…'
                : 'API desconectada'}
          </div>
        </section>
        <aside className="auth-art" aria-label="Conheça o Orbe">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-glow" />
          <div className="art-copy">
            <span>IDEIAS QUE GANHAM FORMA</span>
            <p>Um bom começo pode mudar tudo.</p>
          </div>
          <span className="art-star star-one">✳</span>
          <span className="art-star star-two">✦</span>
        </aside>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Orbe, início">
          <span className="brand-mark">✳</span>
          <span>orbe<span className="brand-period">.</span></span>
        </a>
        <div className="sidebar-label">ESPAÇO DE TRABALHO</div>
        <button className="nav-item selected" type="button">
          <span className="nav-icon">✳</span>
          Assistente
        </button>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <span className="plan-icon">✦</span>
            <div>
              <strong>Uma ideia de cada vez</strong>
              <p>Explore, pergunte, crie.</p>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div>
            <div className="profile-details">
              <strong>{user.username}</strong>
              <span>Sua conta</span>
            </div>
            <button
              aria-label="Excluir conta"
              className="icon-button delete-account"
              disabled={isLoading}
              onClick={deleteAccount}
              title="Excluir conta"
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3" />
              </svg>
            </button>
            <button
              aria-label="Sair da conta"
              className="icon-button"
              onClick={logOut}
              title="Sair"
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <section className="chat-area">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">✳</span> orbe<span className="brand-period">.</span>
          </div>
          <div className="assistant-label">
            <span className="assistant-dot" />
            <span>Assistente</span>
            <span className="topbar-divider">/</span>
            <span className="topbar-subtitle">Nova conversa</span>
          </div>
          <div className={`topbar-status ${apiStatus}`}>
            <span />
            {apiStatus === 'online' ? 'Online' : apiStatus === 'checking' ? 'Conectando' : 'Offline'}
          </div>
        </header>

        <div className="conversation" ref={messageListRef}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon">✳</div>
              <span className="eyebrow">UM UNIVERSO DE POSSIBILIDADES</span>
              <h1>Olá, {user.username}.<br />O que vamos descobrir?</h1>
              <p>Faça uma pergunta, explore uma ideia ou comece algo novo.</p>
              <div className="suggestions">
                {[
                  ['✦', 'Me ajude a ter uma ideia', 'Quero ter ideias criativas para um projeto novo.'],
                  ['⌘', 'Explique algo complexo', 'Explique de forma simples como funciona a inteligência artificial.'],
                  ['↗', 'Escreva comigo', 'Me ajude a escrever uma mensagem simpática para um amigo.'],
                ].map(([icon, title, prompt]) => (
                  <button className="suggestion" key={title} onClick={() => setQuestion(prompt)} type="button">
                    <span className="suggestion-icon">{icon}</span>
                    <span>{title}</span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message, index) => (
                <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
                  <div className="message-avatar">
                    {message.role === 'assistant' ? '✳' : user.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="message-content">
                    <strong>{message.role === 'assistant' ? 'Orbe' : user.username}</strong>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
              {isLoading && (
                <article className="message assistant">
                  <div className="message-avatar">✳</div>
                  <div className="message-content">
                    <strong>Orbe</strong>
                    <div className="typing-indicator" aria-label="Orbe está pensando">
                      <span /><span /><span />
                    </div>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {error && <p className="chat-error" role="alert">{error}</p>}
          <form className="composer" onSubmit={handleAsk}>
            <textarea
              aria-label="Escreva sua mensagem"
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form.requestSubmit()
                }
              }}
              placeholder="Escreva sua mensagem…"
              rows="1"
              value={question}
            />
            <div className="composer-footer">
              <span>Pressione <kbd>Enter</kbd> para enviar · <kbd>Shift + Enter</kbd> para quebrar linha</span>
              <button
                aria-label="Enviar mensagem"
                className="send-button"
                disabled={!question.trim() || isLoading}
                type="submit"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </form>
          <p className="disclaimer">O Orbe pode cometer erros. Confirme informações importantes.</p>
        </div>
      </section>
    </main>
  )
}

export default App

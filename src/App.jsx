import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrendingUp, AlertTriangle, Plus, Trash2, Zap,
  CreditCard, BarChart2, Bell, X, Check,
  Wifi, Clock, MessageCircle, Send, Bot, User, Key
} from 'lucide-react';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const today = new Date();
const daysAgo = (n) => new Date(today - n * 86400000).toISOString().split('T')[0];

const SEED_SUBSCRIPTIONS = [
  { id: 1,  name: 'Netflix',         category: 'Streaming',    cost: 649,  cycle: 'monthly', lastUsed: daysAgo(5),  color: '#e50914' },
  { id: 2,  name: 'Spotify',         category: 'Music',        cost: 119,  cycle: 'monthly', lastUsed: daysAgo(2),  color: '#1db954' },
  { id: 3,  name: 'Adobe CC',        category: 'Productivity', cost: 4230, cycle: 'monthly', lastUsed: daysAgo(45), color: '#ff0000' },
  { id: 4,  name: 'Notion',          category: 'Productivity', cost: 800,  cycle: 'monthly', lastUsed: daysAgo(60), color: '#ffffff' },
  { id: 5,  name: 'YouTube Premium', category: 'Streaming',    cost: 189,  cycle: 'monthly', lastUsed: daysAgo(3),  color: '#ff0000' },
  { id: 6,  name: 'Apple iCloud',    category: 'Storage',      cost: 75,   cycle: 'monthly', lastUsed: daysAgo(1),  color: '#007aff' },
  { id: 7,  name: 'Duolingo Plus',   category: 'Education',    cost: 750,  cycle: 'monthly', lastUsed: daysAgo(38), color: '#58cc02' },
];

// ─── Cheaper Alternatives Map ─────────────────────────────────────────────────

const ALTERNATIVES = {
  'Netflix':         { name: 'Zee5 Premium',   cost: 99,   saving: 550  },
  'Spotify':         { name: 'Wynk Music',     cost: 49,   saving: 70   },
  'Adobe CC':        { name: 'Canva Pro',       cost: 499,  saving: 3731 },
  'Notion':          { name: 'Obsidian',        cost: 0,    saving: 800  },
  'YouTube Premium': { name: 'Vanced (Free)',   cost: 0,    saving: 189  },
  'Duolingo Plus':   { name: 'Clozemaster',     cost: 0,    saving: 750  },
};

const CATEGORIES = ['Streaming', 'Music', 'Productivity', 'Storage', 'Gaming', 'Fitness', 'Education', 'News', 'Other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const daysSince = (dateStr) => {
  const diff = new Date() - new Date(dateStr);
  return Math.floor(diff / 86400000);
};

const toMonthly = (cost, cycle) => cycle === 'yearly' ? cost / 12 : cost;

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = accent || 'var(--border-2)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-2)' }}>
          {label}
        </span>
        {Icon && (
          <span style={{
            background: accent ? `${accent}20` : 'var(--border)',
            color: accent || 'var(--text-2)',
            borderRadius: 8,
            padding: '4px 6px',
            display: 'flex',
          }}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: accent || 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>}
      {/* decorative corner */}
      <div style={{
        position: 'absolute', bottom: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: accent ? `${accent}08` : 'transparent',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

function InsightBanner({ icon: Icon, color, title, children }) {
  return (
    <div style={{
      display: 'flex',
      gap: 14,
      padding: '16px 20px',
      background: `${color}12`,
      border: `1px solid ${color}30`,
      borderRadius: 12,
      animation: 'fadeUp 0.4s ease both',
    }}>
      <div style={{
        flexShrink: 0,
        width: 36, height: 36,
        borderRadius: 10,
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

function SubscriptionRow({ sub, onDelete }) {
  const days = daysSince(sub.lastUsed);
  const isUnused = days > 30;
  const alt = ALTERNATIVES[sub.name];
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${isUnused ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.15s',
      animation: 'fadeUp 0.35s ease both',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = isUnused ? 'rgba(239,68,68,0.5)' : 'var(--border-2)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = isUnused ? 'rgba(239,68,68,0.25)' : 'var(--border)'; }}
    >
      {/* Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
        {/* Logo dot */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `${sub.color}22`, border: `1.5px solid ${sub.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13, color: sub.color,
        }}>
          {sub.name.slice(0, 2).toUpperCase()}
        </div>

        {/* Name & category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            {sub.name}
            {isUnused && (
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 5, padding: '2px 6px',
              }}>Unused</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {sub.category} · Last used {days === 0 ? 'today' : `${days}d ago`}
          </div>
        </div>

        {/* Cost */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 15, color: 'var(--amber)' }}>
            {formatCurrency(toMonthly(sub.cost, sub.cycle))}<span style={{ fontSize: 11, color: 'var(--text-3)' }}>/mo</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {formatCurrency(toMonthly(sub.cost, sub.cycle) * 12)}/yr
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
          {alt && (
            <button
              onClick={() => setExpanded(e => !e)}
              title="View alternative"
              style={{
                background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                color: 'var(--green)', display: 'flex', alignItems: 'center',
                transition: 'background 0.15s',
              }}
            >
              <Zap size={13} />
            </button>
          )}
          <button
            onClick={() => onDelete(sub.id)}
            title="Remove subscription"
            style={{
              background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
              color: 'var(--red)', display: 'flex', alignItems: 'center',
              transition: 'background 0.15s',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Alternative panel */}
      {expanded && alt && (
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--green-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          animation: 'fadeUp 0.2s ease',
        }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--text-2)' }}>💡 Try </span>
            <strong style={{ color: 'var(--green)' }}>{alt.name}</strong>
            <span style={{ color: 'var(--text-2)' }}> at {formatCurrency(alt.cost)}/mo — save </span>
            <strong style={{ color: 'var(--green)' }}>{formatCurrency(alt.saving * 12)}/yr</strong>
          </div>
          <button
            onClick={() => setExpanded(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function AddForm({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: '', category: 'Streaming', cost: '', cycle: 'monthly', lastUsed: daysAgo(0),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.cost) return;
    const colors = ['#f59e0b','#3b82f6','#8b5cf6','#ec4899','#10b981','#f97316'];
    onAdd({
      ...form,
      id: Date.now(),
      cost: parseFloat(form.cost),
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    onClose();
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: 10,
    padding: '10px 14px',
    color: 'var(--text)',
    fontFamily: 'var(--font-head)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    marginBottom: 6,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(8,13,26,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border-2)',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 440,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>Add Subscription</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Service Name</label>
            <input
              style={inputStyle}
              placeholder="e.g. Netflix"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--amber)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Monthly Cost ($)</label>
              <input
                style={inputStyle}
                type="number"
                placeholder="9.99"
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--amber)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Billing Cycle</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.cycle}
                onChange={e => set('cycle', e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Last Used</label>
            <input
              style={inputStyle}
              type="date"
              value={form.lastUsed}
              onChange={e => set('lastUsed', e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--amber)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
            />
          </div>

          <button
            onClick={handleSubmit}
            style={{
              marginTop: 8,
              background: 'var(--amber)',
              color: '#0a0f1e',
              border: 'none',
              borderRadius: 12,
              padding: '13px 24px',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              fontFamily: 'var(--font-head)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.9'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            <Check size={16} /> Add Subscription
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Component ────────────────────────────────────────────────────────

function AIChat({ subs, stats, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi! 👋 I'm your subscription analyst. I can see you have **${subs.length} subscriptions** costing **₹${Math.round(stats.monthly).toLocaleString('en-IN')}/month**. Ask me anything!\n\nFor example:\n• "Which subscriptions am I wasting money on?"\n• "How much do I spend on streaming?"\n• "Where can I save the most money?"`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_key') || import.meta.env.VITE_GROQ_API_KEY || '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('groq_key'));
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveKey = () => {
    localStorage.setItem('groq_key', apiKey);
    setShowKeyInput(false);
  };

  const buildContext = () => {
    const subList = subs.map(s => {
      const days = Math.floor((new Date() - new Date(s.lastUsed)) / 86400000);
      const monthly = s.cycle === 'yearly' ? s.cost / 12 : s.cost;
      return `- ${s.name} (${s.category}): ₹${monthly.toFixed(0)}/month, last used ${days} days ago${days > 30 ? ' ⚠️ UNUSED' : ''}`;
    }).join('\n');

    const altList = Object.entries(ALTERNATIVES)
      .filter(([name]) => subs.some(s => s.name === name))
      .map(([name, alt]) => `- ${name} → ${alt.name} saves ₹${alt.saving}/month`)
      .join('\n');

    return `You are a smart personal finance assistant inside a subscription tracker app. 
The user's subscription data is below. Answer in a friendly, concise way. Use ₹ for currency. Be specific with numbers.

SUBSCRIPTIONS:
${subList}

SUMMARY:
- Total monthly spend: ₹${Math.round(stats.monthly).toLocaleString('en-IN')}
- Annual forecast: ₹${Math.round(stats.annual).toLocaleString('en-IN')}
- Unused subscriptions (30+ days): ${stats.unused.map(s => s.name).join(', ') || 'None'}
- Monthly waste on unused: ₹${Math.round(stats.wasteCost).toLocaleString('en-IN')}

CHEAPER ALTERNATIVES AVAILABLE:
${altList || 'None mapped yet'}

Answer the user's question based on this data. Keep responses concise and helpful.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!apiKey) { setShowKeyInput(true); return; }

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 500,
          messages: [
            { role: 'system', content: buildContext() },
            ...messages
              .filter(m => m.role === 'user' || (m.role === 'assistant' && m !== messages[0]))
              .map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: input },
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', text: `❌ Error: ${data.error.message}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: data.choices[0].message.content }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: '❌ Could not connect. Check your API key and try again.' }]);
    }

    setLoading(false);
  };

  const renderText = (text) => {
    return text.split('\n').map((line, i) => (
      <div key={i} style={{ marginBottom: line === '' ? 6 : 2 }}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} style={{ color: 'var(--amber)' }}>{part}</strong> : part
        )}
      </div>
    ));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
      padding: 24,
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, height: 560,
        background: 'var(--card)',
        border: '1px solid var(--border-2)',
        borderRadius: 20,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'all',
        animation: 'fadeUp 0.3s ease',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--amber-dim)', border: '1px solid var(--amber-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--amber)',
            }}>
              <Bot size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>SubTrack AI</div>
              <div style={{ fontSize: 11, color: 'var(--green)' }}>● Analyzing your subscriptions</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowKeyInput(s => !s)}
              title="API Key settings"
              style={{
                background: 'var(--border)', border: 'none', borderRadius: 8,
                padding: '6px', cursor: 'pointer', color: 'var(--text-2)',
                display: 'flex',
              }}
            >
              <Key size={13} />
            </button>
            <button onClick={onClose} style={{
              background: 'var(--border)', border: 'none', borderRadius: 8,
              padding: '6px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex',
            }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* API Key input */}
        {showKeyInput && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--blue-dim)',
            borderBottom: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', gap: 8,
          }}>
            <input
              placeholder="Paste your Groq API key..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              type="password"
              style={{
                flex: 1, background: 'var(--bg)', border: '1px solid var(--border-2)',
                borderRadius: 8, padding: '7px 10px', color: 'var(--text)',
                fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
              }}
            />
            <button onClick={saveKey} style={{
              background: 'var(--amber)', border: 'none', borderRadius: 8,
              padding: '7px 12px', color: '#0a0f1e', fontWeight: 700,
              fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-head)',
            }}>Save</button>
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              <div style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                background: msg.role === 'user' ? 'var(--amber-dim)' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${msg.role === 'user' ? 'var(--amber-glow)' : 'rgba(16,185,129,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: msg.role === 'user' ? 'var(--amber)' : 'var(--green)',
              }}>
                {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
              </div>
              <div style={{
                maxWidth: '80%',
                background: msg.role === 'user' ? 'var(--amber-dim)' : 'var(--surface)',
                border: `1px solid ${msg.role === 'user' ? 'var(--amber-glow)' : 'var(--border)'}`,
                borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                padding: '10px 14px',
                fontSize: 13, lineHeight: 1.6, color: 'var(--text)',
              }}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--green)',
              }}>
                <Bot size={13} />
              </div>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '4px 14px 14px 14px', padding: '12px 16px',
                display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--text-3)',
                    animation: `pulse-amber 1.2s ease ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8,
        }}>
          <input
            placeholder="Ask about your subscriptions..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{
              flex: 1, background: 'var(--bg)',
              border: '1px solid var(--border-2)',
              borderRadius: 10, padding: '9px 14px',
              color: 'var(--text)', fontFamily: 'var(--font-head)',
              fontSize: 13, outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--amber)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? 'var(--border)' : 'var(--amber)',
              border: 'none', borderRadius: 10,
              padding: '9px 14px', cursor: loading ? 'not-allowed' : 'pointer',
              color: loading || !input.trim() ? 'var(--text-3)' : '#0a0f1e',
              display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [subs, setSubs] = useState(SEED_SUBSCRIPTIONS);
  const [showForm, setShowForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [plaidStatus, setPlaidStatus] = useState('idle'); // idle | connecting | connected
  const [filter, setFilter] = useState('all'); // all | unused | active

  const deleteSub = (id) => setSubs(s => s.filter(x => x.id !== id));
  const addSub    = (sub) => setSubs(s => [sub, ...s]);

  // ── Computed Stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const monthly   = subs.reduce((acc, s) => acc + toMonthly(s.cost, s.cycle), 0);
    const annual    = monthly * 12;
    const unused    = subs.filter(s => daysSince(s.lastUsed) > 30);
    const wasteCost = unused.reduce((acc, s) => acc + toMonthly(s.cost, s.cycle), 0);
    const totalAlt  = Object.entries(ALTERNATIVES)
      .filter(([name]) => subs.some(s => s.name === name))
      .reduce((acc, [, v]) => acc + v.saving, 0);
    return { monthly, annual, unused, wasteCost, totalAlt };
  }, [subs]);

  const displayed = useMemo(() => {
    if (filter === 'unused') return subs.filter(s => daysSince(s.lastUsed) > 30);
    if (filter === 'active') return subs.filter(s => daysSince(s.lastUsed) <= 30);
    return subs;
  }, [subs, filter]);

  // ── Plaid Mock ──────────────────────────────────────────────────────────────

  const handlePlaid = () => {
    if (plaidStatus !== 'idle') return;
    setPlaidStatus('connecting');
    setTimeout(() => setPlaidStatus('connected'), 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const filterBtnStyle = (f) => ({
    background: filter === f ? 'var(--amber)' : 'var(--surface)',
    color:      filter === f ? '#0a0f1e' : 'var(--text-2)',
    border:     `1px solid ${filter === f ? 'var(--amber)' : 'var(--border)'}`,
    borderRadius: 10,
    padding:    '7px 16px',
    fontFamily: 'var(--font-head)',
    fontWeight: 600,
    fontSize:   13,
    cursor:     'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 80px' }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,13,26,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 max(24px, calc(50vw - 640px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BarChart2 size={17} color="#0a0f1e" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>SubTrack</span>
          </div>

          {/* Plaid button */}
          <button
            onClick={handlePlaid}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: plaidStatus === 'connected' ? 'var(--green-dim)' : 'var(--surface)',
              border: `1px solid ${plaidStatus === 'connected' ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              borderRadius: 10, padding: '8px 16px',
              color: plaidStatus === 'connected' ? 'var(--green)' : 'var(--text-2)',
              fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13,
              cursor: plaidStatus === 'idle' ? 'pointer' : 'default',
              transition: 'all 0.3s',
            }}
          >
            {plaidStatus === 'connecting' ? (
              <><Wifi size={13} style={{ animation: 'pulse-amber 1s infinite' }} /> Connecting…</>
            ) : plaidStatus === 'connected' ? (
              <><Check size={13} /> Bank Connected</>
            ) : (
              <><CreditCard size={13} /> Connect via Plaid</>
            )}
          </button>

          {/* Add button */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--amber)', border: 'none',
              borderRadius: 10, padding: '8px 16px',
              color: '#0a0f1e', fontFamily: 'var(--font-head)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.88'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            <Plus size={14} strokeWidth={2.5} /> Add
          </button>
        </div>
      </header>

      {/* ── Page Body ── */}
      <main style={{ padding: '40px max(24px, calc(50vw - 640px))' }}>

        {/* Title */}
        <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease' }}>
          <h1 style={{ fontWeight: 800, fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Subscription<br />
            <span style={{ color: 'var(--amber)' }}>Intelligence</span>
          </h1>
          <p style={{ color: 'var(--text-2)', marginTop: 8, fontSize: 15 }}>
            {subs.length} active subscriptions tracked · updated just now
          </p>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          <StatCard
            label="Monthly Spend"
            value={formatCurrency(stats.monthly)}
            sub={`${subs.length} subscriptions`}
            accent="#f59e0b"
            icon={TrendingUp}
          />
          <StatCard
            label="Annual Forecast"
            value={formatCurrency(stats.annual)}
            sub="at current subscriptions"
            accent="#3b82f6"
            icon={BarChart2}
          />
          <StatCard
            label="Wasted Monthly"
            value={formatCurrency(stats.wasteCost)}
            sub={`${stats.unused.length} unused service${stats.unused.length !== 1 ? 's' : ''}`}
            accent="#ef4444"
            icon={AlertTriangle}
          />
          <StatCard
            label="Potential Savings"
            value={formatCurrency(stats.totalAlt * 12)}
            sub="per year with alternatives"
            accent="#10b981"
            icon={Zap}
          />
        </div>

        {/* ── Smart Insights ── */}
        {(stats.unused.length > 0 || stats.totalAlt > 0) && (
          <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 4 }}>
              Smart Insights
            </h2>

            {stats.unused.length > 0 && (
              <InsightBanner icon={Clock} color="#ef4444" title={`${stats.unused.length} subscription${stats.unused.length > 1 ? 's' : ''} unused for 30+ days`}>
                You're paying <strong style={{ color: 'var(--text)' }}>{formatCurrency(stats.wasteCost * 12)}/yr</strong> for services you barely use —{' '}
                <strong style={{ color: 'var(--red)' }}>{stats.unused.map(s => s.name).join(', ')}</strong>. Consider cancelling or pausing them.
              </InsightBanner>
            )}

            {stats.totalAlt > 0 && (
              <InsightBanner icon={Zap} color="#10b981" title="Cheaper alternatives available">
                Switching to smarter alternatives could save you <strong style={{ color: 'var(--green)' }}>{formatCurrency(stats.totalAlt * 12)}/yr</strong>.
                Hit the <Zap size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on any subscription to explore options.
              </InsightBanner>
            )}

            {stats.annual > 50000 && (
              <InsightBanner icon={Bell} color="#f59e0b" title="Your annual spend is over ₹50,000">
                At <strong style={{ color: 'var(--amber)' }}>{formatCurrency(stats.annual)}/yr</strong>, subscriptions are a significant expense.
                Auditing unused services could reclaim meaningful budget.
              </InsightBanner>
            )}
          </div>
        )}

        {/* ── Subscription List ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
              All Subscriptions
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={filterBtnStyle('all')} onClick={() => setFilter('all')}>All</button>
              <button style={filterBtnStyle('active')} onClick={() => setFilter('active')}>Active</button>
              <button style={filterBtnStyle('unused')} onClick={() => setFilter('unused')}>
                Unused {stats.unused.length > 0 && `(${stats.unused.length})`}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 24px',
                color: 'var(--text-3)', background: 'var(--card)',
                borderRadius: 16, border: '1px solid var(--border)',
              }}>
                <Plus size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontWeight: 700, marginBottom: 6 }}>No subscriptions here</div>
                <div style={{ fontSize: 13 }}>Add one using the button above.</div>
              </div>
            ) : (
              displayed.map((sub, i) => (
                <div key={sub.id} style={{ animationDelay: `${i * 0.04}s` }}>
                  <SubscriptionRow sub={sub} onDelete={deleteSub} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Category Breakdown ── */}
        {subs.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 16 }}>
              Spend by Category
            </h2>
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {Object.entries(
                subs.reduce((acc, s) => {
                  const key = s.category;
                  acc[key] = (acc[key] || 0) + toMonthly(s.cost, s.cycle);
                  return acc;
                }, {})
              )
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => {
                const pct = Math.round((amount / stats.monthly) * 100);
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-2)' }}>{cat}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 500 }}>
                        {formatCurrency(amount)}/mo · <span style={{ color: 'var(--text-3)' }}>{pct}%</span>
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: 'linear-gradient(90deg, var(--amber), #f97316)',
                        borderRadius: 3,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Plaid Note ── */}
        <div style={{
          marginTop: 40,
          padding: '18px 22px',
          background: 'var(--blue-dim)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 14,
          fontSize: 13,
          color: 'var(--text-2)',
          lineHeight: 1.7,
        }}>
          <strong style={{ color: 'var(--blue)' }}>🔗 Plaid Integration Note:</strong> The "Connect via Plaid" button above is a demo stub.
          To enable real bank sync, you'll need a Plaid account (free sandbox at plaid.com), a Node/Express backend to handle OAuth,
          and a Plaid Link token. All transaction data stays on your server — nothing is stored externally.
        </div>
      </main>

      {/* ── Add Form Modal ── */}
      {showForm && <AddForm onAdd={addSub} onClose={() => setShowForm(false)} />}

      {/* ── AI Chat ── */}
      {showChat && <AIChat subs={subs} stats={stats} onClose={() => setShowChat(false)} />}

      {/* ── Floating AI Button ── */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 150,
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--amber)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px var(--amber-glow)',
            animation: 'pulse-amber 2s infinite',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Ask AI about your subscriptions"
        >
          <MessageCircle size={22} color="#0a0f1e" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
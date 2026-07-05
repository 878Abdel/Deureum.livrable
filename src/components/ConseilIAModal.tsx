import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, MessageCircle, ChevronLeft, Send } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface ConseilIAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConseilResponse {
  texte: string;
  statsUtilisees?: any;
  createdAt?: string;
}

type Mode = 'choix' | 'conseil' | 'chat';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Palette IBA — reprend l'accent principal du dashboard (#E8FF5A) et les teintes
// déjà utilisées pour les actifs crypto ailleurs dans l'app. Ici elles représentent
// les 4 sources que IBA lit en continu : Portefeuille, Transactions, Objectifs, Tontines.
const AURA = ['#E8FF5A', '#22d3ee', '#c084fc', '#f59e0b'];
const AURA_GRADIENT = `conic-gradient(from 0deg, ${AURA[0]}, ${AURA[1]}, ${AURA[2]}, ${AURA[3]}, ${AURA[0]})`;

const couleurs = {
  card: 'rgba(11,16,26,0.62)',
  cardSoft: 'rgba(18,24,38,0.55)',
  cardHover: 'rgba(24,32,50,0.7)',
  border: 'rgba(255,255,255,0.10)',
  borderHi: 'rgba(232,255,90,0.24)',
  text: '#F3F6FB',
  textMuted: 'rgba(190,200,215,0.72)',
  textSoft: 'rgba(156,170,190,0.52)',
  accent: '#E8FF5A',
};

function AuraRing({
  radius,
  thickness = 1.5,
  speed = 6,
  glow = true,
  children,
  className = '',
}: {
  radius: number;
  thickness?: number;
  speed?: number;
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ borderRadius: radius }}>
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: radius + 10,
            overflow: 'hidden',
            filter: 'blur(14px)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          <div
            className="aura-spin"
            style={{
              position: 'absolute',
              inset: '-150%',
              background: AURA_GRADIENT,
              animationDuration: `${speed}s`,
            }}
          />
        </div>
      )}
      <div
        style={{
          position: 'relative',
          borderRadius: radius,
          padding: thickness,
          overflow: 'hidden',
        }}
      >
        <div
          className="aura-spin"
          style={{
            position: 'absolute',
            inset: '-150%',
            background: AURA_GRADIENT,
            animationDuration: `${speed}s`,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: Math.max(radius - thickness, 0),
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ConseilIAModal({ isOpen, onClose }: ConseilIAModalProps) {
  const [loading, setLoading] = useState(false);
  const [conseil, setConseil] = useState<ConseilResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('choix');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(false);
    setConseil(null);
    setError(null);
    setMode('choix');
    setMessages([]);
    setMessage('');
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mode]);

  const generateConseil = async () => {
    setLoading(true);
    setError(null);
    setConseil(null);

    try {
      const data = await apiFetch('/ia/conseil', { method: 'POST' });
      setConseil(data);
      setMode('conseil');
    } catch (err) {
      setError('Impossible de générer un conseil. Vérifiez votre connexion ou réessayez plus tard.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirDiscussion = () => {
    setError(null);
    setMode('chat');
    setMessages((current) => {
      if (current.length > 0) return current;
      if (conseil?.texte) {
        return [{ role: 'assistant', content: conseil.texte }];
      }
      return [{ role: 'assistant', content: 'Je suis IBA. Pose-moi une question sur ton argent, ton budget ou tes objectifs.' }];
    });
  };

  const envoyerMessage = async () => {
    const contenu = message.trim();
    if (!contenu || loading) return;

    const conversation = [...messages, { role: 'user', content: contenu }];
    setMessages(conversation);
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch('/ia/discuter', {
        method: 'POST',
        body: JSON.stringify({
          message: contenu,
          conversation,
        }),
      });

      setMessages((current) => [...current, { role: 'assistant', content: data.texte ?? 'Je n’ai pas pu générer une réponse.' }]);
    } catch (err) {
      setError('Impossible de poursuivre la discussion. Réessayez plus tard.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConseil(null);
    setError(null);
    setMode('choix');
    setMessages([]);
    setMessage('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>{`
            @keyframes aura-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .aura-spin {
              animation-name: aura-spin;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
            }
            @keyframes iba-breathe {
              0%, 100% { transform: scale(1); opacity: 0.55; }
              50% { transform: scale(1.12); opacity: 0.85; }
            }
            .iba-breathe { animation: iba-breathe 3.2s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) {
              .aura-spin, .iba-breathe { animation: none !important; }
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[2000]"
            style={{ background: 'rgba(5,8,14,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 flex items-center justify-center z-[2001] p-4"
          >
            <div
              className="relative max-w-xl w-full"
              style={{
                borderRadius: 28,
                padding: 22,
                background:
                  'linear-gradient(165deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.08) 100%)',
                backdropFilter: 'blur(30px) saturate(160%)',
                WebkitBackdropFilter: 'blur(30px) saturate(160%)',
                border: `1px solid ${couleurs.border}`,
                boxShadow:
                  '0 24px 60px rgba(0,10,30,0.55), 0 2px 8px rgba(0,10,30,0.3), inset 0 1px 0 rgba(255,255,255,0.30)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
                    <div
                      className="iba-breathe absolute inset-0 rounded-full"
                      style={{ background: `radial-gradient(circle, ${couleurs.accent} 0%, #22d3ee 55%, transparent 75%)`, filter: 'blur(7px)' }}
                    />
                    <div
                      className="relative w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: 'radial-gradient(circle at 32% 28%, #fdffe8, #E8FF5A 42%, #0b1220 100%)',
                        boxShadow: `0 0 18px rgba(232,255,90,0.5), inset 0 0 0 1px rgba(255,255,255,0.25)`,
                      }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: '#0b1220' }} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: couleurs.text }}>IBA</h2>
                    <p className="text-xs" style={{ color: couleurs.textMuted }}>Conseil et discussion financière</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: couleurs.cardSoft, border: `1px solid ${couleurs.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = couleurs.cardHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = couleurs.cardSoft)}
                >
                  <X className="w-4 h-4" style={{ color: couleurs.textMuted }} />
                </button>
              </div>

              <div className="space-y-4">
                {mode === 'choix' && !loading && (
                  <div className="grid gap-3">
                    <p className="text-sm text-center pb-1" style={{ color: couleurs.text }}>
                      Que veux-tu faire avec IBA ?
                    </p>
                    <button
                      onClick={generateConseil}
                      className="font-semibold py-3 px-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                      style={{
                        background: `linear-gradient(120deg, ${couleurs.accent}, #c4dd4a)`,
                        color: '#0b1220',
                        boxShadow: '0 10px 30px rgba(232,255,90,0.22)',
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Conseil IA
                    </button>
                    <button
                      onClick={ouvrirDiscussion}
                      className="font-semibold py-3 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
                      style={{ background: couleurs.cardSoft, color: couleurs.text, border: `1px solid ${couleurs.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = couleurs.cardHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = couleurs.cardSoft)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Discuter avec IBA
                    </button>
                  </div>
                )}

                {loading && (
                  <div className="text-center py-10">
                    <Loader2 className="w-9 h-9 animate-spin mx-auto mb-3" style={{ color: couleurs.accent }} />
                    <p className="text-sm" style={{ color: couleurs.text }}>IBA réfléchit...</p>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}>
                    <p className="text-sm mb-4" style={{ color: '#f87171' }}>{error}</p>
                    <button
                      onClick={generateConseil}
                      className="font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
                      style={{ background: '#ef4444', color: '#fff' }}
                    >
                      Réessayer
                    </button>
                  </div>
                )}

                {mode === 'conseil' && conseil && (
                  <div className="rounded-2xl p-5" style={{ background: couleurs.cardSoft, border: `1px solid ${couleurs.border}` }}>
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: couleurs.text }}>
                      <Sparkles className="w-4 h-4" style={{ color: couleurs.accent }} />
                      Conseils personnalisés
                    </h3>
                    <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: couleurs.text }}>
                      {conseil.texte}
                    </div>
                    {conseil.statsUtilisees && (
                      <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${couleurs.border}` }}>
                        <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: couleurs.textMuted }}>
                          Statistiques analysées
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl p-3" style={{ background: couleurs.card, border: `1px solid ${couleurs.border}` }}>
                            <p style={{ color: couleurs.textMuted }}>Total dépenses</p>
                            <p className="font-semibold" style={{ color: couleurs.text }}>
                              {conseil.statsUtilisees.totalDepenses?.toLocaleString()} FCFA
                            </p>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: couleurs.card, border: `1px solid ${couleurs.border}` }}>
                            <p style={{ color: couleurs.textMuted }}>Total revenus</p>
                            <p className="font-semibold" style={{ color: couleurs.text }}>
                              {conseil.statsUtilisees.totalRevenus?.toLocaleString()} FCFA
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={ouvrirDiscussion}
                        className="flex-1 font-semibold py-2.5 px-5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                        style={{ background: `linear-gradient(120deg, ${couleurs.accent}, #c4dd4a)`, color: '#0b1220' }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Répondre à ce conseil
                      </button>
                      <button
                        onClick={() => setMode('choix')}
                        className="flex-1 font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
                        style={{ background: couleurs.cardSoft, color: couleurs.text, border: `1px solid ${couleurs.border}` }}
                      >
                        Retour
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'chat' && (
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-4 max-h-[60vh]"
                    style={{ background: couleurs.cardSoft, border: `1px solid ${couleurs.border}` }}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setMode('choix')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: couleurs.textMuted }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Choix
                      </button>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: couleurs.textMuted }}>Discussion IBA</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {messages.map((item, index) => (
                        <div
                          key={`${item.role}-${index}`}
                          className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                            style={
                              item.role === 'user'
                                ? { background: `linear-gradient(120deg, ${couleurs.accent}, #c4dd4a)`, color: '#0b1220' }
                                : { background: couleurs.card, color: couleurs.text, border: `1px solid ${couleurs.border}` }
                            }
                          >
                            {item.content}
                          </div>
                        </div>
                      ))}
                      <div ref={endRef} />
                    </div>

                    {/* Zone de saisie — anneau dégradé animé, signature visuelle de IBA */}
                    <AuraRing radius={18} thickness={1.5} speed={7}>
                      <div
                        className="flex items-center gap-2 pl-4 pr-1.5 py-1.5"
                        style={{ background: '#0b1220' }}
                      >
                        <input
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void envoyerMessage();
                            }
                          }}
                          placeholder="Écris à IBA..."
                          className="flex-1 bg-transparent outline-none text-sm py-2"
                          style={{ color: couleurs.text }}
                        />
                        <button
                          onClick={envoyerMessage}
                          disabled={!message.trim() || loading}
                          className="rounded-2xl px-4 py-2.5 font-semibold disabled:opacity-40 disabled:cursor-default flex items-center justify-center transition-transform hover:enabled:scale-105"
                          style={{ background: couleurs.accent, color: '#0b1220' }}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </AuraRing>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
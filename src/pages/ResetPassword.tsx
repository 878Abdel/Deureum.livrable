import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
import logoFace from "../assets/LOGO_face.png";
import resetBg  from "../assets/BackGradiant/gradients-fm__luminous-shapes-6.webp";

const TEXT_PRIMARY   = "#F6EFE4";
const TEXT_SECONDARY = "rgba(246,239,228,0.78)";
const TEXT_MUTED     = "rgba(246,239,228,0.62)";
const TEXT_SOFT      = "rgba(246,239,228,0.45)";
const ACCENT         = "#E8FF5A";

const ChampInput: React.FC<{
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}> = ({ label, type = "text", name, value, onChange, placeholder, icon }) => {
  const [enFocus, setEnFocus] = useState(false);
  return (
    <div>
      <label style={{
        display: "block", fontSize: 9, fontWeight: 500,
        textTransform: "uppercase", letterSpacing: "0.25em",
        color: TEXT_MUTED, marginBottom: 8,
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{
            position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)",
            pointerEvents: "none",
          }}>{icon}</div>
        )}
        <input
          type={type} name={name} value={value}
          onChange={onChange} placeholder={placeholder}
          required
          onFocus={() => setEnFocus(true)}
          onBlur={() => setEnFocus(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: icon ? "13px 16px 13px 42px" : "13px 16px",
            borderRadius: 14, fontSize: 13, fontWeight: 400,
            color: TEXT_PRIMARY,
            background: enFocus ? "rgba(0,0,0,0.52)" : "rgba(0,0,0,0.38)",
            border: `1px solid ${enFocus ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
            outline: "none", transition: "all 0.2s",
            fontFamily: "'Satoshi', sans-serif",
          }}
        />
      </div>
    </div>
  );
};

type Step = "email" | "code" | "success";

export default function ResetPassword() {
  const navigate    = useNavigate();
  const [etape, setEtape]     = useState<Step>("email");
  const [enChargement, setEnChargement] = useState(false);
  const [adresseMail, setAdresseMail]   = useState("");
  const [codeVerif, setCodeVerif]     = useState("");
  const [nvMdp, setNvMdp]   = useState("");

  const gererEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEnChargement(true);
    setTimeout(() => { setEnChargement(false); setEtape("code"); }, 1400);
  };

  const gererCode = (e: React.FormEvent) => {
    e.preventDefault();
    setEnChargement(true);
    setTimeout(() => { setEnChargement(false); setEtape("success"); }, 1400);
  };

  const nomEtapes = ["Email", "Vérification", "Terminé"];
  const indexEtape = etape === "email" ? 0 : etape === "code" ? 1 : 2;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Satoshi', sans-serif", background: "#030303",
      color: "#fff", overflow: "hidden",
    }}>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.2); }
        * { font-family: 'Satoshi', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(180deg, rgba(5,7,13,0.16) 0%, rgba(5,7,13,0.88) 100%), url(${resetBg})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "linear-gradient(135deg, rgba(5,8,15,0.82) 0%, rgba(8,14,25,0.78) 50%, rgba(4,6,12,0.86) 100%)",
      }} />

      <div style={{
        position: "fixed", bottom: -80, left: -80,
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(232,255,90,0.07) 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 420, padding: "0 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
          <img src={logoFace} style={{ width: 26, height: 26, objectFit: "contain" }} alt="" />
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: TEXT_MUTED,
          }}>DEUREUM</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
          {nomEtapes.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 99,
                  background: i < indexEtape
                    ? ACCENT
                    : i === indexEtape
                    ? "rgba(232,255,90,0.18)"
                    : "rgba(255,255,255,0.06)",
                  border: `1px solid ${i <= indexEtape ? ACCENT : "rgba(255,255,255,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s",
                }}>
                  {i < indexEtape
                    ? <CheckCircle2 size={13} color="#000" />
                    : <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: i === indexEtape ? ACCENT : TEXT_SOFT,
                      }}>{i + 1}</span>
                  }
                </div>
                <span style={{
                  fontSize: 8, fontWeight: 500, textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: i === indexEtape ? ACCENT : TEXT_SOFT,
                  whiteSpace: "nowrap",
                }}>{s}</span>
              </div>
              {i < nomEtapes.length - 1 && (
                <div style={{
                  flex: 1, height: 1, marginBottom: 22,
                  background: i < indexEtape
                    ? `linear-gradient(90deg, ${ACCENT}, ${ACCENT})`
                    : "rgba(255,255,255,0.07)",
                  transition: "background 0.4s",
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {etape === "email" && (
            <motion.div key="email"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 style={{
                fontSize: 30, fontWeight: 600, letterSpacing: "-0.04em",
                color: TEXT_PRIMARY, lineHeight: 1, marginBottom: 10,
              }}>Mot de passe oublié ?</h1>
              <p style={{
                fontSize: 13, color: TEXT_SECONDARY,
                fontWeight: 400, lineHeight: 1.6, marginBottom: 36,
              }}>
                Entrez votre email. Nous vous enverrons un code de vérification.
              </p>
              <form onSubmit={gererEmail} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <ChampInput
                  label="Adresse email"
                  name="email" value={adresseMail}
                  onChange={e => setAdresseMail(e.target.value)}
                  placeholder="moussa@exemple.com"
                  icon={<Mail size={15} />}
                />
                <motion.button
                  type="submit" disabled={enChargement}
                  whileHover={{ scale: enChargement ? 1 : 1.01 }}
                  whileTap={{ scale: enChargement ? 1 : 0.98 }}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 14,
                    border: "none", cursor: enChargement ? "default" : "pointer",
                    background: enChargement ? "rgba(255,255,255,0.1)" : "#fff",
                    color: enChargement ? "rgba(255,255,255,0.4)" : "#000",
                    fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "background 0.2s, color 0.2s",
                    fontFamily: "'Satoshi', sans-serif",
                  }}
                  onMouseEnter={e => { if (!enChargement) (e.currentTarget as HTMLElement).style.background = ACCENT; }}
                  onMouseLeave={e => { if (!enChargement) (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                >
                  {enChargement ? (
                    <>
                      <motion.div animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        style={{ width: 14, height: 14, borderRadius: 99,
                          border: "2px solid rgba(255,255,255,0.2)",
                          borderTopColor: "rgba(255,255,255,0.6)" }} />
                      Envoi en cours…
                    </>
                  ) : (
                    <>Envoyer le code <ArrowRight size={14} /></>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {etape === "code" && (
            <motion.div key="code"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 style={{
                fontSize: 30, fontWeight: 600, letterSpacing: "-0.04em",
                color: TEXT_PRIMARY, lineHeight: 1, marginBottom: 10,
              }}>Vérification</h1>
              <p style={{
                fontSize: 13, color: TEXT_SECONDARY,
                fontWeight: 400, lineHeight: 1.6, marginBottom: 36,
              }}>
                Code envoyé à{" "}
                <span style={{ color: ACCENT, fontWeight: 600 }}>{adresseMail || "votre email"}</span>.
                Saisissez-le ci-dessous avec votre nouveau mot de passe.
              </p>
              <form onSubmit={gererCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ChampInput
                  label="Code de vérification"
                  name="code" value={codeVerif}
                  onChange={e => setCodeVerif(e.target.value)}
                  placeholder="123456"
                  icon={<KeyRound size={15} />}
                />
                <ChampInput
                  label="Nouveau mot de passe"
                  type="password"
                  name="newpw" value={nvMdp}
                  onChange={e => setNvMdp(e.target.value)}
                  placeholder="••••••••"
                />

                {nvMdp.length > 0 && (
                  <div>
                    <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(nvMdp.length * 8, 100)}%` }}
                        style={{
                          height: "100%", borderRadius: 99,
                          background: nvMdp.length < 6 ? "rgba(255,80,80,0.6)"
                            : nvMdp.length < 10 ? "rgba(255,200,60,0.8)"
                            : ACCENT,
                          transition: "background 0.3s",
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 9, color: TEXT_SOFT, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                      {nvMdp.length < 6 ? "Faible" : nvMdp.length < 10 ? "Moyen" : "Fort"}
                    </p>
                  </div>
                )}

                <motion.button
                  type="submit" disabled={enChargement}
                  whileHover={{ scale: enChargement ? 1 : 1.01 }}
                  whileTap={{ scale: enChargement ? 1 : 0.98 }}
                  style={{
                    marginTop: 8, width: "100%", padding: "14px 0", borderRadius: 14,
                    border: "none", cursor: enChargement ? "default" : "pointer",
                    background: enChargement ? "rgba(255,255,255,0.1)" : "#fff",
                    color: enChargement ? "rgba(255,255,255,0.4)" : "#000",
                    fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "background 0.2s, color 0.2s",
                    fontFamily: "'Satoshi', sans-serif",
                  }}
                  onMouseEnter={e => { if (!enChargement) (e.currentTarget as HTMLElement).style.background = ACCENT; }}
                  onMouseLeave={e => { if (!enChargement) (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                >
                  {enChargement ? (
                    <>
                      <motion.div animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        style={{ width: 14, height: 14, borderRadius: 99,
                          border: "2px solid rgba(255,255,255,0.2)",
                          borderTopColor: "rgba(255,255,255,0.6)" }} />
                      Vérification…
                    </>
                  ) : (
                    <>Réinitialiser <ArrowRight size={14} /></>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {etape === "success" && (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: "center" }}>

              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                style={{
                  width: 72, height: 72, borderRadius: 99, margin: "0 auto 28px",
                  background: `rgba(232,255,90,0.12)`,
                  border: `1px solid rgba(232,255,90,0.3)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <CheckCircle2 size={34} color={ACCENT} />
              </motion.div>

              <h1 style={{
                fontSize: 30, fontWeight: 600, letterSpacing: "-0.04em",
                color: TEXT_PRIMARY, lineHeight: 1, marginBottom: 12,
              }}>Mot de passe mis à jour !</h1>
              <p style={{
                fontSize: 13, color: TEXT_SECONDARY,
                lineHeight: 1.6, marginBottom: 40,
              }}>
                Votre mot de passe a été réinitialisé avec succès.<br />
                Vous pouvez maintenant vous connecter.
              </p>

              <motion.button
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 14,
                  border: "none", cursor: "pointer",
                  background: "#fff", color: "#000",
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "'Satoshi', sans-serif", transition: "background 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = ACCENT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
              >
                Se connecter <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>

        {etape !== "success" && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, color: TEXT_MUTED, textDecoration: "none",
              fontWeight: 500, transition: "color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT_PRIMARY)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT_MUTED)}>
              <ArrowLeft size={13} /> Retour à la connexion
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
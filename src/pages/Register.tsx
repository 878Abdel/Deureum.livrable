import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import logoFace from "../assets/LOGO_face.png";
import logoPile from "../assets/LOGO_pile.png";
import card1    from "../assets/card1.png";
import card2    from "../assets/card2.png";
import card3    from "../assets/card3.png";
import registerBg from "../assets/BackGradiant/gradients-fm__luminous-shapes-3.webp";

const TEXT_PRIMARY   = "#F6EFE4";
const TEXT_SECONDARY = "rgba(246,239,228,0.78)";
const TEXT_MUTED     = "rgba(246,239,228,0.62)";
const TEXT_SOFT      = "rgba(246,239,228,0.45)";

const FloatingCards: React.FC = () => (
  <div style={{ position: "relative", width: "100%", height: 320 }}>
    {[card3, card2, card1].map((c, i) => (
      <motion.img
        key={i} src={c} alt=""
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1 - i * 0.15, y: 0 }}
        transition={{ delay: 0.3 + i * 0.12, duration: 0.8, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: "82%",
          left: "50%",
          borderRadius: 18,
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
          transform: `translateX(-50%) translateY(${i * 28}px) translateX(${i * -8}px) rotate(${i * -2.5}deg)`,
          zIndex: 3 - i,
        }}
      />
    ))}
  </div>
);

const PointsEtapes: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div style={{ display: "flex", gap: 6 }}>
    {Array.from({ length: total }).map((_, i) => (
      <motion.div key={i}
        animate={{
          width:      i === current ? 24 : 6,
          background: i < current ? "#E8FF5A" : i === current ? "#fff" : "rgba(255,255,255,0.15)",
        }}
        transition={{ duration: 0.3 }}
        style={{ height: 6, borderRadius: 99 }}
      />
    ))}
  </div>
);

const ChampInput: React.FC<{
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}> = ({ label, type = "text", name, value, onChange, placeholder, prefix, suffix }) => {
  const [enFocus, setEnFocus] = useState(false);
  return (
    <div>
      <label style={{
        display: "block", fontSize: 9, fontWeight: 500,
        textTransform: "uppercase", letterSpacing: "0.25em",
        color: TEXT_MUTED, marginBottom: 8,
      }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        {prefix && (
          <div style={{
            padding: "0 14px", borderRadius: 14, display: "flex",
            alignItems: "center", flexShrink: 0,
            background: "rgba(0,0,0,0.38)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 12, color: TEXT_MUTED,
          }}>{prefix}</div>
        )}
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type={type} name={name} value={value}
            onChange={onChange} placeholder={placeholder}
            required
            onFocus={() => setEnFocus(true)}
            onBlur={() => setEnFocus(false)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: suffix ? "13px 44px 13px 16px" : "13px 16px",
              borderRadius: 14, fontSize: 13, fontWeight: 400,
              color: TEXT_PRIMARY,
              background: enFocus ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.40)",
              border: `1px solid ${enFocus ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.09)"}`,
              outline: "none", transition: "all 0.2s",
            }}
          />
          {suffix && (
            <div style={{
              position: "absolute", right: 14, top: "50%",
              transform: "translateY(-50%)",
            }}>{suffix}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Register() {
  const navigate = useNavigate();
  const [etape, setEtape]       = useState(0);
  const [voirMdp, setVoirMdp]   = useState(false);
  const [enChargement, setEnChargement] = useState(false);
  const [formulaire, setFormulaire] = useState({ name:"", phone:"", email:"", password:"", confirm:"" });
  const surChangement = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormulaire(p => ({ ...p, [e.target.name]: e.target.value }));

  const [erreur, setErreur] = useState("");

const etapeSuivante = async (e: React.FormEvent) => {
  e.preventDefault();

  if (etape < 1) {
    setEtape(s => s + 1);
    return;
  }

  setErreur("");
  setEnChargement(true);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: formulaire.name,
        email: formulaire.email,
        password: formulaire.password,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erreur lors de l'inscription");
    }

    const data = await response.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setEnChargement(false);
    setEtape(2);
  } catch (err: any) {
    setEnChargement(false);
    setErreur(err.message || "Une erreur est survenue");
  }
};

  const forceMdp = (() => {
    const p = formulaire.password; if (!p.length) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const couleursForceMdp = ["#f87171","#fb923c","#E8FF5A","#4ade80"];
  const labelsForceMdp = ["Faible","Moyen","Bon","Fort"];

  const EtapeIdentite = (
    <motion.div key="s0"
      initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:-20 }} transition={{ duration:0.3 }}
      style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <ChampInput label="Nom complet" name="name" value={formulaire.name}
        onChange={surChangement} placeholder="Moussa Ndiaye" />
      <ChampInput label="Téléphone" name="phone" value={formulaire.phone}
        onChange={surChangement} placeholder="77 000 00 00" prefix="🇸🇳 +221" />
      <ChampInput label="Email" type="email" name="email" value={formulaire.email}
        onChange={surChangement} placeholder="moussa@exemple.com" />
    </motion.div>
  );

  const EtapeSecurite = (
    <motion.div key="s1"
      initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:-20 }} transition={{ duration:0.3 }}
      style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <ChampInput label="Mot de passe" type={voirMdp ? "text":"password"}
        name="password" value={formulaire.password} onChange={surChangement}
        placeholder="Minimum 8 caractères"
        suffix={
          <button type="button" onClick={() => setVoirMdp(!voirMdp)}
            style={{ background:"none", border:"none", cursor:"pointer",
              color:"rgba(255,255,255,0.3)", padding:0, display:"flex" }}>
            {voirMdp ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        }
      />
      {formulaire.password.length > 0 && (
        <div>
          <div style={{ display:"flex", gap:4, marginBottom:5 }}>
            {[0,1,2,3].map(i => (
              <motion.div key={i}
                animate={{ background: i < forceMdp ? couleursForceMdp[forceMdp-1] : "rgba(255,255,255,0.08)" }}
                style={{ flex:1, height:3, borderRadius:99 }} />
            ))}
          </div>
          <p style={{ fontSize:10, color: forceMdp > 0 ? couleursForceMdp[forceMdp-1] : TEXT_MUTED,
            fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase" }}>
            {forceMdp > 0 ? labelsForceMdp[forceMdp-1] : ""}
          </p>
        </div>
      )}
      <ChampInput label="Confirmer" type={voirMdp ? "text":"password"}
        name="confirm" value={formulaire.confirm} onChange={surChangement}
        placeholder="Répétez le mot de passe"
        suffix={formulaire.confirm.length > 0 && formulaire.confirm === formulaire.password
          ? <Check size={15} color="#4ade80"/> : null}
      />
      <p style={{ fontSize:11, color:TEXT_SOFT, lineHeight:1.6, fontWeight:400 }}>
        En créant un compte vous acceptez nos{" "}
        <a href="#" style={{ color:TEXT_MUTED, textDecoration:"underline" }}>CGU</a>{" "}
        et notre{" "}
        <a href="#" style={{ color:TEXT_MUTED, textDecoration:"underline" }}>Politique de confidentialité</a>.
      </p>
    </motion.div>
  );

  const EtapeTerminee = (
    <motion.div key="s2"
      initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      transition={{ duration:0.5 }}
      style={{ display:"flex", flexDirection:"column", alignItems:"center",
        textAlign:"center", gap:24, padding:"32px 0" }}>
      <motion.div
        initial={{ scale:0 }} animate={{ scale:1 }}
        transition={{ type:"spring", stiffness:200, damping:16, delay:0.1 }}
        style={{ width:80, height:80, borderRadius:99, background:"linear-gradient(135deg, #E8FF5A 0%, #4ade80 100%)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 8px 32px rgba(232,255,90,0.3)" }}>
        <Check size={36} color="#000" strokeWidth={2.5}/>
      </motion.div>
      <div>
        <h3 style={{ fontSize:28, fontWeight:600, letterSpacing:"-0.03em",
          color:TEXT_PRIMARY, marginBottom:12 }}>
          Bienvenue, {formulaire.name.split(" ")[0] || "ami"} 👋
        </h3>
        <p style={{ fontSize:14, color:TEXT_MUTED, lineHeight:1.6 }}>
          Votre compte DEUREUM est prêt.<br/>Dalal ak jamm.
        </p>
      </div>
      <motion.button onClick={() => navigate("/dashboard")}
        whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
        style={{ width:"100%", padding:"14px 0", borderRadius:14,
          border:"none", background:"#fff", color:"#000",
          fontSize:13, fontWeight:600, letterSpacing:"0.04em", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#E8FF5A")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#fff")}
      >
        Accéder à mon dashboard <ArrowRight size={14}/>
      </motion.button>
    </motion.div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily: "'Satoshi', sans-serif",
      background: "#030303", color: "#fff", overflow: "hidden" }}>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.2); }
        * { font-family: 'Satoshi', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
            backgroundImage: `linear-gradient(180deg, rgba(5,7,13,0.22) 0%, rgba(5,7,13,0.84) 100%), url(${registerBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        }}
      />

      <style>{`@media (min-width:900px){ .auth-left{ display:flex !important; } }`}</style>
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{
          display: "none",
          width: "48%", flexShrink: 0, position: "relative", zIndex: 1,
          padding: "60px 56px", flexDirection: "column", justifyContent: "space-between",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
        className="md-flex"
      >
        <style>{`
          @media (min-width: 900px) { .auth-left { display: flex !important; } }
        `}</style>
        <div className="auth-left" style={{ display: "none", position: "absolute", inset: 0,
          padding: "60px 56px", flexDirection: "column", justifyContent: "space-between" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logoFace} style={{ width: 32, height: 32, objectFit: "contain" }} alt="" />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", color: TEXT_PRIMARY }}>DEUREUM</span>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "40px 0" }}>
            <div style={{ width: "100%", maxWidth: 340 }}>
              <FloatingCards />
            </div>
          </div>

          <div>
            <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em",
              lineHeight: 1.35, color: TEXT_PRIMARY, marginBottom: 16 }}>
              "Votre voyage financier<br />
              <span style={{ color: TEXT_MUTED, fontStyle: "italic" }}>
                commence ici.
              </span>"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={logoPile} style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.4 }} alt="" />
              <span style={{ fontSize: 10, color: TEXT_SOFT,
                textTransform: "uppercase", letterSpacing: "0.2em" }}>Made in Dakar 🇸🇳</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 1, padding: "40px 24px" }}>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ width: "100%", maxWidth: 400 }}
        >
          {etape < 2 && (
            <>
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
                  <img src={logoFace} style={{ width: 28, height: 28, objectFit: "contain" }} alt="" />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: TEXT_MUTED }}>DEUREUM</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", marginBottom: 10 }}>
                  <h1 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.04em",
                    color: TEXT_PRIMARY, lineHeight: 1 }}>
                    {etape === 0 ? "Créer un compte." : "Sécurisez-le."}
                  </h1>
                  <PointsEtapes current={etape} total={2} />
                </div>
                <p style={{ fontSize: 13, color: TEXT_SECONDARY, fontWeight: 400, lineHeight: 1.6 }}>
                  {etape === 0
                    ? "Gratuit, pour toujours. Aucune carte requise."
                    : "Choisissez un mot de passe solide."}
                </p>
                {erreur && (
                  <p style={{
                    color: "#ff6b6b", fontSize: 12, marginBottom: 16,
                    textAlign: "center", fontWeight: 500,
                  }}>
                    {erreur}
                  </p>
                )}
              </div>

              <form onSubmit={etapeSuivante} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <AnimatePresence mode="wait">
                  {etape === 0 ? EtapeIdentite : EtapeSecurite}
                </AnimatePresence>

                <motion.button type="submit" disabled={enChargement}
                  whileHover={{ scale: enChargement ? 1 : 1.01 }}
                  whileTap={{ scale: enChargement ? 1 : 0.98 }}
                  style={{
                    marginTop: 8, width: "100%", padding: "14px 0",
                    borderRadius: 14, border: "none", cursor: enChargement ? "default" : "pointer",
                    background: enChargement ? "rgba(255,255,255,0.1)" : "#fff",
                    color: enChargement ? "rgba(255,255,255,0.4)" : "#000",
                    fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "background 0.2s, color 0.2s",
                    fontFamily: "'Satoshi', sans-serif",
                  }}
                  onMouseEnter={e => { if (!enChargement) (e.currentTarget as HTMLElement).style.background = "#E8FF5A"; }}
                  onMouseLeave={e => { if (!enChargement) (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                >
                  {enChargement ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        style={{ width: 14, height: 14, borderRadius: 99,
                          border: "2px solid rgba(255,255,255,0.2)",
                          borderTopColor: "rgba(255,255,255,0.6)" }}
                      />
                      Création…
                    </>
                  ) : etape === 0 ? (
                    <>Continuer <ArrowRight size={14}/></>
                  ) : (
                    <>Créer mon compte <ArrowRight size={14}/></>
                  )}
                </motion.button>
              </form>

              {etape === 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)",
                      textTransform: "uppercase", letterSpacing: "0.2em" }}>ou</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                  </div>
                  <button onClick={() => navigate("/dashboard")}
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(0,0,0,0.32)",
                      color: TEXT_SECONDARY, fontSize: 12, fontWeight: 500,
                      cursor: "pointer", letterSpacing: "0.04em",
                      fontFamily: "'Satoshi', sans-serif", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
                      (e.currentTarget as HTMLElement).style.color = "#fff";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLElement).style.color = TEXT_SECONDARY;
                    }}
                  >
                    Accéder à la démo →
                  </button>
                </>
              )}

              <p style={{ textAlign: "center", marginTop: 28, fontSize: 12,
                color: TEXT_MUTED, fontWeight: 400 }}>
                Déjà un compte ?{" "}
                <Link to="/login"
                  style={{ color: TEXT_PRIMARY, fontWeight: 600, textDecoration: "none",
                    transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E8FF5A")}
                  onMouseLeave={e => (e.currentTarget.style.color = TEXT_PRIMARY)}>
                  Se connecter
                </Link>
              </p>
            </>
          )}

          <AnimatePresence>{etape === 2 && EtapeTerminee}</AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
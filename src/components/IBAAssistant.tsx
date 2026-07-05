import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import iba1 from '/iba/iba_1.png';
import iba2 from '/iba/iba_2.png';
import iba3 from '/iba/iba_3.png';
import iba4 from '/iba/iba_4.png';
import iba5 from '/iba/iba_5.png';
import iba6 from '/iba/iba_6.png';
import iba7 from '/iba/iba_7.png';
import iba8 from '/iba/iba_8.png';
import iba9 from '/iba/iba_9.png';

const images = [
  iba1,
  iba2,
  iba3,
  iba4,
  iba5,
  iba6,
  iba7,
  iba8,
  iba9,
];

const dialogues = [
  'Bienvenue sur Deureum ! Je suis IBA, votre assistant financier.',
  'Besoin de conseils pour optimiser votre budget ? Je suis là pour ça.',
  'Analysons ensemble vos dépenses ce mois-ci.',
  'Une bonne gestion financière commence par de bonnes habitudes.',
  'Cliquez sur moi pour découvrir mes fonctionnalités.',
  'Vos objectifs financiers sont à portée de main avec Deureum.',
  'Je peux vous aider à planifier vos économisations intelligemment.',
  'Chaque euro compte quand il s\'agit de votre avenir financier.',
  'Sur Deureum, votre argent travaille pour vous.',
];

interface IBAAssistantProps {
  onOpenConseil: () => void;
}

export default function IBAAssistant({ onOpenConseil }: IBAAssistantProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [showDialogue, setShowDialogue] = useState(false);

  useEffect(() => {
    // Afficher le dialogue initial après 1.5s
    const initialTimeout = setTimeout(() => {
      setShowDialogue(true);
      setTimeout(() => setShowDialogue(false), 5000);
    }, 1500);

    // Changer l'image et le dialogue toutes les 8 secondes
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
      setCurrentDialogueIndex((prev) => (prev + 1) % dialogues.length);
      setShowDialogue(true);
      setTimeout(() => setShowDialogue(false), 5000);
    }, 8000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 cursor-pointer" onClick={onOpenConseil}>
      <AnimatePresence>
        {showDialogue && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-32 right-0 w-64 bg-gradient-to-br from-[#E8FF5A]/95 to-[#c4dd4a]/95 backdrop-blur-xl p-4 rounded-2xl border-2 border-[#E8FF5A] shadow-[0_0_40px_rgba(232,255,90,0.3)] pointer-events-none"
          >
            <div className="text-[9px] text-[#0f172a] font-bold tracking-widest uppercase mb-1">
              IBA
            </div>
            <div className="text-[#0f172a] text-xs leading-relaxed font-semibold">
              {dialogues[currentDialogueIndex]}
            </div>
            <div className="absolute bottom-[-12px] right-8 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#E8FF5A]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative w-[160px] h-[160px]"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
      >
        <motion.img
          key={currentImageIndex}
          src={images[currentImageIndex]}
          alt="IBA Assistant"
          className="w-full h-full object-contain drop-shadow-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      </motion.div>
    </div>
  );
}

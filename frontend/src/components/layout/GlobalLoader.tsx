import React from 'react';
import { motion } from 'framer-motion';

const GlobalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 backdrop-blur-md pointer-events-none">
      <div className="relative">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
            borderRadius: ["20%", "50%", "20%"]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent shadow-[0_0_30px_rgba(59,130,246,0.3)]"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] whitespace-nowrap"
        >
          Sincronizando...
        </motion.div>
      </div>
    </div>
  );
};

export default GlobalLoader;

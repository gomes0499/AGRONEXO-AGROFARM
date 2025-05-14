"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { EnhancedGroqChat } from "./groq-chat";
export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 z-50 w-[380px] md:w-[420px] max-h-[80vh]"
          >
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <EnhancedGroqChat
                initialPrompt="Você é um assistente agrícola especializado em produção rural, culturas, clima e mercado agrícola. Forneça respostas precisas e úteis sobre agricultura, pecuária e gestão rural."
                suggestions={[
                  "Como posso aumentar a produtividade?",
                  "Qual a previsão do tempo?",
                  "Como estão os preços do mercado?",
                ]}
                title="Assistente SR-Consultoria"
                height="70vh"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full h-10 w-10 shadow-lg z-50"
        size="icon"
        disabled={isOpen}
      >
        <Bot className="h-6 w-6" />
      </Button>
    </>
  );
}

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Phone, MessageCircle } from "lucide-react";

interface PhoneWithWhatsAppProps {
  phoneNumber: string;
  organizationName?: string;
  className?: string;
}

// Função para formatar telefone para WhatsApp
const formatWhatsAppNumber = (phone: string) => {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
};

// Função para formatar telefone para exibição
const formatPhoneDisplay = (phone: string) => {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
      7
    )}`;
  }

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(
      6
    )}`;
  }

  return phone;
};

// Função para gerar link do WhatsApp
const getWhatsAppLink = (phone: string, organizationName?: string) => {
  const phoneNumber = formatWhatsAppNumber(phone);
  const message = encodeURIComponent(
    organizationName
      ? `Olá! Entrei em contato através do sistema da ${organizationName}. Como posso ser ajudado?`
      : `Olá! Como posso ser ajudado?`
  );
  return `https://wa.me/${phoneNumber}?text=${message}`;
};

export function PhoneWithWhatsApp({
  phoneNumber,
  organizationName,
  className = "",
}: PhoneWithWhatsAppProps) {
  if (!phoneNumber) return <span>-</span>;

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5" />
          <span>{formatPhoneDisplay(phoneNumber)}</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-700"
              asChild
            >
              <a
                href={getWhatsAppLink(phoneNumber, organizationName)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Enviar mensagem no WhatsApp</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

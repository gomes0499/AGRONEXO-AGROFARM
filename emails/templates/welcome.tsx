import React from "react";
import { 
  Heading, 
  Section, 
  Text, 
  Button, 
  Link
} from "@react-email/components";
import { EmailLayout } from "../components/layout";

interface WelcomeEmailProps {
  userName: string;
  organizationName: string;
  loginUrl: string;
}

export default function WelcomeEmail({
  userName,
  organizationName,
  loginUrl,
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      title="Bem-vindo à SR-Consultoria"
      preview="Seja bem-vindo à plataforma SR-Consultoria para consultoria agrícola e financeira."
    >
      <Heading as="h2" style={headingStyle}>
        Olá, {userName}!
      </Heading>
      
      <Text style={paragraphStyle}>
        Seja bem-vindo à plataforma <strong>SR-Consultoria</strong> para consultoria agrícola e financeira. 
        Estamos felizes em tê-lo como parte da organização <strong>{organizationName}</strong>.
      </Text>
      
      <Text style={paragraphStyle}>
        Nossa plataforma oferece ferramentas poderosas para:
      </Text>
      
      <ul style={listStyle}>
        <li style={listItemStyle}>Gerenciamento de propriedades e terras</li>
        <li style={listItemStyle}>Análise de produção e produtividade</li>
        <li style={listItemStyle}>Planejamento financeiro e controle de custos</li>
        <li style={listItemStyle}>Projeções e simulações econômicas</li>
        <li style={listItemStyle}>Monitoramento de indicadores importantes</li>
      </ul>
      
      <Section style={buttonContainerStyle}>
        <Button style={buttonStyle} href={loginUrl}>
          Acessar a Plataforma
        </Button>
      </Section>
      
      <Text style={paragraphStyle}>
        Se precisar de qualquer ajuda, nossa equipe está à disposição para auxiliá-lo.
      </Text>
      
      <Text style={signatureStyle}>
        Atenciosamente,<br />
        Equipe SR-Consultoria
      </Text>
    </EmailLayout>
  );
}

// Estilos
const headingStyle = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "16px 0",
};

const paragraphStyle = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const listStyle = {
  margin: "16px 0",
  padding: "0 0 0 24px",
};

const listItemStyle = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const buttonContainerStyle = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const buttonStyle = {
  backgroundColor: "#111827",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const signatureStyle = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "24px 0 0",
};
import React from "react";
import { Heading, Section, Text, Button, Link } from "@react-email/components";
import { EmailLayout } from "../components/layout";

interface InvitationEmailProps {
  organizationName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  expiresIn: string;
  isReminder?: boolean;
}

export default function InvitationEmail({
  organizationName,
  inviterName,
  role,
  acceptUrl,
  expiresIn,
  isReminder = false,
}: InvitationEmailProps) {
  return (
    <EmailLayout
      title={
        isReminder
          ? `Lembrete: Convite para participar da ${organizationName}`
          : `Convite para participar da ${organizationName}`
      }
      preview={`Você foi convidado por ${inviterName} para se juntar à ${organizationName} na plataforma AGROFARM.`}
    >
      <Heading as="h2" style={headingStyle}>
        {isReminder
          ? "Lembrete: Você tem um convite pendente!"
          : "Você recebeu um convite!"}
      </Heading>

      <Text style={paragraphStyle}>
        <strong>{inviterName}</strong>{" "}
        {isReminder ? "te convidou anteriormente" : "convidou você"} para se
        juntar à organização <strong>{organizationName}</strong> na plataforma
        AGROFARM como <strong>{role}</strong>.
      </Text>

      <Text style={paragraphStyle}>
        A AGROFARM é uma plataforma especializada em consultoria agrícola e
        financeira para produtores rurais, oferecendo ferramentas para gestão
        completa de propriedades, análise de produção, planejamento financeiro e
        muito mais.
      </Text>

      <Section style={buttonContainerStyle}>
        <Button style={buttonStyle} href={acceptUrl}>
          Aceitar Convite
        </Button>
      </Section>

      <Text style={noteStyle}>Este convite expira em {expiresIn}.</Text>

      <Text style={paragraphStyle}>
        Se você não conhece esta pessoa ou organização, ou acredita que recebeu
        este convite por engano, basta ignorar este email.
      </Text>

      <Text style={signatureStyle}>
        Atenciosamente,
        <br />
        Equipe AGROFARM
      </Text>
    </EmailLayout>
  );
}

// Estilos
const headingStyle = {
  color: "#17134F",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "16px 0",
};

const paragraphStyle = {
  color: "#17134F",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const buttonContainerStyle = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const buttonStyle = {
  backgroundColor: "#17134F",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const noteStyle = {
  color: "#666666",
  fontSize: "14px",
  fontStyle: "italic",
  margin: "16px 0",
  textAlign: "center" as const,
};

const signatureStyle = {
  color: "#17134F",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "24px 0 0",
};

import React from "react";
import {
  Heading,
  Section,
  Text,
  Button,
  Link,
  Hr,
} from "@react-email/components";
import { EmailLayout } from "../components/layout";

interface AdminAccountEmailProps {
  organizationName: string;
  userEmail: string;
  password: string;
  loginUrl: string;
}

export default function AdminAccountEmail({
  organizationName,
  userEmail,
  password,
  loginUrl,
}: AdminAccountEmailProps) {
  return (
    <EmailLayout
      title={`Sua nova conta administrativa para ${organizationName}`}
      preview={`Uma conta de administrador foi criada para você na plataforma AGROFARM para a organização ${organizationName}.`}
    >
      <Heading as="h2" style={headingStyle}>
        Sua Conta Administrativa Foi Criada
      </Heading>

      <Text style={paragraphStyle}>
        Uma conta de administrador foi criada para você na plataforma AGROFARM
        para a organização <strong>{organizationName}</strong>.
      </Text>

      <Text style={paragraphStyle}>
        A AGROFARM é uma plataforma especializada em consultoria agrícola e
        financeira para produtores rurais, oferecendo ferramentas para gestão
        completa de propriedades, análise de produção, planejamento financeiro e
        muito mais.
      </Text>

      <Section style={credentialsContainerStyle}>
        <Text style={credentialsTitleStyle}>Seus Dados de Acesso</Text>
        <Text style={credentialsDetailStyle}>
          <strong>Email:</strong> {userEmail}
        </Text>
        <Text style={credentialsDetailStyle}>
          <strong>Senha Temporária:</strong> {password}
        </Text>
      </Section>

      <Text style={securityNoteStyle}>
        Por motivos de segurança, recomendamos que você altere sua senha
        imediatamente após o primeiro acesso.
      </Text>

      <Section style={buttonContainerStyle}>
        <Button style={buttonStyle} href={loginUrl}>
          Acessar o Sistema
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={instructionsHeadingStyle}>Após o primeiro acesso:</Text>

      <Text style={instructionsStyle}>
        1. Complete seu perfil com seus dados pessoais
        <br />
        2. Altere sua senha para uma de sua preferência
        <br />
        3. Configure suas preferências de notificação
      </Text>

      <Text style={paragraphStyle}>
        Se você não esperava receber este e-mail ou acredita que ele foi enviado
        por engano, entre em contato com o administrador da organização.
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

const credentialsContainerStyle = {
  margin: "24px 0",
  padding: "16px",
  backgroundColor: "#f7f7f9",
  borderRadius: "6px",
  border: "1px solid #e9e9ef",
};

const credentialsTitleStyle = {
  color: "#17134F",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const credentialsDetailStyle = {
  color: "#17134F",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const securityNoteStyle = {
  color: "#d63939",
  fontSize: "14px",
  margin: "12px 0",
  fontWeight: "bold",
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

const dividerStyle = {
  borderTop: "1px solid #e9e9ef",
  margin: "24px 0",
};

const instructionsHeadingStyle = {
  color: "#17134F",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "16px 0 8px 0",
};

const instructionsStyle = {
  color: "#17134F",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0 16px 0",
};

const signatureStyle = {
  color: "#17134F",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "24px 0 0",
};

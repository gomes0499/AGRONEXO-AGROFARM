import React from "react";
import { 
  Html, 
  Head, 
  Body, 
  Container, 
  Section, 
  Heading, 
  Text,
  Hr,
  Img,
  Link
} from "@react-email/components";

interface EmailLayoutProps {
  children: React.ReactNode;
  title?: string;
  preview?: string;
}

export const EmailLayout = ({
  children,
  title = "SR-Consultoria",
  preview = "Informações importantes da SR-Consultoria"
}: EmailLayoutProps) => {
  return (
    <Html>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading as="h1" style={headingStyle}>
              SR-Consultoria
            </Heading>
          </Section>
          
          <Section style={contentStyle}>
            {children}
          </Section>
          
          <Hr style={hrStyle} />
          
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              © {new Date().getFullYear()} SR-Consultoria. Todos os direitos reservados.
            </Text>
            <Text style={footerTextStyle}>
              Este é um email automático, por favor não responda.
            </Text>
            <Link href="https://sr-consultoria.com/privacidade" style={linkStyle}>
              Política de Privacidade
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Estilos
const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: "0",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #eaeaea",
  borderRadius: "8px",
  margin: "40px auto",
  padding: "0",
  width: "100%",
  maxWidth: "600px",
};

const headerStyle = {
  backgroundColor: "#111827",
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
};

const headingStyle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const contentStyle = {
  padding: "30px 40px",
};

const hrStyle = {
  borderColor: "#eaeaea",
  margin: "0",
};

const footerStyle = {
  padding: "20px 40px",
  textAlign: "center" as const,
};

const footerTextStyle = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
};

const linkStyle = {
  color: "#0070f3",
  fontSize: "14px",
  textDecoration: "underline",
};
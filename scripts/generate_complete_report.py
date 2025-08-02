#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de Relatório Completo - SR Consultoria
Combina capa + avisos + conteúdo em um único PDF
"""

import sys
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.units import cm, mm
import requests
import numpy as np

# Paleta de cores
COLORS = {
    'primary': HexColor('#1e293b'),      # slate-800
    'secondary': HexColor('#334155'),     # slate-700
    'tertiary': HexColor('#475569'),     # slate-600
    'light': HexColor('#64748b'),        # slate-500
    'lighter': HexColor('#94a3b8'),      # slate-400
    'lightest': HexColor('#cbd5e1'),     # slate-300
    'bg_light': HexColor('#f8fafc'),     # slate-50
    'white': HexColor('#ffffff'),
}

# Meses em português
MESES_PT = {
    1: 'JANEIRO', 2: 'FEVEREIRO', 3: 'MARÇO', 4: 'ABRIL',
    5: 'MAIO', 6: 'JUNHO', 7: 'JULHO', 8: 'AGOSTO',
    9: 'SETEMBRO', 10: 'OUTUBRO', 11: 'NOVEMBRO', 12: 'DEZEMBRO'
}

class CompleteReportCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        self.organization_name = kwargs.pop('organization_name', 'CLIENTE')
        self.report_period = kwargs.pop('report_period', 'Safras 2021/22 - 2029/30')
        self.data = kwargs.pop('data', {})
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.width, self.height = A4
        self.page_num = 0
        
    def showPage(self):
        """Sobrescrever para adicionar diferentes páginas"""
        self.page_num += 1
        
        if self.page_num == 1:
            self.draw_cover_page()
        elif self.page_num == 2:
            self.draw_avisos_page()
        elif self.page_num == 3:
            self.draw_organization_data_page()
        elif self.page_num == 4:
            self.draw_properties_page()
        elif self.page_num == 5:
            self.draw_planting_area_page()
        elif self.page_num == 6:
            self.draw_productivity_page()
        elif self.page_num == 7:
            self.draw_revenue_projections_page()
        elif self.page_num == 8:
            self.draw_financial_evolution_page()
        elif self.page_num == 9:
            self.draw_liabilities_page()
        elif self.page_num == 10:
            self.draw_economic_indicators_page()
        elif self.page_num == 11:
            self.draw_cash_flow_page()
        elif self.page_num == 12:
            self.draw_dre_page()
        elif self.page_num == 13:
            self.draw_balance_sheet_page()
        elif self.page_num == 14:
            self.draw_thank_you_page()
        else:
            # Outras páginas futuras
            pass
            
        canvas.Canvas.showPage(self)
    
    def draw_cover_page(self):
        """Desenhar página de capa"""
        # Fundo branco
        self.setFillColor(COLORS['white'])
        self.rect(0, 0, self.width, self.height, stroke=0, fill=1)
        
        
        # === HEADER ===
        x_logo = 60
        y_logo = self.height - 60
        
        # Logo SR CONSULTORIA - seguindo design da imagem
        # SR em azul escuro
        sr_color = HexColor('#17134F')  # Cor correta do logo
        
        # S
        self.setFont("Helvetica-Bold", 36)
        self.setFillColor(sr_color)
        self.drawString(x_logo, y_logo, "S")
        
        # R
        s_width = self.stringWidth("S", "Helvetica-Bold", 36)
        self.drawString(x_logo + s_width, y_logo, "R")
        
        # CONSULTORIA em preto
        sr_width = self.stringWidth("SR", "Helvetica-Bold", 36)
        self.setFont("Helvetica", 20)
        self.setFillColor(HexColor('#000000'))
        self.drawString(x_logo + sr_width + 6, y_logo + 3, "CONSULTORIA")  # Reduzido de 12 para 6
        
        # Barra vertical | após CONSULTORIA
        consultoria_width = self.stringWidth("CONSULTORIA", "Helvetica", 20)
        self.setStrokeColor(sr_color)
        self.setLineWidth(3)  # Aumentado de 2 para 3
        self.line(x_logo + sr_width + 6 + consultoria_width + 8, y_logo - 5, 
                  x_logo + sr_width + 6 + consultoria_width + 8, y_logo + 20)
        
        # Data
        now = datetime.now()
        mes = MESES_PT.get(now.month, now.strftime('%B').upper())
        data_texto = f"{now.day} DE {mes} DE {now.year}"
        
        self.setFont("Helvetica", 14)
        self.setFillColor(COLORS['light'])
        self.drawRightString(self.width - 60, y_logo + 5, data_texto)
        
        # === CONTEÚDO PRINCIPAL ===
        center_y = self.height / 2 + 20
        x_start = 60
        
        # Linha decorativa
        self.setStrokeColor(COLORS['primary'])
        self.setLineWidth(2)
        self.line(x_start, center_y + 140, x_start + 40, center_y + 140)
        
        # Label
        self.setFont("Helvetica-Bold", 14)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_start + 52, center_y + 135, "RELATÓRIO EXECUTIVO")
        
        # Título - primeira linha
        self.setFont("Helvetica", 56)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_start, center_y + 50, "Análise Econômica")
        
        # Título - segunda linha
        self.setFont("Helvetica-Bold", 56)
        self.drawString(x_start, center_y - 20, "e Financeira")
        
        # Nome da organização
        self.setFont("Helvetica-Bold", 32)
        self.setFillColor(COLORS['secondary'])
        self.drawString(x_start, center_y - 110, self.organization_name.upper())
        
        # === FOOTER ===
        y_footer = 80
        
        # Info direita
        self.setFont("Helvetica", 12)
        self.setFillColor(COLORS['light'])
        self.drawRightString(self.width - 60, y_footer + 20, "ANÁLISE COMPLETA")
        
        self.setFont("Helvetica-Bold", 16)
        self.setFillColor(COLORS['secondary'])
        self.drawRightString(self.width - 60, y_footer, self.report_period)
        
        # Linha inferior com gradiente
        bar_height = 6
        sections = 5
        section_width = self.width / sections
        
        colors_gradient = [COLORS['primary'], COLORS['secondary'], COLORS['tertiary'], 
                          COLORS['secondary'], COLORS['primary']]
        
        for i in range(sections):
            self.setFillColor(colors_gradient[i])
            self.rect(i * section_width, 0, section_width, bar_height, stroke=0, fill=1)
    
    def draw_avisos_page(self):
        """Desenhar página de avisos legais"""
        # Fundo branco
        self.setFillColor(COLORS['white'])
        self.rect(0, 0, self.width, self.height, stroke=0, fill=1)
        
        # === ELEMENTOS DE FUNDO ===
        self.saveState()
        
        # Círculo decorativo superior direito
        self.setStrokeColor(Color(0.12, 0.16, 0.23, alpha=0.03))
        self.setLineWidth(1)
        self.circle(self.width - 200, self.height - 300, 300, stroke=1, fill=0)
        
        # Quadrado decorativo inferior esquerdo
        self.setFillColor(Color(0.12, 0.16, 0.23, alpha=0.02))
        self.saveState()
        self.translate(100, 100)
        self.rotate(45)
        self.rect(-100, -100, 200, 200, stroke=0, fill=1)
        self.restoreState()
        
        self.restoreState()
        
        # === HEADER ===
        x_margin = 60
        y_start = self.height - 80  # Aumentado de 60 para 80 (mais margem top)
        
        # Título "Avisos Legais"
        self.setFont("Helvetica", 36)  # Reduzido de 48 para 36
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_start, "Avisos Legais")
        
        # Linha decorativa abaixo do título
        self.setStrokeColor(COLORS['primary'])
        self.setLineWidth(3)
        self.line(x_margin, y_start - 35, x_margin + 80, y_start - 35)
        
        # === AVISOS ===
        avisos = [
            {
                'numero': '1',
                'titulo': 'CONFIDENCIALIDADE',
                'texto': f'Todas as informações fornecidas pela empresa {self.organization_name} à SR Consultoria, incluindo, mas não se limitando a, planos estratégicos, objetivos empresariais, estratégias comerciais e metodologias de produção, são consideradas estritamente confidenciais e serão tratadas com o mais alto grau de sigilo profissional.'
            },
            {
                'numero': '2',
                'titulo': 'PREMISSAS E PROJEÇÕES',
                'texto': 'As análises, projeções e cenários apresentados neste relatório baseiam-se em premissas consideradas razoáveis na data de sua elaboração. Tais projeções estão sujeitas a incertezas inerentes ao ambiente de negócios e podem ser significativamente afetadas por mudanças nas condições econômicas, mercadológicas ou regulatórias.'
            },
            {
                'numero': '3',
                'titulo': 'RESPONSABILIDADE PELAS INFORMAÇÕES',
                'texto': 'Este relatório foi elaborado com base em dados e informações fornecidos exclusivamente pelo cliente. A SR Consultoria não realizou auditoria independente destes dados, sendo de inteira responsabilidade do cliente a veracidade, precisão e completude das informações disponibilizadas.'
            },
            {
                'numero': '4',
                'titulo': 'CARÁTER DINÂMICO DAS ANÁLISES',
                'texto': 'As conclusões e recomendações contidas neste documento refletem as condições vigentes na data de sua elaboração. Recomenda-se a revisão periódica das análises e estratégias propostas para adequação às mudanças do ambiente empresarial e manutenção de sua eficácia.'
            }
        ]
        
        y_current = y_start - 90  # Subir os avisos
        
        for aviso in avisos:
            # Box com número
            box_size = 36
            box_y = y_current - box_size + 8
            self.setFillColor(COLORS['primary'])
            self.roundRect(x_margin, box_y, box_size, box_size, 4, stroke=0, fill=1)
            
            # Número (centralizado vertical e horizontalmente)
            self.setFont("Helvetica-Bold", 14)
            self.setFillColor(COLORS['white'])
            text_width = self.stringWidth(aviso['numero'], "Helvetica-Bold", 14)
            # Centralizar horizontalmente
            text_x = x_margin + (box_size - text_width) / 2
            # Centralizar verticalmente (considerando altura da fonte)
            text_y = box_y + (box_size / 2) - 5  # -5 é ajuste fino para altura da fonte
            self.drawString(text_x, text_y, aviso['numero'])
            
            # Título do aviso
            self.setFont("Helvetica-Bold", 14)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin + 50, y_current - 2, aviso['titulo'])
            
            # Texto do aviso
            self.setFont("Helvetica", 12)
            self.setFillColor(COLORS['tertiary'])
            
            # Quebrar texto em linhas
            text_x = x_margin + 50
            text_width = self.width - x_margin - 80 - 50
            words = aviso['texto'].split()
            lines = []
            current_line = []
            
            for word in words:
                test_line = ' '.join(current_line + [word])
                if self.stringWidth(test_line, "Helvetica", 12) <= text_width:
                    current_line.append(word)
                else:
                    if current_line:
                        lines.append(' '.join(current_line))
                    current_line = [word]
            
            if current_line:
                lines.append(' '.join(current_line))
            
            # Desenhar linhas de texto
            y_text = y_current - 20
            for line in lines:
                self.drawString(text_x, y_text, line)
                y_text -= 15
            
            y_current -= (len(lines) * 15 + 45)
        
        # === WARNING BOX ===
        warning_y = y_current - 15
        warning_height = 40
        
        # Fundo do warning box
        self.setFillColor(COLORS['bg_light'])
        self.roundRect(x_margin, warning_y - warning_height, self.width - 2*x_margin, warning_height, 4, stroke=0, fill=1)
        
        # Borda esquerda
        self.setFillColor(COLORS['primary'])
        self.rect(x_margin, warning_y - warning_height, 4, warning_height, stroke=0, fill=1)
        
        # Texto do warning
        self.setFont("Helvetica-Oblique", 11)
        self.setFillColor(COLORS['tertiary'])
        warning_text = f"Este documento é de propriedade exclusiva de {self.organization_name} e não deve ser reproduzido, distribuído ou divulgado a terceiros sem autorização expressa."
        
        # Quebrar texto do warning
        warning_x = x_margin + 32
        warning_width = self.width - 2*x_margin - 64
        words = warning_text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            if self.stringWidth(test_line, "Helvetica-Oblique", 11) <= warning_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        # Desenhar texto do warning
        y_warning_text = warning_y - 18
        for line in lines:
            self.drawString(warning_x, y_warning_text, line)
            y_warning_text -= 14
        
        # Footer removido conforme solicitado
    
    def draw_organization_data_page(self):
        """Desenhar página de dados da organização"""
        # Fundo branco
        self.setFillColor(COLORS['white'])
        self.rect(0, 0, self.width, self.height, stroke=0, fill=1)
        
        
        x_margin = 60
        y_start = self.height - 80  # Mesma margem top da página de avisos
        
        # === HEADER ===
        # Título "Informações Cadastrais"
        self.setFont("Helvetica", 36)  # Mesmo tamanho da página de avisos
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_start, "Informações Cadastrais")
        
        # Linha decorativa abaixo do título
        self.setStrokeColor(COLORS['primary'])
        self.setLineWidth(3)
        self.line(x_margin, y_start - 35, x_margin + 80, y_start - 35)
        
        # === INFORMAÇÕES DA EMPRESA ===
        y_current = y_start - 80  # Ajustado para o novo layout
        
        # Obter dados da organização
        org_data = self.data.get('organization', {})
        
        # Formatar CPF/CNPJ
        cpf = org_data.get('cpf', '')
        cnpj = org_data.get('cnpj', '')
        if cpf:
            # Formatar CPF: xxx.xxx.xxx-xx
            cpf_formatado = f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}" if len(cpf) == 11 else cpf
            doc = cpf_formatado
        elif cnpj:
            # Formatar CNPJ: xx.xxx.xxx/xxxx-xx
            cnpj_formatado = f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}" if len(cnpj) == 14 else cnpj
            doc = cnpj_formatado
        else:
            doc = 'Não informado'
            
        # Formatar telefone
        telefone = org_data.get('telefone', '')
        if telefone and len(telefone) == 11:
            # Formatar telefone: (xx) xxxxx-xxxx
            telefone_formatado = f"({telefone[:2]}) {telefone[2:7]}-{telefone[7:]}"
        else:
            telefone_formatado = telefone or 'Não informado'
        
        # Grid de informações
        info_items = [
            ("RAZÃO SOCIAL", org_data.get('nome', self.organization_name), True),
            ("CPF/CNPJ", doc, False),
            ("E-MAIL", org_data.get('email', 'Não informado'), False),
            ("TELEFONE", telefone_formatado, False),
        ]
        
        # Desenhar informações em grid
        col1_x = x_margin
        col2_x = self.width / 2
        
        for i, (label, value, is_large) in enumerate(info_items):
            x_pos = col1_x if i % 2 == 0 else col2_x
            y_pos = y_current - (i // 2 * 60)
            
            
            # Label
            self.setFont("Helvetica-Bold", 12)
            self.setFillColor(COLORS['light'])
            self.drawString(x_pos, y_pos, label)
            
            # Valor
            if is_large:
                self.setFont("Helvetica-Bold", 20)
            else:
                self.setFont("Helvetica", 18)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_pos, y_pos - 20, value)
        
        # === ENDEREÇO ===
        y_current = y_current - 140
        
        # Linha divisória
        self.setStrokeColor(COLORS['lightest'])
        self.setLineWidth(1)
        self.line(x_margin, y_current + 20, self.width - x_margin, y_current + 20)
        
        
        self.setFont("Helvetica-Bold", 12)
        self.setFillColor(COLORS['light'])
        self.drawString(col1_x, y_current - 20, "ENDEREÇO COMERCIAL")
        
        # Endereço completo
        self.setFont("Helvetica", 16)
        self.setFillColor(COLORS['primary'])
        
        endereco = org_data.get('endereco', {})
        if isinstance(endereco, dict) and endereco:
            # Montar primeira linha do endereço
            primeira_linha = endereco.get('logradouro', '')
            if endereco.get('numero'):
                primeira_linha += f", nº {endereco.get('numero')}"
            if endereco.get('complemento'):
                primeira_linha += f", {endereco.get('complemento')}"
                
            # Formatar CEP
            cep = endereco.get('cep', '')
            if cep and len(cep) == 8:
                cep_formatado = f"{cep[:5]}-{cep[5:]}"
            else:
                cep_formatado = cep
                
            endereco_linhas = [
                primeira_linha,
                f"{endereco.get('bairro', '')} - {endereco.get('cidade', '')}, {endereco.get('estado', '')}",
                f"CEP {cep_formatado}"
            ]
        else:
            endereco_linhas = ["Endereço não informado"]
        
        y_addr = y_current - 45
        for linha in endereco_linhas:
            if linha and linha != " - , ":
                self.drawString(col1_x, y_addr, linha)
                y_addr -= 20
        
        # === ESTRUTURA SOCIETÁRIA ===
        y_current = y_current - 140
        
        self.setFont("Helvetica", 28)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_current, "Estrutura Societária")
        
        # Dados da estrutura societária
        y_cards = y_current - 40
        estrutura_societaria = org_data.get('estrutura_societaria', [])
        
        # Processar e agrupar por tipo
        pessoas_fisicas = []
        pessoas_juridicas = []
        
        for membro in estrutura_societaria:
            if membro.get('tipo_documento') == 'cpf':
                pessoas_fisicas.append(membro.get('nome', 'Nome não informado'))
            else:
                pessoas_juridicas.append(membro.get('nome', 'Nome não informado'))
        
        # Desenhar seção de Pessoas Físicas
        if pessoas_fisicas:
            self.setFont("Helvetica-Bold", 14)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin, y_cards, "PESSOAS FÍSICAS")
            
            y_cards -= 25
            for nome in pessoas_fisicas:
                # Bullet point
                self.setFillColor(COLORS['primary'])
                self.circle(x_margin + 10, y_cards + 4, 3, stroke=0, fill=1)
                
                # Nome
                self.setFont("Helvetica", 12)
                self.setFillColor(COLORS['tertiary'])
                self.drawString(x_margin + 25, y_cards, nome)
                y_cards -= 20
        
        # Espaço entre seções
        y_cards -= 15
        
        # Desenhar seção de Pessoas Jurídicas
        if pessoas_juridicas:
            self.setFont("Helvetica-Bold", 14)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin, y_cards, "PESSOAS JURÍDICAS")
            
            y_cards -= 25
            for nome in pessoas_juridicas:
                # Bullet point
                self.setFillColor(COLORS['secondary'])
                self.circle(x_margin + 10, y_cards + 4, 3, stroke=0, fill=1)
                
                # Nome
                self.setFont("Helvetica", 12)
                self.setFillColor(COLORS['tertiary'])
                # Truncar nome longo
                if len(nome) > 50:
                    nome = nome[:47] + "..."
                self.drawString(x_margin + 25, y_cards, nome)
                y_cards -= 20
        
        # === RESUMO ===
        y_resumo = y_cards - 40
        
        # Box de resumo
        resumo_height = 50
        # Fundo removido para deixar mais limpo
        # self.setFillColor(Color(0.12, 0.16, 0.23, alpha=0.04))
        # self.roundRect(x_margin, y_resumo - resumo_height, self.width - 2*x_margin, resumo_height, 8, stroke=0, fill=1)
        
        # Contar pessoas físicas e jurídicas
        pf_count = len(pessoas_fisicas)
        pj_count = len(pessoas_juridicas)
        total_count = pf_count + pj_count
        
        # Texto do resumo
        resumo_y = y_resumo - resumo_height/2 - 5
        
        # Total de sócios
        self.setFont("Helvetica-Bold", 20)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 20, resumo_y, f"{total_count}")
        
        self.setFont("Helvetica", 14)
        self.setFillColor(COLORS['tertiary'])
        self.drawString(x_margin + 45, resumo_y, "sócios no total")
        
        # Separador
        self.setStrokeColor(COLORS['lightest'])
        self.setLineWidth(1)
        separator_x = x_margin + 180
        self.line(separator_x, y_resumo - resumo_height + 10, separator_x, y_resumo - 10)
        
        # Detalhamento
        self.setFont("Helvetica", 12)
        self.setFillColor(COLORS['light'])
        detail_text = f"{pf_count} {'pessoa física' if pf_count == 1 else 'pessoas físicas'}"
        if pj_count > 0:
            detail_text += f" e {pj_count} {'pessoa jurídica' if pj_count == 1 else 'pessoas jurídicas'}"
        self.drawString(separator_x + 20, resumo_y, detail_text)
        
        # Footer removido conforme solicitado
    
    def draw_properties_page(self):
        """Desenhar página de propriedades rurais"""
        # Fundo branco
        self.setFillColor(COLORS['white'])
        self.rect(0, 0, self.width, self.height, stroke=0, fill=1)
        
        
        x_margin = 60
        y_start = self.height - 80  # Mesma margem top das outras páginas
        
        # === HEADER ===
        # Título "Patrimônio Imobiliário"
        self.setFont("Helvetica", 36)  # Mesmo tamanho das outras páginas
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_start, "Patrimônio Imobiliário")
        
        # Linha decorativa abaixo do título
        self.setStrokeColor(COLORS['primary'])
        self.setLineWidth(3)
        self.line(x_margin, y_start - 35, x_margin + 80, y_start - 35)
        
        # Subtítulo/descrição
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        self.drawString(x_margin, y_start - 55, "Análise completa do patrimônio imobiliário e distribuição de valor por propriedade")
        
        # === MÉTRICAS ===
        y_metrics = y_start - 60  # Subir ainda mais o card
        
        # Obter dados
        props_data = self.data.get('properties', {})
        stats = props_data.get('stats', {})
        properties_list = props_data.get('list', [])
        
        # Calcular métricas
        total_fazendas = stats.get('totalFazendas', 0)
        total_proprias = stats.get('totalProprias', 0)
        total_arrendadas = stats.get('totalArrendadas', 0)
        area_total = stats.get('areaTotal', 0)
        area_propria_percent = stats.get('areaPercentualPropria', 0)
        area_arrendada_percent = stats.get('areaPercentualArrendada', 0)
        valor_patrimonial = stats.get('valorPatrimonial', 0)
        area_cultivavel = stats.get('areaCultivavel', 0)
        percent_cultivavel = (area_cultivavel / area_total * 100) if area_total > 0 else 0
        
        # Cards de métricas - removida área cultivável
        metrics = [
            {
                'value': str(total_fazendas),
                'label': 'Total de Fazendas',
                'sublabel': f'{total_proprias} próprias • {total_arrendadas} arrendadas',
                'is_currency': False
            },
            {
                'value': f'{area_total:,.0f}'.replace(',', '.'),
                'label': 'Área Total (ha)',
                'sublabel': f'{area_propria_percent:.0f}% própria • {area_arrendada_percent:.0f}% arrendada',
                'is_currency': False
            },
            {
                'value': f'R$ {valor_patrimonial/1_000_000:.1f}M',
                'label': 'Valor Patrimonial',
                'sublabel': 'Propriedades próprias',
                'is_currency': True
            }
        ]
        
        # Desenhar um único card grande com divisórias
        card_height = 80  # Aumentado de 70
        # Fundo único para todas as métricas (removido para deixar mais limpo)
        # self.setFillColor(Color(0.12, 0.16, 0.23, alpha=0.04))
        # self.roundRect(x_margin, y_metrics - card_height, self.width - 2*x_margin, card_height, 8, stroke=0, fill=1)
        
        # Desenhar métricas
        section_width = (self.width - 2*x_margin) / 3  # Alterado de 4 para 3
        
        for i, metric in enumerate(metrics):
            x_section = x_margin + i * section_width
            
            # Divisória vertical (exceto para a primeira métrica)
            if i > 0:
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(1)
                self.line(x_section, y_metrics - card_height + 15, x_section, y_metrics - 15)
            
            # Centro da seção
            x_center = x_section + section_width / 2
            
            # Valor (centralizado vertical e horizontalmente)
            self.setFont("Helvetica-Bold", 20)  # Mesmo tamanho para todas as métricas
            self.setFillColor(COLORS['primary'])
            value_width = self.stringWidth(metric['value'], "Helvetica-Bold", 20)
            # Posição vertical centralizada no card
            value_y = y_metrics - (card_height/2) + 10  # Centralizado verticalmente
            self.drawString(x_center - value_width/2, value_y, metric['value'])
            
            # Label (centralizado)
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(COLORS['light'])
            label_width = self.stringWidth(metric['label'].upper(), "Helvetica-Bold", 8)
            self.drawString(x_center - label_width/2, value_y - 20, metric['label'].upper())
            
            # Sublabel (centralizado)
            self.setFont("Helvetica", 7)
            self.setFillColor(COLORS['lighter'])
            # Para sublabels longos, quebrar em duas linhas
            if ' • ' in metric['sublabel']:
                parts = metric['sublabel'].split(' • ')
                for j, part in enumerate(parts):
                    part_width = self.stringWidth(part, "Helvetica", 7)
                    self.drawString(x_center - part_width/2, value_y - 33 - j*9, part)
            else:
                sublabel_width = self.stringWidth(metric['sublabel'], "Helvetica", 7)
                self.drawString(x_center - sublabel_width/2, value_y - 33, metric['sublabel'])
        
        # === GRÁFICO DE BARRAS ===
        y_chart = y_metrics - 120  # Subir o gráfico
        
        self.setFont("Helvetica", 16)  # Reduzir fonte do título
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_chart, "Ranking Patrimonial das Propriedades")
        
        # Área do gráfico
        chart_y = y_chart - 50
        chart_height = 220  # Ajustado
        chart_x = x_margin + 40  # Espaço para eixo Y
        chart_width = self.width - 2*x_margin - 80
        
        # Eixo Y - 0 embaixo, 70 em cima
        max_value = 70  # 70 milhões
        y_labels = [0, 10, 30, 50, 70]  # Ordem crescente
        
        for i, label in enumerate(y_labels):
            # Calcular posição Y (0 na base, 70 no topo)
            y_pos = chart_y - chart_height + (i * chart_height / (len(y_labels) - 1))
            
            # Label
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['light'])
            self.drawRightString(chart_x - 15, y_pos - 3, f"{label}M")
            
            # Linha guia
            if label > 0:  # Não desenhar linha no 0
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(0.5)
                self.line(chart_x - 5, y_pos, chart_x + chart_width, y_pos)
        
        # Ordenar propriedades por valor
        sorted_props = sorted(properties_list, key=lambda x: x.get('valor_atual', 0), reverse=True)[:15]
        
        # Desenhar barras
        if sorted_props:
            bar_spacing = 4  # Reduzir espaçamento
            bar_width = (chart_width - (len(sorted_props) - 1) * bar_spacing) / len(sorted_props)
            bar_width = min(bar_width, 30)  # Largura máxima reduzida
            
            for i, prop in enumerate(sorted_props):
                x_bar = chart_x + i * (bar_width + bar_spacing)
                valor = prop.get('valor_atual', 0) / 1_000_000  # Em milhões
                bar_height = (valor / max_value) * chart_height
                bar_height = max(bar_height, 5)  # Altura mínima
                
                # Barra (crescendo de baixo para cima)
                self.setFillColor(COLORS['primary'])
                bar_y = chart_y - chart_height  # Base do gráfico
                self.rect(x_bar, bar_y, bar_width, bar_height, stroke=0, fill=1)
                
                # Valor acima da barra
                self.setFont("Helvetica-Bold", 7)
                self.setFillColor(COLORS['primary'])
                valor_text = f"R$ {valor:.1f}M"
                text_width = self.stringWidth(valor_text, "Helvetica-Bold", 7)
                self.drawString(x_bar + (bar_width - text_width)/2, 
                              bar_y + bar_height + 5, valor_text)
                
                # Nome da propriedade (rotacionado)
                self.saveState()
                self.translate(x_bar + bar_width/2, bar_y - 25)  # Aumentado de -15 para -25 (mais espaço)
                self.rotate(-45)
                self.setFont("Helvetica", 7)
                self.setFillColor(COLORS['tertiary'])
                nome = prop.get('nomeClean', prop.get('nome', 'N/A'))
                if len(nome) > 10:
                    nome = nome[:8] + ".."
                self.drawRightString(0, 0, nome)  # Usar drawRightString para melhor alinhamento
                self.restoreState()
        
        
    def draw_planting_area_page(self):
        """Página 5 - Evolução da Área Plantada"""
        # Margens
        x_margin = 70
        y_margin = self.height - 100
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Evolução da Área Plantada")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        self.drawString(x_margin, bar_y - 20, "Análise temporal da distribuição de culturas e crescimento da área cultivada")
        
        # === CARDS DE MÉTRICAS ===
        y_metrics = y_margin - 50  # Subir as métricas
        
        # Obter dados de área plantada
        planting_areas = self.data.get('plantingAreas', {})
        if isinstance(planting_areas, dict) and 'plantingAreas' in planting_areas:
            planting_areas = planting_areas['plantingAreas']
        
        chart_data = planting_areas.get('chartData', []) if isinstance(planting_areas, dict) else []
        
        # Calcular métricas
        if chart_data:
            # Área inicial (primeira safra)
            initial_area = chart_data[0].get('total', 0) or sum(chart_data[0].get('culturas', {}).values())
            
            # Área final (última safra)
            final_area = chart_data[-1].get('total', 0) or sum(chart_data[-1].get('culturas', {}).values())
            
            # Crescimento total
            growth = ((final_area - initial_area) / initial_area * 100) if initial_area > 0 else 0
            
            # Número de culturas únicas
            all_crops = set()
            for safra in chart_data:
                all_crops.update(safra.get('culturas', {}).keys())
            num_crops = len(all_crops)
        else:
            initial_area = 0
            final_area = 0
            growth = 0
            num_crops = 0
        
        # Cards de métricas
        metrics = [
            {
                'value': f'{initial_area/1000:.1f}k',
                'label': 'Área Inicial (ha)',
                'sublabel': f'Safra {chart_data[0]["safra"] if chart_data else "N/A"}',
                'is_currency': False
            },
            {
                'value': f'{final_area/1000:.1f}k',
                'label': 'Área Final (ha)',
                'sublabel': f'Safra {chart_data[-1]["safra"] if chart_data else "N/A"}',
                'is_currency': False
            },
            {
                'value': f'{growth:+.1f}%',
                'label': 'Crescimento Total',
                'sublabel': f'{(final_area - initial_area)/1000:.1f}k ha',
                'is_currency': False
            },
            {
                'value': str(num_crops),
                'label': 'Culturas',
                'sublabel': 'Diferentes tipos',
                'is_currency': False
            }
        ]
        
        # Desenhar um único card grande com divisórias
        card_height = 60  # Reduzido de 80 para 60
        # Fundo único para todas as métricas (removido para deixar mais limpo)
        # self.setFillColor(Color(0.12, 0.16, 0.23, alpha=0.04))
        # self.roundRect(x_margin, y_metrics - card_height, self.width - 2*x_margin, card_height, 8, stroke=0, fill=1)
        
        # Desenhar métricas
        section_width = (self.width - 2*x_margin) / 4
        
        for i, metric in enumerate(metrics):
            x_section = x_margin + i * section_width
            
            # Divisória vertical (exceto para a primeira métrica)
            if i > 0:
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(1)
                self.line(x_section, y_metrics - card_height + 15, x_section, y_metrics - 15)
            
            # Centro da seção
            x_center = x_section + section_width / 2
            
            # Valor (centralizado vertical e horizontalmente)
            self.setFont("Helvetica-Bold", 18)  # Reduzido de 20
            self.setFillColor(COLORS['primary'])
            value_width = self.stringWidth(metric['value'], "Helvetica-Bold", 18)
            value_y = y_metrics - (card_height/2) + 8
            self.drawString(x_center - value_width/2, value_y, metric['value'])
            
            # Label (centralizado)
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(COLORS['light'])
            label_width = self.stringWidth(metric['label'].upper(), "Helvetica-Bold", 8)
            self.drawString(x_center - label_width/2, value_y - 16, metric['label'].upper())
            
            # Sublabel (centralizado)
            self.setFont("Helvetica", 7)
            self.setFillColor(COLORS['lighter'])
            sublabel_width = self.stringWidth(metric['sublabel'], "Helvetica", 7)
            self.drawString(x_center - sublabel_width/2, value_y - 26, metric['sublabel'])
        
        # === GRÁFICO DE BARRAS EMPILHADAS ===
        y_chart = y_metrics - 90  # Reduzido espaço entre métricas e gráfico
        
        self.setFont("Helvetica", 16)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_chart, "Evolução por Cultura")
        
        # Área do gráfico
        chart_y = y_chart - 50
        chart_height = 220
        chart_x = x_margin + 40
        chart_width = self.width - 2*x_margin - 80
        
        if chart_data:
            # Encontrar valor máximo para escala
            max_value = max(safra.get('total', 0) or sum(safra.get('culturas', {}).values()) for safra in chart_data)
            max_value = int(max_value * 1.1)  # 10% de margem
            
            # Arredondar para múltiplo de 10000
            max_value = ((max_value // 10000) + 1) * 10000
            
            # Eixo Y
            y_steps = 5
            for i in range(y_steps):
                y_pos = chart_y - chart_height + (i * chart_height / (y_steps - 1))
                value = int(max_value * i / (y_steps - 1))
                
                # Grid line
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(0.5)
                self.line(chart_x, y_pos, chart_x + chart_width, y_pos)
                
                # Label
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['light'])
                label = f'{value/1000:.0f}k' if value > 0 else '0'
                self.drawRightString(chart_x - 10, y_pos - 3, label)
            
            # Cores das culturas - seguindo padrão do relatório
            base_color = COLORS['primary']  # #17134F
            crop_colors = {
                'Soja': HexColor('#17134F'),      # Cor principal
                'Milho': HexColor('#2A1F6B'),     # Variação mais clara
                'Trigo': HexColor('#3D2B87'),     # Variação ainda mais clara
                'Algodão': HexColor('#5037A3'),   # Variação roxa
                'Feijão': HexColor('#6B4BB8'),    # Variação roxa clara
                'Arroz': HexColor('#8660CD'),     # Variação lilás
                'Sorgo': HexColor('#9F7AE1'),     # Variação lilás clara
                'Outros': HexColor('#B794F4')     # Mais clara
            }
            
            # Coletar todas as culturas
            all_crops_ordered = []
            for safra in chart_data:
                for crop in safra.get('culturas', {}).keys():
                    if crop not in all_crops_ordered:
                        all_crops_ordered.append(crop)
            
            # Largura das barras
            bar_width = chart_width / (len(chart_data) + 1)
            bar_actual_width = bar_width * 0.6  # 60% da largura disponível
            
            # Desenhar barras empilhadas
            for idx, safra in enumerate(chart_data):
                x_bar = chart_x + (idx + 0.5) * bar_width - bar_actual_width/2
                y_stack = chart_y - chart_height
                
                # Empilhar culturas
                for crop in all_crops_ordered:
                    value = safra.get('culturas', {}).get(crop, 0)
                    if value > 0:
                        height = (value / max_value) * chart_height
                        
                        # Cor da cultura
                        color = crop_colors.get(crop, HexColor('#6B7280'))
                        self.setFillColor(color)
                        self.rect(x_bar, y_stack, bar_actual_width, height, fill=1, stroke=0)
                        
                        y_stack += height
                
                # Valor total em hectares acima da barra
                total_value = safra.get('total', 0) or sum(safra.get('culturas', {}).values())
                if total_value > 0:
                    self.setFont("Helvetica-Bold", 10)
                    self.setFillColor(COLORS['primary'])
                    # Formatar como k com 1 casa decimal
                    value_k = total_value / 1000
                    value_label = f'{value_k:.1f}k'
                    value_width = self.stringWidth(value_label, "Helvetica-Bold", 10)
                    self.drawString(x_bar + bar_actual_width/2 - value_width/2, y_stack + 5, value_label)
                
                # Label do ano - formato yy/yy
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['tertiary'])
                safra_label = safra['safra']
                # Converter formato yyyy/yy para yy/yy
                if '/' in safra_label and len(safra_label) > 5:
                    parts = safra_label.split('/')
                    if len(parts[0]) == 4:
                        safra_label = f"{parts[0][2:]}/{parts[1]}"
                label_width = self.stringWidth(safra_label, "Helvetica", 10)
                self.drawString(x_bar + bar_actual_width/2 - label_width/2, chart_y - chart_height - 20, safra_label)
            
            # === LEGENDA ===
            legend_y = chart_y - chart_height - 80
            legend_items_per_row = 4
            legend_item_width = chart_width / legend_items_per_row
            
            for idx, crop in enumerate(all_crops_ordered):
                row = idx // legend_items_per_row
                col = idx % legend_items_per_row
                
                x_legend = chart_x + col * legend_item_width
                y_legend = legend_y - row * 25
                
                # Quadrado colorido
                color = crop_colors.get(crop, HexColor('#6B7280'))
                self.setFillColor(color)
                self.rect(x_legend, y_legend - 4, 12, 12, fill=1, stroke=0)
                
                # Nome da cultura
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['tertiary'])
                self.drawString(x_legend + 18, y_legend, crop)
            
            # === TABELA DETALHADA ===
            table_y = legend_y - 60
            
            # Título da tabela
            self.setFont("Helvetica", 14)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin, table_y, "Detalhamento por Cultura (hectares)")
            
            # Cabeçalho da tabela
            header_y = table_y - 30
            # Ajustar larguras das colunas - primeira coluna (cultura) mais estreita
            num_safras = min(len(chart_data), 10)  # Máximo 10 safras
            col_widths = [70]  # Cultura (reduzido de 80)
            safra_col_width = (self.width - 2*x_margin - 70) / num_safras  # Distribuir espaço restante
            for i in range(num_safras):
                col_widths.append(safra_col_width)  # Largura dinâmica para safras
            
            table_width = sum(col_widths)
            
            # Fundo do cabeçalho
            self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
            self.rect(x_margin, header_y - 20, table_width, 25, fill=1, stroke=0)
            
            # Textos do cabeçalho
            self.setFont("Helvetica-Bold", 9)  # Reduzido de 10
            self.setFillColor(COLORS['primary'])
            
            # Primeira coluna: Cultura
            self.drawString(x_margin + 5, header_y - 10, "CULTURA")
            
            # Colunas das safras
            col_x = x_margin + col_widths[0]
            for idx, safra in enumerate(chart_data[:num_safras]):
                safra_label = safra['safra']
                if '/' in safra_label and len(safra_label) > 5:
                    parts = safra_label.split('/')
                    if len(parts[0]) == 4:
                        safra_label = f"{parts[0][2:]}/{parts[1]}"
                # Centralizar texto na coluna
                label_width = self.stringWidth(safra_label, "Helvetica-Bold", 9)
                x_pos = col_x + (col_widths[idx + 1] - label_width) / 2
                self.drawString(x_pos, header_y - 10, safra_label)
                col_x += col_widths[idx + 1]
            
            # Linhas de dados (uma linha por cultura)
            row_y = header_y - 30
            self.setFont("Helvetica", 10)
            
            for idx, crop in enumerate(all_crops_ordered):
                # Alternar cor de fundo das linhas
                if idx % 2 == 1:
                    self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                    self.rect(x_margin, row_y - 15, table_width, 20, fill=1, stroke=0)
                
                # Nome da cultura com a cor correspondente do gráfico
                crop_color = crop_colors.get(crop, HexColor('#6B7280'))
                self.setFillColor(crop_color)
                self.setFont("Helvetica-Bold", 9)  # Reduzido
                self.drawString(x_margin + 5, row_y - 5, crop.upper())
                
                # Valores por safra
                self.setFont("Helvetica", 9)  # Reduzido
                self.setFillColor(COLORS['tertiary'])  # Voltar para cor padrão
                col_x = x_margin + col_widths[0]
                for idx_safra, safra in enumerate(chart_data[:num_safras]):
                    value = safra.get('culturas', {}).get(crop, 0)
                    if value > 0:
                        value_str = f'{value/1000:.1f}k'
                    else:
                        value_str = '-'
                    # Centralizar valor na coluna
                    value_width = self.stringWidth(value_str, "Helvetica", 9)
                    x_pos = col_x + (col_widths[idx_safra + 1] - value_width) / 2
                    self.drawString(x_pos, row_y - 5, value_str)
                    col_x += col_widths[idx_safra + 1]
                
                row_y -= 20
    
    def draw_productivity_page(self):
        """Página 6 - Produtividade"""
        # Margens
        x_margin = 70
        y_margin = self.height - 100
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Produtividade")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        self.drawString(x_margin, bar_y - 20, "Evolução da produtividade das culturas e análise de eficiência operacional")
        
        # === CARDS DE MÉTRICAS ===
        y_metrics = y_margin - 50
        
        # Obter dados de produtividade
        productivity_data = self.data.get('productivity', {})
        chart_data = productivity_data.get('chartData', [])
        
        # Calcular métricas
        if chart_data:
            # Produtividade média geral
            all_values = []
            for safra in chart_data:
                for crop, value in safra.get('culturas', {}).items():
                    if value > 0:
                        all_values.append(value)
            
            avg_productivity = sum(all_values) / len(all_values) if all_values else 0
            max_productivity = max(all_values) if all_values else 0
            min_productivity = min(all_values) if all_values else 0
            
            # Variação percentual
            if len(chart_data) >= 2:
                first_safra_avg = []
                last_safra_avg = []
                
                for crop in chart_data[0].get('culturas', {}).keys():
                    first_val = chart_data[0].get('culturas', {}).get(crop, 0)
                    if first_val > 0:
                        first_safra_avg.append(first_val)
                
                for crop in chart_data[-1].get('culturas', {}).keys():
                    last_val = chart_data[-1].get('culturas', {}).get(crop, 0)
                    if last_val > 0:
                        last_safra_avg.append(last_val)
                
                first_avg = sum(first_safra_avg) / len(first_safra_avg) if first_safra_avg else 0
                last_avg = sum(last_safra_avg) / len(last_safra_avg) if last_safra_avg else 0
                variation = ((last_avg - first_avg) / first_avg * 100) if first_avg > 0 else 0
            else:
                variation = 0
        else:
            avg_productivity = 0
            max_productivity = 0
            min_productivity = 0
            variation = 0
        
        # Cards de métricas
        metrics = [
            {
                'value': f'{avg_productivity:.0f}',
                'label': 'Produtividade Média',
                'sublabel': 'Sacas/hectare',
                'is_currency': False
            },
            {
                'value': f'{max_productivity:.0f}',
                'label': 'Máxima Registrada',
                'sublabel': 'Sacas/hectare',
                'is_currency': False
            },
            {
                'value': f'{min_productivity:.0f}',
                'label': 'Mínima Registrada',
                'sublabel': 'Sacas/hectare',
                'is_currency': False
            },
            {
                'value': f'{variation:+.1f}%',
                'label': 'Variação Total',
                'sublabel': 'Primeira vs última safra',
                'is_currency': False
            }
        ]
        
        # Desenhar um único card grande com divisórias
        card_height = 60
        # Fundo removido para deixar mais limpo
        # self.setFillColor(Color(0.12, 0.16, 0.23, alpha=0.04))
        # self.roundRect(x_margin, y_metrics - card_height, self.width - 2*x_margin, card_height, 8, stroke=0, fill=1)
        
        # Desenhar métricas
        section_width = (self.width - 2*x_margin) / 4
        
        for i, metric in enumerate(metrics):
            x_section = x_margin + i * section_width
            
            # Divisória vertical (exceto para a primeira métrica)
            if i > 0:
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(1)
                self.line(x_section, y_metrics - card_height + 15, x_section, y_metrics - 15)
            
            # Centro da seção
            x_center = x_section + section_width / 2
            
            # Valor
            self.setFont("Helvetica-Bold", 18)
            self.setFillColor(COLORS['primary'])
            value_width = self.stringWidth(metric['value'], "Helvetica-Bold", 18)
            value_y = y_metrics - (card_height/2) + 8
            self.drawString(x_center - value_width/2, value_y, metric['value'])
            
            # Label
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(COLORS['light'])
            label_width = self.stringWidth(metric['label'].upper(), "Helvetica-Bold", 8)
            self.drawString(x_center - label_width/2, value_y - 16, metric['label'].upper())
            
            # Sublabel
            self.setFont("Helvetica", 7)
            self.setFillColor(COLORS['lighter'])
            sublabel_width = self.stringWidth(metric['sublabel'], "Helvetica", 7)
            self.drawString(x_center - sublabel_width/2, value_y - 26, metric['sublabel'])
        
        # === GRÁFICO DE LINHAS ===
        y_chart = y_metrics - 90
        
        self.setFont("Helvetica", 16)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_chart, "Evolução da Produtividade por Cultura")
        
        # Área do gráfico
        chart_y = y_chart - 50
        chart_height = 220
        chart_x = x_margin + 40
        chart_width = self.width - 2*x_margin - 80
        
        if chart_data:
            # Encontrar valores mínimo e máximo para escala
            all_productivity_values = []
            for safra in chart_data:
                for value in safra.get('culturas', {}).values():
                    if value > 0:
                        all_productivity_values.append(value)
            
            if all_productivity_values:
                min_value = min(all_productivity_values) * 0.9  # 10% abaixo do mínimo
                max_value = max(all_productivity_values) * 1.1  # 10% acima do máximo
            else:
                min_value = 0
                max_value = 100
            
            # Eixo Y
            y_steps = 5
            for i in range(y_steps):
                y_pos = chart_y - chart_height + (i * chart_height / (y_steps - 1))
                value = min_value + (max_value - min_value) * i / (y_steps - 1)
                
                # Grid line
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(0.5)
                self.line(chart_x, y_pos, chart_x + chart_width, y_pos)
                
                # Label
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['light'])
                self.drawRightString(chart_x - 10, y_pos - 3, f'{value:.0f}')
            
            # Cores das culturas (incluindo culturas de sequeiro)
            crop_colors = {
                'Soja': HexColor('#17134F'),
                'Milho': HexColor('#2A1F6B'),
                'Trigo': HexColor('#3D2B87'),
                'Algodão': HexColor('#5037A3'),
                'Feijão': HexColor('#6B4BB8'),
                'Arroz': HexColor('#8660CD'),
                'Sorgo': HexColor('#9F7AE1'),
                'Soja Sequeiro': HexColor('#17134F'),
                'Milho Sequeiro': HexColor('#2A1F6B'),
                'Feijão Sequeiro': HexColor('#6B4BB8'),
                'Sorgo Sequeiro': HexColor('#9F7AE1'),
                'Outros': HexColor('#B794F4')
            }
            
            # Coletar todas as culturas
            all_crops = set()
            for safra in chart_data:
                all_crops.update(safra.get('culturas', {}).keys())
            all_crops = sorted(list(all_crops))
            
            # Posições X das safras
            x_positions = []
            x_step = chart_width / (len(chart_data) - 1) if len(chart_data) > 1 else chart_width / 2
            for i in range(len(chart_data)):
                x_positions.append(chart_x + i * x_step)
            
            # Desenhar linhas por cultura
            for crop in all_crops:
                color = crop_colors.get(crop, HexColor('#6B7280'))
                self.setStrokeColor(color)
                self.setLineWidth(2)
                
                # Coletar pontos da cultura
                points = []
                for i, safra in enumerate(chart_data):
                    value = safra.get('culturas', {}).get(crop, 0)
                    if value > 0:
                        x = x_positions[i]
                        y = chart_y - chart_height + ((value - min_value) / (max_value - min_value)) * chart_height
                        points.append((x, y, value))
                
                # Desenhar linhas conectando os pontos
                if len(points) > 1:
                    for i in range(len(points) - 1):
                        self.line(points[i][0], points[i][1], points[i+1][0], points[i+1][1])
                
                # Desenhar círculos nos pontos e valores
                self.setFillColor(color)
                for x, y, value in points:
                    # Círculo branco de fundo
                    self.setFillColor(COLORS['white'])
                    self.circle(x, y, 4, stroke=1, fill=1)
                    # Círculo colorido
                    self.setFillColor(color)
                    self.circle(x, y, 3, stroke=0, fill=1)
                    
                    # Adicionar valor acima do ponto
                    self.setFont("Helvetica", 8)
                    self.setFillColor(color)
                    value_str = f'{value:.0f}'
                    value_width = self.stringWidth(value_str, "Helvetica", 8)
                    self.drawString(x - value_width/2, y + 8, value_str)
            
            # Labels das safras no eixo X
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            for i, safra in enumerate(chart_data):
                safra_label = safra['safra']
                if '/' in safra_label and len(safra_label) > 5:
                    parts = safra_label.split('/')
                    if len(parts[0]) == 4:
                        safra_label = f"{parts[0][2:]}/{parts[1]}"
                label_width = self.stringWidth(safra_label, "Helvetica", 10)
                self.drawString(x_positions[i] - label_width/2, chart_y - chart_height - 20, safra_label)
            
            # === LEGENDA ===
            legend_y = chart_y - chart_height - 50
            legend_items_per_row = 4
            legend_item_width = chart_width / legend_items_per_row
            
            for idx, crop in enumerate(all_crops):
                row = idx // legend_items_per_row
                col = idx % legend_items_per_row
                
                x_legend = chart_x + col * legend_item_width
                y_legend = legend_y - row * 25
                
                # Linha com bolinha (igual ao estilo dos gráficos de linha)
                color = crop_colors.get(crop, HexColor('#6B7280'))
                self.setStrokeColor(color)
                self.setLineWidth(2)
                self.line(x_legend, y_legend, x_legend + 15, y_legend)
                
                # Círculo branco de fundo
                self.setFillColor(COLORS['white'])
                self.circle(x_legend + 7.5, y_legend, 3, stroke=1, fill=1)
                # Círculo colorido
                self.setFillColor(color)
                self.circle(x_legend + 7.5, y_legend, 2, stroke=0, fill=1)
                
                # Nome da cultura
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['tertiary'])
                self.drawString(x_legend + 20, y_legend - 3, crop)
            
            # === TABELA DETALHADA ===
            table_y = legend_y - 60
            
            # Título da tabela
            self.setFont("Helvetica", 14)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin, table_y, "Detalhamento por Cultura (sacas/hectare)")
            
            # Preparar dados da tabela
            header_y = table_y - 30
            num_safras = min(len(chart_data), 10)
            col_widths = [100]  # Cultura - aumentado de 70 para 100
            safra_col_width = (self.width - 2*x_margin - 100) / num_safras
            for i in range(num_safras):
                col_widths.append(safra_col_width)
            
            table_width = sum(col_widths)
            
            # Fundo do cabeçalho
            self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
            self.rect(x_margin, header_y - 20, table_width, 25, fill=1, stroke=0)
            
            # Cabeçalho
            self.setFont("Helvetica-Bold", 9)
            self.setFillColor(COLORS['primary'])
            
            # Cultura
            self.drawString(x_margin + 5, header_y - 10, "CULTURA")
            
            # Safras
            col_x = x_margin + col_widths[0]
            for idx, safra in enumerate(chart_data[:num_safras]):
                safra_label = safra['safra']
                if '/' in safra_label and len(safra_label) > 5:
                    parts = safra_label.split('/')
                    if len(parts[0]) == 4:
                        safra_label = f"{parts[0][2:]}/{parts[1]}"
                label_width = self.stringWidth(safra_label, "Helvetica-Bold", 9)
                x_pos = col_x + (col_widths[idx + 1] - label_width) / 2
                self.drawString(x_pos, header_y - 10, safra_label)
                col_x += col_widths[idx + 1]
            
            # Linhas de dados
            row_y = header_y - 30
            self.setFont("Helvetica", 9)
            
            for idx, crop in enumerate(all_crops):
                # Alternar cor de fundo
                if idx % 2 == 1:
                    self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                    self.rect(x_margin, row_y - 15, table_width, 20, fill=1, stroke=0)
                
                # Nome da cultura com cor
                crop_color = crop_colors.get(crop, HexColor('#6B7280'))
                self.setFillColor(crop_color)
                self.setFont("Helvetica-Bold", 9)
                self.drawString(x_margin + 5, row_y - 5, crop.upper())
                
                # Valores
                self.setFont("Helvetica", 9)
                self.setFillColor(COLORS['tertiary'])
                col_x = x_margin + col_widths[0]
                for idx_safra, safra in enumerate(chart_data[:num_safras]):
                    value = safra.get('culturas', {}).get(crop, 0)
                    if value > 0:
                        value_str = f'{value:.0f}'
                    else:
                        value_str = '-'
                    value_width = self.stringWidth(value_str, "Helvetica", 9)
                    x_pos = col_x + (col_widths[idx_safra + 1] - value_width) / 2
                    self.drawString(x_pos, row_y - 5, value_str)
                    col_x += col_widths[idx_safra + 1]
                
                row_y -= 20
    
    def draw_revenue_projections_page(self):
        """Página 7 - Receitas Projetadas"""
        # Margens
        x_margin = 70
        y_margin = self.height - 100
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Receitas Projetadas")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        self.drawString(x_margin, bar_y - 20, "Projeção de receitas por cultura e análise de crescimento do faturamento")
        
        # === CARDS DE MÉTRICAS ===
        y_metrics = y_margin - 50
        
        # Obter dados de receitas
        revenue_section = self.data.get('revenue', {})
        chart_data = revenue_section.get('chartData', [])
        
        # Calcular métricas
        total_revenue = 0
        first_year_revenue = 0
        last_year_revenue = 0
        num_products = 0
        all_years = []
        
        # Processar dados do gráfico
        revenue_data = {}
        if chart_data:
            for safra_data in chart_data:
                safra = safra_data.get('safra', '')
                culturas = safra_data.get('culturas', {})
                if safra and culturas:
                    revenue_data[safra] = culturas
            
            all_years = sorted(revenue_data.keys())
            
            if all_years:
                # Receita total projetada (soma de todos os anos)
                for year in revenue_data:
                    year_total = sum(revenue_data[year].values())
                    total_revenue += year_total
                
                # Primeira e última safra
                first_year_revenue = sum(revenue_data[all_years[0]].values())
                last_year_revenue = sum(revenue_data[all_years[-1]].values())
                
                # Número de produtos únicos
                all_products = set()
                for year_data in revenue_data.values():
                    all_products.update(year_data.keys())
                num_products = len(all_products)
        
        # Crescimento percentual
        growth = ((last_year_revenue - first_year_revenue) / first_year_revenue * 100) if first_year_revenue > 0 else 0
        
        # Cards de métricas (sem a receita total)
        metrics = [
            {
                'value': f'R$ {first_year_revenue/1_000_000:.1f}M',
                'label': 'Primeira Safra',
                'sublabel': all_years[0] if all_years else 'N/A',
                'is_currency': True
            },
            {
                'value': f'R$ {last_year_revenue/1_000_000:.1f}M',
                'label': 'Última Safra',
                'sublabel': all_years[-1] if all_years else 'N/A',
                'is_currency': True
            },
            {
                'value': f'{growth:+.1f}%',
                'label': 'Crescimento Total',
                'sublabel': f'{num_products} culturas',
                'is_currency': False
            }
        ]
        
        # Desenhar um único card grande com divisórias
        card_height = 60
        # Fundo removido para deixar mais limpo
        # self.setFillColor(Color(0.12, 0.16, 0.23, alpha=0.04))
        # self.roundRect(x_margin, y_metrics - card_height, self.width - 2*x_margin, card_height, 8, stroke=0, fill=1)
        
        # Desenhar métricas
        section_width = (self.width - 2*x_margin) / 3
        
        for i, metric in enumerate(metrics):
            x_section = x_margin + i * section_width
            
            # Divisória vertical (exceto para a primeira métrica)
            if i > 0:
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(1)
                self.line(x_section, y_metrics - card_height + 15, x_section, y_metrics - 15)
            
            # Centro da seção
            x_center = x_section + section_width / 2
            
            # Valor
            self.setFont("Helvetica-Bold", 18)
            self.setFillColor(COLORS['primary'])
            value_width = self.stringWidth(metric['value'], "Helvetica-Bold", 18)
            value_y = y_metrics - (card_height/2) + 8
            self.drawString(x_center - value_width/2, value_y, metric['value'])
            
            # Label
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(COLORS['light'])
            label_width = self.stringWidth(metric['label'].upper(), "Helvetica-Bold", 8)
            self.drawString(x_center - label_width/2, value_y - 16, metric['label'].upper())
            
            # Sublabel
            self.setFont("Helvetica", 7)
            self.setFillColor(COLORS['lighter'])
            sublabel_width = self.stringWidth(metric['sublabel'], "Helvetica", 7)
            self.drawString(x_center - sublabel_width/2, value_y - 26, metric['sublabel'])
        
        # === GRÁFICO DE BARRAS EMPILHADAS ===
        y_chart = y_metrics - 90
        
        self.setFont("Helvetica", 16)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_chart, "Projeção de Receitas por Cultura")
        
        # Área do gráfico
        chart_y = y_chart - 50
        chart_height = 220
        chart_x = x_margin + 60  # Espaço maior para valores em milhões
        chart_width = self.width - 2*x_margin - 100
        
        if revenue_data:
            # Preparar dados
            years = sorted(revenue_data.keys())
            
            # Coletar todos os produtos
            all_products = []
            for year_data in revenue_data.values():
                for product in year_data.keys():
                    if product not in all_products:
                        all_products.append(product)
            
            # Calcular valor máximo para escala
            max_value = 0
            for year in years:
                year_total = sum(revenue_data[year].values())
                if year_total > max_value:
                    max_value = year_total
            
            max_value = int(max_value * 1.1)  # 10% de margem
            
            # Eixo Y - valores em milhões
            y_steps = 5
            for i in range(y_steps):
                y_pos = chart_y - chart_height + (i * chart_height / (y_steps - 1))
                value = max_value * i / (y_steps - 1)
                
                # Grid line
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(0.5)
                self.line(chart_x, y_pos, chart_x + chart_width, y_pos)
                
                # Label em milhões
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['light'])
                label = f'R$ {value/1_000_000:.0f}M'
                self.drawRightString(chart_x - 10, y_pos - 3, label)
            
            # Cores dos produtos (usando as mesmas cores)
            product_colors = {
                'Soja 1ª safra sequeiro': HexColor('#17134F'),
                'Milho 1ª safra sequeiro': HexColor('#2A1F6B'),
                'Feijão 2ª safra sequeiro': HexColor('#6B4BB8'),
                'Sorgo 2ª safra sequeiro': HexColor('#9F7AE1'),
                'Milho 2ª safra sequeiro': HexColor('#3D2B87'),
                'Soja': HexColor('#17134F'),
                'Milho': HexColor('#2A1F6B'),
                'Feijão': HexColor('#6B4BB8'),
                'Sorgo': HexColor('#9F7AE1')
            }
            
            # Largura das barras
            bar_width = chart_width / (len(years) + 1)
            bar_actual_width = bar_width * 0.6
            
            # Desenhar barras empilhadas
            for idx, year in enumerate(years):
                x_bar = chart_x + (idx + 0.5) * bar_width - bar_actual_width/2
                y_stack = chart_y - chart_height
                
                # Empilhar produtos
                for product in all_products:
                    value = revenue_data[year].get(product, 0)
                    if value > 0:
                        height = (value / max_value) * chart_height
                        
                        # Cor do produto
                        color = product_colors.get(product, HexColor('#6B7280'))
                        self.setFillColor(color)
                        self.rect(x_bar, y_stack, bar_actual_width, height, fill=1, stroke=0)
                        
                        y_stack += height
                
                # Valor total da barra acima
                total_value = sum(revenue_data[year].values())
                if total_value > 0:
                    self.setFont("Helvetica-Bold", 9)
                    self.setFillColor(COLORS['primary'])
                    value_label = f'{total_value/1_000_000:.1f}M'
                    value_width = self.stringWidth(value_label, "Helvetica-Bold", 9)
                    self.drawString(x_bar + bar_actual_width/2 - value_width/2, y_stack + 5, value_label)
                
                # Label do ano (formato yy/yy)
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['tertiary'])
                year_label = year
                if '/' in year_label and len(year_label) > 5:
                    parts = year_label.split('/')
                    if len(parts[0]) == 4:
                        year_label = f"{parts[0][2:]}/{parts[1]}"
                label_width = self.stringWidth(year_label, "Helvetica", 10)
                self.drawString(x_bar + bar_actual_width/2 - label_width/2, chart_y - chart_height - 20, year_label)
            
            # === LEGENDA ===
            legend_y = chart_y - chart_height - 50
            legend_items_per_row = len(all_products)  # Todos na mesma linha
            legend_item_width = chart_width / legend_items_per_row
            
            for idx, product in enumerate(all_products):
                row = 0  # Sempre na primeira linha
                col = idx
                
                x_legend = chart_x + col * legend_item_width
                y_legend = legend_y
                
                # Quadrado colorido
                color = product_colors.get(product, HexColor('#6B7280'))
                self.setFillColor(color)
                self.rect(x_legend, y_legend - 4, 12, 12, fill=1, stroke=0)
                
                # Nome do produto (truncado se necessário)
                self.setFont("Helvetica", 9)
                self.setFillColor(COLORS['tertiary'])
                product_name = product
                if len(product_name) > 20:
                    product_name = product_name[:18] + '..'
                self.drawString(x_legend + 18, y_legend, product_name)
            
            # === TABELA DETALHADA ===
            table_y = legend_y - 80
            
            # Título da tabela
            self.setFont("Helvetica", 14)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin, table_y, "Receitas Agrícolas Detalhadas (R$ milhões)")
            
            # Preparar dados da tabela
            header_y = table_y - 30
            num_years = min(len(years), 8)  # Máximo 8 anos
            col_widths = [120]  # Cultura
            year_col_width = (self.width - 2*x_margin - 120) / num_years
            for i in range(num_years):
                col_widths.append(year_col_width)
            
            table_width = sum(col_widths)
            
            # Fundo do cabeçalho
            self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
            self.rect(x_margin, header_y - 20, table_width, 25, fill=1, stroke=0)
            
            # Cabeçalho
            self.setFont("Helvetica-Bold", 9)
            self.setFillColor(COLORS['primary'])
            
            # Cultura
            self.drawString(x_margin + 5, header_y - 10, "CULTURA")
            
            # Anos
            col_x = x_margin + col_widths[0]
            for idx, year in enumerate(years[:num_years]):
                year_label = year
                if '/' in year_label and len(year_label) > 5:
                    parts = year_label.split('/')
                    if len(parts[0]) == 4:
                        year_label = f"{parts[0][2:]}/{parts[1]}"
                label_width = self.stringWidth(year_label, "Helvetica-Bold", 9)
                x_pos = col_x + (col_widths[idx + 1] - label_width) / 2
                self.drawString(x_pos, header_y - 10, year_label)
                col_x += col_widths[idx + 1]
            
            # Linhas de dados
            row_y = header_y - 30
            self.setFont("Helvetica", 9)
            
            for idx, product in enumerate(all_products):
                # Alternar cor de fundo
                if idx % 2 == 1:
                    self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                    self.rect(x_margin, row_y - 15, table_width, 20, fill=1, stroke=0)
                
                # Nome do produto com cor
                product_color = product_colors.get(product, HexColor('#6B7280'))
                self.setFillColor(product_color)
                self.setFont("Helvetica-Bold", 9)
                product_display = product.upper()
                if len(product_display) > 18:
                    product_display = product_display[:16] + '..'
                self.drawString(x_margin + 5, row_y - 5, product_display)
                
                # Valores
                self.setFont("Helvetica", 9)
                self.setFillColor(COLORS['tertiary'])
                col_x = x_margin + col_widths[0]
                for idx_year, year in enumerate(years[:num_years]):
                    value = revenue_data[year].get(product, 0)
                    if value > 0:
                        value_str = f'{value/1_000_000:.1f}'
                    else:
                        value_str = '-'
                    value_width = self.stringWidth(value_str, "Helvetica", 9)
                    x_pos = col_x + (col_widths[idx_year + 1] - value_width) / 2
                    self.drawString(x_pos, row_y - 5, value_str)
                    col_x += col_widths[idx_year + 1]
                
                row_y -= 20
    
    def draw_financial_evolution_page(self):
        """Página 8 - Evolução Financeira"""
        # Margens
        x_margin = 70
        y_margin = self.height - 100
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Evolução Financeira")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        self.drawString(x_margin, bar_y - 20, "Análise temporal dos principais indicadores financeiros e margens")
        
        # === CARDS DE MÉTRICAS ===
        y_metrics = y_margin - 50
        
        # Obter dados financeiros
        financial_evolution = self.data.get('financialEvolution', [])
        
        # Calcular métricas
        if financial_evolution:
            # Remover safras com receita zero
            valid_data = [s for s in financial_evolution if s.get('receita', 0) > 0]
            
            if valid_data:
                # Receita média por safra
                avg_revenue = sum(s.get('receita', 0) for s in valid_data) / len(valid_data)
                
                # Lucro médio por safra
                avg_profit = sum(s.get('lucro', 0) for s in valid_data) / len(valid_data)
                
                # Margem média
                margins = [s.get('margem', 0) for s in valid_data if s.get('margem', 0) > 0]
                avg_margin = sum(margins) / len(margins) if margins else 0
                
                # EBITDA médio (aproximação: lucro + 30% do custo como depreciação/impostos)
                total_ebitda = sum(s.get('lucro', 0) + (s.get('custo', 0) * 0.3) for s in valid_data)
                avg_ebitda = total_ebitda / len(valid_data) if valid_data else 0
            else:
                avg_revenue = 0
                avg_profit = 0
                avg_margin = 0
                avg_ebitda = 0
        else:
            avg_revenue = 0
            avg_profit = 0
            avg_margin = 0
            avg_ebitda = 0
        
        # Cards de métricas
        metrics = [
            {
                'value': f'R$ {avg_revenue/1_000_000:.1f}M',
                'label': 'Receita Média',
                'sublabel': 'Por safra',
                'is_currency': True
            },
            {
                'value': f'R$ {avg_profit/1_000_000:.1f}M',
                'label': 'Lucro Médio',
                'sublabel': 'Por safra',
                'is_currency': True
            },
            {
                'value': f'{avg_margin:.1f}%',
                'label': 'Margem Média',
                'sublabel': 'Lucro/Receita',
                'is_currency': False
            }
        ]
        
        # Desenhar um único card grande com divisórias
        card_height = 60
        # Fundo removido para deixar mais limpo
        # self.setFillColor(Color(0.12, 0.16, 0.23, alpha=0.04))
        # self.roundRect(x_margin, y_metrics - card_height, self.width - 2*x_margin, card_height, 8, stroke=0, fill=1)
        
        # Desenhar métricas
        section_width = (self.width - 2*x_margin) / 3
        
        for i, metric in enumerate(metrics):
            x_section = x_margin + i * section_width
            
            # Divisória vertical (exceto para a primeira métrica)
            if i > 0:
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(1)
                self.line(x_section, y_metrics - card_height + 15, x_section, y_metrics - 15)
            
            # Centro da seção
            x_center = x_section + section_width / 2
            
            # Valor
            self.setFont("Helvetica-Bold", 18)
            self.setFillColor(COLORS['primary'])
            value_width = self.stringWidth(metric['value'], "Helvetica-Bold", 18)
            value_y = y_metrics - (card_height/2) + 8
            self.drawString(x_center - value_width/2, value_y, metric['value'])
            
            # Label
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(COLORS['light'])
            label_width = self.stringWidth(metric['label'].upper(), "Helvetica-Bold", 8)
            self.drawString(x_center - label_width/2, value_y - 16, metric['label'].upper())
            
            # Sublabel
            self.setFont("Helvetica", 7)
            self.setFillColor(COLORS['lighter'])
            sublabel_width = self.stringWidth(metric['sublabel'], "Helvetica", 7)
            self.drawString(x_center - sublabel_width/2, value_y - 26, metric['sublabel'])
        
        # === GRÁFICO DE LINHAS ===
        y_chart = y_metrics - 90
        
        self.setFont("Helvetica", 16)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_chart, "Evolução de Receita, Custo, EBITDA e Lucro Líquido")
        
        # Área do gráfico
        chart_y = y_chart - 50
        chart_height = 220
        chart_x = x_margin + 60
        chart_width = self.width - 2*x_margin - 100
        
        if valid_data:
            # Encontrar valor máximo para escala
            max_value = 0
            for safra in valid_data:
                receita = safra.get('receita', 0)
                if receita > max_value:
                    max_value = receita
            
            max_value = int(max_value * 1.1)  # 10% de margem
            
            # Eixo Y - valores em milhões
            y_steps = 5
            for i in range(y_steps):
                y_pos = chart_y - chart_height + (i * chart_height / (y_steps - 1))
                value = max_value * i / (y_steps - 1)
                
                # Grid line
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(0.5)
                self.line(chart_x, y_pos, chart_x + chart_width, y_pos)
                
                # Label em milhões
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['light'])
                label = f'R$ {value/1_000_000:.0f}M'
                self.drawRightString(chart_x - 10, y_pos - 3, label)
            
            # Cores das linhas (usando a paleta padrão)
            line_colors = {
                'receita': HexColor('#17134F'),     # Azul escuro (principal)
                'custo': HexColor('#3D2B87'),       # Variação roxa (como Trigo)
                'ebitda': HexColor('#6B4BB8'),      # Variação roxa clara (como Feijão)
                'lucro': HexColor('#9F7AE1')        # Variação lilás (como Sorgo)
            }
            
            # Posições X das safras
            x_positions = []
            x_step = chart_width / (len(valid_data) - 1) if len(valid_data) > 1 else chart_width / 2
            for i in range(len(valid_data)):
                x_positions.append(chart_x + i * x_step)
            
            # Dados para cada linha
            metrics_data = {
                'receita': [],
                'custo': [],
                'ebitda': [],
                'lucro': []
            }
            
            # Coletar dados
            for i, safra in enumerate(valid_data):
                receita = safra.get('receita', 0)
                custo = safra.get('custo', 0)
                ebitda = safra.get('lucro', 0) + (safra.get('custo', 0) * 0.3)
                lucro = safra.get('lucro', 0)
                
                x = x_positions[i]
                
                if receita > 0:
                    y = chart_y - chart_height + ((receita / max_value) * chart_height)
                    metrics_data['receita'].append((x, y, receita))
                
                if custo > 0:
                    y = chart_y - chart_height + ((custo / max_value) * chart_height)
                    metrics_data['custo'].append((x, y, custo))
                
                if ebitda > 0:
                    y = chart_y - chart_height + ((ebitda / max_value) * chart_height)
                    metrics_data['ebitda'].append((x, y, ebitda))
                
                if lucro > 0:
                    y = chart_y - chart_height + ((lucro / max_value) * chart_height)
                    metrics_data['lucro'].append((x, y, lucro))
            
            # Desenhar linhas e pontos para cada métrica
            for metric, points in metrics_data.items():
                if len(points) > 1:
                    color = line_colors[metric]
                    self.setStrokeColor(color)
                    self.setLineWidth(2)
                    
                    # Desenhar linhas conectando os pontos
                    for i in range(len(points) - 1):
                        self.line(points[i][0], points[i][1], points[i+1][0], points[i+1][1])
                    
                    # Desenhar círculos nos pontos e valores
                    self.setFillColor(color)
                    for x, y, value in points:
                        # Círculo branco de fundo
                        self.setFillColor(COLORS['white'])
                        self.circle(x, y, 4, stroke=1, fill=1)
                        # Círculo colorido
                        self.setFillColor(color)
                        self.circle(x, y, 3, stroke=0, fill=1)
                        
                        # Adicionar valor acima do ponto
                        self.setFont("Helvetica", 8)
                        self.setFillColor(color)
                        # Formatar valor
                        value_m = value / 1_000_000
                        if value_m >= 100:
                            value_str = f'{value_m:.0f}M'
                        elif value_m >= 10:
                            value_str = f'{value_m:.1f}M'
                        else:
                            value_str = f'{value_m:.1f}M'
                        value_width = self.stringWidth(value_str, "Helvetica", 8)
                        self.drawString(x - value_width/2, y + 8, value_str)
            
            # Labels das safras no eixo X
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            for i, safra in enumerate(valid_data):
                safra_label = safra.get('safra', '')
                if '/' in safra_label and len(safra_label) > 5:
                    parts = safra_label.split('/')
                    if len(parts[0]) == 4:
                        safra_label = f"{parts[0][2:]}/{parts[1]}"
                label_width = self.stringWidth(safra_label, "Helvetica", 10)
                self.drawString(x_positions[i] - label_width/2, chart_y - chart_height - 20, safra_label)
            
            # === LEGENDA ===
            legend_y = chart_y - chart_height - 50
            legend_items = [
                ('Receita', line_colors['receita']),
                ('Custo', line_colors['custo']),
                ('EBITDA', line_colors['ebitda']),
                ('Lucro Líquido', line_colors['lucro'])
            ]
            
            legend_item_width = chart_width / len(legend_items)
            
            for idx, (label, color) in enumerate(legend_items):
                x_legend = chart_x + idx * legend_item_width
                
                # Linha com bolinha (igual ao estilo dos gráficos de linha)
                self.setStrokeColor(color)
                self.setLineWidth(2)
                self.line(x_legend, legend_y, x_legend + 15, legend_y)
                
                # Círculo branco de fundo
                self.setFillColor(COLORS['white'])
                self.circle(x_legend + 7.5, legend_y, 3, stroke=1, fill=1)
                # Círculo colorido
                self.setFillColor(color)
                self.circle(x_legend + 7.5, legend_y, 2, stroke=0, fill=1)
                
                # Nome
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['tertiary'])
                self.drawString(x_legend + 20, legend_y - 3, label)
            
            # === TABELA DETALHADA ===
            table_y = legend_y - 60
            
            # Título da tabela
            self.setFont("Helvetica", 14)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin, table_y, "Detalhamento Financeiro (R$ milhões)")
            
            # Preparar dados da tabela
            header_y = table_y - 30
            num_safras = min(len(valid_data), 8)
            col_widths = [80]  # Métrica
            safra_col_width = (self.width - 2*x_margin - 80) / num_safras
            for i in range(num_safras):
                col_widths.append(safra_col_width)
            
            table_width = sum(col_widths)
            
            # Fundo do cabeçalho
            self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
            self.rect(x_margin, header_y - 20, table_width, 25, fill=1, stroke=0)
            
            # Cabeçalho
            self.setFont("Helvetica-Bold", 9)
            self.setFillColor(COLORS['primary'])
            
            # Métrica
            self.drawString(x_margin + 5, header_y - 10, "MÉTRICA")
            
            # Safras
            col_x = x_margin + col_widths[0]
            for idx, safra in enumerate(valid_data[:num_safras]):
                safra_label = safra.get('safra', '')
                if '/' in safra_label and len(safra_label) > 5:
                    parts = safra_label.split('/')
                    if len(parts[0]) == 4:
                        safra_label = f"{parts[0][2:]}/{parts[1]}"
                label_width = self.stringWidth(safra_label, "Helvetica-Bold", 9)
                x_pos = col_x + (col_widths[idx + 1] - label_width) / 2
                self.drawString(x_pos, header_y - 10, safra_label)
                col_x += col_widths[idx + 1]
            
            # Linhas de dados
            row_y = header_y - 30
            metrics_rows = [
                ('Receita', 'receita', line_colors['receita']),
                ('Custo', 'custo', line_colors['custo']),
                ('EBITDA', 'ebitda', line_colors['ebitda']),
                ('Lucro Líquido', 'lucro', line_colors['lucro']),
                ('Margem %', 'margem', COLORS['primary'])
            ]
            
            for idx, (metric_name, metric_key, color) in enumerate(metrics_rows):
                # Alternar cor de fundo
                if idx % 2 == 1:
                    self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                    self.rect(x_margin, row_y - 15, table_width, 20, fill=1, stroke=0)
                
                # Nome da métrica com cor
                self.setFillColor(color)
                self.setFont("Helvetica-Bold", 9)
                self.drawString(x_margin + 5, row_y - 5, metric_name.upper())
                
                # Valores
                self.setFont("Helvetica", 9)
                self.setFillColor(COLORS['tertiary'])
                col_x = x_margin + col_widths[0]
                for idx_safra, safra in enumerate(valid_data[:num_safras]):
                    if metric_key == 'ebitda':
                        # Calcular EBITDA
                        value = safra.get('lucro', 0) + (safra.get('custo', 0) * 0.3)
                        value_str = f'{value/1_000_000:.1f}'
                    elif metric_key == 'margem':
                        value = safra.get(metric_key, 0)
                        value_str = f'{value:.1f}%'
                    else:
                        value = safra.get(metric_key, 0)
                        value_str = f'{value/1_000_000:.1f}'
                    
                    value_width = self.stringWidth(value_str, "Helvetica", 9)
                    x_pos = col_x + (col_widths[idx_safra + 1] - value_width) / 2
                    self.drawString(x_pos, row_y - 5, value_str)
                    col_x += col_widths[idx_safra + 1]
                
                row_y -= 20
    
    def _draw_debt_type_pie_chart_v2(self, x, y, width, height, data, title, subtitle):
        """Desenha gráfico de pizza com container roxo"""
        # Container roxo
        self.setFillColor(HexColor('#4C1D95'))  # Roxo escuro
        self.roundRect(x, y - height, width, height, 10, fill=1, stroke=0)
        
        # Título branco dentro do container
        self.setFont("Helvetica-Bold", 10)
        self.setFillColor(COLORS['white'])
        self.drawString(x + 10, y - 15, title)
        
        # Subtítulo
        self.setFont("Helvetica", 8)
        self.drawString(x + 10, y - 25, subtitle)
        
        # Processar dados
        custeio = 0
        investimento = 0
        
        for item in data:
            tipo = item.get('name') or item.get('tipo', '')
            valor = item.get('value') or item.get('valor', 0)
            
            if 'Custeio' in tipo:
                custeio = valor
            elif 'Investimento' in tipo:
                investimento = valor
        
        total = custeio + investimento
        
        if total > 0:
            # Centro e raio do gráfico
            center_x = x + width / 2
            center_y = y - height / 2 - 10
            radius = min(width, height) * 0.25
            
            # Calcular percentuais
            perc_custeio = (custeio / total) * 100
            perc_investimento = (investimento / total) * 100
            
            # Desenhar fatias
            # Custeio - roxo claro
            if custeio > 0:
                angle_custeio = (custeio / total) * 360
                self.setFillColor(HexColor('#A78BFA'))  # Roxo claro
                self.wedge(center_x - radius, center_y - radius,
                          center_x + radius, center_y + radius,
                          0, angle_custeio, fill=1, stroke=0)
            
            # Investimento - roxo escuro
            if investimento > 0:
                self.setFillColor(HexColor('#7C3AED'))  # Roxo médio
                self.wedge(center_x - radius, center_y - radius,
                          center_x + radius, center_y + radius,
                          angle_custeio if custeio > 0 else 0, 360, fill=1, stroke=0)
            
            # Caixa branca com percentuais
            box_width = 90
            box_height = 40
            box_x = center_x + radius + 15
            box_y = center_y - box_height/2
            
            self.setFillColor(COLORS['white'])
            self.roundRect(box_x, box_y, box_width, box_height, 5, fill=1, stroke=0)
            
            # Texto na caixa
            self.setFont("Helvetica", 8)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(box_x + 5, box_y + box_height - 12, f"Custeio: {perc_custeio:.1f}%")
            self.drawString(box_x + 5, box_y + box_height - 24, f"Investimentos: {perc_investimento:.1f}%")
            
            # Total abaixo
            self.setFont("Helvetica", 8)
            self.setFillColor(COLORS['white'])
            total_text = f"Total de dívidas: R$ {total/1_000_000:.1f} milhões"
            text_width = self.stringWidth(total_text, "Helvetica", 8)
            self.drawString(center_x - text_width/2, y - height + 15, total_text)
    
    def _draw_debt_type_pie_chart(self, x, y, width, height, data, title):
        """Desenha gráfico de pizza para distribuição por tipo de dívida"""
        # Título do gráfico
        self.setFont("Helvetica-Bold", 12)
        self.setFillColor(COLORS['primary'])
        self.drawCentredString(x + width/2, y - 20, title)
        
        # Processar dados - suportar ambos os formatos
        custeio = 0
        investimento = 0
        outros = 0
        
        for item in data:
            # Suportar formato name/value e tipo/valor
            tipo = item.get('name') or item.get('tipo', '')
            valor = item.get('value') or item.get('valor', 0)
            
            if tipo.upper() == 'CUSTEIO':
                custeio = valor
            elif tipo.upper() in ['INVESTIMENTOS', 'INVESTIMENTO']:
                investimento = valor
            else:
                outros += valor
        
        # Se não houver divisão por modalidade, usar proporção padrão
        if custeio == 0 and investimento == 0 and outros > 0:
            # Distribuir o valor total em 30% custeio e 70% investimento
            custeio = outros * 0.3
            investimento = outros * 0.7
        
        total = custeio + investimento
        
        if total > 0:
            # Centro e raio do gráfico
            center_x = x + width / 2
            center_y = y - height / 2 - 10
            radius = min(width, height) * 0.3
            
            # Calcular ângulos
            custeio_angle = (custeio / total) * 360 if total > 0 else 0
            
            # Desenhar fatias
            # Custeio - cor secundária
            if custeio > 0:
                self.setFillColor(COLORS['secondary'])
                self.wedge(center_x - radius, center_y - radius,
                          center_x + radius, center_y + radius,
                          0, custeio_angle, fill=1, stroke=0)
            
            # Investimento - cor primária
            if investimento > 0:
                self.setFillColor(COLORS['primary'])
                self.wedge(center_x - radius, center_y - radius,
                          center_x + radius, center_y + radius,
                          custeio_angle, 360, fill=1, stroke=0)
            
            # Legenda
            legend_y = center_y + radius + 30
            
            # Custeio
            self.setFillColor(COLORS['secondary'])
            self.rect(x + width/2 - 60, legend_y, 10, 10, fill=1, stroke=0)
            self.setFont("Helvetica", 9)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(x + width/2 - 45, legend_y + 8, f"Custeio: {(custeio/total*100):.1f}%")
            
            # Investimento
            self.setFillColor(COLORS['primary'])
            self.rect(x + width/2 - 60, legend_y + 15, 10, 10, fill=1, stroke=0)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(x + width/2 - 45, legend_y + 23, f"Investimentos: {(investimento/total*100):.1f}%")
            
            # Valor total
            self.setFont("Helvetica-Bold", 10)
            self.setFillColor(COLORS['primary'])
            total_text = f"Total: R$ {total/1_000_000:.1f}M"
            text_width = self.stringWidth(total_text, "Helvetica-Bold", 10)
            self.drawString(center_x - text_width/2, legend_y + 40, total_text)
    
    def _draw_debt_evolution_chart_v2(self, x, y, width, height, debt_data):
        """Desenha gráfico de barras dentro do container roxo"""
        if not debt_data:
            return
        
        # Encontrar valor máximo
        max_value = 0
        for item in debt_data:
            max_value = max(max_value, 
                          item.get('dividaTotal', 0),
                          item.get('dividaBancaria', 0),
                          item.get('dividaLiquida', 0))
        
        # Se não houver valores, usar escala padrão
        if max_value == 0:
            max_value = 40_000_000  # 40M
        
        # Grid horizontal com linhas brancas semi-transparentes
        self.setStrokeColor(COLORS['white'])
        self.setLineWidth(0.3)
        self.setStrokeAlpha(0.3)
        
        # 5 linhas de grid
        grid_values = [0, 9, 18, 27, 36]  # Em milhões
        for i, value in enumerate(grid_values):
            y_pos = y - (i * height / 4)
            self.line(x, y_pos, x + width, y_pos)
            
            # Labels do eixo Y
            self.setFont("Helvetica", 7)
            self.setFillColor(COLORS['white'])
            self.setFillAlpha(0.8)
            label = f"R$ {value} mi"
            self.drawRightString(x - 5, y_pos + 2, label)
        
        self.setStrokeAlpha(1)
        self.setFillAlpha(1)
        
        # Largura de cada grupo de barras
        num_safras = len(debt_data)
        if num_safras == 0:
            return
            
        group_width = width / num_safras
        bar_width = group_width * 0.2
        spacing = group_width * 0.05
        
        # Cores das barras
        colors = {
            'total': HexColor('#E9D5FF'),      # Lilás muito claro
            'bancaria': HexColor('#C4B5FD'),   # Lilás claro
            'liquida': HexColor('#A78BFA'),    # Roxo claro
        }
        
        # Desenhar barras
        for i, item in enumerate(debt_data):
            x_base = x + i * group_width + group_width * 0.2
            
            # Normalizar valores para a escala 0-36M
            scale_factor = height / 36_000_000
            
            # Dívida Total
            total = item.get('dividaTotal', 0)
            if total > 0:
                bar_height = min(total * scale_factor, height * 0.95)
                self.setFillColor(colors['total'])
                self.rect(x_base, y - bar_height, bar_width, bar_height, fill=1, stroke=0)
                
                # Valor acima da barra
                self.setFont("Helvetica-Bold", 6)
                self.setFillColor(COLORS['white'])
                value_text = f"{int(total/1_000_000)}"
                self.drawCentredString(x_base + bar_width/2, y - bar_height - 8, value_text)
            
            # Dívida Bancária
            bancaria = item.get('dividaBancaria', 0)
            if bancaria > 0:
                bar_height = min(bancaria * scale_factor, height * 0.95)
                self.setFillColor(colors['bancaria'])
                self.rect(x_base + bar_width + spacing, y - bar_height, bar_width, bar_height, fill=1, stroke=0)
                
                # Valor acima da barra
                value_text = f"{int(bancaria/1_000_000)}"
                self.drawCentredString(x_base + bar_width + spacing + bar_width/2, y - bar_height - 8, value_text)
            
            # Dívida Líquida
            liquida = item.get('dividaLiquida', 0)
            if liquida > 0:
                bar_height = min(liquida * scale_factor, height * 0.95)
                self.setFillColor(colors['liquida'])
                self.rect(x_base + 2*(bar_width + spacing), y - bar_height, bar_width, bar_height, fill=1, stroke=0)
                
                # Valor acima da barra
                value_text = f"{int(liquida/1_000_000)}"
                self.drawCentredString(x_base + 2*(bar_width + spacing) + bar_width/2, y - bar_height - 8, value_text)
            
            # Label da safra
            self.setFont("Helvetica", 7)
            self.setFillColor(COLORS['white'])
            safra_label = item.get('safra', '')
            self.drawCentredString(x_base + 1.5*bar_width + spacing, y + 8, safra_label)
    
    def _draw_debt_evolution_chart(self, x, y, width, height, debt_data):
        """Desenha gráfico de barras para evolução da dívida por safra"""
        if not debt_data:
            return
        
        # Encontrar valor máximo
        max_value = 0
        for item in debt_data:
            max_value = max(max_value, 
                          item.get('dividaTotal', 0),
                          item.get('dividaBancaria', 0),
                          item.get('dividaLiquida', 0))
        
        if max_value == 0:
            return
        
        # Grid horizontal
        self.setStrokeColor(COLORS['lightest'])
        self.setLineWidth(0.5)
        
        # 5 linhas de grid
        for i in range(5):
            y_pos = y - (i * height / 4)
            self.line(x, y_pos, x + width, y_pos)
            
            # Labels do eixo Y
            value = max_value * (1 - i/4)
            self.setFont("Helvetica", 8)
            self.setFillColor(COLORS['light'])
            label = f"R$ {value/1_000_000:.0f}M"
            self.drawRightString(x - 5, y_pos + 3, label)
        
        # Largura de cada grupo de barras
        group_width = width / len(debt_data)
        bar_width = group_width * 0.25
        spacing = group_width * 0.05
        
        # Cores das barras
        colors = {
            'total': HexColor('#C6C5F5'),      # Lilás claro
            'bancaria': HexColor('#847EDC'),   # Roxo médio
            'liquida': HexColor('#7367F0'),    # Azul violeta
        }
        
        # Desenhar barras
        for i, item in enumerate(debt_data):
            x_base = x + i * group_width + group_width * 0.1
            
            # Dívida Total
            total = item.get('dividaTotal', 0)
            if total > 0:
                bar_height = (total / max_value) * height * 0.9
                self.setFillColor(colors['total'])
                self.rect(x_base, y - bar_height, bar_width, bar_height, fill=1, stroke=0)
                
                # Valor acima da barra
                self.setFont("Helvetica-Bold", 7)
                self.setFillColor(COLORS['primary'])
                self.drawCentredString(x_base + bar_width/2, y - bar_height - 5, f"{int(total/1_000_000)}")
            
            # Dívida Bancária
            bancaria = item.get('dividaBancaria', 0)
            if bancaria > 0:
                bar_height = (bancaria / max_value) * height * 0.9
                self.setFillColor(colors['bancaria'])
                self.rect(x_base + bar_width + spacing, y - bar_height, bar_width, bar_height, fill=1, stroke=0)
            
            # Dívida Líquida
            liquida = item.get('dividaLiquida', 0)
            if liquida > 0:
                bar_height = (liquida / max_value) * height * 0.9
                self.setFillColor(colors['liquida'])
                self.rect(x_base + 2*(bar_width + spacing), y - bar_height, bar_width, bar_height, fill=1, stroke=0)
            
            # Label da safra
            self.setFont("Helvetica", 8)
            self.setFillColor(COLORS['tertiary'])
            safra_label = item.get('safra', '')
            self.drawCentredString(x_base + 1.5*bar_width + spacing, y + 10, safra_label)
        
        # Legenda
        legend_y = y - height - 20
        legend_items = [
            ('Dívida Total', colors['total']),
            ('Dívida Bancária', colors['bancaria']),
            ('Dívida Líquida', colors['liquida'])
        ]
        
        legend_x = x + width/2 - 100
        for i, (label, color) in enumerate(legend_items):
            item_x = legend_x + i * 70
            self.setFillColor(color)
            self.rect(item_x, legend_y, 10, 10, fill=1, stroke=0)
            self.setFont("Helvetica", 8)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(item_x + 12, legend_y + 8, label)
    
    def draw_liabilities_page(self):
        """Página 9 - Passivos Totais"""
        # Margens
        x_margin = 70
        y_margin = self.height - 100
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Passivos Totais")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        self.drawString(x_margin, bar_y - 20, "Análise detalhada do endividamento e estrutura de passivos")
        
        # === GRÁFICOS DE ROSCA - CUSTEIO VS INVESTIMENTOS ===
        donut_y = y_margin - 80
        
        # Dois gráficos lado a lado
        chart_width = (self.width - 2*x_margin - 40) / 2
        chart_height = 200
        
        # Dados para os gráficos (exemplo)
        custeio_consolidado = 20.1  # 23.5%
        investimento_consolidado = 65.7  # 76.5%
        total_consolidado = custeio_consolidado + investimento_consolidado
        
        custeio_2025 = 1.5  # 31.1%
        investimento_2025 = 3.3  # 68.9%
        total_2025 = custeio_2025 + investimento_2025
        
        # Obter dados reais se disponíveis
        debts_data = self.data.get('debts', {})
        debt_type_data = []
        
        # Processar dados de distribuição consolidada para custeio vs investimento
        debt_dist_consolidated = debts_data.get('debtDistributionConsolidated', [])
        if debt_dist_consolidated:
            # Converter formato do JSON para o esperado pelo gráfico
            debt_type_data = debt_dist_consolidated
        
        # Processar dados reais se existirem
        if debt_type_data:
            # Dados consolidados
            custeio_consolidado = 0
            investimento_consolidado = 0
            outros_consolidado = 0
            for item in debt_type_data:
                tipo = item.get('name') or item.get('tipo', '')
                valor = item.get('value', 0) or item.get('valor', 0)
                if 'CUSTEIO' in tipo.upper():
                    custeio_consolidado += valor / 1_000_000
                elif 'INVESTIMENTO' in tipo.upper():
                    investimento_consolidado += valor / 1_000_000
                else:
                    # Outros tipos (TRADING, OUTROS, etc) vão para investimento
                    investimento_consolidado += valor / 1_000_000
            total_consolidado = custeio_consolidado + investimento_consolidado
            
        # Dados para 2025/26
        debt_dist_2025 = debts_data.get('debtDistribution2025', [])
        if debt_dist_2025:
            custeio_2025 = 0
            investimento_2025 = 0
            for item in debt_dist_2025:
                tipo = item.get('name') or item.get('tipo', '')
                valor = item.get('value', 0) or item.get('valor', 0)
                if 'CUSTEIO' in tipo.upper():
                    custeio_2025 += valor / 1_000_000
                elif 'INVESTIMENTO' in tipo.upper():
                    investimento_2025 += valor / 1_000_000
                else:
                    # Outros tipos vão para investimento
                    investimento_2025 += valor / 1_000_000
            total_2025 = custeio_2025 + investimento_2025
        
        # === GRÁFICO 1 - CONSOLIDADO ===
        self._draw_donut_chart(
            x=x_margin,
            y=donut_y,
            width=chart_width,
            height=chart_height,
            data=[
                ('Custeio', custeio_consolidado, HexColor('#64748B')),  # Cinza azulado
                ('Investimentos', investimento_consolidado, HexColor('#1E293B'))  # Azul escuro
            ],
            title='Dívidas: Custeio vs Investimentos (Consolidado)',
            subtitle='Distribuição das dívidas bancárias por modalidade',
            total_label=f'R$ {total_consolidado:.1f}',
            total_sublabel='milhões'
        )
        
        # === GRÁFICO 2 - SAFRA 2025/26 ===
        self._draw_donut_chart(
            x=x_margin + chart_width + 40,
            y=donut_y,
            width=chart_width,
            height=chart_height,
            data=[
                ('Custeio', custeio_2025, HexColor('#64748B')),  # Cinza azulado
                ('Investimentos', investimento_2025, HexColor('#1E293B'))  # Azul escuro
            ],
            title='Dívidas: Custeio vs Investimentos (2025/26)',
            subtitle='Distribuição das dívidas bancárias por modalidade',
            total_label=f'R$ {total_2025:.1f}',
            total_sublabel='milhões'
        )
        
        # === GRÁFICO DE LINHAS - POSIÇÃO DA DÍVIDA POR SAFRA ===
        line_chart_y = donut_y - chart_height - 80
        
        # Título do gráfico
        self.setFont("Helvetica", 16)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, line_chart_y, "Posição da Dívida por Safra")
        
        # Área do gráfico
        chart_y = line_chart_y - 50
        chart_height = 200  # Reduzido para caber na página
        chart_x = x_margin + 60  # Espaço para eixo Y
        chart_width = self.width - 2*x_margin - 100
        
        # Obter dados reais do banco de dados - sem fallbacks hardcodados
        # debtPosition está no nível raiz do JSON exportado
        debt_position_data = self.data.get('debtPosition', {})
        debt_position = []
        
        # Processar dados de dívidas por safra se existirem
        if debt_position_data and 'dividas' in debt_position_data:
            # Obter anos disponíveis
            anos_disponiveis = debt_position_data.get('anos', [])
            
            # Buscar dados de dívidas bancárias, terras e fornecedores
            bancos_data = {}
            terras_data = {}
            fornecedores_data = {}
            
            for divida in debt_position_data.get('dividas', []):
                if divida.get('categoria') == 'BANCOS':
                    bancos_data = divida.get('valores_por_ano', {})
                elif divida.get('categoria') == 'TERRAS':
                    terras_data = divida.get('valores_por_ano', {})
                elif divida.get('categoria') == 'FORNECEDORES':
                    fornecedores_data = divida.get('valores_por_ano', {})
            
            # Buscar indicadores
            indicadores = debt_position_data.get('indicadores', {})
            divida_total_data = indicadores.get('endividamento_total', {})
            divida_liquida_data = indicadores.get('divida_liquida', {})
            
            # Montar dados para o gráfico
            for ano in anos_disponiveis:
                # Calcular dívida bancária (apenas bancos)
                divida_bancaria = bancos_data.get(ano, 0)
                
                # Dívida total (bancos + terras + fornecedores)
                divida_total = divida_total_data.get(ano, 0)
                
                # Dívida líquida
                divida_liquida = divida_liquida_data.get(ano, 0)
                
                debt_position.append({
                    'safra': ano,
                    'divida_total': divida_total,
                    'divida_bancaria': divida_bancaria,
                    'divida_liquida': divida_liquida
                })
        
        # Inicializar listas vazias
        safras = []
        divida_total = []
        divida_bancaria = []
        divida_liquida = []
        
        # Processar dados apenas se existirem no banco
        for item in debt_position:
            safra = item.get('safra', '')
            if safra:
                # Converter formato da safra para yy/yy
                if '/' in safra:
                    parts = safra.split('/')
                    if len(parts) == 2:
                        year1 = parts[0][-2:] if len(parts[0]) > 2 else parts[0]
                        year2 = parts[1][-2:] if len(parts[1]) > 2 else parts[1]
                        safra = f"{year1}/{year2}"
                safras.append(safra)
                divida_total.append(item.get('divida_total', 0) / 1_000_000)  # Converter para milhões
                divida_bancaria.append(item.get('divida_bancaria', 0) / 1_000_000)
                divida_liquida.append(item.get('divida_liquida', 0) / 1_000_000)
        
        # Configurar gráfico
        all_values = divida_total + divida_bancaria + divida_liquida
        
        # Se não houver dados, desenhar gráfico vazio com mensagem
        if not all_values or not safras:
            # Desenhar eixos vazios
            self.setStrokeColor(COLORS['lightest'])
            self.setLineWidth(0.5)
            # Eixo Y
            self.line(chart_x, chart_y, chart_x, chart_y - chart_height)
            # Eixo X
            self.line(chart_x, chart_y - chart_height, chart_x + chart_width, chart_y - chart_height)
            
            # Mensagem de dados não disponíveis
            self.setFont("Helvetica", 12)
            self.setFillColor(COLORS['light'])
            msg = "Dados não disponíveis"
            msg_width = self.stringWidth(msg, "Helvetica", 12)
            self.drawString(chart_x + (chart_width - msg_width) / 2, chart_y - chart_height/2, msg)
            
            # Desenhar legenda mesmo sem dados
            legend_y = chart_y - chart_height - 50
            line_colors = {
                'total': HexColor('#17134F'),     # Azul escuro (principal)
                'bancaria': HexColor('#3D2B87'),  # Roxo médio
                'liquida': HexColor('#6B4BB8')    # Roxo claro
            }
            legend_items = [
                ('Dívida Total', line_colors['total']),
                ('Dívida Bancária', line_colors['bancaria']),
                ('Dívida Líquida', line_colors['liquida'])
            ]
            
            legend_item_width = chart_width / len(legend_items)
            for idx, (label, color) in enumerate(legend_items):
                x_legend = chart_x + idx * legend_item_width
                
                # Linha colorida
                self.setStrokeColor(color)
                self.setLineWidth(2)
                self.line(x_legend, legend_y + 5, x_legend + 20, legend_y + 5)
                
                # Círculo no meio da linha
                self.setFillColor(COLORS['white'])
                self.circle(x_legend + 10, legend_y + 5, 3, stroke=1, fill=1)
                self.setFillColor(color)
                self.circle(x_legend + 10, legend_y + 5, 2, stroke=0, fill=1)
                
                # Nome
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['tertiary'])
                self.drawString(x_legend + 25, legend_y + 2, label)
            return
            
        max_value = max(all_values)
        max_value = int(max_value * 1.1)  # 10% de margem
        
        # Arredondar para múltiplo de 10
        max_value = ((max_value // 10) + 1) * 10
        
        num_safras = len(safras)
        
        # Eixo Y
        y_steps = 5
        for i in range(y_steps):
            y_pos = chart_y - chart_height + (i * chart_height / (y_steps - 1))
            value = max_value * i / (y_steps - 1)
            
            # Grid line
            self.setStrokeColor(COLORS['lightest'])
            self.setLineWidth(0.5)
            self.line(chart_x, y_pos, chart_x + chart_width, y_pos)
            
            # Label
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['light'])
            label = f'R$ {value:.0f}M'
            self.drawRightString(chart_x - 10, y_pos - 3, label)
        
        # Desenhar gráfico de linhas
        if num_safras > 0 and safras:
            # Cores das linhas - seguindo padrão do relatório
            line_colors = {
                'total': HexColor('#17134F'),     # Azul escuro (principal)
                'bancaria': HexColor('#3D2B87'),  # Roxo médio
                'liquida': HexColor('#6B4BB8')    # Roxo claro
            }
            
            # Calcular posições X
            x_positions = []
            x_step = chart_width / (num_safras - 1) if num_safras > 1 else chart_width / 2
            for i in range(num_safras):
                x_positions.append(chart_x + i * x_step)
            
            # Preparar dados para cada linha
            metrics_data = {
                'total': [],
                'bancaria': [],
                'liquida': []
            }
            
            # Coletar pontos para cada métrica
            for i in range(num_safras):
                x = x_positions[i]
                
                # Dívida Total
                if i < len(divida_total):
                    value = divida_total[i]
                    y = chart_y - chart_height + ((value / max_value) * chart_height) if value > 0 else chart_y - chart_height
                    metrics_data['total'].append((x, y, value))
                
                # Dívida Bancária
                if i < len(divida_bancaria):
                    value = divida_bancaria[i]
                    y = chart_y - chart_height + ((value / max_value) * chart_height) if value > 0 else chart_y - chart_height
                    metrics_data['bancaria'].append((x, y, value))
                
                # Dívida Líquida
                if i < len(divida_liquida):
                    value = divida_liquida[i]
                    y = chart_y - chart_height + ((value / max_value) * chart_height) if value > 0 else chart_y - chart_height
                    metrics_data['liquida'].append((x, y, value))
            
            # Desenhar linhas e pontos para cada métrica
            for metric_type, points in metrics_data.items():
                if len(points) > 1:
                    color = line_colors[metric_type]
                    self.setStrokeColor(color)
                    self.setLineWidth(2)
                    
                    # Desenhar linhas conectando os pontos
                    for i in range(len(points) - 1):
                        self.line(points[i][0], points[i][1], points[i+1][0], points[i+1][1])
                    
                    # Desenhar círculos nos pontos e valores
                    self.setFillColor(color)
                    for x, y, value in points:
                        # Círculo branco de fundo
                        self.setFillColor(COLORS['white'])
                        self.circle(x, y, 4, stroke=1, fill=1)
                        # Círculo colorido
                        self.setFillColor(color)
                        self.circle(x, y, 3, stroke=0, fill=1)
                        
                        # Adicionar valor acima do ponto (apenas se maior que zero)
                        if value > 0:
                            self.setFont("Helvetica", 8)
                            self.setFillColor(color)
                            value_str = f'{int(value)}'
                            value_width = self.stringWidth(value_str, "Helvetica", 8)
                            self.drawString(x - value_width/2, y + 8, value_str)
            
            # Labels das safras no eixo X
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            for i, safra in enumerate(safras):
                if i < len(x_positions):
                    label_width = self.stringWidth(safra, "Helvetica", 10)
                    self.drawString(x_positions[i] - label_width/2, chart_y - chart_height - 20, safra)
            
            # === LEGENDA ===
            legend_y = chart_y - chart_height - 50
            legend_items = [
                ('Dívida Total', line_colors['total']),
                ('Dívida Bancária', line_colors['bancaria']),
                ('Dívida Líquida', line_colors['liquida'])
            ]
            
            legend_item_width = chart_width / len(legend_items)
            for idx, (label, color) in enumerate(legend_items):
                x_legend = chart_x + idx * legend_item_width
                
                # Linha colorida
                self.setStrokeColor(color)
                self.setLineWidth(2)
                self.line(x_legend, legend_y + 5, x_legend + 20, legend_y + 5)
                
                # Círculo no meio da linha
                self.setFillColor(COLORS['white'])
                self.circle(x_legend + 10, legend_y + 5, 3, stroke=1, fill=1)
                self.setFillColor(color)
                self.circle(x_legend + 10, legend_y + 5, 2, stroke=0, fill=1)
                
                # Nome
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['tertiary'])
                self.drawString(x_legend + 25, legend_y + 2, label)
    
    def _draw_donut_chart(self, x, y, width, height, data, title, subtitle, total_label, total_sublabel):
        """Desenha um gráfico de rosca estilo do relatório"""
        # Fundo do card removido para deixar mais limpo
        # self.setFillColor(Color(0.03, 0.07, 0.14, alpha=0.02))
        # self.roundRect(x, y - height, width, height, 8, fill=1, stroke=0)
        
        # Título (ajustado para caber melhor)
        self.setFont("Helvetica-Bold", 12)
        self.setFillColor(COLORS['primary'])
        # Quebrar título se for muito longo
        if len(title) > 40:
            # Encontrar ponto de quebra
            parts = title.split(' ')
            mid = len(parts) // 2
            line1 = ' '.join(parts[:mid])
            line2 = ' '.join(parts[mid:])
            self.drawString(x + 15, y - 20, line1)
            self.drawString(x + 15, y - 32, line2)
            subtitle_y = y - 45
        else:
            self.drawString(x + 15, y - 25, title)
            subtitle_y = y - 38
        
        # Subtítulo
        self.setFont("Helvetica", 9)
        self.setFillColor(COLORS['light'])
        self.drawString(x + 15, subtitle_y, subtitle)
        
        # Centro do gráfico
        center_x = x + width * 0.35
        center_y = y - height/2 - 20  # Ajustado para dar mais espaço ao título
        outer_radius = min(width, height) * 0.22  # Reduzido para caber melhor
        inner_radius = outer_radius * 0.75  # Rosca mais fina para dar mais espaço ao texto
        
        # Calcular total e percentuais
        total = sum(value for _, value, _ in data)
        
        if total > 0:
            # Desenhar arcos
            start_angle = 90  # Começar do topo
            
            for label, value, color in data:
                if value > 0:
                    # Calcular ângulo
                    angle = (value / total) * 360
                    
                    # Desenhar arco externo
                    self.setFillColor(color)
                    self.wedge(center_x - outer_radius, center_y - outer_radius,
                              center_x + outer_radius, center_y + outer_radius,
                              start_angle, start_angle + angle, fill=1, stroke=0)
                    
                    start_angle += angle
            
            # Desenhar círculo interno (para criar a rosca)
            self.setFillColor(COLORS['white'])
            self.circle(center_x, center_y, inner_radius, fill=1, stroke=0)
            
            # Texto central
            self.setFont("Helvetica-Bold", 16)  # Reduzido para caber melhor
            self.setFillColor(COLORS['primary'])
            label_width = self.stringWidth(total_label, "Helvetica-Bold", 16)
            self.drawString(center_x - label_width/2, center_y + 5, total_label)
            
            self.setFont("Helvetica", 9)  # Reduzido
            self.setFillColor(COLORS['light'])
            sublabel_width = self.stringWidth(total_sublabel, "Helvetica", 9)
            self.drawString(center_x - sublabel_width/2, center_y - 8, total_sublabel)
        
        # Legenda
        legend_x = x + width * 0.62
        legend_y = y - height/2 + 10
        
        for i, (label, value, color) in enumerate(data):
            item_y = legend_y - i * 25
            
            # Quadrado colorido
            self.setFillColor(color)
            self.rect(legend_x, item_y - 4, 10, 10, fill=1, stroke=0)
            
            # Label
            self.setFont("Helvetica", 11)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(legend_x + 15, item_y, label)
            
            # Percentual
            if total > 0:
                percent = (value / total) * 100
                self.setFont("Helvetica-Bold", 11)
                self.setFillColor(COLORS['primary'])
                percent_text = f"{percent:.1f}%"
                # Calcular largura do label para posicionar percentual depois dele
                label_width = self.stringWidth(label, "Helvetica", 11)
                percent_x = legend_x + 15 + label_width + 10  # 10px de espaço após o label
                self.drawString(percent_x, item_y, percent_text)
    
    def draw_economic_indicators_page(self):
        """Página 10 - Indicadores Econômicos"""
        # Margens
        x_margin = 70
        y_margin = self.height - 100
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Indicadores Econômicos")
        
        # Barra decorativa abaixo do título
        debts_data = self.data.get('debts', {})
        debt_by_safra = debts_data.get('debtBySafra', [])
        debt_dist_2025 = debts_data.get('debtDistribution2025', [])
        debt_dist_consolidated = debts_data.get('debtDistributionConsolidated', [])
        debt_list = debts_data.get('list', [])
        
        # === SEÇÃO 1: GRÁFICOS DE PIZZA ===
        current_y = y_margin - 60
        
        # Container para os dois gráficos
        container_height = 180
        container_width = self.width - 2*x_margin
        
        # Background dos containers
        self.setFillColor(HexColor('#f8fafc'))
        self.roundRect(x_margin, current_y - container_height, container_width/2 - 10, container_height, 10, fill=1, stroke=0)
        self.roundRect(x_margin + container_width/2 + 10, current_y - container_height, container_width/2 - 10, container_height, 10, fill=1, stroke=0)
        
        # Área dos gráficos
        pizza_y = current_y - container_height/2 - 30
        pizza_size = 80  # Tamanho de cada pizza
        chart_width = self.width - 2*x_margin
        pizza_spacing = chart_width / 2
        
        # Cores para as pizzas
        pizza_colors = {
            'CUSTEIO': HexColor('#17134F'),      # Azul escuro
            'INVESTIMENTO': HexColor('#6B4BB8'),  # Roxo
            'BANCO': HexColor('#17134F'),         # Azul escuro
            'TERRAS': HexColor('#3D2B87'),        # Roxo médio
            'FORNECEDORES': HexColor('#9F7AE1')   # Lilás
        }
        
        # Pizza 1: Custeio vs Investimento (Consolidado)
        pizza1_x = x_margin + pizza_spacing/2
        pizza1_y = pizza_y - pizza_size
        
        # Buscar dados consolidados de custeio vs investimento
        # Como os dados consolidados mostram apenas "BANCO", vamos usar os dados da lista
        custeio_total = 0
        investimento_total = 0
        
        # Analisar lista de dívidas para separar por tipo
        for debt in debt_list:
            tipo = debt.get('tipo', '').upper()
            valor = debt.get('saldo_devedor', 0)
            
            # Por enquanto, vamos considerar todas como investimento
            # já que não temos a informação de CUSTEIO vs INVESTIMENTO
            investimento_total += valor
        
        # Se tivermos dados consolidados, usar eles
        for item in debt_dist_consolidated:
            name = item.get('name', '').upper()
            value = item.get('value', 0)
            if 'CUSTEIO' in name:
                custeio_total = value
                investimento_total = 0  # Reset para evitar duplicação
            elif 'INVESTIMENTO' in name:
                investimento_total = value
            elif name == 'BANCO' and custeio_total == 0 and investimento_total == 0:
                # Se só temos "BANCO", dividir 60/40 como exemplo
                custeio_total = value * 0.6
                investimento_total = value * 0.4
        
        total_debt = custeio_total + investimento_total
        
        debt_by_type = {
            'CUSTEIO': custeio_total,
            'INVESTIMENTO': investimento_total
        }
        
        # Desenhar pizza 1
        if total_debt > 0 and (custeio_total > 0 or investimento_total > 0):
            start_angle = 0
            for tipo, valor in debt_by_type.items():
                if valor > 0:
                    sweep_angle = (valor / total_debt) * 360
                    self.setFillColor(pizza_colors[tipo])
                    self.wedge(pizza1_x - pizza_size/2, pizza1_y, 
                             pizza1_x + pizza_size/2, pizza1_y + pizza_size,
                             start_angle, sweep_angle, fill=1, stroke=0)
                    
                    # Adicionar valor em milhões no centro da fatia
                    mid_angle = start_angle + sweep_angle/2
                    radius = pizza_size * 0.35
                    text_x = pizza1_x + radius * np.cos(np.radians(mid_angle))
                    text_y = pizza1_y + pizza_size/2 + radius * np.sin(np.radians(mid_angle))
                    
                    self.setFillColor(COLORS['white'])
                    self.setFont("Helvetica-Bold", 11)
                    value_text = f"R$ {valor/1_000_000:.0f}M"
                    value_width = self.stringWidth(value_text, "Helvetica-Bold", 11)
                    self.drawString(text_x - value_width/2, text_y - 3, value_text)
                    
                    start_angle += sweep_angle
            
            # Caixa com valores ao lado da pizza 1
            box_width = 100
            box_height = 50
            box_x = pizza1_x + pizza_size/2 + 20
            box_y = pizza1_y + pizza_size/2 - box_height/2
            
            # Fundo branco com borda
            self.setFillColor(COLORS['white'])
            self.setStrokeColor(COLORS['lightest'])
            self.setLineWidth(1)
            self.roundRect(box_x, box_y, box_width, box_height, 5, stroke=1, fill=1)
            
            # Valores na caixa
            self.setFont("Helvetica", 9)
            y_text = box_y + box_height - 15
            for tipo, valor in debt_by_type.items():
                if valor > 0:
                    self.setFillColor(COLORS['tertiary'])
                    self.drawString(box_x + 5, y_text, f"{tipo.title()}:")
                    self.setFillColor(COLORS['primary'])
                    self.setFont("Helvetica-Bold", 9)
                    percent_text = f"{valor/total_debt*100:.1f}%"
                    percent_width = self.stringWidth(percent_text, "Helvetica-Bold", 9)
                    self.drawRightString(box_x + box_width - 5, y_text, percent_text)
                    self.setFont("Helvetica", 9)
                    y_text -= 15
            
            # Título pizza 1
            self.setFont("Helvetica-Bold", 12)
            self.setFillColor(COLORS['primary'])
            title = "Dívidas: Custeio vs Investimentos (Consolidado)"
            title_width = self.stringWidth(title, "Helvetica-Bold", 12)
            self.drawString(pizza1_x - title_width/2, pizza1_y - 20, title)
            
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            subtitle = "Distribuição das dívidas bancárias por modalidade"
            subtitle_width = self.stringWidth(subtitle, "Helvetica", 10)
            self.drawString(pizza1_x - subtitle_width/2, pizza1_y - 35, subtitle)
            
            # Total em milhões abaixo
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            total_text = f"Total de dívidas: R$ {total_debt/1_000_000:.1f} milhões"
            total_width = self.stringWidth(total_text, "Helvetica", 10)
            self.drawString(pizza1_x - total_width/2, pizza1_y - 50, total_text)
        else:
            # Mensagem quando não há dados
            self.setFont("Helvetica", 12)
            self.setFillColor(COLORS['light'])
            no_data_text = "Sem dados de dívidas consolidadas"
            text_width = self.stringWidth(no_data_text, "Helvetica", 12)
            self.drawString(pizza1_x - text_width/2, pizza1_y + pizza_size/2, no_data_text)
        
        # Pizza 2: Por tipo de credor
        pizza2_x = x_margin + pizza_spacing * 1.5
        pizza2_y = pizza1_y
        
        # Dados para 2025/26 a partir dos dados reais
        custeio_2025 = 0
        investimento_2025 = 0
        
        for item in debt_dist_2025:
            if 'CUSTEIO' in item.get('name', '').upper():
                custeio_2025 += item.get('value', 0)
            elif 'INVESTIMENTO' in item.get('name', '').upper():
                investimento_2025 += item.get('value', 0)
        
        total_2025 = custeio_2025 + investimento_2025
        
        debt_2025 = {
            'CUSTEIO': custeio_2025,
            'INVESTIMENTO': investimento_2025
        }
        
        # Desenhar pizza 2
        if total_2025 > 0 and (custeio_2025 > 0 or investimento_2025 > 0):
            start_angle = 0
            for tipo, valor in debt_2025.items():
                if valor > 0:
                    sweep_angle = (valor / total_2025) * 360
                    self.setFillColor(pizza_colors[tipo])
                    self.wedge(pizza2_x - pizza_size/2, pizza2_y, 
                             pizza2_x + pizza_size/2, pizza2_y + pizza_size,
                             start_angle, sweep_angle, fill=1, stroke=0)
                    
                    # Adicionar valor em milhões no centro da fatia
                    mid_angle = start_angle + sweep_angle/2
                    radius = pizza_size * 0.35
                    text_x = pizza2_x + radius * np.cos(np.radians(mid_angle))
                    text_y = pizza2_y + pizza_size/2 + radius * np.sin(np.radians(mid_angle))
                    
                    self.setFillColor(COLORS['white'])
                    self.setFont("Helvetica-Bold", 11)
                    value_text = f"R$ {valor/1_000_000:.0f}M"
                    value_width = self.stringWidth(value_text, "Helvetica-Bold", 11)
                    self.drawString(text_x - value_width/2, text_y - 3, value_text)
                    
                    start_angle += sweep_angle
            
            # Caixa com valores ao lado da pizza 2
            box2_x = pizza2_x + pizza_size/2 + 20
            box2_y = pizza2_y + pizza_size/2 - box_height/2
            
            # Fundo branco com borda
            self.setFillColor(COLORS['white'])
            self.setStrokeColor(COLORS['lightest'])
            self.setLineWidth(1)
            self.roundRect(box2_x, box2_y, box_width, box_height, 5, stroke=1, fill=1)
            
            # Valores na caixa 2
            self.setFont("Helvetica", 9)
            y_text2 = box2_y + box_height - 15
            for tipo, valor in debt_2025.items():
                if valor > 0:
                    self.setFillColor(COLORS['tertiary'])
                    self.drawString(box2_x + 5, y_text2, f"{tipo.title()}:")
                    self.setFillColor(COLORS['primary'])
                    self.setFont("Helvetica-Bold", 9)
                    percent_text = f"{valor/total_2025*100:.1f}%"
                    percent_width = self.stringWidth(percent_text, "Helvetica-Bold", 9)
                    self.drawRightString(box2_x + box_width - 5, y_text2, percent_text)
                    self.setFont("Helvetica", 9)
                    y_text2 -= 15
            
            # Título pizza 2
            self.setFont("Helvetica-Bold", 12)
            self.setFillColor(COLORS['primary'])
            title = "Dívidas: Custeio vs Investimentos (2025/26)"
            title_width = self.stringWidth(title, "Helvetica-Bold", 12)
            self.drawString(pizza2_x - title_width/2, pizza2_y - 20, title)
            
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            subtitle = "Distribuição das dívidas bancárias por modalidade"
            subtitle_width = self.stringWidth(subtitle, "Helvetica", 10)
            self.drawString(pizza2_x - subtitle_width/2, pizza2_y - 35, subtitle)
            
            # Total em milhões abaixo
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            total_text2 = f"Total de dívidas: R$ {total_2025/1_000_000:.1f} milhões"
            total_width2 = self.stringWidth(total_text2, "Helvetica", 10)
            self.drawString(pizza2_x - total_width2/2, pizza2_y - 50, total_text2)
        else:
            # Mensagem quando não há dados
            self.setFont("Helvetica", 12)
            self.setFillColor(COLORS['light'])
            no_data_text = "Sem dados de dívidas para 2025/26"
            text_width = self.stringWidth(no_data_text, "Helvetica", 12)
            self.drawString(pizza2_x - text_width/2, pizza2_y + pizza_size/2, no_data_text)
        
        # Sem legenda separada - valores já estão nas caixas
        
        # === GRÁFICO DE BARRAS - POSIÇÃO DA DÍVIDA ===
        y_bars = pizza_y - pizza_size - 80
        
        self.setFont("Helvetica", 16)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_bars, "Posição da Dívida por Safra")
        
        # Área do gráfico
        bar_y = y_bars - 40
        bar_height = 150
        bar_x = x_margin + 60
        bar_chart_width = self.width - 2*x_margin - 100
        
        # Obter dados de posição da dívida a partir dos dados reais
        safras = []
        divida_total_valores = []
        divida_bancaria_valores = []
        divida_liquida_valores = []
        
        # Processar dados de debt_by_safra
        # A estrutura tem 'safra' e 'valor' apenas
        for item in debt_by_safra:
            safra = item.get('safra', '')
            valor = item.get('valor', 0)
            if safra and safra != 'Sem safra':
                safras.append(safra)
                divida_total_valores.append(valor)
                # Por enquanto, assumir que toda dívida é bancária
                divida_bancaria_valores.append(valor)
                # Dívida líquida seria total menos caixa (assumir 30% do total)
                divida_liquida_valores.append(valor * 0.7)
        
        # Só prosseguir se tivermos dados reais do banco
        
        if safras and len(safras) > 0:
            # Encontrar valor máximo
            max_value = max(max(divida_total_valores), max(divida_bancaria_valores), max(divida_liquida_valores))
            max_value = int(max_value * 1.1)  # 10% de margem
            
            # Eixo Y
            y_steps = 5
            for i in range(y_steps):
                y_pos = bar_y - bar_height + (i * bar_height / (y_steps - 1))
                value = max_value * i / (y_steps - 1)
                
                # Grid line
                self.setStrokeColor(COLORS['lightest'])
                self.setLineWidth(0.5)
                self.line(bar_x, y_pos, bar_x + bar_chart_width, y_pos)
                
                # Label
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['light'])
                label = f'R$ {value/1_000_000:.0f}M'
                self.drawRightString(bar_x - 10, y_pos - 3, label)
            
            # Barras agrupadas
            group_width = bar_chart_width / len(safras)
            bar_width = group_width / 4  # 3 barras + espaço
            
            # Cores das barras
            bar_colors = {
                'total': HexColor('#17134F'),     # Azul escuro
                'bancaria': HexColor('#3D2B87'),  # Roxo médio
                'liquida': HexColor('#9F7AE1')    # Lilás
            }
            
            for idx, safra in enumerate(safras):
                x_group = bar_x + idx * group_width
                
                # Dívida Total
                height_total = (divida_total_valores[idx] / max_value) * bar_height
                self.setFillColor(bar_colors['total'])
                self.rect(x_group, bar_y - bar_height, bar_width, height_total, fill=1, stroke=0)
                
                # Dívida Bancária
                height_bancaria = (divida_bancaria_valores[idx] / max_value) * bar_height
                self.setFillColor(bar_colors['bancaria'])
                self.rect(x_group + bar_width * 1.2, bar_y - bar_height, bar_width, height_bancaria, fill=1, stroke=0)
                
                # Dívida Líquida
                height_liquida = (divida_liquida_valores[idx] / max_value) * bar_height
                self.setFillColor(bar_colors['liquida'])
                self.rect(x_group + bar_width * 2.4, bar_y - bar_height, bar_width, height_liquida, fill=1, stroke=0)
                
                # Label do ano
                self.setFont("Helvetica", 9)
                self.setFillColor(COLORS['tertiary'])
                label_width = self.stringWidth(safra, "Helvetica", 9)
                self.drawString(x_group + group_width/2 - label_width/2, bar_y - bar_height - 15, safra)
            
            # Legenda do gráfico de barras
            bar_legend_y = bar_y - bar_height - 35
            bar_legend_items = [
                ('Dívida Total', bar_colors['total']),
                ('Dívida Bancária', bar_colors['bancaria']),
                ('Dívida Líquida', bar_colors['liquida'])
            ]
            
            legend_item_width = bar_chart_width / 3
            for idx, (label, color) in enumerate(bar_legend_items):
                x_legend = bar_x + idx * legend_item_width
                
                # Quadrado colorido
                self.setFillColor(color)
                self.rect(x_legend, bar_legend_y - 4, 12, 12, fill=1, stroke=0)
                
                # Nome
                self.setFont("Helvetica", 10)
                self.setFillColor(COLORS['tertiary'])
                self.drawString(x_legend + 18, bar_legend_y, label)
        else:
            # Mensagem quando não há dados de posição da dívida
            self.setFont("Helvetica", 12)
            self.setFillColor(COLORS['light'])
            no_data_text = "Sem dados de posição da dívida por safra"
            text_width = self.stringWidth(no_data_text, "Helvetica", 12)
            self.drawString(bar_x + bar_chart_width/2 - text_width/2, bar_y - bar_height/2, no_data_text)
    
    def draw_economic_indicators_page(self):
        """Página 10 - Indicadores Econômicos"""
        # Margens
        x_margin = 70
        y_margin = self.height - 100
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Indicadores Econômicos")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        self.drawString(x_margin, bar_y - 20, "Análise de alavancagem financeira e evolução do endividamento")
        
        # Obter dados
        debt_position = self.data.get('debtPosition', {})
        
        # === GRÁFICO DE LINHAS - INDICADORES DE ENDIVIDAMENTO ===
        y_chart = y_margin - 80
        
        self.setFont("Helvetica", 16)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_chart, "Indicadores de Endividamento")
        
        self.setFont("Helvetica", 10)
        self.setFillColor(COLORS['tertiary'])
        self.drawString(x_margin, y_chart - 15, "Evolução dos indicadores de alavancagem financeira")
        
        # Área do gráfico
        chart_y = y_chart - 40
        chart_height = 180
        chart_x = x_margin + 60
        chart_width = self.width - 2*x_margin - 100
        
        # Obter dados dos indicadores - apenas do banco de dados
        anos = []
        divida_receita = []
        divida_ebitda = []
        divida_liquida_receita = []
        divida_liquida_ebitda = []
        
        # Processar dados apenas se existirem no banco
        if debt_position and 'indicadores' in debt_position and 'indicadores_calculados' in debt_position['indicadores']:
            calc = debt_position['indicadores']['indicadores_calculados']
            
            # Extrair chaves das safras dos dados reais
            safra_keys = sorted(calc.get('divida_receita', {}).keys()) if 'divida_receita' in calc else []
            
            # Converter chaves das safras para formato display
            for key in safra_keys:
                if '/' in key:
                    parts = key.split('/')
                    if len(parts) == 2 and len(parts[0]) == 4:
                        anos.append(f"{parts[0][2:]}/{parts[1]}")
                    else:
                        anos.append(key)
                else:
                    anos.append(key)
            
            # Extrair valores reais
            if 'divida_receita' in calc:
                divida_receita = [calc['divida_receita'].get(key, 0) for key in safra_keys]
            if 'divida_ebitda' in calc:
                divida_ebitda = [calc['divida_ebitda'].get(key, 0) for key in safra_keys]
            if 'divida_liquida_receita' in calc:
                divida_liquida_receita = [calc['divida_liquida_receita'].get(key, 0) for key in safra_keys]
            if 'divida_liquida_ebitda' in calc:
                divida_liquida_ebitda = [calc['divida_liquida_ebitda'].get(key, 0) for key in safra_keys]
        
        # Encontrar valores máximo e mínimo - apenas se houver dados
        all_values = divida_receita + divida_ebitda + divida_liquida_receita + divida_liquida_ebitda
        if not all_values:
            return  # Sair se não houver dados do banco
            
        max_value = max(all_values)
        min_value = min(all_values)
        
        # Ajustar escala
        if min_value < 0:
            min_value = min_value * 1.1
        else:
            min_value = 0
        max_value = max_value * 1.1
        
        # Evitar divisão por zero
        if max_value == min_value:
            max_value = min_value + 1
        
        # Eixo Y
        y_steps = 7
        for i in range(y_steps):
            y_pos = chart_y - chart_height + (i * chart_height / (y_steps - 1))
            value = min_value + (max_value - min_value) * i / (y_steps - 1)
            
            # Grid line
            self.setStrokeColor(COLORS['lightest'])
            self.setLineWidth(0.5)
            self.line(chart_x, y_pos, chart_x + chart_width, y_pos)
            
            # Label
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['light'])
            label = f'{value:.2f}'
            self.drawRightString(chart_x - 10, y_pos - 3, label)
        
        # Linha zero se houver valores negativos
        if min_value < 0:
            zero_y = chart_y - chart_height + ((-min_value) / (max_value - min_value)) * chart_height
            self.setStrokeColor(COLORS['tertiary'])
            self.setLineWidth(1)
            self.setDash([3, 3])
            self.line(chart_x, zero_y, chart_x + chart_width, zero_y)
            self.setDash([])
        
        # Cores das linhas
        line_colors = {
            'divida_receita': HexColor('#17134F'),      # Azul escuro
            'divida_ebitda': HexColor('#6B4BB8'),       # Roxo
            'divida_liquida_receita': HexColor('#3D2B87'), # Roxo médio
            'divida_liquida_ebitda': HexColor('#9F7AE1')   # Lilás
        }
        
        # Desenhar linhas
        x_step = chart_width / (len(anos) - 1)
        
        # Função para calcular posição Y
        def get_y_pos(value):
            return chart_y - chart_height + ((value - min_value) / (max_value - min_value)) * chart_height
        
        # Desenhar cada linha
        datasets = [
            ('divida_receita', divida_receita, 'Dívida/Receita'),
            ('divida_ebitda', divida_ebitda, 'Dívida/Ebitda'),
            ('divida_liquida_receita', divida_liquida_receita, 'Dívida Líquida/Receita'),
            ('divida_liquida_ebitda', divida_liquida_ebitda, 'Dívida Líquida/Ebitda')
        ]
        
        # Desenhar linhas e pontos para cada métrica
        for key, values, label in datasets:
            color = line_colors[key]
            self.setStrokeColor(color)
            self.setLineWidth(2)
            
            # Desenhar linhas conectando os pontos
            if len(values) > 1:
                for i in range(len(values) - 1):
                    x1 = chart_x + i * x_step
                    y1 = get_y_pos(values[i])
                    x2 = chart_x + (i + 1) * x_step
                    y2 = get_y_pos(values[i + 1])
                    self.line(x1, y1, x2, y2)
            
            # Desenhar círculos nos pontos e valores
            self.setFillColor(color)
            for i, value in enumerate(values):
                x = chart_x + i * x_step
                y = get_y_pos(value)
                
                # Círculo branco de fundo
                self.setFillColor(COLORS['white'])
                self.circle(x, y, 4, stroke=1, fill=1)
                # Círculo colorido
                self.setFillColor(color)
                self.circle(x, y, 3, stroke=0, fill=1)
                
                # Adicionar valor acima do ponto
                self.setFont("Helvetica", 8)
                self.setFillColor(color)
                value_text = f'{value:.2f}'
                value_width = self.stringWidth(value_text, "Helvetica", 8)
                
                # Ajustar posição do texto baseado no valor
                text_y = y + 8 if value >= 0 else y - 12
                self.drawString(x - value_width/2, text_y, value_text)
        
        # Labels do eixo X (anos)
        for i, ano in enumerate(anos):
            x = chart_x + i * x_step
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            label_width = self.stringWidth(ano, "Helvetica", 10)
            self.drawString(x - label_width/2, chart_y - chart_height - 15, ano)
        
        # === LEGENDA ===
        legend_y = chart_y - chart_height - 50
        legend_items = [
            ('Dívida/Receita', line_colors['divida_receita']),
            ('Dívida/Ebitda', line_colors['divida_ebitda']),
            ('Dívida Líquida/Receita', line_colors['divida_liquida_receita']),
            ('Dívida Líquida/Ebitda', line_colors['divida_liquida_ebitda'])
        ]
        
        # Duas colunas para a legenda
        items_per_row = 2
        legend_spacing = chart_width / items_per_row
        
        for idx, (label, color) in enumerate(legend_items):
            row = idx // items_per_row
            col = idx % items_per_row
            x_legend = chart_x + col * legend_spacing
            y_legend_pos = legend_y - row * 20  # 20px entre linhas
            
            # Linha com bolinha (igual ao estilo do gráfico Posição da Dívida por Safra)
            self.setStrokeColor(color)
            self.setLineWidth(2)
            self.line(x_legend, y_legend_pos, x_legend + 15, y_legend_pos)
            
            # Círculo branco de fundo
            self.setFillColor(COLORS['white'])
            self.circle(x_legend + 7.5, y_legend_pos, 3, stroke=1, fill=1)
            # Círculo colorido
            self.setFillColor(color)
            self.circle(x_legend + 7.5, y_legend_pos, 2, stroke=0, fill=1)
            
            # Nome
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(x_legend + 20, y_legend_pos - 3, label)
        
        # === TABELA DETALHADA ===
        table_y = legend_y - 80  # Ajustado para acomodar a legenda de duas linhas
        
        # Título da tabela
        self.setFont("Helvetica", 14)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, table_y, "Detalhamento dos Indicadores")
        
        # Preparar dados da tabela
        header_y = table_y - 30
        num_safras = min(len(anos), 8)
        col_widths = [120]  # Métrica - aumentado para acomodar nomes longos
        safra_col_width = (self.width - 2*x_margin - 120) / num_safras
        for i in range(num_safras):
            col_widths.append(safra_col_width)
        
        table_width = sum(col_widths)
        
        # Fundo do cabeçalho
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
        self.rect(x_margin, header_y - 20, table_width, 25, fill=1, stroke=0)
        
        # Cabeçalho
        self.setFont("Helvetica-Bold", 9)
        self.setFillColor(COLORS['primary'])
        
        # Métrica
        self.drawString(x_margin + 5, header_y - 10, "MÉTRICA")
        
        # Safras
        col_x = x_margin + col_widths[0]
        for idx in range(num_safras):
            safra_label = anos[idx]
            label_width = self.stringWidth(safra_label, "Helvetica-Bold", 9)
            x_pos = col_x + (col_widths[idx + 1] - label_width) / 2
            self.drawString(x_pos, header_y - 10, safra_label)
            col_x += col_widths[idx + 1]
        
        # Linhas de dados
        row_y = header_y - 30
        metrics_rows = [
            ('Dívida/Receita', divida_receita, line_colors['divida_receita']),
            ('Dívida/Ebitda', divida_ebitda, line_colors['divida_ebitda']),
            ('Dívida Líq./Receita', divida_liquida_receita, line_colors['divida_liquida_receita']),
            ('Dívida Líq./Ebitda', divida_liquida_ebitda, line_colors['divida_liquida_ebitda'])
        ]
        
        for idx, (metric_name, values, color) in enumerate(metrics_rows):
            # Alternar cor de fundo
            if idx % 2 == 1:
                self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                self.rect(x_margin, row_y - 15, table_width, 20, fill=1, stroke=0)
            
            # Linha e círculo coloridos (ao invés de nome com cor)
            # Linha
            self.setStrokeColor(color)
            self.setLineWidth(2)
            self.line(x_margin + 5, row_y - 5, x_margin + 25, row_y - 5)
            
            # Círculo no meio da linha
            self.setFillColor(COLORS['white'])
            self.circle(x_margin + 15, row_y - 5, 3, stroke=1, fill=1)
            self.setFillColor(color)
            self.circle(x_margin + 15, row_y - 5, 2, stroke=0, fill=1)
            
            # Nome da métrica
            self.setFont("Helvetica-Bold", 9)
            self.setFillColor(COLORS['primary'])  # Cor padrão ao invés da cor da linha
            self.drawString(x_margin + 30, row_y - 5, metric_name.upper())
            
            # Valores
            self.setFont("Helvetica", 9)
            self.setFillColor(COLORS['tertiary'])
            col_x = x_margin + col_widths[0]
            for idx_safra in range(num_safras):
                value = values[idx_safra]
                # Mostrar '-' quando o valor for zero
                if value == 0:
                    value_str = '-'
                else:
                    value_str = f'{value:.2f}'
                
                value_width = self.stringWidth(value_str, "Helvetica", 9)
                x_pos = col_x + (col_widths[idx_safra + 1] - value_width) / 2
                self.drawString(x_pos, row_y - 5, value_str)
                col_x += col_widths[idx_safra + 1]
            
            row_y -= 20
    
    def draw_cash_flow_page(self):
        """Página 11 - Fluxo de Caixa Projetado"""
        # Margens
        x_margin = 70
        y_margin = self.height - 100
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Fluxo de Caixa Projetado")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        self.drawString(x_margin, bar_y - 20, "Projeção detalhada de entradas e saídas por safra")
        
        # Obter dados do fluxo de caixa
        cash_flow_data = self.data.get('cashFlowProjection', {})
        
        # === TABELA DE FLUXO DE CAIXA ===
        table_y = y_margin - 60
        
        # Preparar dados - usar anos do fluxo de caixa
        # Obter dados apenas do banco de dados - sem fallbacks
        anos = cash_flow_data.get('anos', [])
        if not anos:
            return  # Sair se não houver dados do banco
        
        # Converter anos para formato curto
        anos_display = []
        for ano in anos:
            if '/' in ano:
                parts = ano.split('/')
                if len(parts[0]) == 4:
                    anos_display.append(f"{parts[0][2:]}/{parts[1]}")
                else:
                    anos_display.append(ano)
            else:
                anos_display.append(ano)
        
        # Largura das colunas
        metric_col_width = 150
        year_col_width = (self.width - 2*x_margin - metric_col_width) / len(anos_display)
        col_widths = [metric_col_width] + [year_col_width] * len(anos_display)
        
        table_width = sum(col_widths)
        
        # Cabeçalho da tabela
        header_y = table_y
        self.setFillColor(COLORS['primary'])
        self.rect(x_margin, header_y - 25, table_width, 25, fill=1, stroke=0)
        
        # Texto do cabeçalho
        self.setFont("Helvetica-Bold", 10)
        self.setFillColor(COLORS['white'])
        self.drawString(x_margin + 5, header_y - 17, "Fluxo de Caixa (R$)")
        
        # Anos no cabeçalho
        col_x = x_margin + metric_col_width
        for idx, ano in enumerate(anos_display):
            self.setFont("Helvetica-Bold", 9)
            label_width = self.stringWidth(ano, "Helvetica-Bold", 9)
            x_pos = col_x + (year_col_width - label_width) / 2
            self.drawString(x_pos, header_y - 17, ano)
            col_x += year_col_width
        
        # Estrutura de dados do fluxo de caixa
        sections = [
            {
                'title': '% Receitas Agrícolas',
                'metrics': [
                    ('Total Receitas Agrícolas', 'receitas_agricolas', True)
                ]
            },
            {
                'title': '% Despesas Agrícolas',
                'metrics': [
                    ('Total Despesas Agrícolas', 'despesas_agricolas', True),
                    ('Margem Bruta Agrícola', 'margem_bruta', True)
                ]
            },
            {
                'title': '% Outras Despesas',
                'metrics': [
                    ('Arrendamento', 'arrendamento', True),
                    ('Pró-Labore', 'pro_labore', True),
                    ('Divisão de Lucros', 'divisao_lucros', True),
                    ('Financeiras', 'financeiras', True),
                    ('Tributárias', 'tributarias', True),
                    ('Outras', 'outras_despesas', True),
                    ('Total Outras Despesas', 'total_outras_despesas', True)
                ]
            },
            {
                'title': '% Investimentos',
                'metrics': [
                    ('Terras', 'terras', True),
                    ('Maquinários', 'maquinarios', True),
                    ('Outros', 'outros_investimentos', True),
                    ('Total Investimentos', 'total_investimentos', True)
                ]
            },
            {
                'title': '% Financeiras',
                'metrics': [
                    ('Serviço da Dívida', 'servico_divida', True),
                    ('Pagamentos - Bancos', 'pagamentos_bancos', True),
                    ('Novas Linhas de Crédito', 'novas_linhas', True),
                    ('Total Financeiras', 'total_financeiras', True)
                ]
            }
        ]
        
        # Iniciar linha após o cabeçalho
        row_y = header_y - 35
        
        # Função para formatar valores
        def format_value(value):
            if value == 0:
                return '-'
            elif abs(value) >= 1_000_000:
                return f'{value/1_000_000:.1f}M'
            elif abs(value) >= 1_000:
                return f'{value/1_000:.0f}K'
            else:
                return f'{value:.0f}'
        
        # Desenhar seções
        for section_idx, section in enumerate(sections):
            # Título da seção
            self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.1))
            self.rect(x_margin, row_y - 20, table_width, 20, fill=1, stroke=0)
            
            self.setFont("Helvetica-Bold", 9)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin + 5, row_y - 15, section['title'])
            row_y -= 25
            
            # Métricas da seção
            for metric_idx, (metric_name, metric_key, is_currency) in enumerate(section['metrics']):
                # Alternar cor de fundo
                if metric_idx % 2 == 1:
                    self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                    self.rect(x_margin, row_y - 18, table_width, 20, fill=1, stroke=0)
                
                # Nome da métrica
                self.setFont("Helvetica", 9)
                if metric_name.startswith('Total'):
                    self.setFont("Helvetica-Bold", 9)
                    self.setFillColor(COLORS['primary'])
                else:
                    self.setFillColor(COLORS['tertiary'])
                
                self.drawString(x_margin + 10, row_y - 10, metric_name)
                
                # Valores
                self.setFont("Helvetica", 8)
                col_x = x_margin + metric_col_width
                
                # Obter valores reais do fluxo de caixa
                for ano_idx, ano in enumerate(anos):
                    value = 0
                    
                    if metric_key == 'receitas_agricolas':
                        value = cash_flow_data.get('receitas_agricolas', {}).get('total_por_ano', {}).get(ano, 0)
                    elif metric_key == 'despesas_agricolas':
                        value = cash_flow_data.get('despesas_agricolas', {}).get('total_por_ano', {}).get(ano, 0)
                    elif metric_key == 'margem_bruta':
                        receita = cash_flow_data.get('receitas_agricolas', {}).get('total_por_ano', {}).get(ano, 0)
                        despesa = cash_flow_data.get('despesas_agricolas', {}).get('total_por_ano', {}).get(ano, 0)
                        value = receita - despesa
                    elif metric_key == 'arrendamento':
                        value = cash_flow_data.get('outras_despesas', {}).get('arrendamento', {}).get(ano, 0)
                    elif metric_key == 'pro_labore':
                        value = cash_flow_data.get('outras_despesas', {}).get('pro_labore', {}).get(ano, 0)
                    elif metric_key == 'divisao_lucros':
                        value = cash_flow_data.get('outras_despesas', {}).get('divisao_lucros', {}).get(ano, 0)
                    elif metric_key == 'financeiras':
                        value = cash_flow_data.get('outras_despesas', {}).get('financeiras', {}).get(ano, 0)
                    elif metric_key == 'tributarias':
                        value = cash_flow_data.get('outras_despesas', {}).get('tributarias', {}).get(ano, 0)
                    elif metric_key == 'outras_despesas':
                        value = cash_flow_data.get('outras_despesas', {}).get('outras', {}).get(ano, 0)
                    elif metric_key == 'total_outras_despesas':
                        value = cash_flow_data.get('outras_despesas', {}).get('total_por_ano', {}).get(ano, 0)
                    elif metric_key == 'terras':
                        value = cash_flow_data.get('investimentos', {}).get('terras', {}).get(ano, 0)
                    elif metric_key == 'maquinarios':
                        value = cash_flow_data.get('investimentos', {}).get('maquinarios', {}).get(ano, 0)
                    elif metric_key == 'outros_investimentos':
                        value = cash_flow_data.get('investimentos', {}).get('outros', {}).get(ano, 0)
                    elif metric_key == 'total_investimentos':
                        value = cash_flow_data.get('investimentos', {}).get('total', {}).get(ano, 0)
                    elif metric_key == 'servico_divida':
                        value = cash_flow_data.get('financeiras', {}).get('servico_divida', {}).get(ano, 0)
                    elif metric_key == 'pagamentos_bancos':
                        value = cash_flow_data.get('financeiras', {}).get('pagamentos_bancos', {}).get(ano, 0)
                    elif metric_key == 'novas_linhas':
                        value = cash_flow_data.get('financeiras', {}).get('novas_linhas_credito', {}).get(ano, 0)
                    elif metric_key == 'total_financeiras':
                        value = cash_flow_data.get('financeiras', {}).get('total_por_ano', {}).get(ano, 0)
                    
                    if is_currency:
                        value_str = format_value(value)
                    else:
                        value_str = '0%'
                    
                    # Cor do valor baseado se é positivo ou negativo
                    if 'despesas' in metric_key or 'pagamentos' in metric_key:
                        self.setFillColor(HexColor('#DC2626'))  # Vermelho para despesas
                    else:
                        self.setFillColor(COLORS['tertiary'])
                    
                    value_width = self.stringWidth(value_str, "Helvetica", 8)
                    x_pos = col_x + (year_col_width - value_width) / 2
                    self.drawString(x_pos, row_y - 10, value_str)
                    col_x += year_col_width
                
                row_y -= 20
            
            # Espaço entre seções
            row_y -= 5
        
        # Fluxo de Caixa Final e Acumulado
        self.setFillColor(COLORS['primary'])
        self.rect(x_margin, row_y - 18, table_width, 18, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 8)  # Fonte menor
        self.setFillColor(COLORS['white'])
        self.drawString(x_margin + 5, row_y - 13, "Fluxo de Caixa Final")
        
        # Valores do fluxo final
        self.setFont("Helvetica-Bold", 8)  # Fonte menor
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = cash_flow_data.get('fluxo_liquido', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 13, value_str)
            col_x += year_col_width
        
        row_y -= 23
        
        # Fluxo de Caixa Acumulado
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.1))
        self.rect(x_margin, row_y - 18, table_width, 18, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 8)  # Fonte menor
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 5, row_y - 13, "Fluxo de Caixa Acumulado")
        
        # Valores acumulados
        self.setFont("Helvetica-Bold", 8)  # Fonte menor
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = cash_flow_data.get('fluxo_acumulado', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 13, value_str)
            col_x += year_col_width


    def draw_dre_page(self):
        """Página 12 - DRE (Demonstração de Resultado)"""
        # Margens
        x_margin = 50
        y_margin = self.height - 120
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Demonstração de Resultado")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição com período
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        # Obter período das safras
        dre_data = self.data.get('dre', [])
        if dre_data:
            safras = sorted([d.get('safra', '') for d in dre_data if d.get('safra')])
            if safras:
                periodo = f"{safras[0]} a {safras[-1]}"
            else:
                periodo = "Período atual"
        else:
            periodo = "Período atual"
        self.drawString(x_margin, bar_y - 20, f"Demonstração do resultado do exercício por safra")
        
        # Obter dados da DRE
        dre_data = self.data.get('dre', [])
        
        # === TABELA DRE ===
        table_y = y_margin - 60
        
        # Preparar dados - extrair anos da DRE apenas do banco
        anos = []
        if dre_data:
            anos = sorted([str(item.get('ano', 0)) for item in dre_data if item.get('ano')])
        
        if not anos:
            return  # Sair se não houver dados do banco
        
        # Converter anos para formato safra (20/21, 21/22, etc)
        anos_display = []
        for i, ano in enumerate(anos):
            if len(ano) == 4:
                current_year = int(ano)
                next_year = current_year + 1
                safra = f"{str(current_year)[2:]}/{str(next_year)[2:]}"
                anos_display.append(safra)
            else:
                anos_display.append(ano)
        
        # Criar mapa de dados por ano
        dre_by_year = {}
        for item in dre_data:
            ano = str(item.get('ano', 0))
            if ano in anos:
                dre_by_year[ano] = item
        
        # Largura das colunas
        metric_col_width = 150
        year_col_width = (self.width - 2*x_margin - metric_col_width) / len(anos_display)
        col_widths = [metric_col_width] + [year_col_width] * len(anos_display)
        
        table_width = sum(col_widths)
        
        # Cabeçalho da tabela
        header_y = table_y
        self.setFillColor(COLORS['primary'])
        self.rect(x_margin, header_y - 25, table_width, 25, fill=1, stroke=0)
        
        # Texto do cabeçalho
        self.setFont("Helvetica-Bold", 10)
        self.setFillColor(COLORS['white'])
        self.drawString(x_margin + 5, header_y - 17, "Demonstração de Resultado")
        
        # Anos no cabeçalho
        col_x = x_margin + metric_col_width
        for idx, ano in enumerate(anos_display):
            self.setFont("Helvetica-Bold", 9)
            label_width = self.stringWidth(ano, "Helvetica-Bold", 9)
            x_pos = col_x + (year_col_width - label_width) / 2
            self.drawString(x_pos, header_y - 17, ano)
            col_x += year_col_width
        
        # Estrutura de dados da DRE
        sections = [
            {
                'title': '% Receita Operacional Bruta',
                'metrics': [
                    ('Total Receita Bruta', 'receita_bruta', True)
                ]
            },
            {
                'title': '(-) IMPOSTOS',
                'metrics': [
                    ('(-) Total Impostos e Vendas', 'deducoes', True)
                ]
            },
            {
                'title': 'Receita Operacional Líquida',
                'metrics': [
                    ('Total Receita Líquida', 'receita_liquida', True)
                ],
                'is_highlight': True
            },
            {
                'title': '% Custos',
                'metrics': [
                    ('Total Custos', 'custos_vendas', True)
                ]
            },
            {
                'title': 'Lucro Bruto',
                'metrics': [
                    ('Total Lucro Bruto', 'lucro_bruto', True)
                ],
                'is_highlight': True
            },
            {
                'title': '% Despesas Operacionais',
                'metrics': [
                    ('Total Despesas Operacionais', 'despesas_operacionais', True)
                ]
            },
            {
                'title': 'EBITDA',
                'metrics': [
                    ('Total EBITDA', 'lucro_operacional', True)
                ],
                'is_highlight': True
            },
            {
                'title': '% Resultado Financeiro',
                'metrics': [
                    ('Total Resultado Financeiro', 'resultado_financeiro', True)
                ]
            },
            {
                'title': 'Lucro Antes do IR',
                'metrics': [
                    ('Total Lucro Antes IR', 'lucro_antes_impostos', True)
                ],
                'is_highlight': True
            },
            {
                'title': '',
                'metrics': [
                    ('Impostos sobre o Lucro', 'impostos', True)
                ]
            }
        ]
        
        # Função para formatar valores
        def format_value(value):
            if value == 0:
                return '-'
            elif abs(value) >= 1_000_000:
                return f'{value/1_000_000:.1f}M'
            elif abs(value) >= 1_000:
                return f'{value/1_000:.0f}K'
            else:
                return f'{value:.0f}'
        
        # Função para formatar percentual
        def format_percent(value):
            if value == 0:
                return '-'
            return f'{value:.1f}%'
        
        # Iniciar linha após o cabeçalho
        row_y = header_y - 35
        
        # Desenhar seções
        for section_idx, section in enumerate(sections):
            # Título da seção
            if section.get('title'):
                if section.get('is_highlight'):
                    # Seção destacada (como Receita Líquida, Lucro Bruto, etc)
                    self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.1))
                else:
                    # Seção normal
                    self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
                
                self.rect(x_margin, row_y - 20, table_width, 20, fill=1, stroke=0)
                
                self.setFont("Helvetica-Bold", 9)
                self.setFillColor(COLORS['primary'])
                self.drawString(x_margin + 5, row_y - 15, section['title'])
                row_y -= 25
            
            # Métricas da seção
            for metric_idx, (metric_name, metric_key, is_currency) in enumerate(section['metrics']):
                # Alternar cor de fundo
                if metric_idx % 2 == 1:
                    self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                    self.rect(x_margin, row_y - 18, table_width, 20, fill=1, stroke=0)
                
                # Nome da métrica
                self.setFont("Helvetica", 9)
                if metric_name.startswith('Total') and section.get('is_highlight'):
                    self.setFont("Helvetica-Bold", 9)
                    self.setFillColor(COLORS['primary'])
                else:
                    self.setFillColor(COLORS['tertiary'])
                
                self.drawString(x_margin + 10, row_y - 10, metric_name)
                
                # Valores
                self.setFont("Helvetica", 8)
                col_x = x_margin + metric_col_width
                
                # Obter valores reais da DRE
                for ano in anos:
                    value = 0
                    
                    if ano in dre_by_year:
                        data = dre_by_year[ano]
                        value = data.get(metric_key, 0)
                    
                    if is_currency:
                        value_str = format_value(value)
                    else:
                        value_str = format_percent(value)
                    
                    # Cor do valor baseado se é positivo ou negativo
                    if 'despesas' in metric_key or 'custos' in metric_key or 'impostos' in metric_key or 'deducoes' in metric_key:
                        self.setFillColor(HexColor('#DC2626'))  # Vermelho para despesas
                    elif value < 0:
                        self.setFillColor(HexColor('#DC2626'))  # Vermelho para valores negativos
                    else:
                        self.setFillColor(COLORS['tertiary'])
                    
                    value_width = self.stringWidth(value_str, "Helvetica", 8)
                    x_pos = col_x + (year_col_width - value_width) / 2
                    self.drawString(x_pos, row_y - 10, value_str)
                    col_x += year_col_width
                
                row_y -= 20
            
            # Espaço entre seções
            row_y -= 5
        
        # LUCRO LÍQUIDO - seção final especial
        self.setFillColor(COLORS['primary'])
        self.rect(x_margin, row_y - 18, table_width, 18, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLORS['white'])
        self.drawString(x_margin + 5, row_y - 13, "LUCRO LÍQUIDO")
        
        # Valores do lucro líquido
        self.setFont("Helvetica-Bold", 8)
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = 0
            if ano in dre_by_year:
                value = dre_by_year[ano].get('lucro_liquido', 0)
            
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 13, value_str)
            col_x += year_col_width
        
        row_y -= 23
        
        # Margem Líquida (%)
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.1))
        self.rect(x_margin, row_y - 18, table_width, 18, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 5, row_y - 13, "Margem Líquida (%)")
        
        # Valores de margem
        self.setFont("Helvetica-Bold", 8)
        col_x = x_margin + metric_col_width
        for ano in anos:
            margin = 0
            if ano in dre_by_year:
                data = dre_by_year[ano]
                if data.get('receita_bruta', 0) > 0:
                    margin = (data.get('lucro_liquido', 0) / data['receita_bruta']) * 100
            
            margin_str = format_percent(margin)
            value_width = self.stringWidth(margin_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 13, margin_str)
            col_x += year_col_width


    def draw_balance_sheet_page(self):
        """Página 13 - Balanço Patrimonial"""
        # Margens
        x_margin = 50
        y_margin = self.height - 120
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Balanço Patrimonial")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # Subtítulo/descrição com período
        self.setFont("Helvetica", 12)
        self.setFillColor(HexColor('#666666'))
        # Obter período das safras
        balance_data = self.data.get('balanceSheet', [])
        if balance_data:
            anos = sorted([ano for ano in balance_data.keys()])
            if anos:
                periodo = f"{anos[0]} a {anos[-1]}"
            else:
                periodo = "Período atual"
        else:
            periodo = "Período atual"
        self.drawString(x_margin, bar_y - 20, "Demonstração da posição patrimonial e financeira por safra")
        
        # Obter dados do balanço
        balance_sheet_data = self.data.get('balanceSheet', {})
        
        # === TABELA BALANÇO ===
        table_y = y_margin - 60
        
        # Anos - apenas do banco de dados
        anos = balance_sheet_data.get('anos', [])
        if not anos:
            return  # Sair se não houver dados do banco
        
        # Converter anos para formato safra (20/21, 21/22, etc)
        anos_display = []
        for i, ano in enumerate(anos):
            ano_str = str(ano)
            if '/' in ano_str:
                # Já está no formato safra - converter para yy/yy
                parts = ano_str.split('/')
                if len(parts) == 2:
                    year1 = parts[0][-2:] if len(parts[0]) > 2 else parts[0]
                    year2 = parts[1][-2:] if len(parts[1]) > 2 else parts[1]
                    anos_display.append(f"{year1}/{year2}")
                else:
                    anos_display.append(ano_str)
            elif len(ano_str) == 4:
                current_year = int(ano_str)
                next_year = current_year + 1
                safra = f"{str(current_year)[2:]}/{str(next_year)[2:]}"
                anos_display.append(safra)
            else:
                anos_display.append(ano_str)
        
        # Largura das colunas
        metric_col_width = 120
        year_col_width = (self.width - 2*x_margin - metric_col_width) / len(anos_display)
        col_widths = [metric_col_width] + [year_col_width] * len(anos_display)
        
        table_width = sum(col_widths)
        
        # Cabeçalho da tabela
        header_y = table_y
        self.setFillColor(COLORS['primary'])
        self.rect(x_margin, header_y - 25, table_width, 25, fill=1, stroke=0)
        
        # Texto do cabeçalho
        self.setFont("Helvetica-Bold", 10)
        self.setFillColor(COLORS['white'])
        self.drawString(x_margin + 5, header_y - 17, "Balanço Patrimonial")
        
        # Anos no cabeçalho
        col_x = x_margin + metric_col_width
        for idx, ano in enumerate(anos_display):
            self.setFont("Helvetica-Bold", 8)
            label_width = self.stringWidth(ano, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - label_width) / 2
            self.drawString(x_pos, header_y - 17, ano)
            col_x += year_col_width
        
        # Função para formatar valores
        def format_value(value):
            if value == 0:
                return '-'
            elif abs(value) >= 1_000_000:
                return f'{value/1_000_000:.1f}M'
            elif abs(value) >= 1_000:
                return f'{value/1_000:.0f}K'
            else:
                return f'{value:.0f}'
        
        # Iniciar linha após o cabeçalho
        row_y = header_y - 35
        
        # Obter dados do ativo
        ativo_data = balance_sheet_data.get('ativo', {})
        
        # === ATIVO ===
        # Título da seção
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
        self.rect(x_margin, row_y - 20, table_width, 20, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 9)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 5, row_y - 15, "%× Ativo")
        row_y -= 25
        
        # Ativo Circulante
        self.setFont("Helvetica", 9)
        self.setFillColor(COLORS['tertiary'])
        self.drawString(x_margin + 20, row_y - 10, "Ativo Circulante")
        
        # Valores do Ativo Circulante
        self.setFont("Helvetica", 8)
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = ativo_data.get('circulante', {}).get('total', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 10, value_str)
            col_x += year_col_width
        
        row_y -= 20
        
        # Ativo Não Circulante
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
        self.rect(x_margin, row_y - 18, table_width, 20, fill=1, stroke=0)
        
        self.setFont("Helvetica", 9)
        self.setFillColor(COLORS['tertiary'])
        self.drawString(x_margin + 20, row_y - 10, "Ativo Não Circulante")
        
        # Valores do Ativo Não Circulante
        self.setFont("Helvetica", 8)
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = ativo_data.get('nao_circulante', {}).get('total', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 10, value_str)
            col_x += year_col_width
        
        row_y -= 25
        
        # TOTAL DO ATIVO
        self.setFillColor(COLORS['primary'])
        self.rect(x_margin, row_y - 18, table_width, 18, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLORS['white'])
        self.drawString(x_margin + 5, row_y - 13, "TOTAL DO ATIVO")
        
        # Valores do Total do Ativo
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = ativo_data.get('total', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 13, value_str)
            col_x += year_col_width
        
        row_y -= 30
        
        # Obter dados do passivo
        passivo_data = balance_sheet_data.get('passivo', {})
        
        # === PASSIVO ===
        # Título da seção
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
        self.rect(x_margin, row_y - 20, table_width, 20, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 9)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 5, row_y - 15, "%× Passivo")
        row_y -= 25
        
        # Passivo Circulante
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.1))
        self.rect(x_margin, row_y - 20, table_width, 20, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 9)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 5, row_y - 15, "Passivo Circulante")
        
        # Valores do Passivo Circulante
        self.setFont("Helvetica-Bold", 8)
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = passivo_data.get('circulante', {}).get('total', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 15, value_str)
            col_x += year_col_width
        
        row_y -= 25
        
        # Detalhes do Passivo Circulante
        passivo_circ_items = [
            ('Empréstimos e Financiamentos', 'emprestimos_financiamentos_curto_prazo'),
            ('Adiantamentos de Clientes', 'adiantamentos_clientes'),
            ('Obrigações Fiscais', 'impostos_taxas'),
            ('Outras Obrigações', 'outros_passivos_circulantes')
        ]
        
        for idx, (label, key) in enumerate(passivo_circ_items):
            if idx % 2 == 1:
                self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                self.rect(x_margin, row_y - 18, table_width, 20, fill=1, stroke=0)
            
            self.setFont("Helvetica", 9)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(x_margin + 20, row_y - 10, label)
            
            # Valores
            self.setFont("Helvetica", 8)
            col_x = x_margin + metric_col_width
            for ano in anos:
                value = passivo_data.get('circulante', {}).get(key, {}).get(ano, 0)
                value_str = format_value(value)
                value_width = self.stringWidth(value_str, "Helvetica", 8)
                x_pos = col_x + (year_col_width - value_width) / 2
                self.drawString(x_pos, row_y - 10, value_str)
                col_x += year_col_width
            
            row_y -= 20
        
        row_y -= 5
        
        # Passivo Não Circulante
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.1))
        self.rect(x_margin, row_y - 20, table_width, 20, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 9)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 5, row_y - 15, "Passivo Não Circulante")
        
        # Valores do Passivo Não Circulante
        self.setFont("Helvetica-Bold", 8)
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = passivo_data.get('nao_circulante', {}).get('total', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 15, value_str)
            col_x += year_col_width
        
        row_y -= 25
        
        # Detalhes do Passivo Não Circulante
        passivo_nao_circ_items = [
            ('Empréstimos e Financiamentos', 'emprestimos_financiamentos_longo_prazo'),
            ('Financiamento de Terras', 'financiamentos_terras'),
            ('Arrendamentos a Pagar', 'arrendamentos'),
            ('Outras Obrigações', 'outros_passivos_nao_circulantes')
        ]
        
        for idx, (label, key) in enumerate(passivo_nao_circ_items):
            if idx % 2 == 1:
                self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                self.rect(x_margin, row_y - 18, table_width, 20, fill=1, stroke=0)
            
            self.setFont("Helvetica", 9)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(x_margin + 20, row_y - 10, label)
            
            # Valores
            self.setFont("Helvetica", 8)
            col_x = x_margin + metric_col_width
            for ano in anos:
                value = passivo_data.get('nao_circulante', {}).get(key, {}).get(ano, 0)
                value_str = format_value(value)
                value_width = self.stringWidth(value_str, "Helvetica", 8)
                x_pos = col_x + (year_col_width - value_width) / 2
                self.drawString(x_pos, row_y - 10, value_str)
                col_x += year_col_width
            
            row_y -= 20
        
        row_y -= 10
        
        # === PATRIMÔNIO LÍQUIDO ===
        # Título da seção
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.05))
        self.rect(x_margin, row_y - 20, table_width, 20, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 9)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 5, row_y - 15, "%× Patrimônio Líquido")
        row_y -= 25
        
        # Detalhes do Patrimônio Líquido
        patrimonio_items = [
            ('Capital Social', 'capital_social'),
            ('Reservas', 'reservas'),
            ('Lucros Acumulados', 'lucros_acumulados')
        ]
        
        for idx, (label, key) in enumerate(patrimonio_items):
            if idx % 2 == 1:
                self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.02))
                self.rect(x_margin, row_y - 18, table_width, 20, fill=1, stroke=0)
            
            self.setFont("Helvetica", 9)
            self.setFillColor(COLORS['tertiary'])
            self.drawString(x_margin + 20, row_y - 10, label)
            
            # Valores
            self.setFont("Helvetica", 8)
            col_x = x_margin + metric_col_width
            for ano in anos:
                value = passivo_data.get('patrimonio_liquido', {}).get(key, {}).get(ano, 0)
                value_str = format_value(value)
                value_width = self.stringWidth(value_str, "Helvetica", 8)
                x_pos = col_x + (year_col_width - value_width) / 2
                self.drawString(x_pos, row_y - 10, value_str)
                col_x += year_col_width
            
            row_y -= 20
        
        row_y -= 5
        
        # Total Patrimônio Líquido
        self.setFillColor(Color(0.09, 0.08, 0.31, alpha=0.1))
        self.rect(x_margin, row_y - 18, table_width, 18, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin + 5, row_y - 13, "Total Patrimônio Líquido")
        
        # Valores
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = passivo_data.get('patrimonio_liquido', {}).get('total', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 13, value_str)
            col_x += year_col_width
        
        row_y -= 23
        
        # TOTAL DO PASSIVO + PL
        self.setFillColor(COLORS['primary'])
        self.rect(x_margin, row_y - 18, table_width, 18, fill=1, stroke=0)
        
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLORS['white'])
        self.drawString(x_margin + 5, row_y - 13, "TOTAL DO PASSIVO + PL")
        
        # Valores do Total
        col_x = x_margin + metric_col_width
        for ano in anos:
            value = passivo_data.get('total', {}).get(ano, 0)
            value_str = format_value(value)
            value_width = self.stringWidth(value_str, "Helvetica-Bold", 8)
            x_pos = col_x + (year_col_width - value_width) / 2
            self.drawString(x_pos, row_y - 13, value_str)
            col_x += year_col_width

    def draw_thank_you_page(self):
        """Página 14 - Agradecimento e Finalização"""
        # Margens
        x_margin = 50
        y_margin = self.height - 120
        
        # === TÍTULO ===
        self.setFont("Helvetica", 36)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, y_margin, "Agradecimento")
        
        # Barra decorativa abaixo do título
        bar_y = y_margin - 15
        bar_width = 60
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, bar_y, bar_width, 3, fill=1, stroke=0)
        
        # === MENSAGEM DE AGRADECIMENTO ===
        current_y = y_margin - 60
        
        # Texto principal
        self.setFont("Helvetica", 13)
        self.setFillColor(COLORS['tertiary'])
        
        mensagem_linhas = [
            "Agradecemos pela confiança depositada em nossos serviços de consultoria.",
            "",
            "Este relatório foi elaborado com dedicação e expertise para fornecer insights",
            "valiosos que contribuam para o crescimento e sucesso do seu negócio agrícola.",
            "",
            "Estamos sempre à disposição para esclarecer dúvidas e oferecer suporte",
            "contínuo em suas decisões estratégicas."
        ]
        
        for linha in mensagem_linhas:
            if linha:
                self.drawString(x_margin, current_y, linha)
                current_y -= 22
            else:
                current_y -= 15
        
        # === DADOS DE CONTATO ===
        current_y -= 35
        
        # Título da seção de contato
        self.setFont("Helvetica-Bold", 16)
        self.setFillColor(COLORS['primary'])
        self.drawString(x_margin, current_y, "Nossos Contatos")
        
        # Linha decorativa
        current_y -= 8
        self.setFillColor(COLORS['secondary'])
        self.rect(x_margin, current_y, 140, 2, fill=1, stroke=0)
        
        current_y -= 30
        
        # Informações de contato
        contatos = [
            ("Telefone:", "(77) 99972-6069"),
            ("E-mail:", "contato@srconsultoria.com.br"),
            ("Website:", "https://www.srconsultoria.online/"),
            ("Endereço:", "Rua. São Diogo, nº 81, Sala 101 (1º andar) - Morada Nobre, Barreiras - BA"),
            ("CEP:", "47810-112")
        ]
        
        for label, valor in contatos:
            # Label em negrito
            self.setFont("Helvetica-Bold", 10)
            self.setFillColor(COLORS['primary'])
            self.drawString(x_margin, current_y, label)
            
            # Valor normal
            self.setFont("Helvetica", 10)
            self.setFillColor(COLORS['tertiary'])
            label_width = self.stringWidth(label, "Helvetica-Bold", 10)
            self.drawString(x_margin + label_width + 8, current_y, valor)
            
            current_y -= 18
        
        # === RODAPÉ ===
        # Posicionar no final da página
        footer_y = 50
        
        # Logo SR CONSULTORIA centralizada
        sr_color = HexColor('#17134F')  # Cor correta do logo
        
        # Calcular largura total para centralizar
        sr_width = self.stringWidth("SR", "Helvetica-Bold", 18)
        consultoria_width = self.stringWidth("CONSULTORIA", "Helvetica", 11)
        total_width = sr_width + 4 + consultoria_width
        x_logo = (self.width - total_width) / 2
        
        # S
        self.setFont("Helvetica-Bold", 18)
        self.setFillColor(sr_color)
        self.drawString(x_logo, footer_y, "S")
        
        # R
        s_width = self.stringWidth("S", "Helvetica-Bold", 18)
        self.drawString(x_logo + s_width, footer_y, "R")
        
        # CONSULTORIA em preto
        self.setFont("Helvetica", 11)
        self.setFillColor(HexColor('#000000'))
        self.drawString(x_logo + sr_width + 4, footer_y + 1, "CONSULTORIA")
        
        # Subtítulo
        footer_y -= 15
        self.setFont("Helvetica", 9)
        self.setFillColor(COLORS['tertiary'])
        subtitle = "Consultoria Agrícola e Financeira"
        center_x = (self.width - self.stringWidth(subtitle, "Helvetica", 9)) / 2
        self.drawString(center_x, footer_y, subtitle)
        
        # Data de geração do relatório
        footer_y -= 20
        data_geracao = datetime.now().strftime("%d/%m/%Y")
        texto_data = f"Relatório gerado em {data_geracao}"
        self.setFont("Helvetica", 8)
        self.setFillColor(COLORS['light'])
        center_x = (self.width - self.stringWidth(texto_data, "Helvetica", 8)) / 2
        self.drawString(center_x, footer_y, texto_data)


def fetch_data(base_url, organization_id, projection_id=None):
    """Buscar dados da API"""
    url = f"{base_url}/api/report-data/{organization_id}"
    if projection_id:
        url += f"?projectionId={projection_id}"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar dados: {e}")
        return None


def get_report_period(data):
    """Extrair período do relatório"""
    try:
        if 'plantingAreas' in data and 'chartData' in data['plantingAreas']:
            chart_data = data['plantingAreas']['chartData']
            if chart_data:
                first_year = chart_data[0]['safra']
                last_year = chart_data[-1]['safra']
                return f"Safras {first_year} - {last_year}"
        return "Análise Multi-safra"
    except:
        return "Análise Multi-safra"


def create_complete_report(output_path, organization_name="CLIENTE", organization_id=None, base_url="http://localhost:3000"):
    """Criar relatório completo com capa + avisos + conteúdo"""
    
    # Buscar dados se organization_id fornecido
    data = {}
    report_period = "Análise Multi-safra"
    
    if organization_id:
        print(f"Buscando dados para organização {organization_id}...")
        data = fetch_data(base_url, organization_id)
        if data:
            organization_name = data.get('organization', {}).get('nome', organization_name)
            report_period = get_report_period(data)
        else:
            print("Aviso: Não foi possível buscar os dados, usando valores padrão")
    
    # Criar PDF
    c = CompleteReportCanvas(
        output_path, 
        pagesize=A4,
        organization_name=organization_name,
        report_period=report_period,
        data=data
    )
    
    # Página 1: Capa
    c.showPage()
    
    # Página 2: Avisos
    c.showPage()
    
    # Página 3: Dados da Organização
    c.showPage()
    
    # Página 4: Propriedades Rurais
    c.showPage()
    
    # Página 5: Evolução da Área Plantada
    c.showPage()
    
    # Página 6: Produtividade
    c.showPage()
    
    # Página 7: Receitas Projetadas
    c.showPage()
    
    # Página 8: Evolução Financeira
    c.showPage()
    
    # Página 9: Passivos Totais
    c.showPage()
    
    # Página 10: Indicadores Econômicos
    c.showPage()
    
    # Página 11: Fluxo de Caixa Projetado
    c.showPage()
    
    # Página 12: DRE (Demonstração de Resultado)
    c.showPage()
    
    # Página 13: Balanço Patrimonial
    c.showPage()
    
    # Página 14: Agradecimento e Finalização
    c.showPage()
    
    # Salvar PDF
    c.save()
    
    print(f"✅ Relatório completo gerado: {output_path}")
    return True


def main():
    """Função principal"""
    if len(sys.argv) < 2:
        print("Uso: python generate_complete_report.py <organization_id_ou_nome> [output_path]")
        print("Exemplo com ID: python generate_complete_report.py 41ee5785-2d48-4f68-a307-d4636d114ab1")
        print("Exemplo com nome: python generate_complete_report.py 'WILSEMAR ELGER' relatorio.pdf")
        sys.exit(1)
    
    arg1 = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else f"relatorio_completo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    # Verificar se é um UUID (organization_id) ou nome
    if len(arg1) == 36 and '-' in arg1:
        # Parece ser um organization_id
        create_complete_report(output_path, organization_id=arg1)
    else:
        # É um nome de organização
        create_complete_report(output_path, organization_name=arg1)


if __name__ == "__main__":
    main()
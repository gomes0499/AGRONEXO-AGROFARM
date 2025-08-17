#!/usr/bin/env python3
"""
Script para extrair dados específicos do Plano de Negócios e preparar para importação
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime

def extract_production_data(file_path):
    """
    Extrai dados de produção/safra
    """
    print("\n🌾 DADOS DE PRODUÇÃO POR SAFRA")
    print("="*80)
    
    # Planilhas de safras individuais
    safras = ['21-22', '22-23', '23-24', '24-25', '25-26', '26-27', '27-28', '28-29', '29-30']
    
    production_data = {}
    
    for safra in safras:
        try:
            df = pd.read_excel(file_path, sheet_name=safra, header=6)
            
            # Remover linhas vazias e totais
            df = df[df['CULTURA'].notna()]
            df = df[~df['CULTURA'].str.contains('TOTAL', na=False)]
            
            safra_data = {
                'culturas': [],
                'area_total': 0,
                'custo_total': 0,
                'producao_total': 0,
                'receita_total': 0,
                'lucro_total': 0
            }
            
            for _, row in df.iterrows():
                if pd.notna(row.get('CULTURA')):
                    cultura_info = {
                        'cultura': row['CULTURA'],
                        'ciclo': row.get('CICLO', ''),
                        'sistema': row.get('SISTEMA', ''),
                        'area_plantada': float(row.get('Área Plantada', 0) or 0),
                        'custo_ha': float(row.get('Custo/ha - R$', 0) or 0),
                        'custo_total': float(row.get('Custo Total', 0) or 0),
                        'produtividade_ha': float(row.get('Produt./ha', 0) or 0),
                        'producao_total': float(row.get('Produção Total', 0) or 0),
                        'preco_unitario': float(row.get('Preço/unid', 0) or 0),
                        'receita_total': float(row.get('Receita Total', 0) or 0),
                        'lucro': float(row.get('Lucro', 0) or 0)
                    }
                    
                    safra_data['culturas'].append(cultura_info)
                    safra_data['area_total'] += cultura_info['area_plantada']
                    safra_data['custo_total'] += cultura_info['custo_total']
                    safra_data['producao_total'] += cultura_info['producao_total']
                    safra_data['receita_total'] += cultura_info['receita_total']
                    safra_data['lucro_total'] += cultura_info['lucro']
            
            production_data[f"20{safra}"] = safra_data
            
            print(f"\n📅 Safra 20{safra}:")
            print(f"  - Culturas: {len(safra_data['culturas'])}")
            print(f"  - Área total: {safra_data['area_total']:,.2f} ha")
            print(f"  - Custo total: R$ {safra_data['custo_total']:,.2f}")
            print(f"  - Receita total: R$ {safra_data['receita_total']:,.2f}")
            print(f"  - Lucro total: R$ {safra_data['lucro_total']:,.2f}")
            
        except Exception as e:
            print(f"  ⚠️ Erro ao processar safra {safra}: {e}")
    
    return production_data

def extract_financial_data(file_path):
    """
    Extrai dados financeiros (dívidas, investimentos, etc)
    """
    print("\n💰 DADOS FINANCEIROS")
    print("="*80)
    
    financial_data = {}
    
    # 1. Dívidas Bancárias
    try:
        df_bancos = pd.read_excel(file_path, sheet_name='Bancos', header=5)
        
        bancos_data = {}
        anos = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032]
        
        for ano in anos:
            if str(ano) in df_bancos.columns:
                total = df_bancos[str(ano)].sum()
                bancos_data[str(ano)] = float(total) if pd.notna(total) else 0
        
        financial_data['dividas_bancarias'] = bancos_data
        
        print("\n📊 Dívidas Bancárias por ano:")
        for ano, valor in bancos_data.items():
            if valor > 0:
                print(f"  {ano}: R$ {valor:,.2f}")
                
    except Exception as e:
        print(f"  ⚠️ Erro ao processar dívidas bancárias: {e}")
    
    # 2. Dívidas de Imóveis
    try:
        df_imoveis = pd.read_excel(file_path, sheet_name='Endiv. Imóveis', header=6)
        
        imoveis_data = {}
        anos = list(range(2023, 2034))
        
        for ano in anos:
            if str(ano) in df_imoveis.columns:
                total = df_imoveis[str(ano)].sum()
                imoveis_data[str(ano)] = float(total) if pd.notna(total) else 0
        
        financial_data['dividas_imoveis'] = imoveis_data
        
        print("\n🏡 Dívidas de Imóveis por ano:")
        for ano, valor in imoveis_data.items():
            if valor > 0:
                print(f"  {ano}: R$ {valor:,.2f}")
                
    except Exception as e:
        print(f"  ⚠️ Erro ao processar dívidas de imóveis: {e}")
    
    # 3. Fornecedores
    try:
        df_fornecedores = pd.read_excel(file_path, sheet_name='Fornecedores', header=5)
        
        fornecedores_total = 0
        meses_cols = ['Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro']
        
        for mes in meses_cols:
            if mes in df_fornecedores.columns:
                total_mes = df_fornecedores[mes].sum()
                fornecedores_total += float(total_mes) if pd.notna(total_mes) else 0
        
        financial_data['dividas_fornecedores'] = fornecedores_total
        
        print(f"\n📦 Dívidas com Fornecedores: R$ {fornecedores_total:,.2f}")
        
    except Exception as e:
        print(f"  ⚠️ Erro ao processar fornecedores: {e}")
    
    return financial_data

def extract_property_data(file_path):
    """
    Extrai dados de propriedades e bens
    """
    print("\n🏞️ DADOS DE PROPRIEDADES E BENS")
    print("="*80)
    
    property_data = {}
    
    # 1. Bens Imóveis
    try:
        df_imoveis = pd.read_excel(file_path, sheet_name='Bens Imóveis', header=5)
        
        imoveis = []
        area_total = 0
        valor_total = 0
        
        for _, row in df_imoveis.iterrows():
            if pd.notna(row.get('DENOMINAÇÃO DO IMÓVEL')):
                imovel = {
                    'nome': row['DENOMINAÇÃO DO IMÓVEL'],
                    'municipio': row.get('MUNICIPIO/UF', ''),
                    'area_ha': float(row.get('ÁREA (HA)', 0) or 0),
                    'valor_ha': float(row.get('R$/ha', 0) or 0),
                    'valor_total': float(row.get('Valor Total', 0) or 0)
                }
                
                if imovel['area_ha'] > 0:
                    imoveis.append(imovel)
                    area_total += imovel['area_ha']
                    valor_total += imovel['valor_total']
        
        property_data['imoveis'] = {
            'lista': imoveis,
            'total_propriedades': len(imoveis),
            'area_total_ha': area_total,
            'valor_total': valor_total
        }
        
        print(f"\n🏡 Imóveis:")
        print(f"  - Total de propriedades: {len(imoveis)}")
        print(f"  - Área total: {area_total:,.2f} ha")
        print(f"  - Valor total: R$ {valor_total:,.2f}")
        
    except Exception as e:
        print(f"  ⚠️ Erro ao processar imóveis: {e}")
    
    # 2. Bens Móveis (Máquinas e Equipamentos)
    try:
        df_moveis = pd.read_excel(file_path, sheet_name='Bens Móveis', header=5)
        
        maquinas = []
        valor_total_maquinas = 0
        
        for _, row in df_moveis.iterrows():
            if pd.notna(row.get('DESCRIÇÃO')):
                valor = float(row.get('VALOR AQUISIÇÃO', 0) or 0)
                if valor > 0:
                    maquina = {
                        'descricao': row['DESCRIÇÃO'],
                        'ano': row.get('ANO', ''),
                        'marca': row.get('MARCA', ''),
                        'valor': valor
                    }
                    maquinas.append(maquina)
                    valor_total_maquinas += valor
        
        property_data['maquinas'] = {
            'lista': maquinas,
            'total_itens': len(maquinas),
            'valor_total': valor_total_maquinas
        }
        
        print(f"\n🚜 Máquinas e Equipamentos:")
        print(f"  - Total de itens: {len(maquinas)}")
        print(f"  - Valor total: R$ {valor_total_maquinas:,.2f}")
        
    except Exception as e:
        print(f"  ⚠️ Erro ao processar máquinas: {e}")
    
    # 3. Arrendamentos
    try:
        df_arrend = pd.read_excel(file_path, sheet_name='Arrendamentos', header=5)
        
        arrendamentos = []
        area_arrendada_total = 0
        
        for _, row in df_arrend.iterrows():
            if pd.notna(row.get('FAZENDA')):
                area = float(row.get('ÁREA ARRENDADA', 0) or 0)
                if area > 0:
                    arrend = {
                        'fazenda': row['FAZENDA'],
                        'proprietario': row.get('PROPRIETÁRIO', ''),
                        'area_arrendada': area,
                        'prazo': row.get('PRAZO', ''),
                        'valor_ha': float(row.get('VALOR/ha (SC)', 0) or 0)
                    }
                    arrendamentos.append(arrend)
                    area_arrendada_total += area
        
        property_data['arrendamentos'] = {
            'lista': arrendamentos,
            'total_contratos': len(arrendamentos),
            'area_total_arrendada': area_arrendada_total
        }
        
        print(f"\n📄 Arrendamentos:")
        print(f"  - Total de contratos: {len(arrendamentos)}")
        print(f"  - Área total arrendada: {area_arrendada_total:,.2f} ha")
        
    except Exception as e:
        print(f"  ⚠️ Erro ao processar arrendamentos: {e}")
    
    return property_data

def main():
    """
    Função principal
    """
    file_path = Path("/Users/guilhermeoliveiragomes/Projects/SR-CONSULTORIA/docs/062025_PLANO DE NEGÓCIOS WILSEMAR ELGER_070625_Ver. II.xlsx")
    
    if not file_path.exists():
        print(f"❌ Arquivo não encontrado: {file_path}")
        return
    
    print("📊 EXTRAÇÃO DE DADOS DO PLANO DE NEGÓCIOS")
    print("="*80)
    print(f"Arquivo: {file_path.name}")
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Extrair dados
    all_data = {
        'metadata': {
            'arquivo': file_path.name,
            'data_extracao': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'produtor': 'WILSEMAR ELGER'
        }
    }
    
    # 1. Dados de Produção
    all_data['producao'] = extract_production_data(file_path)
    
    # 2. Dados Financeiros
    all_data['financeiro'] = extract_financial_data(file_path)
    
    # 3. Dados de Propriedades
    all_data['propriedades'] = extract_property_data(file_path)
    
    # Salvar dados extraídos
    output_file = Path(file_path).parent / "dados_extraidos_plano_negocios.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2, default=str)
    
    print("\n" + "="*80)
    print(f"✅ Dados extraídos e salvos em: {output_file}")
    print("\n📋 RESUMO DOS DADOS EXTRAÍDOS:")
    print(f"  - Safras analisadas: {len(all_data.get('producao', {}))}")
    print(f"  - Propriedades: {all_data.get('propriedades', {}).get('imoveis', {}).get('total_propriedades', 0)}")
    print(f"  - Máquinas/Equipamentos: {all_data.get('propriedades', {}).get('maquinas', {}).get('total_itens', 0)}")
    print(f"  - Arrendamentos: {all_data.get('propriedades', {}).get('arrendamentos', {}).get('total_contratos', 0)}")

if __name__ == "__main__":
    main()
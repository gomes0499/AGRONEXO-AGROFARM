#!/usr/bin/env python3
"""
Script para ler e analisar o arquivo Excel do Plano de Negócios
Arquivo: 062025_PLANO DE NEGÓCIOS WILSEMAR ELGER_070625_Ver. II.xlsx
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime

def analyze_excel_file(file_path):
    """
    Analisa o arquivo Excel e extrai informações relevantes
    """
    print(f"📊 Analisando arquivo: {file_path}")
    print("="*80)
    
    try:
        # Ler todas as planilhas do arquivo
        excel_file = pd.ExcelFile(file_path)
        
        print(f"\n📑 Planilhas encontradas: {len(excel_file.sheet_names)}")
        for i, sheet_name in enumerate(excel_file.sheet_names, 1):
            print(f"  {i}. {sheet_name}")
        
        print("\n" + "="*80)
        
        # Dicionário para armazenar dados importantes
        dados_extraidos = {
            "metadata": {
                "arquivo": file_path.name,
                "data_analise": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "total_planilhas": len(excel_file.sheet_names)
            },
            "planilhas": {}
        }
        
        # Analisar cada planilha
        for sheet_name in excel_file.sheet_names:
            print(f"\n📋 Analisando planilha: '{sheet_name}'")
            print("-"*40)
            
            # Ler a planilha
            df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
            
            # Informações básicas
            print(f"  Dimensões: {df.shape[0]} linhas x {df.shape[1]} colunas")
            
            # Tentar identificar cabeçalhos
            header_row = None
            for idx in range(min(10, len(df))):
                row = df.iloc[idx]
                # Verificar se a linha tem pelo menos 3 valores não nulos
                if row.notna().sum() >= 3:
                    # Verificar se parecem ser cabeçalhos (strings)
                    if row.apply(lambda x: isinstance(x, str) if pd.notna(x) else False).sum() >= 2:
                        header_row = idx
                        break
            
            if header_row is not None:
                # Recarregar com cabeçalho identificado
                df = pd.read_excel(file_path, sheet_name=sheet_name, header=header_row)
                print(f"  Cabeçalho identificado na linha: {header_row + 1}")
                print(f"  Colunas: {', '.join([str(col) for col in df.columns[:10]])}")
                if len(df.columns) > 10:
                    print(f"  ... e mais {len(df.columns) - 10} colunas")
            
            # Análise de conteúdo
            dados_planilha = {
                "dimensoes": {"linhas": df.shape[0], "colunas": df.shape[1]},
                "linha_cabecalho": header_row,
                "colunas": list(df.columns) if header_row is not None else [],
                "tipos_dados": {},
                "valores_numericos": {},
                "primeiras_linhas": []
            }
            
            # Identificar tipos de dados e valores numéricos
            for col in df.columns:
                # Tipo de dado predominante
                tipos = df[col].apply(type).value_counts()
                if len(tipos) > 0:
                    tipo_predominante = tipos.index[0].__name__
                    dados_planilha["tipos_dados"][str(col)] = tipo_predominante
                
                # Se for numérico, extrair estatísticas
                if df[col].dtype in ['float64', 'int64']:
                    valores_validos = df[col].dropna()
                    if len(valores_validos) > 0:
                        dados_planilha["valores_numericos"][str(col)] = {
                            "min": float(valores_validos.min()),
                            "max": float(valores_validos.max()),
                            "media": float(valores_validos.mean()),
                            "soma": float(valores_validos.sum()),
                            "qtd_valores": len(valores_validos)
                        }
            
            # Capturar primeiras linhas com dados
            linhas_com_dados = df[df.notna().any(axis=1)].head(5)
            for idx, row in linhas_com_dados.iterrows():
                linha_dict = {}
                for col in row.index:
                    valor = row[col]
                    if pd.notna(valor):
                        # Converter para tipo serializável
                        if isinstance(valor, (np.integer, np.floating)):
                            valor = float(valor)
                        elif isinstance(valor, np.bool_):
                            valor = bool(valor)
                        elif pd.api.types.is_datetime64_any_dtype(type(valor)):
                            valor = str(valor)
                        linha_dict[str(col)] = valor
                dados_planilha["primeiras_linhas"].append(linha_dict)
            
            # Adicionar ao resultado
            dados_extraidos["planilhas"][sheet_name] = dados_planilha
            
            # Análise específica baseada no nome da planilha
            if "safra" in sheet_name.lower() or "produção" in sheet_name.lower():
                print("\n  🌾 Planilha de produção/safra detectada")
                # Procurar por culturas
                for col in df.columns:
                    if any(cultura in str(col).lower() for cultura in ['soja', 'milho', 'algodão', 'trigo']):
                        print(f"    - Cultura encontrada: {col}")
                        
            elif "financ" in sheet_name.lower() or "divida" in sheet_name.lower():
                print("\n  💰 Planilha financeira detectada")
                # Procurar por valores monetários
                for col, stats in dados_planilha["valores_numericos"].items():
                    if stats["max"] > 1000:  # Provavelmente valores monetários
                        print(f"    - {col}: R$ {stats['soma']:,.2f}")
                        
            elif "area" in sheet_name.lower() or "hectare" in sheet_name.lower():
                print("\n  📍 Planilha de áreas detectada")
                for col, stats in dados_planilha["valores_numericos"].items():
                    if 'area' in str(col).lower() or 'hectare' in str(col).lower():
                        print(f"    - {col}: {stats['soma']:,.2f} ha")
        
        # Salvar resultado em JSON
        output_file = Path(file_path).parent / f"analise_{Path(file_path).stem}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(dados_extraidos, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n✅ Análise salva em: {output_file}")
        
        # Resumo final
        print("\n" + "="*80)
        print("📊 RESUMO DA ANÁLISE")
        print("="*80)
        
        total_linhas = sum(p["dimensoes"]["linhas"] for p in dados_extraidos["planilhas"].values())
        total_colunas = sum(p["dimensoes"]["colunas"] for p in dados_extraidos["planilhas"].values())
        
        print(f"Total de dados analisados:")
        print(f"  - {len(excel_file.sheet_names)} planilhas")
        print(f"  - {total_linhas} linhas totais")
        print(f"  - {total_colunas} colunas totais")
        
        # Identificar planilhas principais
        print(f"\nPlanilhas principais identificadas:")
        for nome, dados in dados_extraidos["planilhas"].items():
            if dados["dimensoes"]["linhas"] > 10:
                print(f"  - {nome}: {dados['dimensoes']['linhas']} linhas x {dados['dimensoes']['colunas']} colunas")
        
        return dados_extraidos
        
    except Exception as e:
        print(f"❌ Erro ao processar arquivo: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """
    Função principal
    """
    # Caminho do arquivo
    file_path = Path("/Users/guilhermeoliveiragomes/Projects/SR-CONSULTORIA/docs/062025_PLANO DE NEGÓCIOS WILSEMAR ELGER_070625_Ver. II.xlsx")
    
    if not file_path.exists():
        print(f"❌ Arquivo não encontrado: {file_path}")
        return
    
    # Analisar o arquivo
    dados = analyze_excel_file(file_path)
    
    if dados:
        print("\n✅ Análise concluída com sucesso!")
        print("\n💡 Dica: Verifique o arquivo JSON gerado para uma análise detalhada dos dados.")

if __name__ == "__main__":
    main()
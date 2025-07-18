import pandas as pd
import numpy as np

# Carregar o arquivo Excel
file_path = '/Users/guilhermeoliveiragomes/Projects/SR-CONSULTORIA/docs/Dados_Completos_2025-07-17.xlsx'

# Listar todas as abas do Excel
excel_file = pd.ExcelFile(file_path)
print("Abas disponíveis no Excel:")
for i, sheet_name in enumerate(excel_file.sheet_names, 1):
    print(f"{i}. {sheet_name}")

print("\n" + "="*50 + "\n")

# Carregar e examinar cada aba
for sheet_name in excel_file.sheet_names:
    print(f"ABA: {sheet_name}")
    print("-" * 30)
    
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        print(f"Dimensões: {df.shape[0]} linhas x {df.shape[1]} colunas")
        print(f"Colunas: {list(df.columns)}")
        
        # Mostrar algumas linhas de exemplo
        if not df.empty:
            print("\nPrimeiras 3 linhas:")
            print(df.head(3).to_string())
            
            # Verificar se há dados não nulos
            non_null_counts = df.count()
            print(f"\nDados não nulos por coluna:")
            print(non_null_counts.to_string())
        else:
            print("Aba vazia")
            
    except Exception as e:
        print(f"Erro ao ler aba {sheet_name}: {e}")
    
    print("\n" + "="*50 + "\n")
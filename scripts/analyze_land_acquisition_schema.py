import psycopg2
from psycopg2.extras import RealDictCursor

# Conectar ao Supabase
DATABASE_URL = "postgresql://postgres.vnqovsdcychjczfjamdc:vnqovsdcychjczfjamdc@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("🔍 Analisando schema das tabelas relacionadas...\n")
    
    # 1. Verificar estrutura da tabela aquisicao_terras
    print("📋 Tabela: aquisicao_terras")
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'aquisicao_terras'
        ORDER BY ordinal_position;
    """)
    
    print("Colunas:")
    for col in cur.fetchall():
        print(f"  - {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
    
    # 2. Verificar se existe tabela de preços de commodities
    print("\n📊 Buscando tabelas relacionadas a preços/commodities...")
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (
            table_name LIKE '%preco%' 
            OR table_name LIKE '%price%' 
            OR table_name LIKE '%commodit%'
            OR table_name LIKE '%valor%'
        )
        ORDER BY table_name;
    """)
    
    tables = cur.fetchall()
    for table in tables:
        print(f"  - {table['table_name']}")
        
    # 3. Se encontrou tabela de preços, mostrar estrutura
    if tables:
        for table in tables:
            print(f"\n📋 Estrutura da tabela: {table['table_name']}")
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '{table['table_name']}'
                ORDER BY ordinal_position;
            """)
            
            for col in cur.fetchall():
                print(f"  - {col['column_name']}: {col['data_type']}")
    
    # 4. Verificar como arrendamento está calculando valor
    print("\n🔍 Verificando tabela de arrendamentos...")
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'arrendamentos'
        ORDER BY ordinal_position
        LIMIT 10;
    """)
    
    arrendamento_cols = cur.fetchall()
    if arrendamento_cols:
        print("Colunas de arrendamentos:")
        for col in arrendamento_cols:
            print(f"  - {col['column_name']}: {col['data_type']}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Erro: {str(e)}")
    if 'conn' in locals():
        conn.close()
#!/bin/bash

# Script para executar a migração que remove o campo safra_id da tabela arrendamentos

echo "Iniciando migração para remover safra_id da tabela arrendamentos..."

# Execute o script SQL (substituir DATABASE_URL pelo seu valor correto)
# Substitua supabase pelo comando apropriado para seu ambiente (ex: psql)
echo "Executando script SQL..."
psql $DATABASE_URL -f database/properties/migrations/remove_safra_id_from_leases.sql

# Verifique o resultado
if [ $? -eq 0 ]; then
    echo "Migração executada com sucesso!"
else
    echo "Erro ao executar a migração. Verifique os logs acima."
    exit 1
fi

echo "Recompilando o código..."
# Execute o build da aplicação para garantir que as alterações do schema sejam aplicadas
npm run build

echo "Migração concluída. O campo safra_id foi removido da tabela arrendamentos."
echo "As alterações nos tipos e schemas já foram aplicadas."
echo "Reinicie a aplicação para que as alterações tenham efeito."

exit 0
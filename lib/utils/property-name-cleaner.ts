/**
 * Função para remover a palavra "fazenda" do nome de propriedades
 * Remove "fazenda" do início, meio ou final do nome (case insensitive)
 * 
 * Exemplos:
 * - "Fazenda Pirineus" -> "Pirineus"
 * - "Pirineus Fazenda" -> "Pirineus"
 * - "Fazenda São José da Fazenda" -> "São José da"
 * - "FAZENDA ELDORADO" -> "ELDORADO"
 */
export function cleanPropertyName(name: string): string {
  if (!name) return '';
  
  return name
    .replace(/^fazenda\s+/i, '') // Remove "fazenda" no início (case insensitive)
    .replace(/\s+fazenda$/i, '') // Remove "fazenda" no final (case insensitive)
    .replace(/\s+fazenda\s+/i, ' ') // Remove "fazenda" no meio (case insensitive)
    .trim();
}
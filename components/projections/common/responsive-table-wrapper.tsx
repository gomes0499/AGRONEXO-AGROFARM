"use client";

import React from 'react';

/**
 * Componente que envolve tabelas para garantir que o rolamento horizontal
 * ocorra apenas na tabela, não na página inteira.
 * 
 * Use este componente em todas as tabelas que podem ter conteúdo maior que a tela.
 */
export function ResponsiveTableWrapper({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={`overflow-x-auto overflow-y-hidden border rounded-md ${className}`}
      style={{ maxWidth: '100%' }}
    >
      <div className="min-w-max">
        {children}
      </div>
    </div>
  );
}
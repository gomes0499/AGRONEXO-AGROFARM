-- Add delete policy for rating history
CREATE POLICY "Users can delete rating history for their organization" ON rating_history
  FOR DELETE USING (
    organizacao_id IN (
      SELECT organizacao_id FROM organizacao_usuarios 
      WHERE usuario_id = auth.uid()
    )
  );
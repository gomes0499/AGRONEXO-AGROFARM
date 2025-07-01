"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewProjectionModal } from "./new-projection-modal";
import { useRouter } from "next/navigation";

export function NewProjectionButton() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    // Recarregar a página para mostrar a nova projeção
    router.refresh();
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        size="sm"
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Novo Cenário
      </Button>

      <NewProjectionModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleSuccess}
      />
    </>
  );
}
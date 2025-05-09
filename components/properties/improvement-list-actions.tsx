"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ImprovementModal } from "@/components/properties/improvement-modal";

interface ImprovementListActionsProps {
  propertyId: string;
  organizationId: string;
  useModal: boolean;
}

export function ImprovementListActions({
  propertyId,
  organizationId,
  useModal,
}: ImprovementListActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    if (useModal) {
      setShowModal(true);
    } else {
      router.push(`/dashboard/properties/${propertyId}/improvements/new`);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={handleButtonClick}>
        <PlusIcon className="h-4 w-4 mr-2" />
        Nova Benfeitoria
      </Button>

      {useModal && showModal && (
        <ImprovementModal
          propertyId={propertyId}
          organizationId={organizationId}
          open={showModal}
          onOpenChange={setShowModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

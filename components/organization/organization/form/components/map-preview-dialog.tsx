import { AlertCircle, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { LeafletMap } from "@/components/properties/leaflet-map";

interface MapPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: string;
  longitude: string;
}

export function MapPreviewDialog({
  isOpen,
  onClose,
  latitude,
  longitude,
}: MapPreviewDialogProps) {
  const lat = parseFloat(latitude || "0");
  const lng = parseFloat(longitude || "0");

  const isValidCoordinates = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex justify-between items-center w-full">
            <DialogTitle>Localização do Escritório</DialogTitle>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {isValidCoordinates ? (
          <div className="p-0">
            <LeafletMap
              center={[lat, lng]}
              zoom={15}
              className="h-[500px] w-full rounded-none"
              mapType="osm"
              marker={[lat, lng]}
            />
            <div className="p-4 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps?q=${lat},${lng}`,
                    "_blank"
                  );
                }}
              >
                <Globe className="h-4 w-4" />
                Abrir no Google Maps
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p>
              Coordenadas inválidas. Preencha latitude e longitude com valores
              numéricos válidos.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
// Re-export toast from sonner to maintain compatibility 
// with components that expect to import from '@/components/ui/use-toast'
import { toast } from "sonner";

// Create a hook-like function that returns the toast object
export function useToast() {
  return { toast };
}

// Also export toast directly
export { toast };
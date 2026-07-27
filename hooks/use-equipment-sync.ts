import { useEffect } from "react";
import { useFocusCommand } from "@/lib/focus-command";
import { trpc } from "@/lib/trpc";

/**
 * Hook to sync equipped gear from the server to local state
 * This runs on app initialization and whenever equipment changes
 */
export function useEquipmentSync() {
  const { state, updateProfile } = useFocusCommand();
  const equippedQuery = trpc.equipment.getEquipped.useQuery();

  useEffect(() => {
    if (equippedQuery.data) {
      // Transform server data and store in profile metadata
      // This allows us to persist equipped gear across sessions
      const equippedGearMetadata = JSON.stringify(equippedQuery.data);

      // Store in profile if needed (optional - can also just use local state)
      // updateProfile({ equippedGearMetadata });
    }
  }, [equippedQuery.data]);

  return {
    isLoading: equippedQuery.isLoading,
    isError: equippedQuery.isError,
    refetch: equippedQuery.refetch,
    equippedGear: equippedQuery.data,
  };
}

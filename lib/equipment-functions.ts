// Equipment management functions for FocusCommandProvider
// This file contains the implementations that will be added to the FocusCommandContextValue

export const equipmentFunctionsCode = `
  const addEquipment = useCallback((equipment: Omit<Equipment, "id">) => {
    const id = createId("equipment");
    commit((current) => withQueuedOperation({
      ...current,
      allEquipment: [...current.allEquipment, { ...equipment, id }],
    }));
    return id;
  }, [commit]);

  const updateEquipment = useCallback((equipmentId: string, patch: Partial<Omit<Equipment, "id">>) => {
    commit((current) => withQueuedOperation({
      ...current,
      allEquipment: current.allEquipment.map((eq) => eq.id === equipmentId ? { ...eq, ...patch } : eq),
    }));
  }, [commit]);

  const removeEquipment = useCallback((equipmentId: string) => {
    commit((current) => withQueuedOperation({
      ...current,
      allEquipment: current.allEquipment.filter((eq) => eq.id !== equipmentId),
      userEquipment: current.userEquipment.filter((ue) => ue.equipmentId !== equipmentId),
    }));
  }, [commit]);

  const addToInventory = useCallback((equipmentId: string) => {
    const id = createId("user_equipment");
    commit((current) => withQueuedOperation({
      ...current,
      userEquipment: [...current.userEquipment, { id, equipmentId, isEquipped: "false", acquiredAt: nowIso() }],
    }));
    return id;
  }, [commit]);

  const removeFromInventory = useCallback((userEquipmentId: string) => {
    commit((current) => withQueuedOperation({
      ...current,
      userEquipment: current.userEquipment.filter((ue) => ue.id !== userEquipmentId),
    }));
  }, [commit]);

  const equipItem = useCallback((userEquipmentId: string, slot: "head" | "body" | "accessory") => {
    commit((current) => withQueuedOperation({
      ...current,
      userEquipment: current.userEquipment.map((ue) => {
        if (ue.id === userEquipmentId) {
          return { ...ue, isEquipped: slot };
        }
        if (ue.isEquipped === slot) {
          return { ...ue, isEquipped: "false" };
        }
        return ue;
      }),
    }));
  }, [commit]);

  const unequipItem = useCallback((userEquipmentId: string) => {
    commit((current) => withQueuedOperation({
      ...current,
      userEquipment: current.userEquipment.map((ue) => ue.id === userEquipmentId ? { ...ue, isEquipped: "false" } : ue),
    }));
  }, [commit]);

  const getEquippedItems = useCallback(() => {
    const equipped: { head?: Equipment; body?: Equipment; accessory?: Equipment } = {};
    for (const userEq of state.userEquipment) {
      if (userEq.isEquipped !== "false") {
        const equipment = state.allEquipment.find((eq) => eq.id === userEq.equipmentId);
        if (equipment) {
          equipped[userEq.isEquipped as "head" | "body" | "accessory"] = equipment;
        }
      }
    }
    return equipped;
  }, [state.userEquipment, state.allEquipment]);
`;

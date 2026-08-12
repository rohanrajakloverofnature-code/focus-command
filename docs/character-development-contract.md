# Character Development Contract

## Source of truth

Character development is entirely derived from existing local state. `getLevelInfo(state)` determines the current level, `getCurrentTitle(state)` determines the existing title, and `getEquippedItems()` resolves the user’s actual `head`, `body`, and `accessory` equipment. This feature does not create a second experience, equipment, title, inventory, or unlock system.

## Development stages

The six existing level bands become visible, cumulative development stages. A stage changes only when its existing threshold is reached; within a stage, current title and equipped gear alter the character-specific loadout and treatment.

| Existing level band | Development form | Cumulative visual change | Cinematic intensity |
| --- | --- | --- | --- |
| 1–29 | Initiate | Base uniform, first energy core, minimal tactical interface | restrained |
| 30–89 | Field-ready | Reinforced collar, chest rig, forearm module, first tool/sidearm | focused |
| 90–179 | Armored specialist | Chest plates, shoulder protection, targeting visor, active primary equipment | energetic |
| 180–299 | Elite operator | Layered armor, gauntlets, weapon system, power pack, stronger silhouette | dramatic |
| 300–449 | Mythic commander | Command armor, shoulder-mounted or energy weapon, ornate modules, rich aura | high-impact |
| 450+ | Sovereign form | Final layered armor, signature weapon, complete energy field, premium final silhouette | climactic |

## Existing title-family paths

The current title list resolves to one of four existing artwork identities. The class controls the physical evolution, energy behavior, reveal language, accent colors, and equipment vocabulary; the six stages above remain cumulative in all cases.

| Existing title families | Identity | Visual development path | Energy / transformation behavior |
| --- | --- | --- | --- |
| Recruit and early rank titles | Tactical Recruit | field armor, recon harness, optics, pulse carbine, ammunition rig, command exosuit | cyan / green scanning energy, compact lock-on assembly |
| Sergeant through officer titles | Command Officer | officer plating, command bracers, shoulder guards, directive gauntlet, command rail, marshal armor | violet / gold directive rings, precision mechanical locks |
| Special Forces, Black Ops, Phantom, Ghost, Shadow, Apex, Oblivion, Eclipse titles | Shadow Vanguard | stealth weave, masked visor, blade/sidearm, cloak plates, phase modules, phantom armor | indigo / magenta phase trails, fast segmented materialization |
| Commander, General, Warlord, Vanguard, Sentinel and cosmic/endgame titles | Ascendant | field command armor, halo core, energy cannon, celestial pauldrons, cosmic frame, sovereign weapon | gold / violet / blue stellar energy, wide orbital formation and final pulse |

## Real-equipment integration

Each equipped local item is represented in the evolved portrait and final reveal through its real name, slot, rarity, and level. A `head` item becomes the real headgear/optic activation, a `body` item becomes a chest or armor-module activation, and an `accessory` item becomes a side-module, energy core, or weapon attachment. When no item is equipped, that slot is not presented as user-unlocked gear; only the title-and-level development layers appear.

## Presentation rules

The Home portrait always renders the resolved current form with restrained breathing, glow, armor-light sweep, and occasional particle motion. A full cinematic can start only after an actual new title, level, stage, or equipped-item state differs from the last acknowledged local milestone. It opens from a character tap and follows recognition, energy gathering, equipment construction, surge, character-first reveal, status confirmation, and cleanup. Reopening without a new milestone uses the same upgraded portrait and an idle-focused acknowledgement rather than replaying the full transformation.

The sequence never starts while launch, level/title/combo celebration, or another character sequence owns presentation. A repeated tap is ignored. App backgrounding, navigation unmount, explicit dismissal, or audio failure clears every timer and player. Dedicated fixed sound cues are used only for the major sequence; they have no sound-pack or customization UI and are paused/removed before any other presentation can take ownership.

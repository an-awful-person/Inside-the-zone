import { cleanSweepBackpackItem } from "./backpack.service.js";
import { cleanSweepEquipmentItem } from "./equipment.service.js";
import { cleanSweepExtraBagsItem } from "./extra.bags.service.js";

/**
 * Removes item from any list and deletes item once
 * @param {Actor} actor 
 * @param {string} itemId 
 */
export function removeAllItemTraces(actor, itemId){
    cleanSweepBackpackItem(actor, itemId, false);
    cleanSweepEquipmentItem(actor, itemId, false);
    cleanSweepExtraBagsItem(actor,itemId, false);
    actor.items.get(itemId).delete();
}
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

/**
 * 
 * @param {ActorSheet} sheet 
 */
export function showDropAndDeleteButtons(sheet){
    const actorSheet = sheet.actor.sheet;
    actorSheet.element[0].querySelector('.drop-item').style.visibility = 'visible';
    actorSheet.element[0].querySelector('.drop-item').style.height = '50px';
    actorSheet.element[0].querySelector('.delete-item').style.visibility = 'visible';
    actorSheet.element[0].querySelector('.delete-item').style.height = '50px';
}

/**
 * 
 * @param {ActorSheet} sheet 
 */
export function hideDropAndDeleteButtons(sheet){
    const actorSheet = sheet.actor.sheet;
                actorSheet.element[0].querySelector('.drop-item').style.visibility = 'hidden';
                actorSheet.element[0].querySelector('.drop-item').style.height = '0px';
                actorSheet.element[0].querySelector('.delete-item').style.visibility = 'hidden';
                actorSheet.element[0].querySelector('.delete-item').style.height = '0px';
}
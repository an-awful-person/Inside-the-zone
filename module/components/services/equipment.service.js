import { ITEM_ICON_SIZE } from "../../constants.js";
import { hideDropAndDeleteButtons, removeAllItemTraces, showDropAndDeleteButtons } from "./drag.and.drop.utils.service.js";

const EQUIPMENT_BUTTON_COMPONENT = 'equipment-button-component';
const EQUIPMENT_ICON = 'equipment-icon';

/**
 * 
 * @param {*} html 
 * @param {ActorSheet} sheet 
 */
export function equipmentActivateListeners(html, sheet) {
    html.find(`.${EQUIPMENT_BUTTON_COMPONENT}`).click((e) => {
        _onClickOpenItem(e.currentTarget, sheet.actor);
    })

    html.find(`.${EQUIPMENT_BUTTON_COMPONENT}`).on('dragend', () => {
        hideDropAndDeleteButtons(sheet);
    })

    html.find(`.${EQUIPMENT_ICON}`).click((e) => {
        _onClickOpenItem(e.parentElement, sheet.actor);
    })

    html.find(`.${EQUIPMENT_ICON}`).on('dragend', () => {
        hideDropAndDeleteButtons(sheet);
    })
}

/**
 * Handle opening a single compendium entry by invoking the configured document class and its sheet
 * @param {HTMLElement} target      target element
 * @param {Actor} actor
 * @private
 */
async function _onClickOpenItem(target, actor) {
    const document = actor.items.get(target.dataset.documentId);
    const sheet = document.sheet;
    if (sheet._minimized) return sheet.maximize();
    else return sheet.render(true);
}

/**
 * 
 * @param {*} event 
 * @param {ActorSheet} sheet 
 */
export function equipmentOnDragStart(event, sheet) {
    if (event.target.classList.contains("content-link")) return;

    const li = event.target.classList.contains(EQUIPMENT_ICON) ? event.parentElement : event.currentTarget;
    let dragData;

    if (li.classList.contains(EQUIPMENT_BUTTON_COMPONENT) || li.classList.contains(EQUIPMENT_ICON)) {
        if (li.dataset.documentId) {
            const item = sheet.actor.items.get(li.dataset.documentId);
            dragData = item.toDragData();
        }
    }

    if (!dragData) return;

    Item.implementation.fromDropData(dragData).then(item => {
        const imageWidth = item.system.width * ITEM_ICON_SIZE;
        const imageHeight = item.system.height * ITEM_ICON_SIZE
        const preview = DragDrop.createDragImage({ src: item.img }, imageWidth, imageHeight);
        event.dataTransfer.setDragImage(preview, 0, 0);
    })

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));

    showDropAndDeleteButtons(sheet);
}

export function equipmentOnDragOver(event, sheet) {
    const lt = sheet.lastDragStartTarget;
    if (lt != undefined && (lt.classList.contains(EQUIPMENT_BUTTON_COMPONENT) || lt.classList.contains(EQUIPMENT_ICON))) {
        if (lt.dataset.documentId) {
            var item = sheet.actor.items.get(lt.dataset.documentId);
            if (item == undefined) {
                item = game.items.get(lt.dataset.documentId);
            }
            if (item && item.system) {
                const itemWidth = item.system.width;
                const itemHeight = item.system.height;
                const eventItemPosition = { x: 0, y: 0 };
                if (event.target.id.includes('inventory-button')) {
                    eventItemPosition.x = Number(event.target.id.split('_')[1].split('-')[1]);
                    eventItemPosition.y = Number(event.target.id.split('_')[1].split('-')[0]);
                } else if (event.target.nextElementSibling != undefined && event.target.nextElementSibling.id.includes('inventory-button')) {
                    eventItemPosition.x = Number(event.target.nextElementSibling.id.split('_')[1].split('-')[1]);
                    eventItemPosition.y = Number(event.target.nextElementSibling.id.split('_')[1].split('-')[0]);
                }

                var parentElement = event.target;
                var foundInventoryGrid = false;
                for (var i = 0; i < 10; i++) {
                    if (!foundInventoryGrid) {
                        parentElement = parentElement.parentElement;
                        foundInventoryGrid = parentElement.classList.contains('inventory-grid');
                    }
                }

                if (foundInventoryGrid > 0) {
                    const inventoryGridPath = parentElement;
                    const backpackItems = sheet.actor.system.backpack.items;
                    for (var y = 0; y < backpackItems.length; y++) {
                        for (var x = 0; x < backpackItems[y].length; x++) {
                            const itemButton = inventoryGridPath.querySelector(`#inventory-button_${y}-${x}`);
                            if (itemButton.classList.contains('wrongLanding')) {
                                itemButton.classList.remove('wrongLanding');
                            }
                            if (itemButton.classList.contains('optionalLanding')) {
                                itemButton.classList.remove('optionalLanding');
                            }
                        }
                    }
                    if (eventItemPosition.x != undefined && eventItemPosition.y != undefined) {
                        for (var y = eventItemPosition.y; y < eventItemPosition.y + itemHeight && y < backpackItems.length; y++) {
                            for (var x = eventItemPosition.x; x < eventItemPosition.x + itemWidth && x < backpackItems[0].length; x++) {
                                const itemButton = inventoryGridPath.querySelector(`#inventory-button_${y}-${x}`);

                                if (backpackItems[y][x].contains == '' || backpackItems[y][x].contains == item.id) {
                                    itemButton.classList.add('optionalLanding');
                                } else {
                                    itemButton.classList.add('wrongLanding');
                                }
                            }
                        }
                    }
                }
            }
            //add class on hover over & remove class if not appropriate.
        }
    }
}

/**
 * 
 * @param {*} event 
 * @param {ActorSheet} sheet 
 * @returns 
 */
export function equipmentOnDrop(event, sheet) {
    const data = TextEditor.getDragEventData(event);
    const actor = sheet.actor;

    /**
     * A hook event that fires when some useful data is dropped onto an ActorSheet.
     * @function dropActorSheetData
     * @memberof hookEvents
     * @param {Actor} actor      The Actor
     * @param {ActorSheet} sheet The ActorSheet application
     * @param {object} data      The data that has been dropped onto the sheet
     */
    const allowed = Hooks.call("dropActorSheetData", actor, sheet, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
        case "Item":
            return _onDropItem(event, data, sheet);
    }
}

/**
 * @private
 * @param {*} event 
 * @param {object} data 
 * @param {ActorSheet} sheet 
 */
async function _onDropItem(event, data, sheet) {
    if (!sheet.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    var element = event.toElement;

    if (item.type == "item" || item.type == "weapon") {

        if (element.classList.contains(EQUIPMENT_BUTTON_COMPONENT) || element.classList.contains(EQUIPMENT_ICON)) {
            if(element.classList.contains(EQUIPMENT_ICON)){
                element = element.parentElement;
            }
            const sameItemId = item.id;
            const equipment = sheet.actor.system.equipment;

            switch (element.id) {
                case "equipment-holding":
                    if (equipment.holding.item == "") {
                        _putItemInEquipment(itemData, 'holding', sameItemId, sheet);
                    } else {
                        //cant equip animation
                    }
                    break;
                case "equipment-body":
                    if (equipment.body.item == "") {
                        _putItemInEquipment(itemData, 'body', sameItemId, sheet);
                    } else {
                        //cant equip animation
                    }
                    break;
                case "equipment-head":
                    if (equipment.head.item == "") {
                        _putItemInEquipment(itemData, 'head', sameItemId, sheet);
                    } else {
                        //cant equip animation
                    }
                    break;
                case "equipment-augmentation-artifact":
                    if (equipment.augmentation_artifact.item == "") {
                        _putItemInEquipment(itemData, 'augmentation_artifact', sameItemId, sheet);
                    } else {
                        //cant equip animation
                    }
                    break;
                case "equipment-protection-artifact":
                    if (equipment.protection_artifact.item == "") {
                        _putItemInEquipment(itemData, 'protection_artifact', sameItemId, sheet);
                    } else {
                        //cant equip animation
                    }
                    break;
                case "equipment-powerword-artifact-1":
                    if (equipment.powerword_artifacts_1.item == "") {
                        _putItemInEquipment(itemData, 'powerword_artifacts_1', sameItemId, sheet);
                    } else {
                        //cant equip animation
                    }
                    break;
                case "equipment-powerword-artifact-2":
                    if (equipment.powerword_artifacts_2.item == "") {
                        _putItemInEquipment(itemData, 'powerword_artifacts_2', sameItemId, sheet);
                    } else {
                        //cant equip animation
                    }
                    break;                    
            }

        }

        if (element.classList.contains('delete-item')) {
            removeAllItemTraces(sheet.actor, item.id);
        }
    }
}
/**
 * @private
 * @param {object} itemData 
 * @param {string} equipmentName 
 * @param {string} previousId 
 * @param {ActorSheet} sheet
 */
async function _putItemInEquipment(itemData, equipmentName, previousId, sheet) {
    const equipmentItem = await _onDropItemCreate(itemData, sheet);
    if (previousId) {
        removeAllItemTraces(sheet.actor, previousId);
    }
    sheet.actor.system.equipment[equipmentName].item = equipmentItem[0].id;
    sheet.actor.system.equipment[equipmentName].img = equipmentItem[0].img;
}

/**
* Handle the final creation of dropped Item data on the Actor.
* This method is factored out to allow downstream classes the opportunity to override item creation behavior.
* @param {object[]|object} itemData     The item data requested for creation
* @returns {Promise<Item[]>}
* @private
*/
async function _onDropItemCreate(itemData, sheet) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return sheet.actor.createEmbeddedDocuments("Item", itemData);
}

export function cleanSweepEquipmentItem(actor, itemId, remove = true) {
    const equipment = actor.system.equipment;

    const equipmentLocations = ['holding', 'body', 'head', 'augmentation_artifact', 'protection_artifact', 'powerword_artifacts_1', 'powerword_artifacts_2']
    equipmentLocations.forEach(location => {
        if (equipment[location] && equipment[location].item == itemId) {
            equipment[location].item = '';
            equipment[location].img = '';
        }
    })

    actor.system.equipment = equipment;
    actor.update({ ['system.equipment']: actor.system.equipment });
    if (remove && actor.items.has(itemId)) {
        actor.items.get(itemId).delete();
    }
}
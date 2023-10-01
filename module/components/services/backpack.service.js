import { DELETE_ITEMS_ON_STARTUP, ITEM_ICON_SIZE } from "../../constants.js";
import { BackpackItem } from "../backpack.item.component.js";
import { removeAllItemTraces } from "./drag.and.drop.utils.service.js";


/**
 * 
 * @param {*} html 
 * @param {ActorSheet} sheet 
 */
export function backpackActivateListeners(html, sheet) {
    /**
         * inventory actions
         */
    sheet.actor.system.backpack.items.forEach((y, yIndex) => {
        y.forEach((x, xIndex) => {
            html.find(`#inventory-button_${yIndex}-${xIndex}`).click((e) => {
                _onClickOpenItem(e, sheet.actor)
            });
            html.find(`#inventory-button_${yIndex}-${xIndex}`).on('dragend', () => {
                const actorSheet = sheet.actor.sheet;
                actorSheet.element[0].querySelector('.drop-item').style.visibility = 'hidden';
                actorSheet.element[0].querySelector('.delete-item').style.visibility = 'hidden';
            })
        })
    })
}

/**
 * Handle opening a single compendium entry by invoking the configured document class and its sheet
 * @param {MouseEvent} event      The originating click event
 * @param {Actor} actor
 * @private
 */
async function _onClickOpenItem(event, actor) {
    let li = event.currentTarget;
    const document = actor.items.get(li.dataset.documentId);
    const sheet = document.sheet;
    if (sheet._minimized) return sheet.maximize();
    else return sheet.render(true);
}


/**
 * * Start backpack space if there is none in place. Will be ignored otherwise.
 * * `DEBUG:` turning `DELETE_ITEMS_ON_STARTUP` to true will still fire this function.
 * @param {*} systemData 
 * @param {ActorSheet} sheet 
 */
export function initBackpackSpace(systemData, actor) {
    if (systemData.backpack.items.length == 0 || DELETE_ITEMS_ON_STARTUP) {
        const itemRow = [];
        for (var y = 0; y < systemData.backpack.height; y++) {
            const itemColumn = [];
            for (var x = 0; x < systemData.backpack.width; x++) {
                itemColumn.push(new BackpackItem(x, y, actor.id, ''));
            }
            itemRow.push(itemColumn);
        }
        systemData.backpack.items = itemRow;
        actor.system.backpack = systemData.backpack;
        actor.update({ [`system.backpack.items`]: actor.system.backpack.items })

        //clean actor items
        actor.items.forEach(item => {
            item.delete();
        })
    }
}

export function backpackOnDragStart(event, sheet) {
    const li = event.currentTarget;
    sheet.lastDragStartTarget = li;
    if (event.target.classList.contains("content-link")) return;

    // Create drag data
    let dragData;

    if (li.classList.contains('inventory')) {
        // Owned Items
        if (li.dataset.documentId) {
            const item = sheet.actor.items.get(li.dataset.documentId);
            dragData = item.toDragData();
            dragData.dragStartPosition = {
                x: li.id.split('_')[1].split('-')[1],
                y: li.id.split('_')[1].split('-')[0]
            };
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

    const actorSheet = sheet.actor.sheet;
    actorSheet.element[0].querySelector('.drop-item').style.visibility = 'visible';
    actorSheet.element[0].querySelector('.delete-item').style.visibility = 'visible';
}

export function backpackOnDragOver(event, sheet) {
    const lt = sheet.lastDragStartTarget;
    if (lt != undefined && lt.classList.contains('item')) {
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

export function backpackOnDrop(event, sheet) {
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
* Handle dropping of an item reference or item data onto an Actor Sheet
* @param {DragEvent} event            The concluding DragEvent which contains drop data
* @param {object} data                The data transfer extracted from the event
* @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
* @protected
*/
async function _onDropItem(event, data, sheet) {
    if (!sheet.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    const element = event.toElement;

    if (item.type == "item") {

        if (element.classList.contains('inventory')) {
            const width = item.system.width;
            const height = item.system.height;
            const dropX = Number(element.id.split('_')[1].split('-')[1]);
            const dropY = Number(element.id.split('_')[1].split('-')[0]);
            const backpackItems = sheet.actor.system.backpack.items;
            const sameItemId = item.id;

            if (backpackItems.length >= dropY + height && backpackItems[0].length >= dropX + width) {
                var hasNoItem = true;
                for (var y = dropY; y < height + dropY; y++) {
                    for (var x = dropX; x < width + dropX; x++) {
                        if (backpackItems[y][x].contains == '' || backpackItems[y][x].contains == sameItemId) {
                            //good animation;
                        } else {
                            hasNoItem = false;
                            //wrong animation;
                        }
                    }
                }

                if (hasNoItem) {
                    //clean sweep
                    if (sameItemId) {
                        for (var y = 0; y < sheet.actor.system.backpack.height; y++) {
                            for (var x = 0; x < sheet.actor.system.backpack.width; x++) {
                                if (backpackItems[y][x].contains == sameItemId) {
                                    backpackItems[y][x] = new BackpackItem(x, y, sheet.actor.id, '');
                                }
                            }
                        }
                    }

                    //drop the item
                    const inventoryItem = _onDropItemCreate(itemData, sheet);
                    inventoryItem.then(item => {
                        for (var y = dropY; y < height + dropY; y++) {
                            for (var x = dropX; x < width + dropX; x++) {
                                backpackItems[y][x].contains = item[0].id;
                                if (x == dropX && y == dropY) {
                                    //first tile
                                    backpackItems[y][x].topLeftCorner = { x: dropX, y: dropY }
                                    backpackItems[y][x].img = item[0].img;
                                    backpackItems[y][x].imgStyle = `width: ${width * ITEM_ICON_SIZE}px; height: ${height * ITEM_ICON_SIZE}px; position:absolute; top: -2px; left: ${(x * ITEM_ICON_SIZE) - 2}px; z-index:3`
                                }
                            }
                        }
                        sheet.actor.system.backpack.items = backpackItems;
                        sheet.actor.update({ [`system.backpack.items`]: sheet.actor.system.backpack.items });
                    });

                    //clean old item after creation
                    if (sameItemId) {
                        removeAllItemTraces(sheet.actor, sameItemId);
                    }
                    return inventoryItem;
                }
            } else {
                //some sort of animation that it doesn't fit
            }
        }

        if (element.classList.contains('delete-item')) {
            removeAllItemTraces(sheet.actor, item.id);
        }

    }
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

export function cleanSweepBackpackItem(actor, itemId, remove = true) {
    const backpackItems = actor.system.backpack.items;

    //clean sweep
    if (itemId) {
        for (var y = 0; y < actor.system.backpack.height; y++) {
            for (var x = 0; x < actor.system.backpack.width; x++) {
                if (backpackItems[y][x].contains == itemId) {
                    backpackItems[y][x] = new BackpackItem(x, y, actor.id, '');
                }
            }
        }

        actor.system.backpack.items = backpackItems;
        actor.update({ [`system.backpack.items`]: actor.system.backpack.items });
        if (remove && actor.items.has(itemId)) {
            actor.items.get(itemId).delete();
        }
    }
    return;
}
import {BackpackItem} from "../backpack.item.component.js";
import {ITEM_ICON_SIZE} from "../../constants.js";
import {removeAllItemTraces} from "./drag.and.drop.utils.service.js";

const EXTRA_BAG_ADD_BUTTON = "add-extra-bag-button";
const EXTRA_BAG_CHANGE_HEIGHT = "extra-bag-height-";
const EXTRA_BAG_CHANGE_WIDTH = "extra-bag-width-";
const EXTRA_BAG_DELETE = "remove-extra-bag-button";
const EXTRA_BAG_INDEX = "extra-bag-index-";
const START_WIDTH = 2;
const START_HEIGHT = 2;

/**
 * 
 * @param {*} html 
 * @param {ActorSheet} sheet 
 */
export function extraBagActivateListeners(html, sheet) {
    html.find(`.${EXTRA_BAG_ADD_BUTTON}`).click(() => {
        _addExtraBag(sheet);
    })

    sheet.actor.system.extra_bags.forEach((extra_bag, index) => {
        html.find(`.${EXTRA_BAG_CHANGE_HEIGHT}${index}`).change((e) => {
            extra_bag.height = e.target.valueAsNumber;
            sheet.actor.system.extra_bags[index] = _updateExtraBagDimensions(extra_bag, sheet.actor);
            sheet.actor.update({ [`system.extra_bags`]: sheet.actor.system.extra_bags });
            sheet.render(true);
        });

        html.find(`.${EXTRA_BAG_CHANGE_WIDTH}${index}`).change((e) => {
            extra_bag.width = e.target.valueAsNumber;
            sheet.actor.system.extra_bags[index] = _updateExtraBagDimensions(extra_bag, sheet.actor);
            sheet.actor.update({ [`system.extra_bags`]: sheet.actor.system.extra_bags });
            sheet.render(true);
        });
    })

    /**
     * inventory actions
     */
    sheet.actor.system.extra_bags.forEach(extra_bag => {
        extra_bag.items.forEach((y, yIndex) => {
            y.forEach((x, xIndex) => {
                html.find(`#extra-bag-button_${yIndex}-${xIndex}`).click((e) => {
                    _onClickOpenItem(e, sheet.actor)
                });
                html.find(`#extra-bag-button_${yIndex}-${xIndex}`).on('dragend', () => {
                    const actorSheet = sheet.actor.sheet;
                    actorSheet.element[0].querySelector('.drop-item').style.visibility = 'hidden';
                    actorSheet.element[0].querySelector('.delete-item').style.visibility = 'hidden';
                })
            })
        })
    })

    html.find(`.${EXTRA_BAG_DELETE}`).click((e) => {
        _removeExtraBag(e,sheet);
    })
}

/**
 * 
 * @param {ActorSheet} sheet 
 * @private
 */
function _addExtraBag(sheet){
    const actor = sheet.actor;
    var bagObject = {
        width: START_WIDTH,
        height: START_HEIGHT,
        items: []
    }

    bagObject = _updateExtraBagDimensions(bagObject, sheet.actor);

    actor.system.extra_bags.push(bagObject);
    actor.update({ [`system.extra_bags`]: actor.system.extra_bags });
    sheet.render(true);
}

/**
 * 
 * @param {Bag} extra_bag 
 * @param {Actor} actor 
 * @returns {Bag}
 * @private
 */
function _updateExtraBagDimensions(extra_bag, actor){

    _wipeItemsFromExtraBag(extra_bag, actor);

    const itemRow = [];
    for(var y = 0; y < extra_bag.height; y++){
        const itemColumn = [];
        for(var x = 0; x < extra_bag.width; x++){
            itemColumn.push(new BackpackItem(x, y, actor.id, ''));
        }
        itemRow.push(itemColumn);
    }
    extra_bag.items = itemRow;
    return extra_bag;
}

/**
 * 
 * @param {*} event 
 * @param {ActorSheet} sheet 
 */
function _removeExtraBag(event, sheet){
    const index = _getIndexFromClass(event.currentTarget, EXTRA_BAG_INDEX);
    _wipeItemsFromExtraBag(sheet.actor.system.extra_bags[index], sheet.actor);
    sheet.actor.system.extra_bags.splice(index,1);
    sheet.actor.update({ [`system.extra_bags`]: sheet.actor.system.extra_bags });
}

/**
 * 
 * @param {Bag} extra_bag
 * @param {Actor} actor 
 */
function _wipeItemsFromExtraBag(extra_bag, actor){
    const uniqueItems = [];

    extra_bag.items.forEach(column => {
        column.forEach(item => {
            if(!uniqueItems.includes(item.contains) && item.contains != ""){
                uniqueItems.push(item.contains);
            }
        })
    });

    //wipe existing items when changing dimensions
    uniqueItems.forEach(item => {
        cleanSweepExtraBagsItem(actor, item, false);
        actor.items.get(item).delete();
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
 * 
 * @param {*} event 
 * @param {ActorSheet} sheet 
 * @returns 
 */
export function extraBagOnDragStart(event, sheet) {
    const li = event.currentTarget;
    sheet.lastDragStartTarget = li;
    if (event.target.classList.contains("content-link")) return;

    // Create drag data
    let dragData;

    if (li.classList.contains('extra-bag')) {
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

/**
 * 
 * @param {*} event 
 * @param {ActorSheet} sheet 
 */
export function extraBagOnDragOver(event, sheet) {
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
                if (event.target.id.includes('extra-bag-button')) {
                    eventItemPosition.x = Number(event.target.id.split('_')[1].split('-')[1]);
                    eventItemPosition.y = Number(event.target.id.split('_')[1].split('-')[0]);
                } else if (event.target.nextElementSibling != undefined && event.target.nextElementSibling.id.includes('extra-bag-button')) {
                    eventItemPosition.x = Number(event.target.nextElementSibling.id.split('_')[1].split('-')[1]);
                    eventItemPosition.y = Number(event.target.nextElementSibling.id.split('_')[1].split('-')[0]);
                }

                var parentElement = event.target;
                var foundExtraBagGrid = false;
                for (var i = 0; i < 10; i++) {
                    if (!foundExtraBagGrid) {
                        parentElement = parentElement.parentElement;
                        foundExtraBagGrid = parentElement.classList.contains('extra-bag-grid');
                    }
                }

                if (foundExtraBagGrid > 0) {
                    const extraBagGridPath = parentElement;
                    const index = _getIndexFromClass(extraBagGridPath, EXTRA_BAG_INDEX);
                    const extraBagItems = sheet.actor.system.extra_bags[index].items;
                    for (var y = 0; y < extraBagItems.length; y++) {
                        for (var x = 0; x < extraBagItems[y].length; x++) {
                            const itemButton = extraBagGridPath.querySelector(`#extra-bag-button_${y}-${x}`);
                            if (itemButton.classList.contains('wrongLanding')) {
                                itemButton.classList.remove('wrongLanding');
                            }
                            if (itemButton.classList.contains('optionalLanding')) {
                                itemButton.classList.remove('optionalLanding');
                            }
                        }
                    }
                    if (eventItemPosition.x != undefined && eventItemPosition.y != undefined) {
                        for (var y = eventItemPosition.y; y < eventItemPosition.y + itemHeight && y < extraBagItems.length; y++) {
                            for (var x = eventItemPosition.x; x < eventItemPosition.x + itemWidth && x < extraBagItems[0].length; x++) {
                                const itemButton = extraBagGridPath.querySelector(`#extra-bag-button_${y}-${x}`);

                                if (extraBagItems[y][x].contains == '' || extraBagItems[y][x].contains == item.id) {
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

export function extraBagOnDrop(event, sheet) {
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

        if (element.classList.contains('extra-bag')) {
            const width = item.system.width;
            const height = item.system.height;
            const dropX = Number(element.id.split('_')[1].split('-')[1]);
            const dropY = Number(element.id.split('_')[1].split('-')[0]);
            const index = _getIndexFromClass(element, EXTRA_BAG_INDEX);
            const extraBagItems = sheet.actor.system.extra_bags[index].items;
            const sameItemId = item.id;

            if (extraBagItems.length >= dropY + height && extraBagItems[0].length >= dropX + width) {
                var hasNoItem = true;
                for (var y = dropY; y < height + dropY; y++) {
                    for (var x = dropX; x < width + dropX; x++) {
                        if (extraBagItems[y][x].contains == '' || extraBagItems[y][x].contains == sameItemId) {
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
                        for (var y = 0; y < sheet.actor.system.extra_bags[index].height; y++) {
                            for (var x = 0; x < sheet.actor.system.extra_bags[index].width; x++) {
                                if (extraBagItems[y][x].contains == sameItemId) {
                                    extraBagItems[y][x] = new BackpackItem(x, y, sheet.actor.id, '');
                                }
                            }
                        }
                    }

                    //drop the item
                    const extraBagItem = _onDropItemCreate(itemData, sheet);
                    extraBagItem.then(item => {
                        for (var y = dropY; y < height + dropY; y++) {
                            for (var x = dropX; x < width + dropX; x++) {
                                extraBagItems[y][x].contains = item[0].id;
                                if (x == dropX && y == dropY) {
                                    //first tile
                                    extraBagItems[y][x].topLeftCorner = { x: dropX, y: dropY }
                                    extraBagItems[y][x].img = item[0].img;
                                    extraBagItems[y][x].imgStyle = `width: ${width * ITEM_ICON_SIZE}px; height: ${height * ITEM_ICON_SIZE}px; position:absolute; top: -2px; left: ${(x * ITEM_ICON_SIZE) - 2}px; z-index:3`
                                }
                            }
                        }
                        sheet.actor.system.extra_bags[index].items = extraBagItems;
                        sheet.actor.update({ [`system.extra_bags`]: sheet.actor.system.extra_bags });
                    });

                    //clean old item after creation
                    if (sameItemId) {
                        removeAllItemTraces(sheet.actor, sameItemId);
                    }
                    return extraBagItem;
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

export function cleanSweepExtraBagsItem(actor, itemId, remove = true) {
    actor.system.extra_bags.forEach(extra_bag => {
        const extraBagItems = extra_bag.items;

        //clean sweep
        if (itemId) {
            for (var y = 0; y < extra_bag.height; y++) {
                for (var x = 0; x < extra_bag.width; x++) {
                    if (extraBagItems[y][x].contains == itemId) {
                        extraBagItems[y][x] = new BackpackItem(x, y, actor.id, '');
                    }
                }
            }
    
            extra_bag.items = extraBagItems;
            actor.update({ [`system.extra_bags`]: actor.system.extra_bags });
            if (remove && actor.items.has(itemId)) {
                actor.items.get(itemId).delete();
            }
        }
    })
    return;
}

/**
 * 
 * @param {HTMLElement} element 
 * @param {string} classNamePart 
 * @returns {number}
 */
function _getIndexFromClass(element, classNamePart){
    var returnValue = -1;
    element.classList.forEach(className => {
        if(className.includes(classNamePart)){
            returnValue = parseInt(className.substring(classNamePart.length));
        }
    });
    return returnValue;
}
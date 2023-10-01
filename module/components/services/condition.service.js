const CONDITION_DROP = "condition-drop";
const CONDITION_ITEM = "condition-item";
const CONDITION_DELETE = "delete-condition";

/**
 * 
 * @param {*} html 
 * @param {ActorSheet} sheet 
 */
export function conditionActivateListeners(html,sheet){
    html.find(`.${CONDITION_ITEM}`).click((e) => {
        _onClickOpenItem(e,sheet.actor);
    })

    html.find(`.${CONDITION_DELETE}`).click((e) => {
        _deleteCondition(e, sheet);
    })
}

async function _onClickOpenItem(event,actor){
    let li = event.currentTarget;
    const document = actor.items.get(li.dataset.documentId);
    const sheet = document.sheet;
    if (sheet._minimized) return sheet.maximize();
    else return sheet.render(true);  
}

function _deleteCondition(event,sheet){
    const parentElement = event.currentTarget.parentElement;
    const documentId = parentElement.dataset.documentId;
    const actor = sheet.actor;

    const conditionIds = [].splice();
    for(var i = 0; i < actor.system.conditions.length; i++){
        if(actor.system.conditions[i].itemId == documentId){
            conditionIds.push(i);
        }
    }

    for(var i = conditionIds.length-1; i >= 0; i--){
        actor.system.conditions.splice(conditionIds[i], 1);
    }

    actor.update({['system.conditions']: actor.system.conditions});
    actor.items.get(documentId).delete();
    sheet.render(true);
}

export function conditionOnDrop(event,sheet){
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

    const element = event.toElement;

    if (item.type == "condition") {

        if (element.classList.contains(CONDITION_DROP)) {
            const conditionItem = await _onDropItemCreate(itemData, sheet);
            sheet.actor.system.conditions.push({
                img : conditionItem[0].img,
                itemId : conditionItem[0].id,
                name : conditionItem[0].name
            });
            sheet.actor.update({['system.conditions']: sheet.actor.system.conditions});
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
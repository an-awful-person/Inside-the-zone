const PREP_CLASS = 'prep-drop';
const PREP_BUTTON = 'prep-button';
const PREP_DELETE = 'delete-prep';

/**
 * 
 * @param {*} html 
 * @param {ActorSheet} sheet 
 */
export function prepActivateListeners(html,sheet){
    html.find(`.${PREP_CLASS}`).click((e) => {
        _onClickOpenItem(e,sheet.actor);
    })

    html.find(`.${PREP_DELETE}`).click((e) => {
        _deletePrep(e, sheet);
    })
}

async function _onClickOpenItem(event,actor){
    let li = event.currentTarget;
    const document = actor.items.get(li.dataset.documentId);
    const sheet = document.sheet;
    if (sheet._minimized) return sheet.maximize();
    else return sheet.render(true);  
}

function _deletePrep(event,sheet){
    const parentElement = event.currentTarget.parentElement;
    const documentId = parentElement.dataset.documentId;

    if(parentElement.id.includes("prep ")){
        const index = parseInt(parentElement.id.split(' ')[1]);
        const actor = sheet.actor;
        actor.system.preps[index].itemId = "";
        actor.system.preps[index].img = "";
        actor.system.preps[index].name = "";
        actor.update({['system.preps']: actor.system.preps});
        actor.items.get(documentId).delete();
        sheet.render(true);
    }
}

export function prepOnDrop(event,sheet){
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

    if (item.type == "prep") {

        if (element.classList.contains(PREP_CLASS) || element.classList.contains(PREP_BUTTON)) {
            const prepItem = await _onDropItemCreate(itemData, sheet);
            if(element.id.includes("prep ")){
                const index = parseInt(element.id.split(' ')[1]);
                sheet.actor.system.preps[index].itemId = prepItem[0].id;
                sheet.actor.system.preps[index].img = prepItem[0].img;
                sheet.actor.system.preps[index].name = prepItem[0].name;
                sheet.actor.update({['system.preps']: sheet.actor.system.preps});
            }
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
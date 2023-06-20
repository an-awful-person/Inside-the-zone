import { Attribute } from "../../components/attribute.component.js";
import { BackpackItem } from "../../components/backpack.item.component.js";
import { DELETE_ITEMS_ON_STARTUP, ITEM_ICON_SIZE, DICE_ARRAY, STATS, DAMAGE_TYPES } from "../../constants.js";


export default class ITZCoreCharacterSheet extends ActorSheet {

    /**
     * save the last item that started a drag so _onDragOver() knows what item is being dragged
     * @type {HTMLElement}
     * @private
     */
    lastDragStartTarget;

    /** @inheritdoc */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/character sheets/core-character-sheet.html`,
            tabs: [{ navSelector: ".actor-tabs", contentSelector: ".actor-tabs-body", initial: "actions" }],
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: ".landing" }, { dragSelector: ".landing", dropSelector: ".landing" }],
        })
    }

    /** @inheritdoc */
    async getData(options) {
        const context = await super.getData(options);

        context.systemData = context.data.system;
        this._initAvatarImages(context.systemData);
        this._initBackpackSpace(context.systemData);
        this._initProtectiveDice();
        this._initSanityDice();
        this._initSkills(context.systemData);

        this.actor.tab = "actions";

        this.actor.image_class = {};
        this.actor.image_class.sanity = this._changeImageClass(this.actor.system.sanity);
        this.actor.image_class.health = this._changeImageClass(this.actor.system.health);

        // new InventoryDragAPI(document.body);
        this.actor.system = context.systemData;
        return context;
    }

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);

        /**
         * increase or decrease stat
         */
        Object.values(STATS).forEach(stat => {
            html.find(`#decrease-${stat}-button`).on("click", () => {
                this._decreaseStat(stat)
                this.actor.image_class[stat] = this._changeImageClass(this.actor.system[stat]);
            });
            html.find(`#increase-${stat}-button`).on("click", () => {
                this._increaseStat(stat)
                this.actor.image_class[stat] = this._changeImageClass(this.actor.system[stat]);
            });
        })

        /**
         * sanity roll
         */
        html.find("#actor-sanity-roll").click(this._rollSanity.bind(this));

        /**
         * roll protection dices
         */
        DAMAGE_TYPES.forEach(type => html.find(`#actor-${type}-protection-roll`).click(() => this.actor.roll[type].rollTheDice()));

        /**
         * inventory actions
         */
        this.actor.system.backpack.items.forEach((y, yIndex) => {
            y.forEach((x, xIndex) => {
                html.find(`#inventory-button_${yIndex}-${xIndex}`).click((e) => {
                    this._onClickOpenItem(e)
                });
                html.find(`#inventory-button_${yIndex}-${xIndex}`).on('dragend', () => {
                    const actorSheet = this.actor.sheet;
                    actorSheet.element[0].querySelector('.drop-item').style.visibility = 'hidden';
                    actorSheet.element[0].querySelector('.delete-item').style.visibility = 'hidden';
                })
            })
        })

        /**
         * skill actions
         */
        if (this.actor.system.skills) {
            this.actor.system.skills.forEach(skill => {
                html.find(`#actor-${skill.name}-increase`).click(() => this._increaseSkill(skill.name));
                html.find(`#actor-${skill.name}-decrease`).click(() => this._decreaseSkill(skill.name));
                html.find(`#actor-${skill.name}-roll`).click(() => this.actor.system.skills[this.actor.system.skills.indexOf(skill)].attribute.rollTheDice());
            })
        }
    }

    /**
     * @private
     */
    _initSanityDice() {
        this.actor.roll.sanity = new Attribute('1d6');
    }

    _initProtectiveDice() {
        this.actor.roll = {};
        DAMAGE_TYPES.forEach(damage => {
            this.actor.roll[damage] = new Attribute('0');
        })
    }

    _initAvatarImages(systemData) {
        /**
         * AVATAR
         */
        systemData.avatarBorder = avatarBorder();
        function avatarBorder() {
            return `systems/inside-the-zone/assets/img/avatar/avatar-border.png`
        }

        /**
         * SANITY
         */
        systemData.sanityBackground = sanityBackgroundImage(systemData.sanity.max);
        function sanityBackgroundImage(max) {
            return `systems/inside-the-zone/assets/img/avatar/sanity-meter/sanity_${max}_background.png`
        }

        /**
         * STATS
         */
        Object.values(STATS).forEach(stat => {
            systemData[`${stat}Image`] = statImage(systemData[stat].value, systemData[stat].max);

            function statImage(value, max) {
                return value > 0 ? `systems/inside-the-zone/assets/img/avatar/${stat}-meter/${stat}_${value}_${max}.png` : '';
            }
        });
    }

    /**
     * @private
     * give skills their initial value
     */
    _initSkills() {
        this.actor.system.skills.forEach(skill => {
            skill.attribute = new Attribute(DICE_ARRAY[skill.value]);
        })
    }

    /**
     * * Start backpack space if there is none in place. Will be ignored otherwise.
     * * `DEBUG:` turning `DELETE_ITEMS_ON_STARTUP` to true will still fire this function.
     * @param {*} systemData 
     * @private
     */
    _initBackpackSpace(systemData) {
        if (systemData.backpack.items.length == 0 || DELETE_ITEMS_ON_STARTUP) {
            const itemRow = [];
            for (var y = 0; y < systemData.backpack.height; y++) {
                const itemColumn = [];
                for (var x = 0; x < systemData.backpack.width; x++) {
                    itemColumn.push(new BackpackItem(x, y, this.actor.id, ''));
                }
                itemRow.push(itemColumn);
            }
            systemData.backpack.items = itemRow;
            this.actor.system.backpack = systemData.backpack;
            this.actor.update({ [`system.backpack.items`]: this.actor.system.backpack.items })

            //clean actor items
            this.actor.items.forEach(item => {
                item.delete();
            })
        }
    }

    /**
     * Increase the value of a stat based on the stats min, max and its current value
     * @param {string} statName 
     * @private
     */
    _increaseStat(statName) {
        const stat = this.actor.system[statName];
        if (stat.value < stat.max) {
            stat.value++;
        } else {
            stat.value = stat.max;
        }
        this.actor.update({ [`system.${statName}.value`]: stat.value })
        this.render(false);
    }

    /**
     * Decrease the value of a stat based on the stats min, max and its current value
     * @param {string} statName 
     * @private
     */
    _decreaseStat(statName) {
        const stat = this.actor.system[statName];
        if (stat.value > stat.min) {
            stat.value--;
        } else {
            stat.value = stat.min;
        }
        this.actor.update({ [`system.${statName}.value`]: stat.value })
        this.render(false);
    }

    /**
     * increase the dice of a skill based on the current dice value and the amount of skill points left
     * @param {string} skillName 
     * @private
     */
    _increaseSkill(skillName) {
        const filteredSkill = this.actor.system.skills.filter(skill => skill.name == skillName)
        if (filteredSkill.length > 0 && this.actor.system.skillpoints > 0) {
            const skill = filteredSkill[0];
            if (skill.value < skill.max - 1) {
                skill.value++;
                this.actor.system.skillpoints--;
            } else {
                skill.value = skill.max - 1;
            }
            this.actor.update({ [`system.skills`]: this.actor.system.skills }); //overkill
            this.actor.update({ [`system.skillpoints`]: this.actor.system.skillpoints })
            this.render(false);
        }
    }

    /**
     * decrease the dice of a skill based on the current dice value and the amount of skill points left
     * @param {string} skillName 
     * @private
     */
    _decreaseSkill(skillName) {
        const filteredSkill = this.actor.system.skills.filter(skill => skill.name == skillName)
        if (filteredSkill.length > 0) {
            const skill = filteredSkill[0];
            if (skill.value > skill.min) {
                skill.value--;
                this.actor.system.skillpoints++;
            } else {
                skill.value = skill.min;
            }
            this.actor.update({ [`system.skills`]: this.actor.system.skills }); //overkill
            this.actor.update({ [`system.skillpoints`]: this.actor.system.skillpoints })
            this.render(false);
        }
    }

    /**
     * @private
     * @param {string} stat 
     * @returns {string} class name
     */
    _changeImageClass(stat) {
        if (stat.value <= stat.max * 0.6) {
            if (stat.value <= stat.max * 0.4) {
                return 'header-image-fast-pulse-animation'
            } else {
                return 'header-image-slow-pulse-animation'
            }
        } else {
            return '';
        }
    }

    /**
     * @private
     */
    _rollSanity() {
        this.actor.roll.sanity.rollTheDice().then(result => {
            if (result.total < 4) {
                this._decreaseStat(STATS.SANITY);
            }
        })
    }

    /** @inheritdoc */
    _onDragStart(event) {
        const li = event.currentTarget;
        this.lastDragStartTarget = li;
        if (event.target.classList.contains("content-link")) return;

        // Create drag data
        let dragData;

        if (li.classList.contains('inventory')) {
            // Owned Items
            if (li.dataset.documentId) {
                const item = this.actor.items.get(li.dataset.documentId);
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

        const actorSheet = this.actor.sheet;
        actorSheet.element[0].querySelector('.drop-item').style.visibility = 'visible';
        actorSheet.element[0].querySelector('.delete-item').style.visibility = 'visible';
    }

    /** 
   * @inheritdoc 
   * @param {DragEvent} event  
  */
    _onDragOver(event) {
        const lt = this.lastDragStartTarget;
        if (lt != undefined && lt.classList.contains('item')) {
            if (lt.dataset.documentId) {
                var item = this.actor.items.get(lt.dataset.documentId);
                if (item == undefined) {
                    item = game.items.get(lt.dataset.documentId);
                }
                const itemWidth = item.system.width;
                const itemHeight = item.system.height;
                const eventItemPosition = {};
                if (event.target.id.includes('inventory-button')) {
                    eventItemPosition.x = Number(event.target.id.split('_')[1].split('-')[1]);
                    eventItemPosition.y = Number(event.target.id.split('_')[1].split('-')[0]);
                } else if (event.target.nextElementSibling != undefined && event.target.nextElementSibling.id.includes('inventory-button')) {
                    eventItemPosition.x = Number(event.target.nextElementSibling.id.split('_')[1].split('-')[1]);
                    eventItemPosition.y = Number(event.target.nextElementSibling.id.split('_')[1].split('-')[0]);
                }
                const inventoryGridPaths = event.path.filter(path => {
                    if (path.classList) {
                        return path.classList.contains('inventory-grid')
                    } else {
                        return false;
                    }
                });
                if (inventoryGridPaths.length > 0) {
                    const inventoryGridPath = inventoryGridPaths[0];
                    const backpackItems = this.actor.system.backpack.items;
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
                //add class on hover over & remove class if not appropriate.
            }
        }
    }

    /** 
     * @inheritdoc 
     * @param {DragEvent} event  
    */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const actor = this.actor;

        /**
         * A hook event that fires when some useful data is dropped onto an ActorSheet.
         * @function dropActorSheetData
         * @memberof hookEvents
         * @param {Actor} actor      The Actor
         * @param {ActorSheet} sheet The ActorSheet application
         * @param {object} data      The data that has been dropped onto the sheet
         */
        const allowed = Hooks.call("dropActorSheetData", actor, this, data);
        if (allowed === false) return;

        // Handle different data types
        switch (data.type) {
            case "Item":
                return this._onDropItem(event, data);
        }
    }

    /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        const element = event.toElement;

        if (element.classList.contains('inventory')) {
            const width = item.system.width;
            const height = item.system.height;
            const dropX = Number(element.id.split('_')[1].split('-')[1]);
            const dropY = Number(element.id.split('_')[1].split('-')[0]);
            const backpackItems = this.actor.system.backpack.items;
            const sameItemId = item.uuid.split('.')[3];

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
                        for (var y = 0; y < this.actor.system.backpack.height; y++) {
                            for (var x = 0; x < this.actor.system.backpack.width; x++) {
                                if (backpackItems[y][x].contains == sameItemId) {
                                    backpackItems[y][x] = new BackpackItem(x, y, this.actor.id, '');
                                }
                            }
                        }
                    }

                    //drop the item
                    const inventoryItem = this._onDropItemCreate(itemData);
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
                        this.actor.system.backpack.items = backpackItems;
                        this.actor.update({ [`system.backpack.items`]: this.actor.system.backpack.items });
                    });

                    //clean old item after creation
                    if (sameItemId) {
                        this.actor.items.get(sameItemId).delete();
                    }
                    return inventoryItem;
                }
            } else {
                //some sort of animation that it doesn't fit
            }
        }

        if (element.classList.contains('delete-item')) {
            const backpackItems = this.actor.system.backpack.items;
            const sameItemId = item.uuid.split('.')[3];

            //clean sweep
            if (sameItemId) {
                for (var y = 0; y < this.actor.system.backpack.height; y++) {
                    for (var x = 0; x < this.actor.system.backpack.width; x++) {
                        if (backpackItems[y][x].contains == sameItemId) {
                            backpackItems[y][x] = new BackpackItem(x, y, this.actor.id, '');
                        }
                    }
                }

                this.actor.system.backpack.items = backpackItems;
                this.actor.update({ [`system.backpack.items`]: this.actor.system.backpack.items });

                this.actor.items.get(sameItemId).delete();
            }
            return;
        }
    }

    /**
 * Handle the final creation of dropped Item data on the Actor.
 * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
 * @param {object[]|object} itemData     The item data requested for creation
 * @returns {Promise<Item[]>}
 * @private
 */
    async _onDropItemCreate(itemData) {
        itemData = itemData instanceof Array ? itemData : [itemData];
        return this.actor.createEmbeddedDocuments("Item", itemData);
    }


    /**
     * Handle opening a single compendium entry by invoking the configured document class and its sheet
     * @param {MouseEvent} event      The originating click event
     * @private
     */
    async _onClickOpenItem(event) {
        let li = event.currentTarget;
        const document = this.actor.items.get(li.dataset.documentId);
        const sheet = document.sheet;
        if (sheet._minimized) return sheet.maximize();
        else return sheet.render(true);
    }
}
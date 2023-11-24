import ITZItemSheet from './ITZItemSheet.js';
import { ITEM_ICON_SIZE } from "../../constants.js";
import { rollDice } from '../../components/dice.roll.function.js';

const AMMO_DROP = "ammo-button-component";

export default class ITZWeaponSheet extends ITZItemSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/item sheets/weapon-sheet.html`,
            dragDrop: [{ dragSelector: ".item-list .item", dropSelector: ".landing" }, { dragSelector: ".landing", dropSelector: ".landing" }],
        })
    }

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.ammo-checkbox').change(e => {
            this.item.system.hasAmmo = e.target.checked;
            e.currentTarget.checked = this.item.system.hasAmmo;
            this.item.update({ [`system.hasAmmo`]: this.item.system.hasAmmo });
            this.render(false);
        })

        html.find('.decrease-ammo-button').click(e => {
            const rounds = this.item.system.rounds;
            if (rounds.value > rounds.max) {
                rounds.value = rounds.max;
            } else if (rounds.value > rounds.min) {
                rounds.value--;
            } else {
                rounds.value = rounds.min;
            }
            this.item.update({ [`system.rounds.value`]: rounds.value })
            this.render(false);
        })

        html.find('.increase-ammo-button').click(e => {
            const rounds = this.item.system.rounds;
            if (rounds.value < rounds.min) {
                rounds.value = rounds.min;
            } else if (rounds.value < rounds.max) {
                rounds.value++;
            } else {
                rounds.value = rounds.max;
            }
            this.item.update({ [`system.rounds.value`]: rounds.value })
            this.render(false);
        })

        html.find('.ammo-input').change(e => {
            const value = e.target.valueAsNumber;
            const max = this.item.rounds.max;
            const min = this.item.rounds.min;
            if (value > max) {
                this.item.system.value = max;
            } else if (value < min) {
                this.item.system.value = min;
            } else {
                this.item.system.value = value;
            }

            this.item.update({ [`system.rounds.value`]: this.item.system.rounds.value });
        })

        html.find(`.ammo-max-input`).change(e => {
            this.item.system.rounds.max = e.target.valueAsNumber;
            this.item.update({ [`system.rounds.max`]: this.item.system.rounds.max });
        })

        this.item.system.actions.forEach((action, index) => {
            html.find(`.action-name-input-${index}`).change(e => {
                action.name = e.target.value;
                this.item.update({ [`system.actions`]: this.item.system.actions });
                this.render(false);
            });

            html.find(`.action-roll-input-${index}`).change(e => {
                action.roll = e.target.value;
                this.item.update({ [`system.actions`]: this.item.system.actions });
                this.render(false);
            });

            html.find(`.action-damagetype-input-${index}`).change(e => {
                action.damageType = e.target.value;
                this.item.update({ [`system.actions`]: this.item.system.actions });
                this.render(false);
            })

            html.find(`.action-amount-ammo-used-input-${index}`).change(e => {
                action.usesAmmo = e.target.valueAsNumber;
                this.item.update({ [`system.actions`]: this.item.system.actions });
                this.render(false);
            })

            html.find(`.action-roll-button-${index}`).click(e => {
                if (action.usesAmmo <= this.item.system.rounds.value) {
                    rollDice(action.roll);
                    this.item.system.rounds.value -= action.usesAmmo;
                    this.item.update({ ['system.rounds']: this.item.system.rounds });
                } else {
                    ui.notifications.info('not enough ammo');
                }
            });

            html.find(`.action-delete-button-${index}`).click(e => {
                this.item.system.actions.splice(index, 1);
                this.item.update({ [`system.actions`]: this.item.system.actions });
                this.render(false);
            })
        })

        html.find('.add-action-button').click(e => {
            this.item.system.actions.push({
                name: 'new action',
                damageType: 'none',
                usesAmmo: 0,
                roll: "d4"
            });
            this.item.update({ [`system.actions`]: this.item.system.actions });
            this.render(false);
        })

        html.find('.ammo-button-component').click(e => {
            this._onClickOpenItem(e.currentTarget);
        })
    }

    /** @inheritdoc */
    _onDragStart(event) {
        if (event.target.classList.contains("content-link")) return;

        const li = event.currentTarget;
        let dragData;

        if (li.classList.contains(AMMO_DROP)) {
            if (li.dataset.documentId) {
                const item = game.items.get(li.dataset.documentId);
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
    }


    /** 
   * @inheritdoc 
   * @param {DragEvent} event  
  */
    _onDragOver(event) {

    }

    /** 
     * @inheritdoc 
     * @param {DragEvent} event  
    */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = this.item;

        /**
         * A hook event that fires when some useful data is dropped onto an ItemSheet.
         * @function dropItemSheetData
         * @memberof hookEvents
         * @param {Actor} actor      The Item
         * @param {ItemSheet} sheet The ItemSheet application
         * @param {object} data      The data that has been dropped onto the sheet
         */
        const allowed = Hooks.call("dropItemSheetData", item, this, data);
        if (allowed === false) return;

        // Handle different data types
        switch (data.type) {
            case "Item":
                return this._onDropItem(event, data);
        }
    }


    /**
     * @private
     * @param {*} event 
     * @param {object} data 
     * @param {ItemSheet} sheet 
     */
    async _onDropItem(event, data) {
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        var element = event.toElement;

        if (item.type == "item" || item.type == "weapon") {

            if (element.classList.contains(AMMO_DROP)) {

                const sameItemId = item.id;
                this._putItemInAmmo(itemData, sameItemId);

            }
        }
    }

    async _putItemInAmmo(itemData) {
        this.item.system.ammo.id = itemData._id;
        this.item.system.ammo.img = itemData.img;
        this.item.update({ [`system.ammo`]: this.item.system.ammo });
        this.render(false);
    }

    /**
     * Handle opening a single compendium entry by invoking the configured document class and its sheet
     * @param {HTMLElement} target      target element
     * @param {Actor} actor
     * @private
     */
    async _onClickOpenItem(target) {
        const document = game.items.get(target.dataset.documentId);
        const sheet = document.sheet;
        if (sheet._minimized) return sheet.maximize();
        else return sheet.render(true);
    }
}
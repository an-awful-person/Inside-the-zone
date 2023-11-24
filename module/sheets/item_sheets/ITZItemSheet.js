import { ITEM_ICON_SIZE } from '../../constants.js';

export default class ITZItemSheet extends ItemSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/item sheets/item-sheet.html`,
            tabs: [{ navSelector: ".item-description-tabs", contentSelector: ".item-description-tabs-body", initial: "display" }],
        })
    }

    async getData(options) {
        const context = await super.getData(options);
        context.systemData = context.data.system;
        this._initImageDimensions(context.systemData.width, context.systemData.height);
        return context;
    }

    /**
 * @param {number} width 
 * @param {number} height 
 */
    _initImageDimensions(width, height) {
        this.item.system.grid = [];
        for (var y = 0; y < height; y++) {
            const widthItemId = [];
            for (var x = 0; x < width; x++) {
                widthItemId.push(this.item.id);
            }
            this.item.system.grid.push(widthItemId);
        }
        this.item.system.imageWidth = width * ITEM_ICON_SIZE;
        this.item.system.imageHeight = height * ITEM_ICON_SIZE;
        this.item.system.imageStyle = `width: ${width * ITEM_ICON_SIZE}px; height: ${height * ITEM_ICON_SIZE}px; position:absolute; z-index:10`;
    }

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".description-display")[0].innerHTML = marked.parse(this.item.system.description);
        
        /**
         * change description
         */
        html.find(".description").change(e => {
            this.item.update({ [`system.description`]: e.target.value });
            html.find(".description-display")[0].innerHTML = marked.parse(this.item.system.description);
            this.render(false);
        });

        html.find(".uses-toggle").change(e => {
            this.item.system.hasUses = e.target.checked;
            e.currentTarget.checked = this.item.system.hasUses;
            this.item.update({ [`system.hasUses`] : this.item.system.hasUses});
            this.render(false);
        })

        html.find(".broken-toggle").change(e => {
            this.item.system.broken = e.target.checked;
            e.currentTarget.checked = this.item.system.broken;
            this.item.update({ [`system.broken`] : this.item.system.broken});
            this.render(false);
        })

        html.find(".decrease-uses-button").click(e => {
            const uses = this.item.system.uses;
            if (uses.value > uses.max){
                uses.value = uses.max;
            } else if (uses.value > uses.min) {
                uses.value--;
            } else {
                uses.value = uses.min;
            }
            this.item.update({ [`system.uses.value`]: uses.value })
            this.render(false);
        })

        html.find(".increase-uses-button").click(e => {
            const uses = this.item.system.uses;
            if(uses.value < uses.min){
                uses.value = uses.min;
            } else if (uses.value < uses.max) {
                uses.value++;
            } else {
                uses.value = uses.max;
            }
            this.item.update({ [`system.uses.value`]: uses.value })
            this.render(false);
        })

        html.find(".uses-input").change(e => {
            const value = e.target.valueAsNumber;
            const max = this.item.system.uses.max;
            const min = this.item.system.uses.min;
            if(value > max){
                this.item.system.uses.value = max;
            } else if (value < min){
                this.item.system.uses.value = min;
            } else {
                this.item.system.uses.value = value;
            }            
            this.item.update({[`system.uses.value`]: this.item.system.uses.value});
        })

        html.find(".uses-max-input").change(e => {
            this.item.system.uses.max = e.target.valueAsNumber;
            this.item.update({[`system.uses.max`]: this.item.system.uses.max});
        })

        html.find(".change-price").change(e => {
            this.item.system.price = e.target.valueAsNumber;
            this.item.update({['system.price']: this.item.system.price});
        })
    }
}
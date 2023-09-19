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
    }
}
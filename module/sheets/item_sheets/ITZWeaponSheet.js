import ITZItemSheet from './ITZItemSheet.js';
import { ITEM_ICON_SIZE } from '../../constants.js';
export default class ITZWeaponSheet extends ITZItemSheet {
    static get defaultOptions() {
        //@ts-ignore
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/item sheets/weapon-sheet.html`
        });
    }
    async getData(options) {
        const context = await super.getData(options);
        context['systemData'] = context.data['system'];
        this._initImageDimensions(context['systemData'].width, context['systemData'].height);
        this.item['system'].ammoIcon = 'systems/inside-the-zone/assets/img/ammo.svg';
        return context;
    }
    /**
     * @param {number} width
     * @param {number} height
     */
    _initImageDimensions(width, height) {
        this.item['system'].grid = [];
        for (var y = 0; y < height; y++) {
            const widthItemId = [];
            for (var x = 0; x < width; x++) {
                widthItemId.push(this.item.id);
            }
            this.item['system'].grid.push(widthItemId);
        }
        this.item['system'].imageWidth = width * ITEM_ICON_SIZE;
        this.item['system'].imageHeight = height * ITEM_ICON_SIZE;
        this.item['system'].imageStyle = `width: ${width * ITEM_ICON_SIZE}px; height: ${height * ITEM_ICON_SIZE}px; position:absolute; z-index:10`;
    }
}

export default class ITZItemSheet extends ItemSheet {
    /**
     * @inheritdoc
     */
    static get defaultOptions() {
        //@ts-ignore super is js
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/item sheets/item-sheet.html`
        });
    }
    async getData(options) {
        const context = await super.getData(options);
        context['systemData'] = context.data['system'];
        return context;
    }
}

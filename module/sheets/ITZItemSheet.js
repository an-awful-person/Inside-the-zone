
export default class ITZItemSheet extends ItemSheet {

    static get defaultOptions(){
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/item-sheet.html`
        })
    }

    async getData(options) {
        const context = await super.getData(options);
        context.systemData= context.data.system;
        return context;
    }
}
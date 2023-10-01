export default class ITZConditionSheet extends ItemSheet {
    
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/item sheets/condition-sheet.html`,
            tabs: [{ navSelector: ".item-description-tabs", contentSelector: ".item-description-tabs-body", initial: "display" }],
        })
    }

    async getData(options) {
        const context = await super.getData(options);
        context.systemData = context.data.system;
        return context;
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
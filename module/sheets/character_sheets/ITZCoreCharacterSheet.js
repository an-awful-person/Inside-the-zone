import { Attribute } from "../../components/attribute.component.js";
import { BackpackItem } from "../../components/backpack.item.component.js";
import { DELETE_ITEMS_ON_STARTUP, ITEM_ICON_SIZE, DICE_ARRAY, STATS, DAMAGE_TYPES } from "../../constants.js";
import {attributeActiveListener, initSanityDice, initStatsImageClasses} from "../../components/services/attribute.service.js";
import {backpackActivateListeners, backpackOnDragOver, backpackOnDragStart, backpackOnDrop, initBackpackSpace} from "../../components/services/backpack.service.js";
import { initSkills, skillActivateListeners } from "../../components/services/skill.service.js";
import { equipmentActivateListeners, equipmentOnDragOver, equipmentOnDrop, equipmentOnDragStart } from "../../components/services/equipment.service.js";
import { prepActivateListeners, prepOnDrop } from "../../components/services/prep.service.js";
import { conditionActivateListeners, conditionOnDrop } from "../../components/services/condition.service.js";
import { extraBagActivateListeners, extraBagOnDragOver, extraBagOnDragStart, extraBagOnDrop } from "../../components/services/extra.bags.service.js";


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
        initBackpackSpace(context.systemData, this.actor);
        this._initProtectiveDice();
        initSanityDice(this.actor);
        initSkills(this.actor);

        this.actor.tab = "actions";

        initStatsImageClasses(this.actor);

        this.actor.system = context.systemData;
        return context;
    }

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);

        attributeActiveListener(html, this);

        /**
         * roll protection dices
         */
        DAMAGE_TYPES.forEach(type => html.find(`#actor-${type}-protection-roll`).click(() => this.actor.roll[type].rollTheDice()));

        backpackActivateListeners(html,this);
        equipmentActivateListeners(html,this);
        prepActivateListeners(html,this);
        conditionActivateListeners(html,this);
        extraBagActivateListeners(html,this);

        skillActivateListeners(html,this);
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

    /** @inheritdoc */
    _onDragStart(event) {
        backpackOnDragStart(event,this);
        equipmentOnDragStart(event,this);
        extraBagOnDragStart(event,this);
    }

    /** 
   * @inheritdoc 
   * @param {DragEvent} event  
  */
    _onDragOver(event) {
        backpackOnDragOver(event,this);
        equipmentOnDragOver(event,this);
        extraBagOnDragOver(event,this);
    }

    /** 
     * @inheritdoc 
     * @param {DragEvent} event  
    */
    async _onDrop(event) {
        backpackOnDrop(event, this);
        equipmentOnDrop(event, this);
        prepOnDrop(event,this);
        conditionOnDrop(event,this);
        extraBagOnDrop(event,this);
    }
}
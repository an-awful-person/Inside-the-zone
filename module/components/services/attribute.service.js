import { STATS } from "../../constants.js";
import { Attribute } from "../attribute.component.js";
import { rollDice } from "../dice.roll.function.js";

export function attributeActiveListener(html, sheet) {
    /**
     * increase or decrease stat
     */
    Object.values(STATS).forEach(stat => {
        html.find(`#decrease-${stat}-button`).on("click", () => {
            _decreaseStat(stat, sheet)
            sheet.actor.image_class[stat] = _changeImageClass(sheet.actor.system[stat]);
        });
        html.find(`#increase-${stat}-button`).on("click", () => {
            _increaseStat(stat, sheet)
            sheet.actor.image_class[stat] = _changeImageClass(sheet.actor.system[stat]);
        });
    })

    /**
         * sanity roll
         */
    html.find("#actor-sanity-roll").click(() => _rollSanity(sheet));
}

/**
 * Increase the value of a stat based on the stats min, max and its current value
 * @param {string} statName 
 * @private
 */
function _increaseStat(statName, sheet) {
    const stat = sheet.actor.system[statName];
    if (stat.value < stat.max) {
        stat.value++;
    } else {
        stat.value = stat.max;
    }
    sheet.actor.update({ [`system.${statName}.value`]: stat.value })
    sheet.render(false);
}

/**
 * Decrease the value of a stat based on the stats min, max and its current value
 * @param {string} statName 
 * @private
 */
function _decreaseStat(statName, sheet) {
    const stat = sheet.actor.system[statName];
    if (stat.value > stat.min) {
        stat.value--;
    } else {
        stat.value = stat.min;
    }
    sheet.actor.update({ [`system.${statName}.value`]: stat.value })
    sheet.render(false);
}

/**
* @private
* @param {string} stat 
* @returns {string} class name
*/
function _changeImageClass(stat) {
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
function _rollSanity(sheet) {
    const roll = rollDice(sheet.actor.roll.sanity.roll)
    if (roll.result < 4) {
            _decreaseStat(STATS.SANITY, sheet);
    }
}

/**
 * @param {Actor} actor
 */
export function initSanityDice(actor) {
    actor.roll.sanity = new Attribute('1d6');
}

/**
 * 
 * @param {Actor} actor 
 */
export function initStatsImageClasses(actor){
    actor.image_class = {};
    actor.image_class.sanity = _changeImageClass(actor.system.sanity);
    actor.image_class.health = _changeImageClass(actor.system.health);
}
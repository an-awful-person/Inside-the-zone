import { Attribute } from "../attribute.component.js";
import { DICE_ARRAY } from "../../constants.js";
import { rollDice } from "../dice.roll.function.js";

export function skillActivateListeners(html, sheet) {
    /**
 * skill actions
 */
    if (sheet.actor.system.skills) {
        sheet.actor.system.skills.forEach(skill => {
            html.find(`#actor-${skill.name}-increase`).click(() => _increaseSkill(skill.name, sheet));
            html.find(`#actor-${skill.name}-decrease`).click(() => _decreaseSkill(skill.name, sheet));
            html.find(`#actor-${skill.name}-roll`).click(() => {
               rollDice(sheet.actor.system.skills[sheet.actor.system.skills.indexOf(skill)].attribute.roll)
            });
        })
    }

    html.find(".actor-skillpoints-decrease").click(() => {
        sheet.actor.system.skillpoints--;
        sheet.actor.update({[`system.skillpoints`]: sheet.actor.system.skillpoints});
        sheet.render(false);
    })

    html.find(".actor-skillpoints-increase").click(() => {
        sheet.actor.system.skillpoints++;
        sheet.actor.update({[`system.skillpoints`]: sheet.actor.system.skillpoints});
        sheet.render(false);
    })
}

/**
 * give skills their initial value
 * @param {ActorSheet} sheet
 */
export function initSkills(sheet) {
    sheet.actor.system.skills.forEach(skill => {
        skill.attribute = new Attribute(DICE_ARRAY[skill.value]);
    })
    sheet.render(false);
}

/**
* increase the dice of a skill based on the current dice value and the amount of skill points left
* @param {string} skillName 
* @private
*/
function _increaseSkill(skillName, sheet) {
    const filteredSkill = sheet.actor.system.skills.filter(skill => skill.name == skillName)
    if (filteredSkill.length > 0 && sheet.actor.system.skillpoints > 0) {
        const skill = filteredSkill[0];
        if (skill.value < skill.max - 1) {
            skill.value++;
            sheet.actor.system.skillpoints--;
        } else {
            skill.value = skill.max - 1;
        }
        sheet.actor.update({ [`system.skills`]: sheet.actor.system.skills }); //overkill
        sheet.actor.update({ [`system.skillpoints`]: sheet.actor.system.skillpoints })
        sheet.render(false);
    }
}

/**
 * decrease the dice of a skill based on the current dice value and the amount of skill points left
 * @param {string} skillName 
 * @private
 */
function _decreaseSkill(skillName, sheet) {
    const filteredSkill = sheet.actor.system.skills.filter(skill => skill.name == skillName)
    if (filteredSkill.length > 0) {
        const skill = filteredSkill[0];
        if (skill.value > skill.min) {
            skill.value--;
            sheet.actor.system.skillpoints++;
        } else {
            skill.value = skill.min;
        }
        sheet.actor.update({ [`system.skills`]: sheet.actor.system.skills }); //overkill
        sheet.actor.update({ [`system.skillpoints`]: sheet.actor.system.skillpoints })
        sheet.render(false);
    }
}
/**
 * makes a dice roll
 * @param {string} diceString 
 * @returns {Roll}
 */
export function rollDice(diceString){
    const messageData = {
        speaker: ChatMessage.getSpeaker()
    }

    const roll = new Roll(diceString);
    roll.toMessage(messageData);
    return roll;
}
export class Attribute {
    roll = '0';
    boons = [];
    banes = [];

    constructor(roll) {
        if (roll) {
            this.roll = roll;
        }
    }

    async rollTheDice() {

        const messageData = {
            speaker: ChatMessage.getSpeaker()
        }

        var rollMessage = this.roll;
        this.boons.forEach(boon => `${rollMessage}+${boon}`);
        this.banes.forEach(bane => `${rollMessage}-${bane}`);

        const roll = new Roll(rollMessage);
        roll.toMessage(messageData);
        return roll;
    }
}
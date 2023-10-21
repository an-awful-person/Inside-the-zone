/**
 * @deprecated should be replaced with just a template text
 */
export class Attribute {
    roll = '0';

    constructor(roll) {
        if (roll) {
            this.roll = roll;
        }
    }
}
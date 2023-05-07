// import rollDice from '../../../functions/roll.function';

export default class ITZSoldierSheet extends ActorSheet {

    STATS = {
        SANITY: 'sanity',
        HEALTH: 'health',
        STRESS: 'stress'
    }

    static get defaultOptions(){
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/character sheets/soldier-sheet.html`
        })
    }

    async getData(options) {
        const context = await super.getData(options);
        context.systemData = context.data.system;
        this.initAvatarImages(context.systemData);
        return context;
    }


    activateListeners(html) {
        super.activateListeners(html);
        console.log('actor', this.actor, html);

        html.find("#decrease-sanity-button").on("click", () => this.decrease(this.STATS.SANITY));
        html.find("#increase-sanity-button").on("click", () => this.increase(this.STATS.SANITY));
        html.find("#decrease-health-button").on("click", () => this.decrease(this.STATS.HEALTH));
        html.find("#increase-health-button").on("click", () => this.increase(this.STATS.HEALTH));
        html.find("#decrease-stress-button").on("click", () => this.decrease(this.STATS.STRESS));
        html.find("#increase-stress-button").on("click", () => this.increase(this.STATS.STRESS));

        // if (this.actor.owner){
            html.find("#actor-sanity-roll").click(this._rollSanity.bind(this));
        // }
    }

    initProtectiveDice() {
        this.actor.protectiveDice = {
            physical: '',
            ballistic: '',
            freezing: '',
            burning: '',
            decay: '',
            mind: ''
        }
    }

    initAvatarImages(systemData) {
        systemData.avatarBorder = avatarBorder();
        systemData.stressImage = stressImage(systemData.stress.value, systemData.stress.max);
        systemData.healthImage = healthImage(systemData.health.value, systemData.health.max);
        systemData.sanityBackground = sanityBackgroundImage(systemData.sanity.max);
        systemData.sanityImage = sanityImage(systemData.sanity.value, systemData.sanity.max);

        function stressImage(value, max) {
            return value > 0 ? `systems/inside-the-zone/assets/img/avatar/stress-meter/stress_${value}_${max}.png` : '';
        }

        function healthImage(value, max) {
            return value > 0 ? `systems/inside-the-zone/assets/img/avatar/health-meter/health_${value}_${max}.png` : '';
        }
    
        function sanityImage(value, max) {
            return value > 0 ? `systems/inside-the-zone/assets/img/avatar/sanity-meter/sanity_${value}_${max}.png` : '';
        }
    
        function sanityBackgroundImage(max) {
            return `systems/inside-the-zone/assets/img/avatar/sanity-meter/sanity_${max}_background.png`
        }
    
        function avatarBorder() {
            return `systems/inside-the-zone/assets/img/avatar/avatar-border.png`
        }
    }

    increase(statName){
        const stat = this.actor.system[statName];
        if(stat.value < stat.max){
            stat.value++;
        } else {
            stat.value = stat.max;
        }
        this.actor.update({[`system.${statName}.value`]: stat.value})
        this.render(false);
        console.log(statName, this.actor.system[statName].value, this.actor.system[statName].max);
    }

    decrease(statName){
        const stat = this.actor.system[statName];
        if(stat.value > stat.min){
            stat.value--;
        } else {
            stat.value = stat.min;
        }
        this.actor.update({[`system.${statName}.value`]: stat.value})
        this.render(false);
        console.log(statName, this.actor.system[statName].value, this.actor.system[statName].max);
    }

    _rollSanity(event){
        this.roll();
    }

    async roll(){
        this.rollDice('2d6-1d8+1');
    }

    async rollDice(rollFormula){
        const messageData = {
            speaker: ChatMessage.getSpeaker()
        }
        const roll = new Roll(rollFormula);
        roll.toMessage(messageData);
        // roll.then(response => response.toMessage(messageData));
        return roll;
    }
}
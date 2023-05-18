// import rollDice from '../../../functions/roll.function';

export default class ITZSoldierSheet extends ActorSheet {

    STATS = {
        SANITY: 'sanity',
        HEALTH: 'health',
        STRESS: 'stress'
    }

    SKILL_ARRAY = ['1d4', '1d6','1d8','1d10','1d12'];

    static get defaultOptions(){
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `systems/inside-the-zone/templates/sheets/character sheets/soldier-sheet.html`,
            tabs: [{navSelector: ".actor-tabs", contentSelector:".actor-tabs-body", initial:"actions"}]
        })
    }

    async getData(options) {
        const context = await super.getData(options);
        context.systemData = context.data.system;
        this._initAvatarImages(context.systemData);
        this._initBackpackSpace(context.systemData);
        this._initProtectiveDice();
        this._initSanityDice();
        this._initSkills(context.systemData);

        this.actor.tab = "actions";

        this.actor.image_class = {};
        this.actor.image_class.sanity = this._changeImageClass(this.actor.system.sanity);
        this.actor.image_class.health = this._changeImageClass(this.actor.system.health);

        return context;
    }


    activateListeners(html) {
        super.activateListeners(html);

        html.find("#decrease-sanity-button").on("click", () => {
            this._decreaseStat(this.STATS.SANITY)
            this.actor.image_class.sanity = this._changeImageClass(this.actor.system.sanity);
        });
        html.find("#increase-sanity-button").on("click", () => {
            this._increaseStat(this.STATS.SANITY)
            this.actor.image_class.sanity = this._changeImageClass(this.actor.system.sanity);
        });

        html.find("#decrease-health-button").on("click", () => {
            this._decreaseStat(this.STATS.HEALTH);
            this.actor.image_class.health = this._changeImageClass(this.actor.system.health);
        });
        html.find("#increase-health-button").on("click", () => {
            this._increaseStat(this.STATS.HEALTH)
            this.actor.image_class.health = this._changeImageClass(this.actor.system.health);
        });

        html.find("#decrease-stress-button").on("click", () => this._decreaseStat(this.STATS.STRESS));
        html.find("#increase-stress-button").on("click", () => this._increaseStat(this.STATS.STRESS));

        // if (this.actor.owner){
            html.find("#actor-sanity-roll").click(this._rollSanity.bind(this));

            html.find("#actor-physical-protection-roll").click(() => this.actor.roll.physical.rollTheDice());
            html.find("#actor-ballistic-protection-roll").click(() => this.actor.roll.ballistic.rollTheDice());
            html.find("#actor-burning-protection-roll").click(() => this.actor.roll.burning.rollTheDice());
            html.find("#actor-freezing-protection-roll").click(() => this.actor.roll.freezing.rollTheDice());
            html.find("#actor-decay-protection-roll").click(() => this.actor.roll.decay.rollTheDice());
            html.find("#actor-mind-protection-roll").click(() => this.actor.roll.mind.rollTheDice());

            if(this.actor.system.skills){
                this.actor.system.skills.forEach(skill => {
                    html.find(`#actor-${skill.name}-increase`).click(() => this._increaseSkill(skill.name));
                    html.find(`#actor-${skill.name}-decrease`).click(() => this._decreaseSkill(skill.name));
                    html.find(`#actor-${skill.name}-roll`).click(() => this.actor.system.skills[this.actor.system.skills.indexOf(skill)].attribute.rollTheDice());
                })
            } 
        // }
    }

    _initSanityDice(){
        this.actor.roll.sanity = new Attribute('1d6');
    }

    _initProtectiveDice() {
        this.actor.roll = {
            physical: new Attribute('0'),
            ballistic: new Attribute('0'),
            freezing: new Attribute('1d6'),
            burning: new Attribute('0'),
            decay: new Attribute('0'),
            mind: new Attribute('0')
        }
    }

    _initAvatarImages(systemData) {
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

    _initSkills(){
        this.actor.system.skills.forEach(skill => {
            skill.attribute = new Attribute(this.SKILL_ARRAY[skill.value]);
        })
    }

    _initBackpackSpace(systemData){
        const itemRow = [];
        for(var y = 0; y < systemData.backpack.height; y++){
            const itemColumn = [];
            for(var x = 0; x < systemData.backpack.width; x++){
                itemColumn.push(new BackpackItem(x,y, this.actor, ''));
            }
            itemRow.push(itemColumn);
        }
        systemData.backpack.items = itemRow;
    }

    _increaseStat(statName){
        const stat = this.actor.system[statName];
        if(stat.value < stat.max){
            stat.value++;
        } else {
            stat.value = stat.max;
        }
        this.actor.update({[`system.${statName}.value`]: stat.value})
        this.render(false);
    }

    _decreaseStat(statName){
        const stat = this.actor.system[statName];
        if(stat.value > stat.min){
            stat.value--;
        } else {
            stat.value = stat.min;
        }
        this.actor.update({[`system.${statName}.value`]: stat.value})
        this.render(false);
    }

    _increaseSkill(skillName){
        const filteredSkill = this.actor.system.skills.filter(skill => skill.name == skillName)
        if(filteredSkill.length > 0 && this.actor.system.skillpoints > 0){
            const skill = filteredSkill[0];
            if(skill.value < skill.max-1){
                skill.value++;
                this.actor.system.skillpoints--; 
            } else {
                skill.value = skill.max-1;
            }
            this.actor.update({[`system.skills`]: this.actor.system.skills}); //overkill
            this.actor.update({[`system.skillpoints`]: this.actor.system.skillpoints})
            this.render(false);
        }
    }

    _decreaseSkill(skillName){
        const filteredSkill = this.actor.system.skills.filter(skill => skill.name == skillName)
        if(filteredSkill.length > 0){
            const skill = filteredSkill[0];
            if(skill.value > skill.min){
                skill.value--;
                this.actor.system.skillpoints++; 
            } else {
                skill.value = skill.min;
            }
            this.actor.update({[`system.skills`]: this.actor.system.skills}); //overkill
            this.actor.update({[`system.skillpoints`]: this.actor.system.skillpoints})
            this.render(false);
        }
    }

    _changeImageClass(stat){
        if(stat.value <= stat.max * 0.6){
            if(stat.value <= stat.max * 0.4){
                return 'header-image-fast-pulse-animation'
            } else {
                return 'header-image-slow-pulse-animation'
            }
        } else {
            return '';
        }
    }

    _rollSanity(){
        this.actor.roll.sanity.rollTheDice().then(result => {
            if(result.total < 4){
                this._decreaseStat(this.STATS.SANITY);
            }
        })
    }
}

class Attribute {
    roll = '0';
    boons = [];
    banes = [];

    constructor(roll){
        if(roll){
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

class BackpackItem {
    _contains = '';
    _position = {
        x: 0,
        y: 0
    }
    _actor;

    constructor(x,y,actor,item){
        this._actor = actor;
        this._position.x = x;
        this._position.y = y;
        if(item){
            this._contains = item;
        }
    }

    isEmpty(){
        return this._contains == '';
    }

    getItemId(){
        return this.isEmpty() ? 'empty' : this._contains;
    }

    getOwner(){
        return this._actor;
    }

    getX(){
        return this._position.x;
    }

    getY(){
        return this._position.y;
    }

    setPositionX(x){
        this._position.x = x;
    }

    setPositionY(y){
        this._position.y = y;
    }
}
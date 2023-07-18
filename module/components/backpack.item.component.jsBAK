export class BackpackItem {
    contains = '';
    position = {
        x: 0,
        y: 0
    }
    actorId;
    /**
     * @type {string}
     */
    img = null;
    imgStyle = null;
    topLeftCorner = {
        x: 0,
        y: 0
    }

    constructor(x, y, actorId, item) {
        this.actorId = actorId;
        this.position.x = x;
        this.position.y = y;
        if (item) {
            this.contains = item;
        }
    }

    isEmpty() {
        return this.contains == '';
    }

    getItemId() {
        return this.isEmpty() ? 'empty' : this.contains;
    }

    getOwner() {
        return this._actor;
    }

    getX() {
        return this.position.x;
    }

    getY() {
        return this.position.y;
    }

    setPositionX(x) {
        this.position.x = x;
    }

    setPositionY(y) {
        this.position.y = y;
    }

    setItemId(id){
        this.contains = id;
    }
}
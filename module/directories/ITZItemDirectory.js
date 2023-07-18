export default class ITZItemDirectory extends ItemDirectory {
    /** @override */
    _onDragStart(event) {
        console.log('starting dragging drom item directory', event);
        if (game) {
            game['actors'].forEach(actor => {
                actor.sheet.lastDragStartTarget = event.currentTarget;
            });
        }
        super._onDragStart(event);
    }
}

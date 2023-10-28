/**
 * `DEBUG` Will remove all items on a character once the sheet is opened.
 */
export const DELETE_ITEMS_ON_STARTUP = false;

/**
 * Size of an item icon
 */
export const ITEM_ICON_SIZE = 49;

/**
 * known dices in an array to scale up or down in dice size. `[1d4, 1d6, 1d8, 1d10, 1d12]` 
 * @readonly should not be changed
 */
export const DICE_ARRAY = ['1d4', '1d6', '1d8', '1d10', '1d12'];

/**
 * Changable actor stats
 * @readonly should not be changed
 */
export const STATS = {
    SANITY: 'sanity',
    HEALTH: 'health',
    STRESS: 'stress'
}

export const DAMAGE_TYPES = [
    'physical',
    'ballistic',
    'burning',
    'freezing',
    'decay',
    'sanity'
]
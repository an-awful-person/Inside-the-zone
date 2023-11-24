import ITZItemSheet from "./sheets/item_sheets/ITZItemSheet.js";
import ITZCoreCharacterSheet  from "./sheets/character_sheets/ITZCoreCharacterSheet.js";
import ITZItemDirectory from "./directories/ITZItemDirectory.js";
import ITZPrepSheet from "./sheets/item_sheets/ITZPrepSheet.js";
import ITZWeaponSheet from "./sheets/item_sheets/ITZWeaponSheet.js";
import ITZConditionSheet from "./sheets/item_sheets/ITZConditionSheet.js";

Hooks.once("init", async function(){
    console.log("Inside the zone | Initializing Inside the zone System");
    initFomanticUI();
    initSheets();

    CONFIG.ui.items = ITZItemDirectory;
});

function initSheets(){
    console.log("Inside the zone | Initializing Templates");
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("inside-the-zone", ITZItemSheet, { types: ['item'], makeDefault : true}); 
    Items.registerSheet("inside-the-zone", ITZWeaponSheet, { types: ['weapon']}); 
    Items.registerSheet("inside-the-zone", ITZPrepSheet, { types: ['prep']}); 
    Items.registerSheet("inside-the-zone", ITZConditionSheet, { types: ['condition']}); 

    Actors.unregisterSheet("core",ActorSheet);
    Actors.registerSheet("inside-the-zone",ITZCoreCharacterSheet,{ makeDefault : true});
}

function initFomanticUI() {
    console.log("Inside the zone | Initializing Semantic");
    const HEAD = document.head;

    const jquery = document.createElement("script");
    jquery.src="https://cdn.jsdelivr.net/npm/jquery@3.6.3/dist/jquery.min.js";
    HEAD.appendChild(jquery);

    const stylesheet = document.createElement("link");
    stylesheet.rel="stylesheet";
    stylesheet.type="text/css";
    stylesheet.href="../systems/inside-the-zone/semantic/dist/semantic.min.css";
    HEAD.appendChild(stylesheet);

    const semanticJS = document.createElement("script");
    semanticJS.src = "../systems/inside-the-zone/semantic/dist/semantic.min.js";
    HEAD.appendChild(semanticJS);

    //to restore my own styles -- dirty
    const myStyle = document.createElement("link");
    myStyle.rel="stylesheet";
    myStyle.type="text/css";
    myStyle.href="../systems/inside-the-zone/styles/css/inside-the-zone.css";
    HEAD.appendChild(myStyle)

    const markdown = document.createElement("script");
    markdown.src = "../systems/inside-the-zone/node_modules/marked/marked.min.js";
    HEAD.appendChild(markdown);
}
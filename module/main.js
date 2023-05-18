import ITZItemSheet from "./sheets/ITZItemSheet.js";
import ITZSoldierSheet from "./sheets/character sheets/ITZSoldierSheet.js";

Hooks.once("init", async function(){
    console.log("Inside the zone | Initializing Inside the zone System");
    initFomanticUI();
    initSheets();
    registerHandlebarsHelpers();  
});

function initSheets(){
    console.log("Inside the zone | Initializing Templates");
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("inside-the-zone", ITZItemSheet, { makeDefault : true}); 

    Actors.unregisterSheet("core",ActorSheet);
    Actors.registerSheet("inside-the-zone",ITZSoldierSheet,{ makeDefault : true});
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
}

function registerHandlebarsHelpers() {
    Handlebars.registerHelper("tab", function(value, list) {
        return list[value];
    })
}
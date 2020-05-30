


let pageIcons=null; //becomes an object
let iconFolder = "./images/";
let defaultIcon="./images/dragonIcon.png";


let ci={
  dieRoll:function(dieSides){
    return Math.floor(Math.random()*dieSides)+1;
  },
  array_move:function(arr, old_index, new_index) {
    //https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }

    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
  },
  checkCommonGround:function(array1, array2){
    //tests if array1 and 2 have ANY elements in common
    let commonGround=false;
    if (array1.length<array2.length){
      for (let i=0, len=array1.length; i<len; i++){
        if (array2.includes(array1[i])){commonGround=true; break;}
      }
    }else{
      for (let i=0, len=array2.length; i<len; i++){
        if (array1.includes(array2[i])){commonGround=true; break;}
      }
    }

    return commonGround;
  },
  copyToClipboard:(copyText)=>{
    /* Get the text field */


   /* Select the text field */

   let range = document.createRange();
   let selection=window.getSelection();
   range.selectNode(copyText);
   selection.removeAllRanges();
   selection.addRange(range);
   document.execCommand("copy");



   /* Alert the copied text */
   ci.fyiUser("Magic Word copied to clipboard");
 },
 fyiUser:(text)=>{
   $("#alertBanner").removeClass("activeAlert");
   $("#alertBanner").html(text);
   $("#alertBanner").addClass("activeAlert");
   setTimeout(removeBanner, 5000)

   function removeBanner(){
     $("#alertBanner").removeClass("activeAlert");
   }
 },
 getDragByID:(id)=>{
   let pages=activeProfile.pages;
   let drag=false; //???
   pageLoop:
   for (let i=0; i<pages.length; i++){
   dragLoop:
     for (let j=0; j<pages[i].length; j++){
       if (parseInt(pages[i][j].id)==id){
         drag=pages[i][j];
         break pageLoop;
       }
     }
   }

   if (!drag){
     console.error("Tried to find  a draggable that does not exist " +id);

     return null;
   }else{

     return drag;
   }
 },
 getToggleByID:(id)=>{
   let bars=activeProfile.toggles;
   // barLoop:
   for (let i=0; i<bars.length; i++){
     // toggleLoop:
     for (let j=0; j<bars[i].toggles.length; j++){
       if (parseInt(bars[i].toggles[j].id)==id){
         return bars[i].toggles[j];

       }

     }
   }
 },
 getAllToggles:()=>{
   let toggleBars=activeProfile.toggles;
   let allToggles=[];
   toggleBars.forEach((bar)=>{
     bar.toggles.forEach((toggle)=>{
       allToggles.push(toggle);
     });
   });

   return allToggles;
 },
 spliceElem:(array, elem)=>{
   let pos=array.indexOf(elem);
   if (pos>=0){
     array.splice(pos,1);
   }else{
     console.error("Given bad Element, not found in array to splice");
   }

 },
 downloadJSON:(exportObj, exportName)=>{
   //https://stackoverflow.com/a/30800715
   var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
   var downloadAnchorNode = document.createElement('a');
   downloadAnchorNode.setAttribute("href",     dataStr);
   downloadAnchorNode.setAttribute("download", exportName + ".json");
   document.body.appendChild(downloadAnchorNode); // required for firefox
   downloadAnchorNode.click();
   downloadAnchorNode.remove();

 }


}

let fontSelector={
  validFonts:[],

  getFontList:function(){
    let detective = new fontSelector.fontDetector();
    if (localStorage.getItem("fonts")){
      cardForms.setFontOptions();
      return;
    }


    let untestedFonts=["Abadi MT Condensed Light", "Albertus Extra Bold", 'Zurich Ex BT','Zurich BlkEx BT',"Albertus Medium","Antique Olive ","Arial","Arial Black","Arial MT","Arial Narrow","Bazooka","Book Antiqua","Bookman Old Style ","Boulder","Calisto MT","Calligrapher","Century Gothic","Century Schoolbook","Cezanne","CG Omega","CG Times","Charlesworth","Chaucer","Clarendon Condensed","Comic Sans MS","Copperplate Gothic Bold","Copperplate Gothic Light","Cornerstone","Coronet","Courier","Courier New","Cuckoo","Dauphin","Denmark","Fransiscan","Garamond","Geneva","Haettenschweiler","Heather","Helvetica","Herald","Impact","Jester","Letter Gothic","Lithograph","Lithograph Light","Long Island","Lucida Console","Lucida Handwriting","Lucida Sans","Lucida Sans Unicode","Marigold","Market","Matisse ITC","MS LineDraw","News GothicMT","OCR A Extended","Old Century","Pegasus","Pickwick","Poster","Pythagoras","Sceptre","Sherwood","Signboard","Socket","Steamer","Storybook","Subway","Tahoma ","Technical",'Teletype','Tempus Sans ITC','Times','Times New Roman','Times New Roman PS','Trebuchet MS','Tristan','Tubular','Unicorn','Univers','Univers Condensed','Vagabond','Verdana','Westminster','Allegro','Amazone BT','AmerType Md BT','Arrus BT','Aurora Cn BT','AvantGarde Bk BT','AvantGarde Md BT','BankGothic Md BT','Benguiat Bk BT','BernhardFashion BT','BernhardMod BT','BinnerD','Bremen Bd BT','CaslonOpnface BT','Charter Bd BT','Charter BT','ChelthmITC Bk BT','CloisterBlack BT','CopperplGoth Bd BT','English 111 Vivace BT','EngraversGothic BT','Exotc350 Bd BT','Freefrm721 Blk BT','FrnkGothITC Bk BT','Futura Bk BT','Futura Lt BT','Futura Md BT','Futura ZBlk BT','FuturaBlack BT','Galliard BT','Geometr231 BT','Geometr231 Hv BT','Geometr231 Lt BT','GeoSlab 703 Lt BT','GeoSlab 703 XBd BT','GoudyHandtooled BT','GoudyOLSt BT','Humanst521 BT','Humanst 521 Cn BT','Humanst521 Lt BT ','Incised901 Bd BT ','Incised901 BT ','Incised901 Lt BT ','Informal011 BT ','Kabel Bk BT ','Kabel Ult BT ','Kaufmann Bd BT ','Kaufmann BT ','Korinna BT ','Lydian BT ','Monotype Corsiva','NewsGoth BT ','Onyx BT ','OzHandicraft BT','PosterBodoni BT','PTBarnum BT','Ribbon131 Bd BT','Serifa BT','Serifa Th BT','ShelleyVolante BT','Souvenir Lt BT','Swis721 BlkEx BT','Swiss911 XCm BT ','TypoUpright BT','ZapfEllipt BT','ZapfHumnst BT','ZapfHumnst Dm BT'];
    fontSelector.validFonts=untestedFonts.filter(font => detective.detect(font));

  },
  fontDetector:function(){
    /**
 * JavaScript code to detect available availability of a
 * particular font in a browser using JavaScript and CSS.
 *
 * Author : Lalit Patel
 * Website: http://www.lalit.org/lab/javascript-css-font-detect/
 * License: Apache Software License 2.0
 *          http://www.apache.org/licenses/LICENSE-2.0
 * Version: 0.15 (21 Sep 2009)
 *          Changed comparision font to default from sans-default-default,
 *          as in FF3.0 font of child element didnt fallback
 *          to parent element if the font is missing.
 * Version: 0.2 (04 Mar 2012)
 *          Comparing font against all the 3 generic font families ie,
 *          "monospace", "sans-serif" and "sans". If it doesn't match all 3
 *          then that font is 100% not available in the system
 * Version: 0.3 (24 Mar 2012)
 *          Replaced sans with serif in the list of baseFonts
 */

/**
 * Usage: d = new Detector();
 *        d.detect("font name");
 */
    // a font will be compared against all the three default fonts.
    // and if it doesn't match all 3 then that font is not available.
    var baseFonts = ["monospace", "sans-serif", "serif"];

    //we use m or w because these two characters take up the maximum width.
    // And we use a LLi so that the same matching fonts can get separated
    var testString = "mmmmmmmmmmlli";

    //we test using 72px font size, we may use any size. I guess larger the better.
    var testSize = "72px";

    var h = document.getElementsByTagName("body")[0];

    // create a SPAN in the document to get the width of the text we use to test
    var s = document.createElement("span");
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    var defaultWidth = {};
    var defaultHeight = {};
    for (var index in baseFonts) {
        //get the default width for the three base fonts
        s.style.fontFamily = baseFonts[index];
        h.appendChild(s);
        defaultWidth[baseFonts[index]] = s.offsetWidth; //width for the default font
        defaultHeight[baseFonts[index]] = s.offsetHeight; //height for the defualt font
        h.removeChild(s);
    }

    function detect(font) {
        var detected = false;
        for (var index in baseFonts) {
            s.style.fontFamily = font + ',' + baseFonts[index]; // name of the font along with the base font for fallback.
            h.appendChild(s);
            var matched = (s.offsetWidth != defaultWidth[baseFonts[index]] || s.offsetHeight != defaultHeight[baseFonts[index]]);
            h.removeChild(s);
            detected = detected || matched;
        }
        return detected;
    }

    this.detect = detect;
  },
}

const dragTypes={
  Default:{
    hasFinalMod:true,
    hasValue:true,
    hasImage:false,
    selectName:"Default",
    selectDescription:"The 'Default' Draggable comes with three sections.  A text section on the top for labelling purposes, a base value section that takes in a number and a final value section that displays the value of the draggable after any/all changes have been made to it.",
    spawnTemplate:"#defaultDrag",
  },
  ReceiveOnly:{
    hasFinalMod:true,
    hasValue:true,
    hasImage:false,
    selectName:"Receiver",
    selectDescription:"The 'Receiver' Draggable comes with two sections.  A text section on the top for labelling purposes, and a final value section.  This means that this draggable alwys has a base value of 0 but can be useful if you want to display a stat that is simply a factor of other stats such as displaying your ability score modifier which is only ever a function of your ability score.",
    spawnTemplate:"#receiveOnlyDrag",

  },
  BaseOnly:{
    hasFinalMod:false,
    hasValue:true,
    hasImage:false,
    selectName:"Base Only",
    selectDescription:"The 'Base Only' Draggable comes with two sections.  A text section on the top for labelling purposes, and a base value section.  This means that this draggable cannot draw from other stats.  For example you cannot target it with toggleable effects and you cannot have it increase/decrease in relation to say your strength modifier.  This draggable is useful for any stat that is never affected by outside sources such as a Proficiency modifier.",
    spawnTemplate:"#baseOnlyDrag",
  },
  SquareImage:{
    hasFinalMod:false,
    hasValue:false,
    hasImage:true,
    selectName:"Image",
    selectDescription:"The 'Image' Draggable allows you to place images on your sheet.  The image can be changed by clicking on the draggable and inputting a new image url in the detail section that will show up on the rightmost column",
    spawnTemplate:"#squareImage",
  },
  SkillBar:{
    hasFinalMod:true,
    hasValue:true,
    hasImage:false,
    selectName:"Skill Bar",
    selectDescription:"The 'Skillbar' Draggable has the same functionality as the default draggable, it's simply arranged ina  way that we feel is aesthetically more pleasing for displaying lists of things like skills.  You can, of course, use them for other reasons.",
    spawnTemplate:"#skillBarDrag",
  },
  TitleBox:{
    hasFinalMod:false,
    hasValue:false,
    hasImage:false,
    selectName:"Title Box",
    selectDescription:"The 'Title Box' Draggable just has a section for text, though only meant to hold a single line of it.  Use it to help keep notes, keep track of inventory, title sections of your sheet, or even to make a spellbook out of when combined with the description feature each draggable has.",
    spawnTemplate:"#textBoxDrag",
  },


}

const bonusTypes= {

    "Alchemical":{
      stackable:false,
      category:"General Purpose"
    },
    "Armor":{
      stackable:false,
      category:"Armor Class Specific"
    },
    "Circumstance":{
      stackable:true,
      category:"General Purpose"
    },
    "Competence":{
      stackable:false,
      category:"General Purpose"
    },
    "Deflection":{
      stackable:false,
      category:"Armor Class Specific"
    },
    "Dodge":{
      stackable:true,
      category:"Armor Class Specific"
    },
    "Enhancement":{
      stackable:false,
      category:"General Purpose"
    },
    "Inherent":{
      stackable:false,
      category:"Ability Score Specific"
    },
    "Insight":{
      stackable:false,
      category:"General Purpose"
    },
    "Luck":{
      stackable:false,
      category:"General Purpose"
    },
    "Morale":{
      stackable:false,
      category:"General Purpose"
    },
    "Natural_Armor":{
      stackable:false,
      category:"Armor Class Specific"
    },
    "Profane":{
      stackable:false,
      category:"General Purpose"
    },
    "Racial":{
      stackable:false,
      category:"General Purpose"
    },
    "Resistance":{
      stackable:false,
      category:"General Purpose"
    },
    "Sacred":{
      stackable:false,
      category:"General Purpose"
    },
    "Shield":{
      stackable:false,
      category:"Armor Class Specific"
    },
    "Size":{
      stackable:false,
      category:"General Purpose"
    },
    "Trait":{
      stackable:false,
      category:"General Purpose"
    },
    "Untyped":{
      stackable:true,
      category:"General Purpose"
    }

  }

const assets={
  "defaultToggle":"https://res.cloudinary.com/metaverse/image/upload/v1548787121/icons8-transition-both-directions-48.png"
}

let Data={
  saveData:()=>{

    userData.profiles[activeProfile.profileName]=activeProfile;

    localStorage.setItem('userData', JSON.stringify(userData));

    $("#saveButton").removeClass("shimmering");

  },
  loadData:()=>{

    userData=JSON.parse(localStorage.getItem("userData"));

    activeProfile=userData.profiles[userData.activeProfile];

  },
  saveJSON:()=>{
    ci.downloadJSON(activeProfile, "CharFile");
  },
  loadFromJSON:(event)=>{

    console.log(event.target.files);
    let fileList=event.target.files;
    let resultHTML="";


    Array.from(fileList).forEach((file, index)=>{
      let reader = new FileReader();


      reader.onload = function(e) {
       // The file's text will be printed here

       activeProfile=JSON.parse(reader.result);
       initialLoad();
     };
      reader.readAsText(file);



    });


  }
}

let activeProfile;
let savedProfiles;

function Draggable(info) {
  this.activeRules= info.activeRules!==undefined? info.activeRules:[];
  this.template=info.template!==undefined? info.template:"defaultDrag";
  this.drawsFrom=info.drawsFrom!==undefined? info.drawsFrom:[];
  this.finalAblScore=0;
  this.finalMod=0;
  ///
  this.height=info.height!==undefined? info.height:10;
  this.width=info.width!==undefined? info.width:15;
  this.left=info.left!==undefined? info.left:0;
  this.top=info.top!==undefined? info.top:0;
  ///
  this.id=info.id!==undefined? info.id:null;
  this.locked=false;
  this.title=info.title!==undefined? info.title:"No Title";
  this.page=info.page!==undefined? info.page:0;
  this.toggleEffects=info.toggleEffects!==undefined? info.toggleEffects:[];
  this.toggleLabel=info.toggleLabel!==undefined? info.toggleLabel:"Uncategorized";
  this.uiName=info.uiName!==undefined? info.uiName:"Unnamed";
  this.value=info.value!==undefined? info.value:0;
  this.imageURL=info.imageURL!==undefined? info.imageURL:"";
  this.description=info.description!==undefined? info.description:null;
  //
  this.isAblScore=info.isAblScore!==undefined? info.isAblScore:false;
  this.isClassSkill=info.isClassSkill!==undefined? info.isClassSkill:false;

  this.type=info.type!==undefined? info.type:"Default";
  this.fontSize=info.fontSize!==undefined? info.fontSize:1;
  this.fontFamily=info.fontFamily!==undefined? info.fontFamily:"initial";
  this.borderless=info.borderless!==undefined? info.borderless:false;
  this.unbacked=info.unbacked!==undefined? info.unbacked:false;
  this.hasHiddenText=info.hasHiddenText!==undefined? info.hasHiddenText:false;

}

function Toggle(info){
  this.bar= info.bar!==undefined? info.bar:0;
  this.description= info.description!==undefined? info.description:"";
  this.effects=[];
  this.icon=info.icon!==undefined? info.icon:assets.defaultToggle;
  this.id= info.id!==undefined? info.id:0;
  this.name= info.name!==undefined? info.name:"Unnamed Toggle";
  this.slotNum= info.slotNum!==undefined? info.slotNum:0;
  this.isActive=info.isActive!==undefined? info.isActive:false;
}

function ToggleEffect(info){
  this.targetDraggable=info.targetDraggable!==undefined? info.targetDraggable:null;
  this.effectType="Untyped";
  this.effectMod=0;
  this.parentID=info.parentID;
}

function ToggleBar(info){
  this.name=info.name!==undefined? info.name:"Unnamed ToggleBar";
  this.toggles=[];

}


function DrawNode(id){
  this.id=id;
  this.strength=1;
}

function Profile() {
  this.profileName="Default";
  this.activePage=0;
  this.activeToggleBar=0;
  this.pages=[[]]; // an array of arrays. each inner array is a page, each element in those arrays is a draggable
  this.pageIcons=[defaultIcon];
  this.pageBackings=[false];
  this.toggles=[new ToggleBar({})];


}


let ProfileFuncs={
  getNewID:()=>{
    let ids=[];
    let newID=0;
    let pages=activeProfile.pages;


    for (let i=0; i<pages.length; i++){
      for (let j=0; j<pages[i].length; j++){
        ids.push(parseInt(pages[i][j].id));
      }
    }
    ids.sort((a, b) => (a - b));

    for (let i=0;i<ids.length;i++){
      //we could also skip the sorting and check if the ids array contains i, but this is more performant with incredibly large amounts of draggables
      if (i!=ids[i]){
        newID=i;
        break;
      }
      if (i==ids.length-1){
        newID=i+1;
      }
    }
    return newID;
  },
  getToggleID:()=>{
    let ids=[];
    let newID=0;
    let pages=activeProfile.toggles;


    for (let i=0; i<pages.length; i++){
      for (let j=0; j<pages[i].toggles.length; j++){

        ids.push(parseInt(pages[i].toggles[j].id));


      }
    }
    ids.sort((a, b) => (a - b));

    for (let i=0;i<ids.length;i++){
      //we could also skip the sorting and check if the ids array contains i, but this is more performant with incredibly large amounts of draggables
      if (i!=ids[i]){
        newID=i;
        break;
      }
      if (i==ids.length-1){
        newID=i+1;
      }
    }
    return newID;
  }
}

// let sampleProfile= new Profile();

let userData;



function resetStorage(){
  if (window.confirm("Do you really want to delete all your saved info?")) {
  localStorage.clear();
  location.reload();
}
}


sheetProj.view.sheetLogic = {
  setupUserInterface: function () {

    fontSelector.getFontList();
    SheetGrid.fitToContainer();
    SheetGrid.createGrid();

    initialLoad();

    }
};

//////

function initialLoad(){
  toggleBar.loadBar();
  pageSelect.loadTray();
  DragPalette.loadOptions();
  SheetDrags.loadPage();
  $("#pageBackingInput").val(activeProfile.pageBackings[activeProfile.activePage]);
  $("#activeSheet").css("background-image", `url(${activeProfile.pageBackings[activeProfile.activePage]})`);
  SheetGrid.toggleGrid(false);
}

let DraggableFuncs={
  refreshDrag:(id)=>{
    $(`#draggable${id}`).remove();
    DraggableFuncs.spawn(ci.getDragByID(id));
  },

  spawn:(ledgerDrag)=>{


    let template, clone, newElem;
    let title, baseValue, finValue, hiddenText;
    let clickMethod;

    let typeInfo =dragTypes[ledgerDrag.type];

    template = document.querySelector(`${typeInfo.spawnTemplate}`);
    if (typeInfo.hasValue){
      clickMethod=DrawSys.drawTrigger;
    }



    clone=document.importNode(template.content, true);
    clone=clone.querySelector('.draggable');
    clone.id=`draggable${ledgerDrag.id}`;



    //Add to sheet
    $("#activeSheet").append(clone);
    newElem=document.getElementById(`draggable${ledgerDrag.id}`);
    setDrag(newElem);

    //Spacing
    newElem.style.top=ledgerDrag.top +"%";
    newElem.style.left=ledgerDrag.left +"%";
    newElem.style.height=ledgerDrag.height +"%";
    newElem.style.width=ledgerDrag.width +"%";

    //lock status
    if (ledgerDrag.locked){
      $(newElem).addClass("locked");
    }
    if (ledgerDrag.hasHiddenText){
      $(newElem).addClass("hasHiddenText");
    }
    //Aesthetics
    if (ledgerDrag.fontSize){
      $(newElem).css("font-size", `${ledgerDrag.fontSize}em`);
    }
    if (ledgerDrag.borderless){
      $(newElem).addClass("borderless");
    }
    if (ledgerDrag.unbacked){
      $(newElem).addClass("unbacked");
    }
    if (ledgerDrag.fontFamily){
      $(newElem).css("font-family", `${ledgerDrag.fontFamily}`);
    }
    //display info
    $(newElem).on("click", DraggableFuncs.displayInfo);
    //KEEP IN MIND
    //$(newElem).on("click", DrawSys.showRelations);
    $(newElem).on("click", clickMethod);
    //Set values + listen for changes
    newElem.setAttribute('data-ledger-id', ledgerDrag.id);
    title=$(newElem).find(".dragTitleInput")[0];
    baseValue=$(newElem).find(".baseModInput")[0];
    finValue=$(newElem).find(".finalMod")[0];
    hiddenText=$(newElem).find(".hiddenText")[0];

    if (title){
      $(title).val(ledgerDrag.title);
      $(title).change(()=>{DraggableFuncs.saveChanges(ledgerDrag.id, {"title":event.target.value})});
    }
    if (baseValue){
      $(baseValue).val(ledgerDrag.value);
      $(baseValue).change(()=>{DraggableFuncs.saveChanges(ledgerDrag.id, {"value":event.target.value})});
    }
    if (finValue){
      if (DrawSys.confirmedLoopless(ledgerDrag.id)){
        $(finValue).val(DrawSys.calcValue(ledgerDrag.id));
      }

    }
    if (hiddenText){

      $(hiddenText).html(ledgerDrag.description);


    }

    if (typeInfo.hasImage){
      $(newElem).find(".imageSegment").addBack().css("background-image", `url(${ledgerDrag.imageURL})`);

    }

  },
  refreshValues:()=>{

    let activeDrags=activeProfile.pages[activeProfile.activePage];
    let elem, finValue;

    activeDrags.forEach((drag)=>{
      if (dragTypes[drag.type].hasFinalMod){
        elem=document.getElementById(`draggable${drag.id}`);
        finValue=$(elem).find(".finalMod")[0];
        if (DrawSys.confirmedLoopless(drag.id)){
          $(finValue).val(DrawSys.calcValue(drag.id));
        }

      }else{

      }
    });

  },
  delete:(id, targetPage,massDelete)=>{

    let activePage;
    if (!targetPage){targetPage=activeProfile.activePage}
    activePage=activeProfile.pages[targetPage];
    id=parseInt(id);
    for (let i=0; i<activePage.length; i++){

      if (parseInt(activePage[i].id)==id){

        activePage.splice(i,1);
        removeReference();
        break;
      }
    }


    $("#draggableInfo").empty();

    if (!massDelete){
      SheetDrags.loadPage();
    }


    function removeReference(){
      let allToggles=ci.getAllToggles();
      //toggle effect refs
      allToggles.forEach((tog)=>{

        tog.effects=tog.effects.filter((effect)=>{

          return effect.targetDraggable!=id;
        });

      });

      //drawing refs
      for (let i=0; i<activeProfile.pages.length; i++){
        for (let j=0; j<activeProfile.pages[i].length; j++){


            activeProfile.pages[i][j].drawsFrom=activeProfile.pages[i][j].drawsFrom.filter((draw)=>{
              return draw.id!=id;
            });

        }
      }


    }
  },
  saveChanges:(id, changes)=>{
    let drag;
    let pages=activeProfile.pages;
    id=parseInt(`${id}`.replace("draggable",""));

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
      console.error("Tried to save  a draggable that does not exist " +id);

      return;
    }else{

      Object.keys(changes).forEach((key)=>{
        drag[key]=changes[key];
      });
    }

    if (ci.checkCommonGround(Object.keys(changes), ["value", "isAblScore", "isClassSkill"])){
      DraggableFuncs.refreshValues();
    }

    $("#saveButton").addClass("shimmering");

  },
  refreshImage:(id, newURL)=>{
    let imageElem=$(`#draggable${id}`);
    $(imageElem).find(".imageSegment").addBack().css("background-image", `url(${newURL})`);
  },
  displayInfo:(event)=>{


    let id=parseInt(event.currentTarget.id.replace("draggable",""));
    let activePage=activeProfile.pages[activeProfile.activePage];
    let drag, info;
    let valueSegment, imageSegment, fontSegment, fontOptions;

    for (let i=0; i<activePage.length; i++){
      if (parseInt(activePage[i].id)==id){
        drag=activePage[i];
        break;
      }
    }

    fontSelector.validFonts.forEach(function(font){
      fontOptions+=`<option ${drag.fontFamily==font? "selected":""} style="font-family:'${font}' "value="${font}">${font}</option>`;
    });

    if (!drag){
      console.error("Tried to display  a draggable that does not exist " +id);

      return;
    }else{
      valueSegment=`

      <div style="display:flex;">
      <label for="draggableUIName" style="font-size:1.5em; font-weight:bold; width:50%;">Drag Label:</label>
      <input id="draggableUIName" onchange="DraggableFuncs.saveChanges(${id}, {'uiName':event.target.value})" value="${drag.uiName}"><br>
      </div>
      <div style="display:flex;">
        <label for="draggableCategory" style="font-size:1.5em; font-weight:bold; width:50%;">Category:</label>
        <input id="draggableCategory" onchange="DraggableFuncs.saveChanges(${id}, {'toggleLabel':event.target.value})" value="${drag.toggleLabel}"><br>
      </div> <br>




      <input type="checkbox" id="ablScoreToggle" onchange="DraggableFuncs.saveChanges(${id}, {'isAblScore':event.target.checked})" ${drag.isAblScore? "checked":""}>
      <label for="ablScoreToggle">Is An Ability Score</label> <br>

      <input type="checkbox" id="classSkillToggle" onchange="DraggableFuncs.saveChanges(${id}, {'isClassSkill':event.target.checked})" ${drag.isClassSkill? "checked":""}>
      <label for="classSkillToggle">Is A Class Skill</label>
      <hr>
      `;

      imageSegment=`<label for="draggableImageURL" style="font-size:1.5em; font-weight:bold;">Image URL:</label>
      <input id="draggableUIName" onchange="DraggableFuncs.saveChanges(${id}, {'imageURL':event.target.value}); DraggableFuncs.refreshImage(${id}, event.target.value);" value="${drag.imageURL}"><hr>`;

      fontSegment=`
      <div style="display:flex">
        <label for="draggableFontSizer" style="font-size:1.5em; font-weight:bold; width:50%;">Font Size:</label>
        <input style="width:50%" type="number" step=".1" min="0" id="draggableFontSizer" onchange="DraggableFuncs.saveChanges(${id}, {'fontSize':event.target.value}); DraggableFuncs.refreshDrag(${id})" value="${drag.fontSize}">
      </div>

      <div style="display:flex">
        <label for="draggableFontFamily" style="font-size:1.5em; font-weight:bold; width:50%;">Font Family:</label>
        <select style="width:50%" id="draggableFontFamily" onchange="DraggableFuncs.saveChanges(${id}, {'fontFamily':event.target.value}); DraggableFuncs.refreshDrag(${id})">${fontOptions}</select>
      </div>


        <hr>
      `;

      info=`

      <button id="frontSortButton" class="iconButton" onclick="DraggableFuncs.changeDisplayOrder(${drag.id}, -1)"> To Front</button>
      <button id="backSortButton" class="iconButton" onclick="DraggableFuncs.changeDisplayOrder(${drag.id}, 0)"> To Back</button>
      <hr>



      ${dragTypes[drag.type].hasImage? imageSegment:""}

      <p><b>Draggable Description:</b></p>
      <input type="checkbox" id="hiddenTextToggle" onchange="DraggableFuncs.saveChanges(${id}, {'hasHiddenText':event.target.checked}); DraggableFuncs.refreshDrag(${id});" ${drag.hasHiddenText? "checked":""}>
      <label for="hiddenTextToggle">Show On Hover?</label>
      <div id="descriptionHolder">
        ${drag.description}
      </div> <hr>
      ${dragTypes[drag.type].hasValue? valueSegment:""}
      <input type="checkbox" id="borderlessToggle" onchange="DraggableFuncs.saveChanges(${id}, {'borderless':event.target.checked}); DraggableFuncs.refreshDrag(${id})" ${drag.borderless? "checked":""}>
      <label for="borderlessToggle">Make Borderless</label> <br>
      <input type="checkbox" id="unbackedToggle" onchange="DraggableFuncs.saveChanges(${id}, {'unbacked':event.target.checked}); DraggableFuncs.refreshDrag(${id})" ${drag.unbacked? "checked":""}>
      <label for="unbackedToggle">Remove Background</label> <br>

      ${!dragTypes[drag.type].hasImage? fontSegment:""}



      <div style="display:flex; justify-content:center;">
        <button onclick="DraggableFuncs.delete(${id})" style="background-color:darkred; color:white;">Delete</button>
      </div>`;


      $("#draggableInfo").html(info);
      $("#descriptionHolder").click(()=>{InfoBar.toggleDescription(drag)});
    }

  },
  changeDisplayOrder:(id, newPos)=>{
    let page=activeProfile.pages[activeProfile.activePage];

    let dragIndex;

    for (let i=0; i<page.length; i++){
      if (page[i].id==id){
        dragIndex=i;
        break;
      }
    }

    ci.array_move(page,dragIndex,newPos);
    SheetDrags.loadPage();

  },

}

let InfoBar={
  toggleDescription:(drag)=>{

    if ($("#draggableDescription").length!=0){

      return;
    }



    $("#descriptionHolder").html(`<textarea id="draggableDescription" onchange="InfoBar.revertDescriptionBox(${drag.id}); DraggableFuncs.refreshDrag(${drag.id})">${drag.description}</textarea>`);


  },
  revertDescriptionBox:(id)=>{
    DraggableFuncs.saveChanges(id, {'description':event.target.value});
    $("#descriptionHolder").html(event.target.value);},
  toggleInfoBar:()=>{

    if ($(event.currentTarget).hasClass("closed")){
      $(event.currentTarget).removeClass("closed");
      $(event.currentTarget).html(">>>>");
      $("#inspectCol").removeClass("collapsed");
    }else{
      $(event.currentTarget).addClass("closed");
      $(event.currentTarget).html("<<<<");
      $("#inspectCol").addClass("collapsed");
    }
  }
}

let DragPalette={
  createdDrag:{

  },
  loadOptions:()=>{
    let options=``;

   Object.keys(dragTypes).forEach((type)=>{
     options+=`<option ${type=="Default"? "selected":""} value="${type}">${dragTypes[type].selectName}</option>`;
   });

   $("#typeSelect").html(options);
   DragPalette.dragSelect("Default");
  },
  dragSelect:(type)=>{
    let dragInfo=dragTypes[type];
    DragPalette.createdDrag={type:type};
    $("#typeDescription").html(dragInfo.selectDescription);


  },
  createDraggable:()=>{
    let newID=ProfileFuncs.getNewID();
    let ledgerDrag=new Draggable({id:newID, type:DragPalette.createdDrag.type});
    activeProfile.pages[activeProfile.activePage].push(ledgerDrag);
    DraggableFuncs.spawn(ledgerDrag);
  },
  createDefault:()=>{

    let newID=ProfileFuncs.getNewID();
    let ledgerDrag=new Draggable({id:newID});

    activeProfile.pages[activeProfile.activePage].push(ledgerDrag);
    //an ID should be set at this point
    DraggableFuncs.spawn(ledgerDrag);



  }
}

//drag and drop functionality
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;


    if($(e.currentTarget).hasClass("locked")){
      return;
    }
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:

    if (checkIfOnEdge(e)){

      document.onmousemove = elementResize;
    }
    else{
      document.onmousemove = elementDrag;
    }

  }
  function elementResize(e){
    e = e || window.event;
    e.preventDefault();

    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:

    let rect = elmnt.getBoundingClientRect();
    let borders=elmnt.parentElement.getBoundingClientRect();

    if ((elmnt.offsetHeight - pos2)>0 && (rect.bottom - pos2)<=borders.bottom){
       elmnt.style.height = (elmnt.offsetHeight - pos2) + "px";
      //elmnt.style.height = ((elmnt.offsetHeight - pos2)/borders.height)*100 + "%";
    }
    if((elmnt.offsetWidth - pos1)>0 && (rect.right - pos1)<=borders.right){
       elmnt.style.width = (elmnt.offsetWidth - pos1) + "px";
      //elmnt.style.width = ((elmnt.offsetWidth - pos1)/borders.width)*100 + "%";
    }

  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:

    let rect = elmnt.getBoundingClientRect();
    let borders=elmnt.parentElement.getBoundingClientRect();
    let pxlValue;

    if ((rect.top - pos2)>=borders.top  &&  (rect.bottom - pos2)<=borders.bottom){
        // elmnt.style.top = (elmnt.offsetTop - pos2) + "px";

        pxlValue=((elmnt.offsetTop - pos2)/borders.height)*100;
        //pxlValue=SheetGrid.snapX(pxlValue);
        elmnt.style.top = pxlValue + "%";
    }

    if ((rect.left - pos1)>=borders.left  &&  (rect.right - pos1)<=borders.right){
      // elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

      pxlValue=((elmnt.offsetLeft - pos1)/borders.width)*100;
      //pxlValue=SheetGrid.snapY(pxlValue);
      elmnt.style.left = pxlValue + "%";
    }

  }

  function closeDragElement(e) {
    e = e || window.event;
    e.preventDefault();

    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:

    let rect = elmnt.getBoundingClientRect();
    let borders=elmnt.parentElement.getBoundingClientRect();
    let pxlValue;
    let changes={
      top:1,
      left:1,
      height:1,
      width:1,
    };

    //snap position
    if ((rect.top - pos2)>=borders.top  &&  (rect.bottom - pos2)<=borders.bottom){
        // elmnt.style.top = (elmnt.offsetTop - pos2) + "px";

        pxlValue=((elmnt.offsetTop - pos2)/borders.height)*100;
        pxlValue=SheetGrid.snapX(pxlValue);
        elmnt.style.top = pxlValue + "%";
        changes.top=pxlValue;
    }

    if ((rect.left - pos1)>=borders.left  &&  (rect.right - pos1)<=borders.right){
      // elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

      pxlValue=((elmnt.offsetLeft - pos1)/borders.width)*100;
      pxlValue=SheetGrid.snapY(pxlValue);
      elmnt.style.left = pxlValue + "%";
      changes.left=pxlValue;
    }
    //snap sizes
    if ((elmnt.offsetHeight - pos2)>0 && (rect.bottom - pos2)<=borders.bottom){
      // elmnt.style.height = (elmnt.offsetHeight - pos2) + "px";
      pxlValue=((elmnt.offsetHeight - pos2)/borders.height)*100;
      // pxlValue=SheetGrid.snapX(pxlValue);
      pxlValue=Math.max(SheetGrid.snapY(pxlValue), 100/SheetGrid.stats.rows);
      elmnt.style.height =  pxlValue+ "%";
      changes.height=pxlValue;
    }
    if((elmnt.offsetWidth - pos1)>0 && (rect.right - pos1)<=borders.right){
      // elmnt.style.width = (elmnt.offsetWidth - pos1) + "px";
      pxlValue=((elmnt.offsetWidth - pos1)/borders.width)*100;
      pxlValue=Math.max(SheetGrid.snapX(pxlValue), 100/SheetGrid.stats.cols);

      elmnt.style.width =  pxlValue+ "%";
      changes.width=pxlValue;
    }

    DraggableFuncs.saveChanges($(elmnt).attr('id'), changes);
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }

  function checkIfOnEdge(e){
    let rect = elmnt.getBoundingClientRect();
    let yMargin=rect.height*.25;
    let xMargin=rect.width*.25;

    if (Math.abs(rect.bottom-e.clientY)<=yMargin ||Math.abs(rect.right-e.clientX)<= xMargin){

      return true;
    }
    else{

      return false;
    }

  }

}

function setDrag(elem){

  dragElement(elem);
  $(elem).off("contextmenu", lockDraggable);
  $(elem).on("contextmenu",lockDraggable);
}

function lockDraggable(e){
  event.preventDefault();
  $(e.currentTarget).toggleClass("locked");

  DraggableFuncs.saveChanges($(e.currentTarget).attr('id'), {locked:$(e.currentTarget).hasClass("locked")});
}

////


let SheetDrags={
  loadPage:()=>{
    let drags= activeProfile.pages[activeProfile.activePage];
    SheetDrags.clearPage();

    drags.forEach((drag)=>{
      DraggableFuncs.spawn(drag);
    });
    DrawSys.reloadBubbles();
  },
  clearPage:()=>{
    $(".draggable").remove();
  }
}

let SheetGrid={
  stats:{
    cols:50,
    rows:50

  },
  fitToContainer:()=>{
    var canvas = document.getElementById("gridCanvas");
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    canvas.style.height='100%';
    // ...then set the internal size to match
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  },
  createGrid:()=>{

    var canvas = document.getElementById("gridCanvas");
    var ctx = canvas.getContext('2d');

    let w=canvas.width;
    let h=canvas.height;

    let cellWidth=w/SheetGrid.stats.cols;
    let cellHeight=h/SheetGrid.stats.rows;


    for (let x=0; x<w; x+=cellWidth){
      ctx.moveTo(x,0);
      ctx.lineTo(x, h);
    }

    for (let y=0; y<h; y+=cellHeight){
      ctx.moveTo(0,y);
      ctx.lineTo(w,y);
    }

    ctx.stroke();



  },
  toggleGrid:()=>{

    if (event.target.checked){

      $("#gridCanvas").removeClass("invisible");
    }else{
      $("#gridCanvas").addClass("invisible");
    }
  },

  snapX:(x)=>{
    let xSnap=100/SheetGrid.stats.cols;


    if (x%xSnap >xSnap/2){
      return Math.ceil(x/xSnap)*xSnap;
    }else{
      return Math.floor(x/xSnap)*xSnap;
    }


  },
  snapY:(y)=>{
    let ySnap=100/SheetGrid.stats.rows;


    if (y%ySnap >ySnap/2){

      return Math.ceil(y/ySnap)*ySnap;
    }else{

      return Math.floor(y/ySnap)*ySnap;
    }

  },


}

let DrawSys={

  state:{
    active:false,
    selected:null,

    reset:()=>{

      $("#drawBody").html(`<table style="width:100%">
        <tr>
          <td colspan=2 align="center"><button  onclick="DrawSys.toggleOverlay()">Toggle Relationship View</button></td>
        </tr>
      </table>`);
    }
  },
  toggleOverlay:()=>{
    //setDrag(child);
    let template;
    let clone;
    DrawSys.popBubbles();
    if ($("#overlay").length){
      //turn off
      DrawSys.state.active=false;
      DrawSys.state.selected=null;
      $("#overlay").remove();
      DrawSys.removeAllBorders();

    }else{
      //turn on


      template = document.querySelector('#overlayTemplate');


      clone=document.importNode(template.content, true);

      clone=clone.querySelector('#overlay');


      $("#workSpace").append(clone);
      DrawSys.bubbleReceptiveDivs();
      DrawSys.state.active=true;

    }

    $("#drawDisplay").toggleClass("bubbled");
    $(".pagePreview").toggleClass("bubbled");
    DrawSys.state.reset();

  },
  bubbleReceptiveDivs:()=>{
    let receptiveDivs=$(".finalMod").closest(".draggable");


    $.each(receptiveDivs, function( key, div ) {
      $(div).addClass("bubbled");
        });
  },
  bubbleSenderDivs:()=>{
    //
    //get all drags on page
    let senderDivs=$(".baseModInput").closest(".draggable");
    let receptiveDivs=$(".finalMod").closest(".draggable");

    $.each(receptiveDivs, function( key, div ) {
      $(div).addClass("bubbled");
        });
    $.each(senderDivs, function( key, div ) {
          $(div).addClass("bubbled");
            });
  },
  popBubbles:()=>{
    $(".bubbled").removeClass("bubbled");
  },
  drawTrigger:()=>{


    let id, drag, selected, drawArray;
    if (DrawSys.state.active==false || $(event.currentTarget).hasClass("bannedBorder")){return}

    id=event.currentTarget.getAttribute("data-ledger-id");
    drag=ci.getDragByID(id);

    //Select a receptive div
    selected=DrawSys.state.selected;
    if (selected){
      drawArray=[];
      selected.drawsFrom.forEach((draw)=>{
        drawArray.push(draw.id)
      });
    }

    if (!selected){
      DrawSys.state.selected=drag;
      DrawSys.addBorder("receiverBorder", id);
      drag.drawsFrom.forEach((source)=>{
        DrawSys.addBorder("sourceBorder", source.id);
      });
      DrawSys.banLoopers(id);
      DrawSys.showRelations(id);
      DrawSys.reloadBubbles();
    }else if(id==selected.id){
        //de-select current div
      DrawSys.state.selected=null;
      DrawSys.removeAllBorders();
      DrawSys.reloadBubbles();
      DrawSys.state.reset();
    }else if(!drawArray.includes(id)){
      //begin drawing from target


      selected.drawsFrom.push(new DrawNode(id));
      DrawSys.addBorder("sourceBorder", id);
      DraggableFuncs.refreshValues();
      DrawSys.showRelations(selected.id);
    }else{
      //stop drawing from  target
      selected.drawsFrom=selected.drawsFrom.filter((draw)=>{
        return parseInt(draw.id)!=parseInt(id);
      });
      DrawSys.removeBorder("sourceBorder", id);
      DraggableFuncs.refreshValues();
      DrawSys.showRelations(selected.id);
    }





  },
  reloadBubbles:()=>{
    //if state is inactive, don't bubble
    let drag=DrawSys.state.selected
    if (!DrawSys.state.active){return}
    $(".draggable").removeClass("bubbled");
    //if nothing selected, it's easy just bubble receptive divs
    if (drag){
      DrawSys.addBorder("receiverBorder", drag.id);
      $(`#draggable${drag.id}`).addClass("bubbled");
      drag.drawsFrom.forEach((source)=>{
        DrawSys.addBorder("sourceBorder", source.id);
      });

      DrawSys.bubbleSenderDivs();  //this will need to change when we add new divtypes that would be valid as receivers but not senders
      DrawSys.banLoopers(parseInt(drag.id));
    }else{
      DrawSys.bubbleReceptiveDivs();
    }

    //if something IS selected bubble everything it can receive from

  },
  ///BorderSec
  addBorder:(borderType, id)=>{
    $(`#draggable${id}`).addClass(borderType);

  },
  removeBorder:(borderType, id)=>{
    $(`#draggable${id}`).removeClass(borderType);
  },
  removeAllBorders:()=>{
    $(".sourceBorder").removeClass("sourceBorder");
    $(".receiverBorder").removeClass("receiverBorder");
    $(".bannedBorder").removeClass("bannedBorder");
  },
  ///DrawMathSec
  calcValue:(id)=>{
    //This is a recursive function.  We always check to make sure there will not be an infinite loop before starting it off
    let drag=ci.getDragByID(id);
    let value=parseInt(drag.value);
    let allToggles=ci.getAllToggles().filter((toggle)=>{
      return toggle.isActive;
    });

    if (!value){value=0}
    if (drag.isClassSkill && value>0){
      value+=3;
    }
    value+=parseInt(getDrawValue(drag.drawsFrom));
    ///RECURSIVE FUNC

    value+=getToggleValue();


    return value;

    function getDrawValue(drawArray){
      let total=0;
      let drawDrag;

        drawArray.forEach((draw)=>{
          drawDrag=ci.getDragByID(draw.id);
          if (drawDrag.isAblScore){
            total+=(-5)+Math.floor((DrawSys.calcValue(drawDrag.id)*draw.strength)/2);
          }else{
            total+=(DrawSys.calcValue(drawDrag.id)*draw.strength);
          }

        });





      return total;
    }

    function getToggleValue(){
      let targetedEffects=[];
      let buffObj={};
      let mod=0;
      //get effects
      allToggles.forEach((tog)=>{
        tog.effects.forEach((effect)=>{
          if (effect.targetDraggable==id){
            targetedEffects.push(effect);
          }
        });
      });

      //sort + compound effects
      targetedEffects.forEach((effect)=>{
        if (buffObj[effect.effectType]){
          if (bonusTypes[effect.effectType].stackable){
            buffObj[effect.effectType]+=parseInt(effect.effectMod);
          }else if(buffObj[effect.effectType]<parseInt(effect.effectMod)){
            buffObj[effect.effectType]=parseInt(effect.effectMod);
          }
        }else{
          buffObj[effect.effectType]=parseInt(effect.effectMod);
        }
      });

      //apply effects
      Object.keys(buffObj).forEach((buff)=>{
        mod+=buffObj[buff];
      });


      return mod;
    }


  },
  confirmedLoopless:(id, skipList, fauxChains)=>{


    let drag=ci.getDragByID(id);
    //add draw array to id

    let chains=drag.drawsFrom;
    if (!skipList){
      skipList=[parseInt(id)];
    }
    if (fauxChains){
      chains=chains.concat(fauxChains);

    }

    for (let i=0, len=chains.length; i<len; i++){
      let newChain=skipList.concat([parseInt(chains[i].id)]);

      if (hasDuplicates(newChain)){

        return false;
      }else if(!DrawSys.confirmedLoopless(parseInt(chains[i].id), newChain)){

        return false;
      }
    }


    if (hasDuplicates(skipList)){

      return false
    }else{
      return true;
    }





    function hasDuplicates(array) {

        return (new Set(array)).size !== array.length;
    }



  },
  banLoopers:(id)=>{
    let selected=ci.getDragByID(id);
    let drags=activeProfile.pages[activeProfile.activePage];
    drags.forEach((drag)=>{
      if (id!= drag.id && !DrawSys.confirmedLoopless(id, [parseInt(id)], [new DrawNode(drag.id)])){
        DrawSys.addBorder("bannedBorder", drag.id);
      }
    });


  },
  showRelations:(id)=>{
    let drawSlots=``;
    let drag=ci.getDragByID(id);
    let drawSources=drag.drawsFrom;
    drawSources.forEach((node)=>{
      let source=ci.getDragByID(node.id);
      drawSlots+=`<tr>
        <td>${source.uiName}</td><td><input id="drawSource${source.id}" type="number" step="any" onchange="DrawSys.changeDrawRatio(${id},${source.id})" value="${node.strength}"></td>
      </tr>`;
    });


    let drawHTML=
    `<table style="width:100%">
        <tr>
          <td colspan=2 align="center"><button onclick="DrawSys.toggleOverlay()">Toggle Relationship View</button></td>
        </tr>
        <tr>
          <th>Source Name</th><th>Relationship Strength</th>
        </tr>
        <tr>
          <td colspan=2><hr></td>
        </tr>
        ${drawSlots}
        <tr>
          <td colspan=2><hr></td>
        </tr>
    </table>`;

    $("#drawBody").html(drawHTML);
  },
  changeDrawRatio:(dragID, sourceID)=>{
    let drag=ci.getDragByID(dragID);
    for (let i=0; i<drag.drawsFrom.length; i++){
      if (drag.drawsFrom[i].id==sourceID){
        drag.drawsFrom[i].strength=event.target.value;
      }
    }
    DraggableFuncs.refreshValues();


  }
}

let toggleBar={
  toggleBody:function(){
    $("#toggleBarBody").toggleClass("noHeight");
  },
  drag:function(ev) {

    ev.dataTransfer.setData("text", ev.target.parentNode.id);
  },
  allowDrop:function(ev) {

    ev.preventDefault();
  },
  drop:function(ev, receiver) {

    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    let draggedToggle;
    let newSlot=receiver.getAttribute("data-toggle-slot-id");


    if (receiver.classList.contains("toggleSlot")){
      draggedToggle=document.getElementById(data);
      //ev.target.appendChild(elem);

      toggleBar.saveBarPosition(draggedToggle.getAttribute("data-toggle-id"), newSlot);
      //elem.setAttribute("data-toggle-id", newSlot);
    }
  },
  //------------
  loadBar:function(){

    let activeBar=activeProfile.toggles[activeProfile.activeToggleBar];
    $(".toggleSlot").empty();
    $("#ToggleTitle").val(activeBar.name);


    activeBar.toggles.forEach((currentToggle, index)=>{
      let newToggle;
      if (currentToggle){
        newToggle=`<label class="toggle ${currentToggle.isActive? "toggleSelected":""}" data-toggle-id="${currentToggle.id}" id="toggle${currentToggle.id}" style="width:100%; height:100%; position:relative;">
            <img class="toggleImg" src="${currentToggle.icon}" alt="some img" draggable="true" ondragstart="toggleBar.drag(event)">
            <img class="toggleSettings" src="https://res.cloudinary.com/metaverse/image/upload/v1547929282/icons8-settings-24.png" alt="settings" onClick="toggleBar.fetchSettings(${currentToggle.id})">
            <div class="toggleNameTag">${currentToggle.name}</div>
            <input id="toggleCheck${currentToggle.id}" onchange="toggleBar.toggle(${currentToggle.id})" style="height:15%; width:100%; visibility:hidden; position:absolute;" type="checkbox" ${currentToggle.isActive? "checked":""}>
        </label>`;

        $(`#toggleSlot${currentToggle.slotNum}`).html(newToggle);
      }

    });

    if (activeProfile.activeToggleBar+1 >= activeProfile.toggles.length){
      $("#toggleBarNextBtn").prop( "disabled", true );
      $("#toggleShuffleRightBtn").prop( "disabled", true );
    }
    else{
      $("#toggleBarNextBtn").prop( "disabled", false );
      $("#toggleShuffleRightBtn").prop( "disabled", false );
    }

    if(activeProfile.activeToggleBar<=0){
      $("#toggleBarPrevBtn").prop( "disabled", true );
      $("#toggleShuffleLeftBtn").prop( "disabled", true );
    }
    else{
      $("#toggleBarPrevBtn").prop( "disabled", false );
      $("#toggleShuffleLeftBtn").prop( "disabled", false );

    }

  },
  titleChange:function(newTitle){

    let activeBar=activeProfile.toggles[activeProfile.activeToggleBar];
    activeBar.name=newTitle;


  },
  saveBarPosition:function(toggleID, newPos){

    let bar=activeProfile.toggles[activeProfile.activeToggleBar];
    let toggle=ci.getToggleByID(toggleID);
    let oldPos=parseInt(toggle.slotNum);
    bar.toggles.forEach((tog)=>{
      if (tog.slotNum==newPos){
        tog.slotNum=oldPos;
      }
    })
    toggle.slotNum=newPos;
    toggleBar.loadBar();

  },

  changeBar:function(direction){
    activeProfile.activeToggleBar+=parseInt(direction);
    toggleBar.loadBar();
  },
  shuffleBar:function(direction){
    let toggleBars=activeProfile.toggles;
    let oldIndex=parseInt(activeProfile.activeToggleBar);
    let newIndex=oldIndex+parseInt(direction);


    if (newIndex>=toggleBars.length || newIndex<0){
      console.error("We shouldn't even be able to make this shuffleBar attempt...");
    }else{
      ci.array_move(toggleBars, oldIndex, newIndex);
      activeProfile.activeToggleBar=newIndex;
      toggleBar.loadBar();
    }



  },
  shuffleBarLeft:function(){
    let savedChars=JSON.parse(localStorage.getItem("savedChars"));
    let activeChar=JSON.parse(localStorage.getItem("activeChar"));
    let chara=savedChars[activeChar];
    let sheet=chara.charSheets[chara.activeSheet];
    let oldBarNum=chara.activeToggleBar;
    let newBarNum=chara.activeToggleBar-1;
    let sheetKeys=Object.keys(sheet.toggles);

    if(chara.activeToggleBar>0){
      chara.activeToggleBar--;
      sheetKeys.forEach(function(key){
        if (sheet.toggles[key].bar==newBarNum){
          sheet.toggles[key].bar=oldBarNum;
        }
        else if(sheet.toggles[key].bar==oldBarNum){
          sheet.toggles[key].bar=newBarNum;
        }
      });
      chara.toggleBarTitles=ci.arraySwap(chara.toggleBarTitles, oldBarNum, newBarNum);
    }
    localStorage.setItem("savedChars", JSON.stringify(savedChars));
    toggleBar.loadBar();
  },
  shuffleBarRight:function(){
    let savedChars=JSON.parse(localStorage.getItem("savedChars"));
    let activeChar=JSON.parse(localStorage.getItem("activeChar"));
    let chara=savedChars[activeChar];
    let sheet=chara.charSheets[chara.activeSheet];
    let oldBarNum=chara.activeToggleBar;
    let newBarNum=chara.activeToggleBar+1;
    let sheetKeys=Object.keys(sheet.toggles);

    if(chara.activeToggleBar+1<chara.totalToggleBars){
      chara.activeToggleBar++;
      sheetKeys.forEach(function(key){
        if (sheet.toggles[key].bar==newBarNum){
          sheet.toggles[key].bar=oldBarNum;
        }
        else if(sheet.toggles[key].bar==oldBarNum){
          sheet.toggles[key].bar=newBarNum;
        }
      });
      chara.toggleBarTitles=ci.arraySwap(chara.toggleBarTitles, oldBarNum, newBarNum);
    }
    localStorage.setItem("savedChars", JSON.stringify(savedChars));
    toggleBar.loadBar();
  },
  addBar:function(){

    activeProfile.toggles.push(new ToggleBar({}));
    toggleBar.loadBar();
    $("#saveButton").addClass("shimmering");
  },
  deleteBar:function(){

    if (activeProfile.toggles.length<=1){
      ci.fyiUser("You can't delete your only toggle bar!");

    }else{
      activeProfile.toggles.splice(activeProfile.activeToggleBar, 1);
      if (activeProfile.activeToggleBar>=activeProfile.toggles.length){
        activeProfile.activeToggleBar=activeProfile.toggles.length-1;
      }


    }
    DraggableFuncs.refreshValues();
    toggleBar.loadBar();
  },
  //------------
  toggle:function(toggleID){
    let toggle=ci.getToggleByID(toggleID);

    let togContainer=$(event.target).closest(".toggle")[0];



    if (event.target.checked){

      toggle.isActive=true;

    }
    else{

      toggle.isActive=false;
    }

    DraggableFuncs.refreshValues();
    $(togContainer).toggleClass("toggleSelected");

    $("#saveButton").addClass("shimmering");
    toggleBar.fetchSettings(toggleID);

  },
  applyEffects:function(toggleID, effectList){
    let savedChars=JSON.parse(localStorage.getItem("savedChars"));
    let activeChar=JSON.parse(localStorage.getItem("activeChar"));
    let chara=savedChars[activeChar];
    let sheet=chara.charSheets[chara.activeSheet];

    for (var i=0; i<effectList.length; i++){
      let effect=effectList[i];
      let drag=sheet.draggables[effect.targetDraggable];

      if (!drag){
        continue;
      }
      let dragEffects=drag.toggleEffects;
      if (!dragEffects.hasOwnProperty(toggleID)){
        dragEffects[toggleID]=[];
      }
      dragEffects[toggleID].push([effect.effectMod, effect.effectType]);
    }

    localStorage.setItem("savedChars",JSON.stringify(savedChars));
    $("#saveButton").addClass("shimmering");
  },
  removeEffects:function(toggleID, effectList){
    let savedChars=JSON.parse(localStorage.getItem("savedChars"));
    let activeChar=JSON.parse(localStorage.getItem("activeChar"));
    let chara=savedChars[activeChar];
    let sheet=chara.charSheets[chara.activeSheet];

    for (var i=0; i<effectList.length; i++){
      let effect=effectList[i];
      let drag=sheet.draggables[effect.targetDraggable];
      if (!drag){
        continue;
      }
      let dragEffects=drag.toggleEffects;
      delete dragEffects[toggleID];
    }
    localStorage.setItem("savedChars",JSON.stringify(savedChars));
    $("#saveButton").addClass("shimmering");
  },
  fetchSettings:function(toggleID){
    event.preventDefault();



    let toggle= ci.getToggleByID(toggleID);
    let toggleEffects="";
    let selectableDrags=getSelectableDrags();
    let newInfo;



    //TODO: This is STILL wildly inneficient.  We could just create the effect list once, use it for all effects, then have each effect simply select their target
    //also it should really just be a foreach
    for (let i=0; i<toggle.effects.length; i++){
      let effect=toggle.effects[i];
      let validTargets="";
      let genEffects="";
      let armorEffects="";
      let ablEffects="";
      let uncategorizedTargets="";
      Object.keys(selectableDrags).forEach((nameGroup)=>{
        let options="";
        selectableDrags[nameGroup].sort(function(a, b){return a.uiName.localeCompare(b.uiName)});

        selectableDrags[nameGroup].forEach((drag)=>{
          options+=`<option ${parseInt(effect.targetDraggable)===parseInt(drag.id)? "selected":""} value="${drag.id}">${drag.uiName}</option>`;
        });
        if (nameGroup=="Uncategorized"){
          uncategorizedTargets+=`
            <optgroup label="${nameGroup}">
              ${options}
            </outgroup>
          `;
        }else{
          validTargets+=`
            <optgroup label="${nameGroup}">
              ${options}
            </outgroup>
          `;
        }

      });

      Object.keys(bonusTypes).forEach((bonus)=>{
        switch (bonusTypes[bonus].category){
          case "General Purpose":
            genEffects+=`<option ${bonus==effect.effectType? "selected":""} value="${bonus}">${bonus}</option>`;
            break;

          case "Armor Class Specific":
            armorEffects+=`<option ${bonus==effect.effectType? "selected":""} value="${bonus}">${bonus}</option>`;
            break;

          case "Ability Score Specific":
            ablEffects+=`<option ${bonus==effect.effectType? "selected":""} value="${bonus}">${bonus}</option>`;
            break;

          default:
            genEffects+=`<option ${bonus==effect.effectType? "selected":""} value="${bonus}">${bonus}</option>`;
            console.error("error:  bonus type "+ bonus+ " did not fit into any category.  Setting to General Purpose.");
            break;
        }
      });

      toggleEffects+=`
        <div  class="effectContainer" style="position:relative">
          <img class="effectDeleter" src="https://res.cloudinary.com/metaverse/image/upload/v1548289539/icons8-delete-48.png" alt="deleteEffect" onclick="toggleBar.deleteEffect(${toggleID},${i})">
          <table  class="toggleEffectTable mt-2">

            <tr style="width:100%;">
              <td style="width:40%;">Draggable Modified:</td>
              <td style="width:60%;">
                  <select  onchange="toggleBar.saveEffectChanges(${toggleID}, ${i}, {'targetDraggable':event.target.value})" style="width:80%;">
                    <option value="" selected disabled hidden style="font-size:.5em">Select Target</option>
                    <optgroup label="Named Draggables">
                    </outgroup>
                    <optgroup label="___________">
                    </outgroup>
                    ${validTargets}
                    ${uncategorizedTargets}
                  </select>
              </td>
            </tr>
            <tr style="width:100%;">
              <td style="width:40%;">Modifier:</td>
              <td style="width:60%;"><input  onchange="toggleBar.saveEffectChanges(${toggleID}, ${i}, {'effectMod':event.target.value})" type="number" value="${effect.effectMod}" style="width:80%;"></td>
            </tr>
            <tr style="width:100%;">
              <td style="width:40%;">Modifier Type:</td>
              <td style="width:60%;">
                <select  onchange="toggleBar.saveEffectChanges(${toggleID}, ${i}, {'effectType':event.target.value})" style="width:80%">
                  <optgroup label="General Bonus Types">
                    ${genEffects}
                  </outgroup>
                  <optgroup label="Armor Specific Bonuses">
                    ${armorEffects}
                  </outgroup>
                  <optgroup label="Abl Score Specific Bonuses">
                    ${ablEffects}
                  </outgroup>
                </select>
              </td>
            </tr>
          </table>
        </div>`;
    }

    newInfo=`
    <label for="toggleName" style="font-size:1.5em; font-weight:bold;">Toggle Name:</label>
    <input id="toggleName" onchange="toggleBar.saveToggleChanges(${toggleID}, {'name':event.target.value})" value="${toggle.name}">
    <label for="toggleIcon" class=" mt-2" style="font-size:1.5em; font-weight:bold;">Toggle Icon:</label>
    <div class="container-fluid">
      <div class="row">
        <img class="col-2" src=${toggle.icon}>
        <input class="col-6" id="toggleIcon" onchange="toggleBar.saveToggleChanges(${toggleID}, {'icon':event.target.value})" value="${toggle.icon}">
      </div>
    </div>
    <label for="toggleDescription" style="font-weight:bold;" class="mt-2">Toggle Description:</label>
    <div id="descriptionHolder">
      ${toggle.description}
    </div>

    <p class="mt-2"><b>Effect List:<br></b></p>
    <div id="toggleEffects" class="mt-2">
    ${toggleEffects}
    </div>
    <button onclick="toggleBar.newEffect(${toggleID})" style="background-color:cyan" class="mt-4">Add a new Effect</button>
    <button onclick="toggleBar.deleteToggle(${toggleID})" style="background-color:red">Delete</button>`;

    $("#draggableInfo").html(newInfo);
    $("#descriptionHolder").click(()=>{toggleBar.toggleDescription(toggleID)});

    function getSelectableDrags(){

      let pages=activeProfile.pages;

      let selectObj={};
      let drag;
      pageLoop:
      for (let i=0; i<pages.length; i++){
      dragLoop:
        for (let j=0; j<pages[i].length; j++){

          drag=pages[i][j];
          if (drag.uiName && drag.uiName!="Unnamed" && dragTypes[drag.type].hasValue){

              if (!drag.toggleLabel){
                drag.toggleLabel="Uncategorized";
              }

              if (selectObj.hasOwnProperty(drag.toggleLabel)){
                selectObj[drag.toggleLabel].push(drag);
              }else{
                selectObj[drag.toggleLabel]=[drag];
              }

            }


        }
      }

      return selectObj;
    }
    $("#saveButton").addClass("shimmering");
  },
  ///
  saveToggleChanges:(id, changes)=>{
    let toggle;

    toggle=ci.getToggleByID(id);

      Object.keys(changes).forEach((key)=>{
        toggle[key]=changes[key];
      });


    if (Object.keys(changes).includes("isActive")){
      DraggableFuncs.refreshValues();
    }
    toggleBar.fetchSettings(id);
    toggleBar.loadBar();
    $("#saveButton").addClass("shimmering");
  },
  saveEffectChanges:(toggleID, effectIndex, changes)=>{
    let toggle, effect;


    toggle=ci.getToggleByID(toggleID);

    effect=toggle.effects[effectIndex];

      Object.keys(changes).forEach((key)=>{
        effect[key]=changes[key];
      });



    DraggableFuncs.refreshValues();
    $("#saveButton").addClass("shimmering");

  },
  changeName:function(newName){
    let savedChars=JSON.parse(localStorage.getItem("savedChars"));
    let activeChar=JSON.parse(localStorage.getItem("activeChar"));
    let chara=savedChars[activeChar];
    let sheet=chara.charSheets[chara.activeSheet];

    let selectedToggle= $("#selectedToggle")[0].value;



    sheet.toggles[selectedToggle].name=newName;
    localStorage.setItem("savedChars", JSON.stringify(savedChars));
    toggleBar.loadBar();
    $("#saveButton").addClass("shimmering");
  },
  changeDescription:function(event){
    let savedChars=JSON.parse(localStorage.getItem("savedChars"));
    let activeChar=JSON.parse(localStorage.getItem("activeChar"));
    let chara=savedChars[activeChar];
    let sheet=chara.charSheets[chara.activeSheet];

    let selectedToggle= $("#selectedToggle")[0].value;
    let newDescription=$(event.target).val();


    sheet.toggles[selectedToggle].description=newDescription;
    localStorage.setItem("savedChars", JSON.stringify(savedChars));
    $("#descriptionHolder").html(newDescription);
    $("#saveButton").addClass("shimmering");
  },
  toggleDescription:function(toggleID){



    let toggle=ci.getToggleByID(toggleID);

    $("#descriptionHolder").html(`<textarea id="toggleDescription" onchange="toggleBar.saveToggleChanges(${toggleID}, {'description':event.target.value})">${toggle.description}</textarea>`);
    $("#descriptionHolder").off();


  },
  changeTarget:function(event){
    let savedChars=JSON.parse(localStorage.getItem("savedChars"));
    let activeChar=JSON.parse(localStorage.getItem("activeChar"));
    let chara=savedChars[activeChar];
    let sheet=chara.charSheets[chara.activeSheet];

    let selectedToggle= $("#selectedToggle")[0].value;
    let selectedEffect=parseInt(event.target.id.replace('target',''));
    let newValue=parseInt(event.target.value);

    if(sheet.toggles[selectedToggle].status=="checked"){
      localStorage.setItem("savedChars", JSON.stringify(savedChars));
      toggleBar.removeEffects(selectedToggle,Object.values(sheet.toggles[selectedToggle].effects));
      savedChars=JSON.parse(localStorage.getItem("savedChars"));
      chara=savedChars[activeChar];
      sheet=chara.charSheets[chara.activeSheet];

      sheet.toggles[selectedToggle].effects[selectedEffect].targetDraggable=newValue;


      localStorage.setItem("savedChars", JSON.stringify(savedChars));
      toggleBar.applyEffects(selectedToggle,Object.values(sheet.toggles[selectedToggle].effects));
      savedChars=JSON.parse(localStorage.getItem("savedChars"));
      chara=savedChars[activeChar];
      sheet=chara.charSheets[chara.activeSheet];
    }
    else{
      sheet.toggles[selectedToggle].effects[selectedEffect].targetDraggable=newValue;
    }






    localStorage.setItem("savedChars", JSON.stringify(savedChars));
    updateFinalMods();
    $("#saveButton").addClass("shimmering");
  },

  newEffect:function(toggleID){

    let selectedToggle=ci.getToggleByID(toggleID);

    selectedToggle.effects.push(new ToggleEffect({parentID:toggleID}));

    toggleBar.fetchSettings(toggleID);
    $("#saveButton").addClass("shimmering");
  },
  deleteEffect:function(toggleID, effectIndex){

    let selectedToggle= ci.getToggleByID(toggleID);

    let oldEffect=selectedToggle.effects[effectIndex];
    let targetDraggable=null;
    if (oldEffect.targetDraggable!==null){
      targetDraggable=ci.getDragByID(oldEffect.targetDraggable);
      targetDraggable.toggleEffects=targetDraggable.toggleEffects.filter((effect)=>{
        return !effect==oldEffect;
      });
    }

    selectedToggle.effects.splice(effectIndex, 1);

    toggleBar.fetchSettings(toggleID);

    DraggableFuncs.refreshValues();
    $("#saveButton").addClass("shimmering");
  },
  deleteToggle:function(toggleID){

    let selectedToggle;
    let bars=activeProfile.toggles;
    toggleID=parseInt(toggleID);

    barLoop:
    for (let i=0; i<bars.length; i++){
      toggleLoop:
      for (let j=0; j<bars[i].toggles.length; j++){
        if (parseInt(bars[i].toggles[j].id)==toggleID){
          bars[i].toggles.splice(j,1);
          break barLoop;
        }

      }
    }

    $("#draggableInfo").html("");
    toggleBar.loadBar();
    DraggableFuncs.refreshValues();
    function removeReference(){
      for (let i=0; i<activeProfile.pages.length; i++){
        for (let j=0; j<activeProfile.pages[i].length; j++){


            activeProfile.pages[i][j].toggleEffects=activeProfile.pages[i][j].toggleEffects.filter((effect)=>{
              return parseInt(effect.parentID)!=toggleID;
            });

        }
      }
    }

    $("#saveButton").addClass("shimmering");
  },
  newToggle:function(){


    let toggleID=ProfileFuncs.getToggleID();

    let availableSlot=null;

    let barToggles=$(".toggleSlot");
    let activeBar;

    for (let key=0; key<barToggles.length; key++){
      if(barToggles[key].childElementCount==0){
        availableSlot=key;
        break;
      }
    }
    if (availableSlot ===null){
      alert("Current toggle bar is full!  Change toggle bars or clear out space before creating a new toggle!");
    }
    else{
      activeBar=activeProfile.toggles[activeProfile.activeToggleBar];
      activeBar.toggles.push(new Toggle({"id":toggleID, "slotNum":availableSlot}));

      toggleBar.loadBar();
    }
    $("#saveButton").addClass("shimmering");
  },
  resetToggle:function(toggleID){
    let savedChars=JSON.parse(localStorage.getItem("savedChars"));
    let activeChar=JSON.parse(localStorage.getItem("activeChar"));
    let chara=savedChars[activeChar];
    let sheet=chara.charSheets[chara.activeSheet];

    let toggle=sheet.toggles[toggleID];


    toggleBar.removeEffects(toggle.id,Object.values(toggle.effects));
    savedChars=JSON.parse(localStorage.getItem("savedChars"));
    toggleBar.applyEffects(toggle.id,Object.values(toggle.effects));
    savedChars=JSON.parse(localStorage.getItem("savedChars"));



    return savedChars;
  },



}

let pageSelect={
  loadTray:()=>{
    let pages=activeProfile.pages;
    let icons=activeProfile.pageIcons;

    let trayHTML="";
    console.log(pages);
    if (!pageIcons){
      pageIcons={};
      $.ajax({
          url : iconFolder,
          success: function (data) {

              $(data).find("a").attr("href", function (i, val) {

                  let path=iconFolder + val
                  if( val.match(/\.(jpe?g|png|gif)$/) ) {
                      //$("body").append( "<img src='"+  +"'>" );
                      pageIcons[val]=path;
                  }
              });
              pageSelect.loadTray();
          }
      });
    }
    else{
      for (let i=0; i<pages.length; i++){
        trayHTML+=`
        <div onclick="pageSelect.changePage(${i})" id="pagePreview${i}"
        class="pagePreview ${i==activeProfile.activePage? "selectedPreview":""}" style="background-image:url(${icons[i]})">
          <div class="previewPageNum previewPip">${i+1}</div>
          <div class="previewPageDelete previewPip" onclick="pageSelect.deletePage(${i})"></div>
          <div class="previewPageEdit previewPip" onclick="pageSelect.addIconDropdown('#pagePreview${i}', ${i})"></div>
          <div class="previewPageMove previewPip" onclick="pageSelect.movePage(${i})"></div>
        </div>`;

      }
      trayHTML+='<button onclick="pageSelect.addPage()">Add Page</button>';
      $("#pageSelector").html(trayHTML);

      if (DrawSys.state.active){
        $(".pagePreview").addClass("bubbled");
      }
    }
    console.log(pageIcons);

  },
  addPage:()=>{
    let pages=activeProfile.pages;
    let icons=activeProfile.pageIcons;
    let backings=activeProfile.pageBackings;
    pages.push([]);
    icons.push(pageIcons["dragonIcon.png"]);
    backings.push(false);
    pageSelect.loadTray();
    $("#saveButton").addClass("shimmering");
  },
  movePage:(index)=>{
    let pages=activeProfile.pages;
    let icons=activeProfile.pageIcons;
    let backings=activeProfile.pageBackings;
    let newIndex=(index+1)>=pages.length? 0:index+1;

    ci.array_move(pages, index, newIndex);
    ci.array_move(icons, index, newIndex);
    ci.array_move(backings, index, newIndex);
    activeProfile.activePage=newIndex;
    pageSelect.loadTray();
    //pageSelect.changePage(newIndex);
    $("#saveButton").addClass("shimmering");

  },
  changePage:(newIndex)=>{

    if (activeProfile.activePage==newIndex || $(event.target).hasClass("previewPageMove")){
      return;
    }else{
      activeProfile.activePage=parseInt(newIndex);
      pageSelect.loadTray();
      SheetDrags.loadPage();
      $("#draggableInfo").empty();
      $("#pageBackingInput").val(activeProfile.pageBackings[newIndex]);
      $("#activeSheet").css("background-image", `url(${activeProfile.pageBackings[newIndex]})`);
    }
  },
  changeBacking:(newBacking)=>{
    let pageIndex =activeProfile.activePage;
    activeProfile.pageBackings[pageIndex]=newBacking;
    $("#activeSheet").css("background-image", `url(${newBacking})`);
      $("#saveButton").addClass("shimmering");
  },
  deletePage:(pageIndex)=>{
    let page=activeProfile.pages[pageIndex];
    event.stopPropagation();

    if (activeProfile.pages.length<=1){
      ci.fyiUser("You can't delete your last page!");
      return;
    }
    if (!window.confirm("Do you really want to delete this page?")) {
      return;
    }

    page.forEach((drag)=>{

      DraggableFuncs.delete(drag.id, pageIndex,true);
    });


    activeProfile.pages.splice(pageIndex, 1);
    activeProfile.pageIcons.splice(pageIndex, 1);
    activeProfile.pageBackings.splice(pageIndex, 1);

    if (activeProfile.activePage==pageIndex || activeProfile.activePage>=activeProfile.pages.length){
      if (activeProfile.activePage>=activeProfile.pages.length){
        activeProfile.activePage=(activeProfile.pages.length-1);
      }
      SheetDrags.loadPage();
    }else{
      DraggableFuncs.refreshValues();
    }

    pageSelect.loadTray();
    $("#saveButton").addClass("shimmering");
  },
  addIconDropdown:(previewID, pageIndex)=>{
    let iconSet=`<div class="closeIcon" onclick="pageSelect.removeIconDropdown()"></div>`;
    event.stopPropagation();
    Object.keys(pageIcons).forEach((key)=>{
      iconSet+=`<div class="selectableIcon" style="background-image:url('${pageIcons[key]}')" onclick="pageSelect.changePreviewIcon(${pageIndex}, '${pageIcons[key]}')"></div>`;
    });

    $(previewID).append(`<div class="iconSelectContainer">${iconSet}</div>`);
    $('body').click(pageSelect.removeIconDropdown);
  },
  changePreviewIcon:(pageIndex, newIcon)=>{
    event.stopPropagation();
    activeProfile.pageIcons[pageIndex]=newIcon;
    pageSelect.loadTray();
    $("#saveButton").addClass("shimmering");
  },
  removeIconDropdown:()=>{
    event.stopPropagation();
    $(".iconSelectContainer").remove();
    $('body').off('click', pageSelect.removeIconDropdown);
  },
  toggleColumn:()=>{

    if ($(event.currentTarget).hasClass("closed")){
      $(event.currentTarget).removeClass("closed");
      $(event.currentTarget).html("<<<<");
      $("#toggleCol").removeClass("collapsed");
    }else{
      $(event.currentTarget).addClass("closed");
      $(event.currentTarget).html(">>>>");
      $("#toggleCol").addClass("collapsed");
    }
  }
}

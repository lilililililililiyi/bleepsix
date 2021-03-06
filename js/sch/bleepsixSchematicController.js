/*

    Copyright (C) 2013 Abram Connelly

    This file is part of bleepsix v2.

    bleepsix is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    bleepsix is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with bleepsix.  If not, see <http://www.gnu.org/licenses/>.

    Parts based on bleepsix v1. BSD license
    by Rama Hoetzlein and Abram Connelly.

*/

var schControllerHeadless = false;
if ( typeof module !== 'undefined')
{
  schControllerHeadless = true;
  var bleepsixSchematic = require("./bleepsixSchematicNode.js");
  var bleepsixBoard = require("../brd/bleepsixBoardNode.js");
  var bleepsixSchBrdOp = require("../lib/bleepsixSchBrdOp.js");
  var bleepsixAux = require("../lib/meowaux.js");

  var guid = bleepsixAux.guid;
  var s4 = bleepsixAux.s4;

  var g_schnetwork = null;
}

function bleepsixSchematicController( viewMode ) {

  this.viewMode = ( (typeof viewMode == 'undefined') ? false : viewMode );

  this.canvas = null;
  this.context = null;

  this.type = "schematic";

  // classes controlled
  this.toolKit = null;
  this.toolLibrary = null;
  //this.palette = null;

  this.focus_flag = false;
  this.focus = null;

  this.schematic = new bleepsixSchematic();
  this.board = new bleepsixBoard();

  /*
  // Global index.  Will be updated by communcation back to central DB. 
  // Initially set to -1 to indicate we don't know what the absolute index is.
  //
  this.opHistoryIndex = -1;  

  // local parameters for unde/redo history.
  //
  this.opHistoryStart = 0;
  this.opHistoryEnd = -1;

  this.opHistory = [];
  */
  this.op = new bleepsixSchBrdOp( this.schematic, this.board );

  //this.palette = new guiPalette();

  this.mouse_left_down = false;
  this.mouse_center_down = false;
  this.mouse_right_down = false;

  this.mouse_start_x = 0;
  this.mouse_start_y = 0;
  this.mouse_cur_x = 0;
  this.mouse_cur_y = 0;

  this.width = 1200;
  this.height = 700;

  this.queued_display_component = 0;

  if (!schControllerHeadless)
  {
    this.tool = new toolNav ( undefined, undefined, this.viewMode );
    this.tabCommunication = new bleepsixTabCommunication();
  }


  this.opHistoryStart = 0;
  this.opHistoryN = 0;
  this.opHistory = [];

  
  this.moving = false;
  this.movingLibrary = false;
  this.movingToolbox = false;
  this.movingGrid = false;
  this.movingAction = false;

  this.movingDebug = false;

  this.capState = "unknown";

  this.display_text_flag = true;
  this.display_text = "bleep";

  this.schematicUpdate = false;

  this.project_name_text_flag = true;
  this.project_name_text = "no name";

  var d = new Date();
  var curt = d.getTime();

  this.action_text_flag = true;
  this.action_text = "init";
  this.action_text_fade  = { sustainDur : 1500, dropoffDur : 500, T : 0, lastT: curt };

  this.drawSnapArea = false;
}

//--------------------------

bleepsixSchematicController.prototype._opDebugPrint = function ( )
{
  console.log("DEBUG: g_schematic_controller.schematic.ref_lookup");
  console.log( "  opHistoryIndex: " + this.opHistoryIndex );
  console.log( "  opHistoryStart: " + this.opHistoryStart );
  console.log( "  opHistoryN: " + this.opHistoryN );
  console.log( "  opHistory.length: " + this.opHistory.length);
  console.log( this.opHistory );

}

bleepsixSchematicController.prototype.opHistoryUpdate = function ( msg )
{
  //var inverseFlag = ( (typeof msg.inverseFlag === "undefined") ? false : msg.inverseFlag );
  var replayFlag = ( (typeof msg.replayFlag === "undefined") ? false : msg.replayFlag );

  if (!replayFlag)
  {
    var n = this.opHistoryN;
    var hist = this.opHistory;
    if ( n < hist.length ) { hist[n] = msg; }
    else                   { hist.push( msg ); }

    this.opHistoryN++;
    this.opHistory = hist.slice(0,this.opHistoryN);
  }

}


bleepsixSchematicController.prototype.opUndo = function ( )
{
  //this.op.opUndo();

  if ( this.opHistoryN > 0 )
  {

    var ind = this.opHistoryN-1;

    var start_group_id = this.opHistory[ ind ].groupId ;
    while ( ( this.opHistoryN > 0 ) &&
            ( this.opHistory[ ind ].groupId == start_group_id ) )
    {

      var op = this.opHistory[ind];

      if ( ("type" in op) && (op["type"] == "batch") )
      {
        var batch_op = op;
        var ops = batch_op["ops"];

        for (var i=0; i<ops.length; i++)
        {
          ops[i].inverseFlag = true;
          ops[i].replayFlag = true;
          //this.op.opCommand( ops[i], true, true );
          this.op.opCommand( ops[i] );
        }

        if ( batch_op.scope == "network" )
        {

          for (var i=0; i<ops.length; i++)
          {
            ops[i].inverseFlag = true;
            ops[i].replayFlag = true;
            g_schnetwork.projectop( ops[i] );
          }

        }

      }
      else
      {

        //this.opCommand( this.opHistory[ ind ], true, true );
        op.inverseFlag = true;
        op.replayFlag = true;

        //this.op.opCommand( op, true, true );
        this.op.opCommand( op );
        if ( op.scope == "network" )
        {
          g_schnetwork.projectop( op );
        }

      }

      this.opHistoryN--;
      ind = this.opHistoryN-1;

    }

  }
  else
  {
    console.log("bleepsixSchematicController.opUndo: already at first element, can't undo any further");
  }

  this.schematicUpdate = true;
  g_painter.dirty_flag = true;
}

bleepsixSchematicController.prototype.opRedo = function ( )
{

  if ( this.opHistoryN < this.opHistory.length )
  {

    var ind = this.opHistoryN;

    var start_group_id = this.opHistory[ ind ].groupId ;

    while ( ( this.opHistoryN < this.opHistory.length ) &&
            ( this.opHistory[ ind ].groupId == start_group_id ) )
    {

      var op = this.opHistory[ind];

      if ( ("type" in op) && (op["type"] == "batch") )
      {
        var batch_op = op;
        var ops = batch_op["ops"];

        for (var i=0; i<ops.length; i++)
        {
          ops[i].inverseFlag = false;
          ops[i].replayFlag = true;
          this.op.opCommand( ops[i] );
        }

        if ( batch_op.scope == "network" )
        {

          for (var i=0; i<ops.length; i++)
          {
            ops[i].inverseFlag = false;
            ops[i].replayFlag = true;
            g_schnetwork.projectop( ops[i] );
          }

        }

      }
      else
      {
        op.inverseFlag = false;
        op.replayFlag = true;

        this.op.opCommand( op );
        if ( op.scope == "network" )
        {
          g_schnetwork.projectop( op );
        }

      }

      this.opHistoryN++;
      ind = this.opHistoryN;
    }

  }
  else
  {
    console.log("bleepsixSchematicController.opRedo: already at last element, can't redo any further");
  }

  this.schematicUpdate = true;
  g_painter.dirty_flag = true;
}


bleepsixSchematicController.prototype.opCommand = function ( msg )
{
  var inverseFlag = ( (typeof msg.inverseFlag === "undefined") ? false : msg.inverseFlag );
  var replayFlag = ( (typeof msg.replayFlag === "undefined") ? false : msg.replayFlag );
  var group_id = ( (typeof msg.groupId === 'undefined') ? String(guid()) : msg.groupId );

  var delComponentList = [];
  if ((msg.action == "delete") && (msg.type == "group"))
  {

    for (var ind in msg.id)
    {
      var sch_ele_ref = this.schematic.refLookup( msg.id[ind] );
      if (sch_ele_ref.type != "component") continue;
      delComponentList.push( { id: msg.id[ind], type: sch_ele_ref.type } );
    }

  }

  // We need an identifier to group the messages together so we can
  // undo it if necessary.
  //
  msg.groupId = group_id;
  msg.inverseFlag = false;
  msg.replayFlag = false;


  this.op.opCommand( msg );
  this.schematicUpdate = true;

  if (!schControllerHeadless)
    g_painter.dirty_flag = true;

  if (!("scope" in msg))
    msg.scope = "network";

  if (g_schnetwork && (msg.scope == "network") )
  {
    g_schnetwork.projectop( msg );
  }

  this.opHistoryUpdate( msg );


  // If we've added a component, we need to add an 'unknown'
  // footprint to the board side
  //
  if ( (msg.action == "add") && (msg.type == "componentData") )
  {

    var comp_ref = this.schematic.refLookup( msg.id );

    if ( (!comp_ref.reference.match( /^#PWR/ )) &&
         (!comp_ref.reference.match( /^#FLG/ )) )
    {

      var mod_x=0, mod_y=0;
      if ("x" in comp_ref) { mod_x = comp_ref.x; }
      if ("y" in comp_ref) { mod_y = comp_ref.y; }

      var module = 
        this.board.makeUnknownModule( 1000, 
                                      comp_ref.id, 
                                      [ comp_ref.text[0].id, comp_ref.text[1].id ] );
      module.text[0].text = comp_ref.text[0].text;
      module.text[0].visible = comp_ref.text[0].visible;

      module.text[1].text = comp_ref.text[1].text;
      module.text[1].visible = comp_ref.text[1].visible;

      var brdop = { source: "sch", destination: "brd" };
      brdop.scope = msg.scope;
      brdop.action = msg.action;
      brdop.type = "footprintData";
      brdop.data = { footprintData: module , x: mod_x, y: mod_y };
      brdop.id = comp_ref.id;
      brdop.idText = [ comp_ref.text[0].id, comp_ref.text[1].id ] ;
      brdop.groupId = group_id;
      brdop.inverseFlag = false;
      brdop.replayFlag = false;
      this.op.opCommand( brdop );


      if ( g_schnetwork && (msg.scope == "network") )
      {
        g_schnetwork.projectop( brdop );
      }

      this.opHistoryUpdate( brdop );

    }

  }

  // We change the reference or name, we should propagate it through
  // to the board side.
  //
  else if ((msg.action == "update") && (msg.type == "edit"))
  {
    var sch_ref = this.schematic.refLookup( msg.id );
    var old_brd_ref = this.board.refLookup( msg.id );
    var old_copy = simplecopy( old_brd_ref );
    var new_copy = simplecopy( old_brd_ref );

    if ( ("text" in new_copy) && ("text" in sch_ref) )
    {

      if ( (0 in new_copy.text) && (0 in sch_ref.text) )
      {
        new_copy.text[0].text = sch_ref.text[0].text;
      }

      if ( (1 in new_copy.text) && (1 in sch_ref.text) )
      {
        new_copy.text[1].text = sch_ref.text[1].text;
      }

      var updateop = { source: "sch", destination: "brd" };
      updateop.scope = msg.scope;
      updateop.action = msg.action;
      updateop.type = "edit";

      updateop.id = [ msg.id ];
      updateop.data = { element : [ new_copy ], oldElement: [ old_copy ] };

      updateop.groupId = group_id;
      updateop.inverseFlag = false;
      updateop.replayFlag = false;
      this.op.opCommand( updateop );

      if ( g_schnetwork && (msg.scope == "network") )
        g_schnetwork.projectop( updateop );

    }

  }

  // Delete the component -> delete the footprint
  //
  else if ((msg.action == "delete") && (msg.type == "group"))
  {

    var brdop = { source: "sch", destination: "brd" };
    brdop.scope = msg.scope;
    brdop.action = msg.action;
    brdop.type = "group";
    brdop.groupId = group_id;
    brdop.inverseFlag = false;
    brdop.replayFlag = false;
    brdop.id = [];
    brdop.data = { element : [] }

    for ( var ind in delComponentList )
    {
      brdop.id.push( delComponentList[ind].id );
      var clonedData = simplecopy( this.board.refLookup( delComponentList[ind].id ) );
      brdop.data.element.push( clonedData );
    }

    if (brdop.id.length > 0)
    {
      this.op.opCommand( brdop );
      if ( g_schnetwork && (msg.scope == "network") )
        g_schnetwork.projectop( brdop );

      this.opHistoryUpdate( brdop );
    }


  }

  // After all udpates and delete, propagate the net information .
  // Order is important as the board needs to have it's sister
  // schematic updated with the netmap.
  //

  //this.schematic.constructNet();
  //var sch_net_code_map = this.schematic.getPinNetMap();

  var net_op = { source: "sch", destination: "sch" };
  net_op.action = "update";
  net_op.type = "net";
  net_op.groupId = group_id;
  net_op.inverseFlag = false;
  net_op.replayFlag = false;
  //net_op.data = sch_net_code_map;
  this.op.opCommand( net_op );


  var brd_net_op = { source: "sch", destination: "brd" };
  brd_net_op.action = "update";
  brd_net_op.type = "schematicnetmap";
  brd_net_op.groupId = group_id;
  brd_net_op.inverseFlag = false;
  brd_net_op.replayFlag = false;
  this.op.opCommand( brd_net_op );


  if (g_schnetwork && (msg.scope == "network") )
  {
    g_schnetwork.projectop( net_op );
    g_schnetwork.projectop( brd_net_op );
  }

  var batch_op = { "type" : "batch", "ops" : [ net_op, brd_net_op ], "groupId" : group_id, "scope" : msg.scope  };
  this.opHistoryUpdate( batch_op );

}


//--------------------------------------

bleepsixSchematicController.prototype.highlightBoardNetsFromSchematic = function ( sch_ncs )
{
  var sch = this.schematic.kicad_sch_json.element;
  var msg = "";

  for (var ii in sch_ncs )
  {
    var sch_nc = sch_ncs[ii];
    if (sch_nc==0) continue;
    if (msg.length > 0) msg += ".";
    msg += sch_nc.toString();
  }

  if (!this.viewMode)
  {
    if ( msg.length > 0 )
      this.tabCommunication.addMessage( "brd:" + g_schnetwork.projectId, msg );
    else
      this.tabCommunication.addMessage( "brd:" + g_schnetwork.projectId, "" );
  }

}


//--------------------------------------



bleepsixSchematicController.prototype.fadeMessage = function ( msg )
{
  var d = new Date();
  var curt = d.getTime();

  this.action_text = msg;
  this.action_text_fade.T = 0;
  this.action_text_fade.lastT = curt;
}

bleepsixSchematicController.prototype.redraw = function ()
{
  var action_text_touched = false;
  var action_text_val = 0.0;

  var at_s = 0.4;

  if ( g_schnetwork )
  {
    if ( g_schnetwork.projectId )
    {
      //this.tabCommunication.setId( "sch:" + g_schnetwork.projectId );
      var channelName = "sch:" + g_schnetwork.projectId;

      if (this.tabCommunication.hasNewMessage( channelName ))
      {
        var msg = this.tabCommunication.processMessage( channelName );
        var ele = msg.split('.');
        var primary = [], secondary = [];
        for (var ind in ele)
        {
          var f = ele[ind].split(";");

          if (f.length>1)
          {
            if      (f[0] == "h") { primary.push( f[1] ); }
            else if (f[0] == "s") { secondary.push( f[1] ); }
          }
          else
          {
            primary.push(f[0]);
          }

        }

        if (msg.length > 0)
        {
          this.schematic.highlightNet( primary, secondary );
        }
        else
        {
          this.schematic.unhighlightNet();
        }

        g_painter.dirty_flag = true;
      }
    }
  }


  if (this.action_text_flag)
  {
    if ( this.action_text_fade.T < this.action_text_fade.sustainDur ) 
    {
      action_text_val = at_s ;
      action_text_touched = true;
    }
    else if (this.action_text_fade.T < ( this.action_text_fade.sustainDur + this.action_text_fade.dropoffDur) )
    {
      var t = this.action_text_fade.sustainDur + this.action_text_fade.dropoffDur - this.action_text_fade.T;
      action_text_val = at_s * t / this.action_text_fade.dropoffDur;
      action_text_touched = true;
    }
    else
      action_text_touched = false;

    if (action_text_touched)
    {
      g_painter.dirty_flag = true;
      var d = new Date();
      var curt = d.getTime();
      var dt = curt - this.action_text_fade.lastT;
      this.action_text_fade.T += dt;
      this.action_text_fade.lastT = curt;
    }

  }


  if ( g_painter.dirty_flag )
  {
    g_painter.startDraw();
    g_painter.drawGrid();

    if (this.schematic.displayable)
      this.schematic.drawSchematic ();

    this.tool.drawOverlay();

    g_painter.endDraw ();
	
    g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

    if (!this.viewMode)
    {
      this.guiPalette.drawChildren();

      this.guiToolbox.drawChildren();
      this.guiLibrary.drawChildren();

      this.guiUndoRedo.drawChildren();
    }

    this.guiGrid.drawChildren();

    g_painter.context.setTransform ( 1, 0, 0,  1, 0, 0 );

    if (this.display_text_flag)
    {
      //g_painter.drawText(this.display_text, 10, 680, "rgba(0,0,0,0.4)", 15);
      var _height = this.height-20;
      g_painter.drawText(this.display_text, 10, _height, "rgba(0,0,0,0.4)", 15);
    }

    if (this.project_name_text_flag)
      g_painter.drawText(this.project_name_text, 30, 10, "rgba(0,0,0,0.4)", 15);


    if (action_text_touched)
    {
      //g_painter.drawText(this.action_text, 10, 650, "rgba(0,0,0," + action_text_val + ")", 15);
      var _height = this.height - 50;
      g_painter.drawText(this.action_text, 10, _height, "rgba(0,0,0," + action_text_val + ")", 15);
    }

    g_painter.dirty_flag = false;

    g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

    if (this.drawSnapArea)
    {
      var lw = 5;
      var ww = 900 + 2*lw;
      var hh = 525 + 2*lw;
      var xx = 50 - lw;
      var yy = 50 - lw;

      g_painter.drawRectangle( xx, yy, ww, hh, lw, "rgba(0,0,0,0.2)", false );
    }


  }

}

/*
function relMouseCoords(ev)
{
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  }
  while (currentElement = currentElement.offsetParent);

  canvasX = ev.pageX - totalOffsetX;
  canvasY = ev.pageY - totalOffsetY;

  return { x : canvasX, y : canvasY };
}

HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
*/

bleepsixSchematicController.prototype.canvas_coords_from_global = function( x, y ) 
{
  var rect = this.canvas.getBoundingClientRect();
  var rl = rect.left;
  var rt = rect.top;

  var scrollx = window.scrollX;
  var scrolly = window.scrollY;

  return [ x - rl - scrollx, y - rt - scrolly ];
}

bleepsixSchematicController.prototype.mouseEnter = function( x, y ) {
  console.log(">> controller mouse enter");
}

bleepsixSchematicController.prototype.mouseLeave = function( x, y ) {
  console.log(">> controller mouse leave");
}

bleepsixSchematicController.prototype.resize = function( w, h, ev ) 
{
  this.guiLibrary.move( g_painter.width - this.guiLibrary.width, 0 );

  //this.guiPalette.move( g_painter.height - this.guiPalette.height, 500 );

  this.guiPalette.move( (g_painter.width - this.guiPalette.width)/4, 
                         g_painter.height - this.guiPalette.height );

  this.guiUndoRedo.move( g_painter.width - this.guiLibrary.width - this.guiUndoRedo.width,
                         g_painter.height - this.guiUndoRedo.height );

  g_painter.dirty_flag = true;

  this.width = w;
  this.height = h;
}


bleepsixSchematicController.prototype.keyDown = function( keycode, ch, ev )
{
  if ( ch == 'G' ) {      
      //this.moving = !this.moving;
  }
  else if (ch == 'O')
  {
    //this.movingLibrary = !this.movingLibrary;
  }
  else if (ch == 'P')
  {
    //this.movingToolbox = !this.movingToolbox;
  }
  else if (ch == 'I')
  {
    //this.movingGrid = !this.movingGrid;
  }
  else if (ch == 'U')
  {
    //this.movingAction = !this.movingAction;
  }
  else if (ch == 'Y')
  {
    //this.movingDebug = !this.movingDebug;
  }

  /*
  else if (ch == '9')
  {
    console.log("adding 'R' component to palette");

    var guicomp = new guiPaletteComponent( "test", "R" );
    this.guiPalette.addChild( guicomp );

    g_painter.dirty_flag = true;
  }
  */

  var r = true;

  if (!this.focus_flag)
  {
    if (typeof this.tool.keyDown !== 'undefined' )
    {
      r = this.tool.keyDown( keycode, ch, ev );
    }
  } else {
    r = this.focus.keyDown( keycode, ch, ev );
  }



  return r;

}

bleepsixSchematicController.prototype.keyPress = function( keycode, ch, ev )
{
  if (this.viewMode) { return true; }

  if (!this.focus_flag)
  {
    if (typeof this.tool.keyPress !== 'undefined' )
      this.tool.keyPress( keycode, ch, ev );
  }
  else
  {
    this.focus.keyPress( keycode, ch, ev );
  }

}


bleepsixSchematicController.prototype.mouseDown = function( button, x, y ) 
{

  this.focus_flag = false;
  this.focus = null;

  //this.root.hitTest(x, y);

  if (!this.viewMode)
  {

    if (this.guiPalette.hitTest(x, y))
    {
      //console.log(" gui component hit, letting it handle it");
      return;
    }

    if (this.guiLibrary.hitTest(x,y))
    {

      this.guiLibrary.mouseDown(button, x, y);

      if (this.guiLibrary.hasFocusedElement())
      {
        this.focus_flag = true;
        this.focus = this.guiLibrary.focusedElement();
      }

      return;
    }

    if (this.guiToolbox.hitTest(x,y))
    {
      this.guiToolbox.mouseDown(button, x, y);
      return;
    }

    if (this.guiUndoRedo.hitTest(x,y))
    {
      this.guiUndoRedo.mouseDown(button, x, y);
      return;
    }

    if (this.guiGrid.hitTest(x,y))
    {
      this.guiGrid.mouseDown(button, x, y);
      return;
    }

  }

  /*
  if (this.guiAction.hitTest(x,y))
  {
    this.guiAction.mouseDown(button, x, y);
    return;
  }
  */

  //DEBUGGING
  /*
  if (this.guiTextboxTest.hitTest(x,y))
  {
    this.guiTextboxTest.mouseDown(button, x, y);
    return;
  }
  */

  /*
  for (var ind in this.guiChild)
  {
    if ( (typeof this.guiChild[ind].hitTest !== 'undefined') &&
         (this.guiChild[ind].hitTest(x, y)) )
    {
      if (typeof this.guiChild[ind].mouseDown !== 'undefined' )
        this.guiChild[ind].mouseDown(button, x, y);
      return;
    }
  }
 */

  if (typeof this.tool.mouseDown !== 'undefined' )
    this.tool.mouseDown ( button, x, y );
}

bleepsixSchematicController.prototype.doubleClick = function( e )
{
  if (this.guiToolbox.hitTest( this.mouse_cur_x, this.mouse_cur_y ))
  {
    this.guiToolbox.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y  );
    return;
  }

  if (typeof this.tool.doubleClick !== 'undefined' )
    this.tool.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y )
}

bleepsixSchematicController.prototype.mouseUp = function( button, x, y ) 
{
  if (typeof this.tool.mouseUp !== 'undefined' )
    this.tool.mouseUp ( button, x, y );
}

bleepsixSchematicController.prototype.mouseMove = function( x, y ) 
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if ( this.moving ) 
    this.guiPalette.move(x, y);

  if (this.movingLibrary)
    this.guiLibrary.move(x, y);

  if (this.movingToolbox)
    this.guiToolbox.move(x,y);

  if (this.movingGrid)
    this.guiGrid.move(x,y);
  
  /*
  if (this.movingAction)
    this.guiAction.move(x,y);
    */

  //if (this.movingDebug) this.guiTextboxTest.move(x,y);

  if (!this.viewMode)
  { 

    if (this.guiToolbox.hitTest(x,y))
    { 

      if (!this.guiToolbox.enter_flag) {
        this.guiToolbox.mouseEnter(x,y);
      }
      this.guiToolbox.mouseMove(x, y);
      return;
    } else {
      if (this.guiToolbox.enter_flag) {
        this.guiToolbox.mouseLeave(x,y);
      }
    }

    if (this.guiUndoRedo.hitTest(x,y))
    {

      if (!this.guiUndoRedo.enter_flag) {
        this.guiUndoRedo.mouseEnter(x,y);
      }
      this.guiUndoRedo.mouseMove(x, y);
      return;
    } else {
      if (this.guiUndoRedo.enter_flag) {
        this.guiUndoRedo.mouseLeave(x,y);
      }
    }

  }

  
  if ( this.schematic.displayable )
  {
    if (typeof this.tool.mouseMove !== 'undefined' )
      this.tool.mouseMove ( x, y );
  }
}

bleepsixSchematicController.prototype.mouseDrag = function( dx, dy ) 
{

  if (typeof this.tool.mouseDrag !== 'undefined' )
    this.tool.mouseDrag ( x, y );
}

bleepsixSchematicController.prototype.mouseWheel = function( delta )
{
  var x = this.mouse_cur_x;
  var y = this.mouse_cur_y;

  if (!this.viewMode)
  {

    if (this.guiLibrary.hitTest(x, y))
    {
      this.guiLibrary.mouseWheelXY(delta, x, y);
    }
    else if (typeof this.tool.mouseWheel !== 'undefined' )
    {
      this.tool.mouseWheel ( delta );
    }

  }
  else
  {

    if (typeof this.tool.mouseWheel !== 'undefined' )
    {
      this.tool.mouseWheel ( delta );
    }

  }

}

bleepsixSchematicController.prototype.init = function( canvas_id ) 
{
  this.canvas = $("#" + canvas_id)[0];
  this.context = this.canvas.getContext('2d');

  // hmm, guiPalette needs to know about g_controller....
  //
  this.guiPalette = new guiPalette( "palette" );
  this.guiPalette.move( (g_painter.width - this.guiPalette.width)/4, g_painter.height - this.guiPalette.height );

  this.guiToolbox = new guiToolbox( "toolbox" );

  this.guiToolbox.move( 0, 200);
  this.guiToolbox.defaultSelect();

  this.guiGrid = new guiGrid( "grid", "rgba(0,0,0,0.2)" );
  this.guiGrid.move(0,0);

  /*
  var userId = $.cookie("userId");
  var sessionId = $.cookie("sessionId");
  var projectId = $.cookie("recentProjectId");
  */
  var userId = ( g_schnetwork ? g_schnetwork.userId : undefined );
  var sessionId = ( g_schnetwork ? g_schnetwork.sessionId : undefined );
  var projectId = ( g_schnetwork ? g_schnetwork.projectId : undefined );
  this.guiLibrary = new guiLibrary( "library", userId, sessionId, projectId );
  this.guiLibrary.move( g_painter.width - this.guiLibrary.width, 0);

  this.guiUndoRedo = new guiUndoRedo( "undo-redo" );
  var ur_x = g_painter.width - this.guiLibrary.width - this.guiUndoRedo.width;
  var ur_y = g_painter.height - this.guiUndoRedo.width;
  this.guiUndoRedo.move( ur_x, ur_y );



  var controller = this;

  $(canvas_id).focus( function(ev) {
  });

  $(canvas_id).mouseup( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseUp( e.which , xy[0], xy[1] );
  });

  $(canvas_id).mousedown( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseDown( e.which, xy[0], xy[1] );
  });

  $(canvas_id).mouseover( function(e) {
  });

  $(canvas_id).mouseenter( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseEnter( xy[0], xy[1] );
  });

  $(canvas_id).mouseleave( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseLeave( xy[0], xy[1] );
  });

  $(canvas_id).mousemove( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseMove( xy[0], xy[1] );
  });

  $(canvas_id).mousewheel( function(e, delta, detlax, deltay) {
    controller.mouseWheel( delta );
    return false;
  });

  $(canvas_id).click( function(e) {
  });

  $(canvas_id).dblclick( function(e) {
    controller.doubleClick(e);
  });

  $(canvas_id).keypress( function(e) {
  });

  $(canvas_id).keydown( function(e) {
    var key = ( e.which ? e.which : e.keyCode );
    var ch = String.fromCharCode(key);

    this.capState = $(window).capslockstate("state");

    return controller.keyDown( e.keyCode, ch, e );
  });

  $(canvas_id).keyup( function(e) {
    var key = e.which;
    var ch = String.fromCharCode(key);
  });

  $(canvas_id).resize( function(e) {
    console.log("resize");
    console.log(e);
  });

  $(canvas_id).keypress( function(e) {
    var key = e.which;
    var ch = String.fromCharCode(key);
    controller.keyPress( key, ch, e );
  });



  $(window).bind("capsOn", function(e) {
    controller.capState = "on";
  });

  $(window).bind("capsOff", function(e) {
    controller.capState = "off";
  });

  $(window).bind("capsUnknown", function(e) {
    controller.capState = "unknown";
  });

  $(window).capslockstate();

  // get rid of right click menu popup
  $(document).bind("contextmenu", function(e) { return false; });

  // put focus on the canvas
  $(canvas_id).focus();

  // do first draw  
  g_painter.dirty_flag = true;
  
  // give to schematic
  this.schematic.init ( g_painter );
}

if (typeof module !== 'undefined')
{
  module.exports = bleepsixSchematicController;
}

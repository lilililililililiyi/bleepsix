/*

    Copyright (C) 2013 Abram Connelly

    This file is part of bleepsix v2.

    bleepsix is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    bleepsix is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with bleepsix.  If not, see <http://www.gnu.org/licenses/>.

    Parts based on bleepsix v1. BSD license
    by Rama Hoetzlein and Abram Connelly.

*/


// Need to figure out if we keep the type specific component operations here
// or move them somewhere else.
// Yeah, it's pretty bad.  We'll have to figure out a way to make it more consistent
// and robust.
//

function toolBoardMove( mouse_x, mouse_y, id_ref_array, processInitialMouseUp  ) 
{

  mouse_x = ( typeof mouse_x !== 'undefined' ? mouse_x : 0 );
  mouse_y = ( typeof mouse_y !== 'undefined' ? mouse_y : 0 );
  processInitialMouseUp = ( typeof processInitialMouseUp !== 'undefined' ? processInitialMouseUp : true );


  if ( typeof id_ref_array === 'undefined' )
  {
    console.log("toolBoardMove: WARNING: id_ref_ar, empty, handing back control to toolBoardNav");
    g_board_controller.tool = new toolBoardNav(mouse_x, mouse_y);

    return g_board_controller.tool;  // iffy, be careful
  }

  console.log("toolBoardMove starting");

  this.mouse_cur_x = mouse_x;
  this.mouse_cur_y = mouse_y;

  this.orig_element_state = [];  // so we can go back to our original state when we 'esc'
  this.base_element_state = [];  // so we can use absolute world delta position, instead of incremental ones

  this.mouse_drag_button = false;
  
  this.drawHighlightRect = true;

  this.orig_world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.prev_world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.cur_world_xy  = g_painter.devToWorld( mouse_x, mouse_y );

  this.snap_world_xy = g_snapgrid.snapGrid (this.prev_world_xy);

  console.log("snap_world_xy");
  console.log(this.snap_world_xy);

  this.cursorSize = 6;
  this.cursorWidth = 1;


  // Since we hand back control on a mouse up instead of a mouse down event
  // and we were handed control from a mouse down event, we need to ignore
  // the initial mouse up event.
  //
  this.processMouseUp = processInitialMouseUp;

  this.selectedElement = null;
  this.addElement( id_ref_array );

  //console.log( this.orig_element_state );
  //console.log( this.base_element_state );


}

toolBoardMove.prototype.mouseDrag  = function( dx, dy ) { g_painter.adjustPan( dx, dy ); }
toolBoardMove.prototype.mouseWheel = function( delta )  { g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta ); }



toolBoardMove.prototype.addElement = function( id_array )
{

  this.selectedElement = id_array;

  var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

  this.prev_world_xy["x"] = world_xy["x"];
  this.prev_world_xy["y"] = world_xy["y"];

  this.cur_world_xy["x"] = world_xy["x"];
  this.cur_world_xy["y"] = world_xy["y"];

  this.orig_world_xy["x"] = world_xy["x"];
  this.orig_world_xy["y"] = world_xy["y"];

  this.snap_world_xy = g_snapgrid.snapGrid( g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y ) );

  $.extend(true, this.orig_element_state, id_array );
  $.extend(true, this.base_element_state, id_array );

  g_painter.dirty_flag = true;
}

toolBoardMove.prototype.drawOverlay = function()
{

  //TESTING
  //g_board_controller.board.updateRatsNest();
  //TESTING

  var s = this.cursorSize / 2;

  g_painter.drawRectangle( this.snap_world_xy["x"] - s, 
                           this.snap_world_xy["y"] - s, 
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );

  for (var ind in this.selectedElement )
  {
    var ref = this.selectedElement[ind]["ref"];

    if ( (ref.type == "track") || (ref.type == "drawsegment") )
    {
      var w = parseFloat( ref.width );
      g_painter.line( ref.x0, ref.y0, ref.x1, ref.y1, "rgba(255,255,255,0.25)", 2*w );
    }
    else
    {
      var bbox = ref["bounding_box"];

      var x = bbox[0][0];
      var y = bbox[0][0];
      var w = bbox[1][0] - bbox[0][0];
      var h = bbox[1][1] - bbox[0][1];

      g_painter.drawRectangle( bbox[0][0], bbox[0][1],
                               w, h, 
                               10, "rgb(128,128,128)",
                               true, "rgba(255,255,255,0.25)");
    }

  }

}

// Moved release control to mouse up so double clicks work out.
//
toolBoardMove.prototype.mouseDown = function( button, x, y )
{

  console.log("toolBoardMove.mouseDown");

  /*
  if (button == 1)
  {
    g_board_controller.tool = new toolNav(x, y);
    //g_board_controller.tool.mouseMove( x, y );  // easy way to setup?
    g_painter.dirty_flag = true;
  }
  else 
 */
  if (button == 3)
  {
    this.mouse_drag_button = true;
  }


}

toolBoardMove.prototype.doubleClick = function( button, x, y )
{
  console.log("toolBoardMove.doubleClick");

  var world_coord = g_painter.devToWorld( x, y );
  var id_ref =  g_board_controller.board.pick( world_coord["x"], world_coord["y"] );

  if (id_ref)
  {

    if (id_ref.ref.type == "component")
    {
      console.log("toolBoardMove.doubleClick: editing not implemented (not passing control), passing off to toolBoardNav instead");
      g_board_controller.tool = new toolBoardNav(x, y);

      g_painter.dirty_flag = true;
    }

  }
  else
  {

  }


}

toolBoardMove.prototype.mouseUp = function( button, x, y )
{

  this.mouse_drag_button = false;

  if (this.processMouseUp)
  {

    if (button == 1)
    {
      g_board_controller.tool = new toolBoardNav(x, y);
      g_painter.dirty_flag = true;
    }
  }

  this.processMouseUp = true;


}


// Move is a bit slow.  I think it's jquery's extend.
// We probably want to do our own deep copy.
// We can probably expect roughly 4x improvement. extend is soaking 
// up about 10-20% (maybe more) cpu when doing a toolmove.
// for future refernce:
// http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object/5344074#5344074
// http://jsperf.com/cloning-an-object/2
// http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
//
//

toolBoardMove.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_button == true)
    this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (this.mouse_drag_button == false)
  {

    var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

    var wdx = world_xy["x"] - this.orig_world_xy["x"];
    var wdy = world_xy["y"] - this.orig_world_xy["y"];

    if ( g_snapgrid.active )
    {
      var ta = g_snapgrid.snapGrid( world_xy );
      var tb = g_snapgrid.snapGrid( this.orig_world_xy );
      wdx = ta["x"] - tb["x"];
      wdy = ta["y"] - tb["y"];
    }

    // Copy original information back to do relative move
    //
    $.extend(true, this.selectedElement, this.base_element_state);


    for (var ind in this.selectedElement)
    {
      g_board_controller.board.relativeMoveElement( this.selectedElement[ind], wdx, wdy );
      g_painter.dirty_flag = true;
    }

    this.prev_world_xy["x"] = world_xy["x"];
    this.prev_world_xy["y"] = world_xy["y"];


    //TESTING
    g_board_controller.board.updateRatsNest();
    //TESTING


  }

}

toolBoardMove.prototype.keyDown = function( keycode, ch, ev )
{

  if (keycode == 27)
  {

    //$.extend(true, this.selectedElement, this.base_element_state);
    $.extend(true, this.selectedElement, this.orig_element_state);

    g_board_controller.tool = new toolBoardNav(this.mouse_cur_x, this.mouse_cur_y);


    g_board_controller.board.updateRatsNest();

    g_painter.dirty_flag = true;

  }
  else if (ch == 'I')
  { 
    console.log('(I)nfo for picked part(s): ' );

    for (var ind in this.selectedElement)
    { 
      console.log( this.selectedElement[ind].ref.name );
      console.log( this.selectedElement[ind].ref );
    }

  } 
  else if (ch == 'D')
  {
    for (var ind in this.selectedElement)
      g_board_controller.board.remove( this.selectedElement[ind] );

      g_board_controller.board.updateRatsNest();

    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_painter.dirty_flag = true;

  }
  else if ( (ch == 'R') || (ch == 'E') )
  {


    com = g_board_controller.board.centerOfMass( this.base_element_state );
    console.log("com:");
    console.log(com);

    // be careful, this might lead to 'drift' as we rotate things around
    //
    com = g_snapgrid.snapGrid(com);

    var ccw = ( (ch == 'R') ? true : false );
    g_board_controller.board.rotateAboutPoint90( this.base_element_state , com.x, com.y, ccw );
    $.extend(true, this.selectedElement, this.base_element_state);


    var world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
    var wdx = world_xy["x"] - this.orig_world_xy["x"];
    var wdy = world_xy["y"] - this.orig_world_xy["y"];

    if ( g_snapgrid.active )
    {
      var ta = g_snapgrid.snapGrid( world_xy );
      var tb = g_snapgrid.snapGrid( this.orig_world_xy );
      wdx = ta["x"] - tb["x"];
      wdy = ta["y"] - tb["y"];
    }

    for (var ind in this.selectedElement)
      g_board_controller.board.relativeMoveElement( this.selectedElement[ind], wdx, wdy );

    g_board_controller.board.updateRatsNest();

    g_painter.dirty_flag = true;

  }
  else if ( ch == 'Z' )
  {

    console.log("zone!");

    for (var i in this.selectedElement )
    {
      var ele = this.selectedElement[i];
      if (ele.type == "czone")
      {
        g_board_controller.board.fillCZone( ele.ref );
        $.extend(true, this.base_element_state, this.selectedElement );
        $.extend(true, this.orig_element_state, this.selectedElement );

      }
    }

  }

}

toolBoardMove.prototype.keyUp = function( keycode, ch, ev  )
{
}



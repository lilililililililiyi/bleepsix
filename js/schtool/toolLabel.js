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


function toolLabel( x, y, type, placeOption )
{
  console.log("toolLabel");

  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof x !== 'undefined' ? y : 0 );

  // default to noconn
  type = ( typeof type !== 'undefined' ? type : 'noconn' );

  // default to once
  placeOption = ( typeof placeOption !== 'undefined' ? placeOption : 'once' );

  this.labelType = type;

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld(x, y);
  this.mouse_drag_flag = false;

  this.cursorSize = 6;
  this.cursorWidth = 1;


  this.placeOption = placeOption;  // "persistent" ?

  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  var wxy =  [ this.mouse_world_xy.x , this.mouse_world_xy.y ] ;
  this.label = { x : wxy[0], y : wxy[1], text : "texting and texting ", type: "label" , orientation : 0 };
  g_schematic_controller.schematic.updateLabelBoundingBox( this.label );

  var ele = document.getElementById("canvas");
  if (type == "noconn")
  {
    ele.style.cursor = "url('img/cursor_custom_noconn_s24.png') 4 3, cursor";
  }
  else if ( (type == "conn") || (type == "connection") )
  {
    ele.style.cursor = "url('img/cursor_custom_conn_s24.png') 4 3, cursor";
  }

  g_painter.dirty_flag = true;

}

//-----------------------------

toolLabel.prototype._drawBBoxOverlay = function( bbox )
{
  var x = bbox[0][0];
  var y = bbox[0][0];
  var w = bbox[1][0] - bbox[0][0];
  var h = bbox[1][1] - bbox[0][1];

  g_painter.drawRectangle( bbox[0][0], bbox[0][1],
                           w, h,
                           2, "rgb(128,128,128)",
                           true, "rgba(0,0,0,0.25)");

}


toolLabel.prototype.drawOverlay = function()
{


  var s = this.cursorSize / 2;
  g_painter.drawRectangle( this.mouse_world_xy["x"] - s,
                           this.mouse_world_xy["y"] - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );

  g_schematic_controller.schematic.drawSchematicLabel( this.label );
  this._drawBBoxOverlay( this.label.bounding_box );

  g_schematic_controller.display_text = "x: " + this.mouse_world_xy.x + ", y: " + this.mouse_world_xy.y;

}

//-----------------------------

toolLabel.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------

toolLabel.prototype._addLabelType = function( type, x, y ) 
{
  console.log("toolLabel._addLabelType");

  g_schematic_controller.schematic.addLabel( 
      this.label.text, 
      this.label.x, this.label.y, 
      this.label.orientation );
}


toolLabel.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1)
  {

    console.log("mouseDown..." + this.labelType );

    if (this.labelType == "label")
    {
      this._addLabelType( "noconn", this.mouse_world_xy.x, this.mouse_world_xy.y );
    }
    else if (this.labelType == "connection")
    {
      this._addLabelType( "connection", this.mouse_world_xy.x, this.mouse_world_xy.y );
    }

    if (this.placeOption == "once")
    {
      g_schematic_controller.tool = new toolNav(x, y);
      g_schematic_controller.guiToolbox.defaultSelect();
      g_painter.dirty_flag = true;


      var ele = document.getElementById("canvas");
      ele.style.cursor = "auto";


      return;
    }

  }

}

//-----------------------------


/*
toolLabel.prototype.doubleClick = function( button, x, y )
{

  if (this.placeOption == "once")
    this.placeOption = "persist";
  else 
    this.placeOption = "once";

  console.log("toolLabel.doubleClick: placeOption " + this.placeOption );
}
*/

//-----------------------------

toolLabel.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//-----------------------------


toolLabel.prototype.mouseMove = function( x, y ) 
{

  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );


  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  g_painter.dirty_flag = true;

  if ( ! this.mouse_drag_flag ) 
  {

  }

}

//-----------------------------

toolLabel.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolLabel.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------
// TESTING

toolLabel.prototype.keyDown = function( keycode, ch, ev )
{
  console.log("toolLabel keyDown: " + keycode + " " + ch );

  if ((ch == 'Q') || (keycode == 27))
  {
    console.log("handing back to toolNav");
    g_schematic_controller.tool = new toolNav( this.mouse_cur_x, this.mouse_cur_y );
    g_schematic_controller.guiToolbox.defaultSelect();

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";

    g_painter.dirty_flag = true;
  }

}

//-----------------------------

toolLabel.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("toolLabel keyUp: " + keycode + " " + ch );
}


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

function toolBoardZone( x, y, initialPlaceFlag ) 
{

  x = ((typeof x !== 'undefined') ? x : 0 );
  y = ((typeof y !== 'undefined') ? y : 0 );
  initialPlaceFlag = ((typeof initialPlaceFlag !== 'undefined') ? initialPlaceFlag : true );

  this.debug = false;

  if (this.debug) {
    console.log("toolBoardZone");
  }

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.orig_world_coord = g_painter.devToWorld( x, y );
  this.cur_world_coord = g_painter.devToWorld( x, y );


  this.region_box_threshold_size = 50;
  this.drawing_box_flag = false;

  this.mouse_drag_flag = false;

  // This netcode is the _schematic_ net code, _not_ the board
  // netcode.  This way, it will be able to connect multiple
  // board elements with different board netcodes because they'll
  // be in an equivalent schematic netcode
  //
  this.netcode = 0;

  this.layer = g_board_controller.guiLayer.selectedLayer;

  this.initialPlaceFlag = initialPlaceFlag;
  this.ready = false;
  this.ignoreMouseUp = true;

  if (this.initialPlaceFlag)
  {
    this._initZoneState( x, y );
  }

  var ele = document.getElementById("canvas");

  //ele.style.cursor = "url('img/cursor_custom_zone_s24.png') 4 3, cursor";

  if ( this.layer < 10 )
  {
    if (this.layer==0)
    {
      ele.style.cursor = "url('img/cursor_custom_zone_s24_green.png') 4 3, cursor";
    }
    else if (this.layer==1)
    {
      ele.style.cursor = "url('img/cursor_custom_zone_s24_teal.png') 4 3, cursor";
    }
    else if (this.layer==2)
    {
      ele.style.cursor = "url('img/cursor_custom_zone_s24_orange.png') 4 3, cursor";
    }
    else
    {
      ele.style.cursor = "url('img/cursor_custom_zone_s24_green.png') 4 3, cursor";
    }
  }
  else
  {
    ele.style.cursor = "url('img/cursor_custom_zone_s24_red.png') 4 3, cursor";
  }


}

toolBoardZone.prototype._initZoneState = function( x, y )
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.orig_world_coord = g_painter.devToWorld( x, y );
  this.cur_world_coord = g_painter.devToWorld( x, y );

  this.ready = true;
  this.ignoreMouseUp = false;

  this._setNextNetcode();
}

toolBoardZone.prototype.debug_print = function()
{
  console.log("toolBoardZone:");
  console.log("  mouse_cur_x " + this.mouse_cur_x + ", mouse_cur_y " + this.mouse_cur_y );
  console.log("  orig_world_coord: " + this.orig_world_coord[0] + " " + this.orig_world_coord[1] );
  console.log("  cur_world_coord: " + this.cur_world_coord[0] + " " + this.cur_world_coord[1] );
  console.log("  region_box_threshold " + this.region_box_threshold_size );
  console.log("  drawing_box_flag " + this.drawing_box_flag );
  console.log("  mouse_drag_flag " + this.drawing_box_flag );
  console.log("  netcode " + this.netcode +   ", layer " + this.layer );
}


toolBoardZone.prototype.drawOverlay = function()
{

  if (this.drawing_box_flag)
  {
    var mx = Math.min( this.cur_world_coord["x"], this.orig_world_coord["x"] );
    var my = Math.min( this.cur_world_coord["y"], this.orig_world_coord["y"] );

    var w = Math.abs( this.cur_world_coord["x"] - this.orig_world_coord["x"] );
    var h = Math.abs( this.cur_world_coord["y"] - this.orig_world_coord["y"] );

    g_painter.drawRectangle( mx, my, w, h, 100, "rgb(128, 128, 128)" );
  }

  var mouse_x = Math.floor(this.cur_world_coord.x);
  var mouse_y = Math.floor(this.cur_world_coord.y);
  g_board_controller.display_text = "x: " + mouse_x + ", y: " + mouse_y;
}

toolBoardZone.prototype.mouseDown = function( button, x, y )
{

  if (button == 3)
    this.mouse_drag_flag = true;

}

toolBoardZone.prototype.mouseUp = function( button, x, y )
{

  if (button == 3)
    this.mouse_drag_flag = false;

  var world_coord = g_painter.devToWorld(x, y);

  if (button == 1)
  {

    if (this.ignoreMouseUp)
    {
      this.ignoreMouseUp = false;
      return;
    }

    if (!this.ready)
    {
      this._initZoneState(x, y);
      return;
    }

    if (this.drawing_box_flag)
    {
      var mx = Math.min( this.cur_world_coord["x"], this.orig_world_coord["x"] );
      var my = Math.min( this.cur_world_coord["y"], this.orig_world_coord["y"] );

      var Mx = Math.max( this.cur_world_coord["x"], this.orig_world_coord["x"] );
      var My = Math.max( this.cur_world_coord["y"], this.orig_world_coord["y"] );

      var pnts = [ [mx, my], [Mx, my], [Mx, My], [mx, My] ];


      // a bit hacky.  If we do this a lot, we should abstract it out
      //
      map = g_board_controller.board.kicad_brd_json.sch_to_brd_net_map;

      sch_nc = this.netcode;

      var group_id = String(guid());

      var op = { source : "brd", destination: "brd" };
      op.action = "add";
      op.type = "czone";

      op.data  = { points : pnts, netcode: sch_nc, layer : this.layer, polyscorners:[] };
      op.groupId = group_id;

      g_board_controller.opCommand( op );

    }

    g_board_controller.tool = new toolBoardNav(x, y);
    g_board_controller.guiToolbox.defaultSelect();

    g_painter.dirty_flag = true;

    g_board_controller.board.unhighlightNet();

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );


  }

}

toolBoardZone.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_flag)
    this.mouseDrag( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (!this.mouse_drag_flag)
  {
    if (!this.ready)
      return;

    this.cur_world_coord = g_painter.devToWorld( x, y );

    var tx = this.cur_world_coord["x"];
    var ox = this.orig_world_coord["y"];

    var ty = this.cur_world_coord["x"];
    var oy = this.orig_world_coord["y"];

    var dx = Math.abs( this.cur_world_coord["x"] - this.orig_world_coord["x"]) ;
    var dy = Math.abs( this.cur_world_coord["y"] - this.orig_world_coord["y"]) ;

    if ( ( Math.abs( dx ) > this.region_box_threshold_size ) ||
         ( Math.abs( dy ) > this.region_box_threshold_size ) )
      this.drawing_box_flag = true;

  }


  if (this.drawing_box_flag == true)
    g_painter.dirty_flag = true;

}

toolBoardZone.prototype.mouseDrag = function( dx, dy )
{
  g_painter.adjustPan( dx, dy );
}

toolBoardZone.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom( this.mouse_cur_x, this.mouse_cur_y, delta );
}

toolBoardZone.prototype._setNextNetcode = function()
{

  var cur_netcode = parseInt(this.netcode);
  var t = -1;
  var min_netcode = -1;

  var ncm = g_board_controller.board.kicad_brd_json.sch_to_brd_net_map ;

  for ( var nc in ncm )
  {
    nc = parseInt(nc);

    if (nc > cur_netcode)
    {
      if ( (t == -1) || (nc < t) )
        t = nc;
    }

    if ( min_netcode == -1 )
      min_netcode = nc;

    if ( min_netcode > nc )
      min_netcode = nc;

  }

  this.netcode = ( (t >= 0) ? t : min_netcode );

  g_board_controller.board.highlightNetCodes( ncm[ this.netcode ] );
}

toolBoardZone.prototype._setPrevNetcode = function()
{
  var cur_netcode = parseInt(this.netcode);
  var t = -1;
  var max_netcode = -1;

  var ncm = g_board_controller.board.kicad_brd_json.sch_to_brd_net_map;

  for (var nc in ncm)
  {
    nc = parseInt(nc);

    if (nc < cur_netcode)
    {
      if ( (t == -1) || (nc > t) )
        t = nc;
    }

    if ( max_netcode == -1 )
      max_netcode = nc;

    if ( max_netcode < nc )
      max_netcode = nc;
  }

  this.netcode = ( (t >= 0) ? t : max_netcode );

  g_board_controller.board.highlightNetCodes( ncm[ this.netcode ] );

}



toolBoardZone.prototype.keyDown = function( keycode, ch, ev )
{
  if (ch == 'I')
  {
    this.debug_print();
  }
  else if (ch == 'Z')
  {

    this._setNextNetcode();

    if (this.debug) {
      console.log("Z!");
      console.log("netcode now : " + this.netcode + " " + this.netname );
      console.log(">>> netcode now (sch) : " + this.netcode );
    }

  }


  else if (ch == 'A')
  {

    this._setPrevNetcode();

    if (this.debug) {
      console.log("A.");
      console.log("netcode now : " + this.netcode + " " + this.netname );
      console.log(">>> netcode now : " + this.netcode );
    }

  }

  else if (keycode == 27)
  {
    g_board_controller.tool = new toolBoardNav(this.mouse_cur_x, this.mouse_cur_y);
    g_board_controller.guiToolbox.defaultSelect();

    g_painter.dirty_flag = true;

    g_board_controller.board.unhighlightNet();

    var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
    g_board_controller.board.updateRatsNest( undefined, undefined, map );

  }

}

toolBoardZone.prototype.keyUp = function( keycode, ch, ev  ) { }

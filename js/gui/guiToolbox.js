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

function guiToolbox( name ) 
{
  this.constructor ( name )   

  this.bgColor = "rgba( 0, 0, 255, 0.2 )";

  //this.iconWidth = __icon_width;
  this.iconWidth = 24;

  this.width = this.iconWdith + 5;

  this.height = 4* this.iconWidth;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  var cur_y = 0;
  var sz = this.iconWidth;


  // iconNav is just a simple guiIcon
  //
  this.iconNav = new guiIcon( name + ":nav" );
  this.iconNav.init( 0, cur_y, sz, sz);
  this.iconNav.drawShape = (function(xx) { return function() { xx._draw_nav_icon(); }; })(this);
  this.iconNav.bgColor = "rgba(0,0,0, 0.0)";
  //this.iconNav.tooltip_text = "nav";
  //this.iconNav.tooltip_flag = true;

  this.addChild( this.iconNav );

  cur_y += this.iconNav.height;


  // grouped wire functions (wire, bus, etc)
  //
  var w = new guiDropIcon( this.name + ":dropwire", this.iconWidth , this.iconWidth );
  w.addIcon( this.name + ":wire", 
      (function(xx) { return function() { xx._draw_wire_icon(); }; })(this) );

  w.tooltip_text = " place wire (W)";
  w.tooltip_flag = true;
  w.tooltip_width = w.tooltip_text.length * w.tooltip_font_size/1.6;


  // BUS not implementd right now, just take it out, we'll put it back in later
  //
  //w.addIcon( this.name + ":bus" , 
  //    (function(xx) { return function() { xx._draw_bus_icon(); }; })(this)  );

  w.move(0, cur_y);

  this.dropWire = w;
  this.addChild( w );

  cur_y += w.height;



  var u = new guiDropIcon( this.name + ":dropconn", this.iconWidth , this.iconWidth );
  u.addIcon( this.name + ":noconn", 
      (function(xx) { return function() { xx._draw_noconn_icon(); }; })(this),
      " place no-connection (X)"
      );
  u.addIcon( this.name + ":conn", 
      (function(xx) { return function() { xx._draw_conn_icon(); }; })(this),
      " place connection (J)"
      );

  u.tooltip_text = " place no-connection (X)";
  u.tooltip_flag = true;
  u.tooltip_width = u.tooltip_text.length * u.tooltip_font_size/1.6;

  u.move(0, cur_y);

  this.dropConn = u;
  this.addChild( u );

  cur_y += w.height;


  var lab = new guiDropIcon( this.name + ":droplabel", this.iconWidth, this.iconWidth );
  lab.addIcon( this.name +":droplabel", 
      (function(xx) { return function() { xx._draw_label_icon(); }; })(this) );

  lab.tooltip_text = " place label (L)";
  lab.tooltip_flag = true;
  lab.tooltip_width = lab.tooltip_text.length * lab.tooltip_font_size/1.6;

  // Other labels not implemented right now.  Will implement later, take them out
  // here for now.
  //
  /*
  lab.addIcon( this.name + ":heirlabel", 
      (function(xx) { return function() { xx._draw_label_icon(); }; })(this) );
  lab.addIcon( this.name + ":globlabel", 
      (function(xx) { return function() { xx._draw_label_icon(); }; })(this) );
      */

  lab.move(0, cur_y);

  this.dropLabel = lab;
  this.addChild( lab );

  cur_y += lab.height;

  // Rotate
  //
  var rot  = new guiDropIcon( this.name + ":droprotate", this.iconWidth , this.iconWidth );
  rot.addIcon( this.name + ":rot_ccw", 
      (function(xx) { return function() { xx._draw_rotccw_icon(); }; })(this),
      " rotate counterclocwise (R)"
      );
  rot.addIcon( this.name + ":rot_cw", 
      (function(xx) { return function() { xx._draw_rotcw_icon(); }; })(this),
      " rotate clockwise (E)"
      );

  rot.tooltip_text = " rotate counterclockwise (R)";
  rot.tooltip_flag = true;
  rot.tooltip_width = rot.tooltip_text.length * rot.tooltip_font_size/1.6;

  rot.move(0, cur_y);

  this.dropRotate = rot;
  this.addChild( rot );

  cur_y += lab.height;


  // Delete
  //
  var deldel = new guiIcon( name + ":delete" );
  deldel.init( 0, cur_y, sz, sz);
  deldel.drawShape = (function(xx) { return function() { xx._draw_delete_icon(); }; })(this);
  deldel.bgColor = "rgba(0,0,0, 0.0)";
  deldel.bgColorTT = "rgba(0,0,0, 0.2)";

  deldel.tooltip_text = " delete (D)";
  deldel.tooltip_flag = true;
  deldel.tooltip_width = deldel.tooltip_text.length * deldel.tooltip_font_size/1.6;

  this.iconDelete = deldel;
  this.addChild( deldel );

  cur_y += deldel.height;

  // Help
  //
  var help = new guiIcon( name + ":help" );
  help.init( 0, cur_y, sz, sz);
  help.drawShape = (function(xx) { return function() { xx._draw_help_icon(); }; })(this);
  help.bgColor = "rgba(0,0,0, 0.0)";

  this.iconHelp = help;
  this.addChild( help );

  cur_y += help.height;

  this.iconNav.selected = true;
  this.dropWire.selected = false;
  this.dropConn.selected = false;
  this.dropLabel.selected = false;
  this.dropRotate.selected = false;
  this.iconDelete.selected = false;
  this.iconHelp.selected = false;
}
guiToolbox.inherits ( guiRegion );

guiToolbox.prototype._draw_nav_icon = function()
{
  var sz = 10;
  var sx = this.iconWidth/2-sz/2, sy = this.iconWidth/2-sz/2;

  var r = parseInt(8 * this.iconWidth /10);
  g_imgcache.draw( "cursor", 3, 1, r, r );

  g_painter.drawRectangle( 0, 0, this.iconWidth, this.iconWidth, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.2)");
}

guiToolbox.prototype._draw_grid_tab_icon = function()
{
  var x = 0;
  var y = this.iconWidth/3;
  var w = this.iconWidth/3;
  var h = this.iconWidth - y;

  var color = "rgba(0, 0, 255, 0.2)";

  var path = [ [0, 0], [x+w, y], [x+w, y+h] , [0, y+h] ];
  g_painter.drawBarePolygon( path, 0, 0, color );
}


guiToolbox.prototype._draw_gridinch_icon = function()
{
  g_painter.drawText("in", 3, 3, "rgba(0,0,0,0.5)", 12, 0, "L", "T");
  g_painter.drawRectangle( 0, 0, this.iconWidth, this.iconWidth, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.2)");
}

guiToolbox.prototype._draw_gridmm_icon = function()
{
  g_painter.drawText("mm", 6, 8, "rgba(0,0,0,0.5)", 15, 0, "L", "T");
}


guiToolbox.prototype._draw_wire_icon = function()
{
  var sx = this.iconWidth/6, sy = this.iconWidth/3, dx = this.iconWidth/3, dy = this.iconWidth/3;
  var color = "rgba(0,138,0,0.6)", width = 2;
  var bgColor = "rgb(255,255,255,0.1)";

  g_painter.line( sx,    sy,    sx+dx,    sy,    color, width);
  g_painter.line( sx+dx, sy,    sx+dx,    sy+dy, color, width);
  g_painter.line( sx+dx, sy+dy, sx+2*dx,  sy+dy, color, width);
}

guiToolbox.prototype._draw_bus_icon = function()
{
  var sx = this.iconWidth/3, sy = this.iconWidth/3, dx = this.iconWidth/3, dy = this.iconWidth/3;
  var dx0 = this.iconWidth/6;
  var color = "rgb(0,0,138)";
  var width = 2;
  var bgColor = "rgb(255,255,255,0.1)";

  g_painter.line( sx,    sy,    sx+dx0,    sy,    color, width);
  g_painter.line( sx+dx0, sy,    sx+dx0,    sy+dy, color, width);
  g_painter.line( sx+dx0, sy+dy, sx+dx + dx0,  sy+dy, color, width);
}

guiToolbox.prototype._draw_noconn_icon = function()
{
  var mx = this.iconWidth/2, my = this.iconWidth/2, dx = this.iconWidth/6, dy = this.iconWidth/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;

  g_painter.line( mx-dx, my-dy, mx+dx, my+dy, color, width );
  g_painter.line( mx-dx, my+dy, mx+dx, my-dy, color, width );
}

guiToolbox.prototype._draw_conn_icon = function()
{
  var mx = this.iconWidth/2, my = this.iconWidth/2, r = 3;
  var color = "rgba(0,138,0, 0.5)";
  var width = 2;

  g_painter.circle( mx, my, r, width, color, true, color);
}

guiToolbox.prototype._draw_conn_tab_icon = function()
{
  var x = 0;
  var y = this.iconWidth/3;
  var w = this.iconWidth/3;
  var h = this.iconWidth - y;

  var color = "rgba(0, 0, 255, 0.2)";

  var path = [ [0, 0], [x+w, y], [x+w, y+h] , [0, y+h] ];
  g_painter.drawBarePolygon( path, 0, 0, color );
}



guiToolbox.prototype.debug_print = function()
{
  console.log("debug");
}

guiToolbox.prototype._debug_print = function( x )
{
  console.log(x);
}

guiToolbox.prototype._draw_label_icon = function()
{
  var mx = this.iconWidth/2, my = this.iconWidth/2;
  var h = this.iconWidth/1.2;
  g_painter.drawTextSimpleFont( "L", mx, my, "rgba(0,0,0,0.9)", h, "Calibri");

}

guiToolbox.prototype._draw_rotccw_icon = function()
{
  var sz = 10;
  var sx = this.iconWidth/2-sz/2, sy = this.iconWidth/2-sz/2;

  var r = parseInt(8 * this.iconWidth /10);
  g_imgcache.draw( "rotate_ccw", 3, 1, r, r, 0.6);
}

guiToolbox.prototype._draw_rotcw_icon = function()
{
  var sz = 10;
  var sx = this.iconWidth/2-sz/2, sy = this.iconWidth/2-sz/2;

  var r = parseInt(8 * this.iconWidth /10);
  g_imgcache.draw( "rotate_cw", 3, 1, r, r, 0.6);
}

guiToolbox.prototype._draw_delete_icon = function()
{
  var sz = 10;
  var sx = this.iconWidth/2-sz/2, sy = this.iconWidth/2-sz/2;

  var r = parseInt(8 * this.iconWidth /10);
  g_imgcache.draw( "trash", 3, 1, r, r, 0.6);

  g_painter.drawRectangle( 0, 0, this.iconWidth, this.iconWidth, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.2)");
}

guiToolbox.prototype._draw_help_icon = function()
{
  var mx = this.iconWidth/2, my = this.iconWidth/2;
  var h = this.iconWidth/1.2;

  g_painter.drawRectangle( 0, 0, this.iconWidth, this.iconWidth, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.2)");
  g_painter.drawTextSimpleFont( "?", mx, my, "rgba(0,0,0,0.9)", h, "Calibri");
}


guiToolbox.prototype.defaultSelect = function()
{
  this.iconNav.selected = true;
  this.dropWire.selected = false;
  this.dropConn.selected = false;
  this.dropLabel.selected = false;
  this.dropRotate.selected = false;
  this.iconDelete.selected = false;
  this.iconHelp.selected = false;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiToolbox.prototype.deleteSelect = function()
{
  this.iconNav.selected = false;
  this.dropWire.selected = false;
  this.dropConn.selected = false;
  this.dropLabel.selected = false;
  this.dropRotate.selected = false;
  this.iconDelete.selected = true;
  this.iconHelp.selected = false;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiToolbox.prototype.wireSelect = function()
{
  this.iconNav.selected = false;
  this.dropWire.selected = true;
  this.dropConn.selected = false;
  this.dropLabel.selected = false;
  this.dropRotate.selected = false;
  this.iconDelete.selected = false;
  this.iconHelp.selected = false;


  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_wire_s24.png') 4 3, cursor";
}

/*
guiToolbox.prototype.busSelect = function()
{
  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiToolbox.prototype.connSelect = function()
{
  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiToolbox.prototype.noconnSelect = function()
{
  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = true;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}
*/


// children will be in weird places, so don't confine it to the box of the
// guiToolbox.
//
guiToolbox.prototype.hitTest = function(x, y)
{

  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  for (var ind in this.guiChildren )
  {
    if (this.guiChildren[ind].visible)
    {

      var r = this.guiChildren[ind].hitTest(x, y);
      if (r) return r;
    }
  }

  return null;


  if ( (0 <= u[0]) && (u[0] <= this.width) &&
       (0 <= u[1]) && (u[1] <= this.height) )
  {
    return this;
  }
  
  return null;
}

guiToolbox.prototype._handleWireEvent = function(ev)
{

  //this.iconConnTab.visible = true;
  this.dropConn.iconTab.visible = true;
  this.dropLabel.iconTab.visible = true;
  this.dropRotate.iconTab.visible = true;

  if (ev.owner == this.name + ":wire")
  {
    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolWire(0, 0, false);

    this.dropWire.selected = true;

    this.dropConn.selected = false;
    this.iconNav.selected = false;
    this.dropLabel.selected = false;
    this.dropRotate.selected = false;
    this.iconDelete.selected = false;
    this.iconHelp.selected = false;



    g_painter.dirty_flag = true;

  }
  else if (ev.owner == this.name + ":bus")
  {
    g_painter.dirty_flag = true;
  }

}


guiToolbox.prototype._handleConnEvent = function(ev)
{

  this.dropLabel.iconTab.visible = true;
  this.dropRotate.iconTab.visible = true;

  if (ev.owner == this.name + ":conn")
  {
    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolConn(0, 0, "connection");

    this.dropConn.selected = true;

    this.dropWire.selected = false;
    this.iconNav.selected = false;
    this.dropLabel.selected = false;
    this.dropRotate.selected = false;
    this.iconDelete.selected = false;
    this.iconHelp.selected = false;


    g_painter.dirty_flag = true;
  }
  else if (ev.owner == this.name + ":noconn")
  {
    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolConn(0, 0, "noconn");

    this.dropConn.selected = true;

    this.dropWire.selected = false;
    this.iconNav.selected = false;
    this.dropLabel.selected = false;
    this.dropRotate.selected = false;
    this.iconDelete.selected = false;
    this.iconHelp.selected = false;


    g_painter.dirty_flag = true;

  }

}

guiToolbox.prototype._handleLabelEvent = function(ev)
{
  this.dropRotate.iconTab.visible = true;

  if (ev.owner == this.name + ":droplabel")
  {
    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolLabel(0, 0, "label", false);

    this.dropLabel.selected = true;

    this.dropConn.selected = false;
    this.dropWire.selected = false;
    this.iconNav.selected = false;
    this.dropRotate.selected = false;
    this.iconDelete.selected = false;
    this.iconHelp.selected = false;


    g_painter.dirty_flag = true;
  }

}

guiToolbox.prototype._handleRotateEvent = function(ev)
{

  if ( (ev.owner != this.name + ":rot_ccw") &&
       (ev.owner != this.name + ":rot_cw") )
    return;

  this.dropRotate.selected = true;

  this.dropConn.selected = false;
  this.dropWire.selected = false;
  this.iconNav.selected = false;
  this.dropLabel.selected = false;
  this.iconDelete.selected = false;
  this.iconHelp.selected = false;

  g_painter.dirty_flag = true;

  if (ev.owner == this.name + ":rot_ccw")
  {
    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolRotate(0, 0, "ccw");
  }
  else if (ev.owner == this.name + ":rot_cw")
  {
    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolRotate(0, 0, "cw");
  }

}


guiToolbox.prototype._eventMouseDown = function( ev )
{

  if (ev.owner == this.name + ":nav")
  {
    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";

    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolNav();

    this.iconNav.selected = true;

    this.dropConn.selected = false;
    this.dropWire.selected = false;
    this.dropLabel.selected = false;
    this.dropRotate.selected = false;
    this.iconDelete.selected = false;
    this.iconHelp.selected = false;


    g_painter.dirty_flag = true;

    return;
  }

  else if ( ev.owner.match(/:(wire|bus)$/) )
  {
    this._handleWireEvent(ev);
  }
  else if ( ev.owner.match(/:(conn|noconn)$/) )
  {
    this._handleConnEvent(ev);
  }
  else if ( ev.owner.match(/:.*label$/) )
  {
    this._handleLabelEvent(ev);
  }

  else if ( ev.owner.match(/:(rot_ccw|rot_cw)$/) )
  {
    this._handleRotateEvent(ev);
  }

  else if (ev.owner == this.name + ":dropwire:tab")
  {
    if ( this.dropWire.showDropdown )
    {
      this.dropConn.contractSlim();
      this.dropLabel.contractSlim();
      this.dropRotate.contractSlim();
    }
    else
    {
      this.dropConn.contract();
      this.dropLabel.contract();
      this.dropRotate.contract();
    }

  }

  else if (ev.owner == this.name + ":dropconn:tab")
  {
    if ( this.dropConn.showDropdown )
    {
      this.dropLabel.contractSlim();
      this.dropRotate.contractSlim();
    }
    else
    {
      this.dropLabel.contract();
      this.dropRotate.contract();
    }

    g_painter.dirty_flag = true;
  }

  else if (ev.owner == this.name + ":droplabel:tab")
  {
    if ( this.dropLabel.showDropdown )
    {
      this.dropRotate.contractSlim();
    }
    else
    {
      this.dropRotate.contract();
    }

    g_painter.dirty_flag = true;
  }

  else if (ev.owner == this.name + ":droprotate:tab")
  {
    g_painter.dirty_flag = true;
  }

  else if (ev.owner == this.name + ":delete")
  {
    this.iconDelete.selected = true;

    this.dropWire.selected = false;
    this.dropConn.selected = false;
    this.iconNav.selected = false;
    this.dropLabel.selected = false;
    this.dropRotate.selected = false;
    this.iconHelp.selected = false;

    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolDelete();
    g_painter.dirty_flag = true;
  }

  else if (ev.owner == this.name + ":help")
  {
    this.iconHelp.selected = true;

    this.dropWire.selected = false;
    this.dropConn.selected = false;
    this.iconNav.selected = false;
    this.dropLabel.selected = false;
    this.dropRotate.selected = false;
    this.iconDelete.selected = false;

    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolHelp();
    g_painter.dirty_flag = true;
  }

}

guiToolbox.prototype._eventDoubleClick = function( ev )
{
  if (ev.owner == this.name + ":conn")
  {
    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolConn( 0, 0, "connection", "persist");
    return;
  }
  else if (ev.owner == this.name + ":noconn")
  {
    if ("cleanup" in g_schematic_controller.tool)
      g_schematic_controller.tool.cleanup();

    g_schematic_controller.tool = new toolConn( 0, 0, "noconn", "persist");
    return;
  }
}

guiToolbox.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);
}

guiToolbox.prototype.draw = function()
{

}

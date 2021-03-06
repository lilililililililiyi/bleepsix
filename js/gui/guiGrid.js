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

function guiGrid( name , bgColor, fgColor, divColor, displayUnitFlag ) 
{
  bgColor = ( (typeof bgColor === 'undefined') ? "rgba(0, 0, 255, 0.2)" : bgColor );
  fgColor = ( (typeof bgColor === 'undefined') ? "rgba(0, 0, 255, 0.2)" : fgColor );
  divColor = ( (typeof divColor === 'undefined') ? "rgba(0, 0, 255, 0.2)" : divColor );
  displayUnitFlag = ( (typeof displayUnitFlag === 'undefined') ? false : displayUnitFlag );
  this.constructor ( name )   

  this.bgColor = bgColor;
  this.fgColor = fgColor;
  this.divColor = divColor;

  this.width = 24;
  this.iconWidth = 24;
  this.height = 24;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  this.move(10, 100);

  var cur_x = 0;
  var sz = this.iconWidth;


  // DISABLED FOR NOW
  // Units are not that important when drawing schematics, so for
  // simplicit, let's just take it out for now.
  // For the PCB portion, this will be important, so maybe we
  // should add a flag to turn it on or no.
  //
  // grouped wire functions (wire, bus, etc)
  //

  var c = this;
  var u = new guiDropIcon( this.name + ":dropgrid", this.iconWidth, this.iconWidth, true );
  u.bgColor = this.bgColor;
  u.divColor = this.divColor;
  u.addIcon( this.name + ":dropgrid:50", this._make_text_draw_function("50") );
  u.addIcon( this.name + ":dropgrid:25", this._make_text_draw_function("25") );
  u.addIcon( this.name + ":dropgrid:10", this._make_text_draw_function("10") );
  u.addIcon( this.name + ":dropgrid:5" , this._make_text_draw_function("5") );
  u.addIcon( this.name + ":dropgrid:2" , this._make_text_draw_function("2") );
  u.addIcon( this.name + ":dropgrid:1" , this._make_text_draw_function("1") );
  u.move(cur_x, 0);

  cur_x += u.width;

  this.dropGrid = u;
  this.addChild( u );

  if (displayUnitFlag)
  {

    var w = new guiDropIcon( this.name + ":dropunit", this.iconWidth, this.iconWidth, true );
    w.bgColor = this.bgColor;
    w.divColor = this.divColor;
    w.addIcon( this.name + ":imperial", this._make_text_draw_function("in") );
    w.move(cur_x, 0);

    this.dropUnit = w;
    this.addChild( w );
    cur_x += w.width;

  }


  this.move(5,5);

}
guiGrid.inherits ( guiRegion );

guiGrid.prototype._make_text_draw_function = function( txt )
{
  var t = this;
  return function()
  {
    g_painter.drawText(txt.toString(), t.iconWidth/2, t.iconHeight/2, "rgba(0,0,0,0.5)", 12, 0, "C", "C");
  }

}

// children will be in weird places, so don't confine it to the box of the
// guiGrid.
//
guiGrid.prototype.hitTest = function(x, y)
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
    //console.log( "guiRegion: " + this.name + " hit\n");
    return this;
  }
  
  return null;
}

guiGrid.prototype._handleUnitEvent = function(ev)
{

  if (ev.owner == this.name + ":imperial")
  {
    console.log("  imperial");
  }
  else if (ev.owner == this.name + ":metric")
  {
    console.log("  metric");
  }

}

guiGrid.prototype._handleSpacingEvent = function(ev)
{
  var parts = ev.owner.split(":");
  if (parts.length!=3) { return; }
  var v = parseInt(parts[2]);
  if (isNaN(v)) { return; }

  g_snapgrid = new snapGrid(true, "deci-mil", v);
}

guiGrid.prototype._handleClearanceEvent = function(ev)
{
  var parts = ev.owner.split(":");
  if (parts.length!=3) { return; }
  var v = parseInt(parts[2]);
  if (isNaN(v)) { return; }

  g_parameter.clearance = v*10;
}

guiGrid.prototype._handleTraceWidthEvent = function(ev)
{
  var parts = ev.owner.split(":");
  if (parts.length!=3) { return; }
  var v = parseInt(parts[2]);
  if (isNaN(v)) { return; }

  g_parameter.traceWidth = v*10;
}


guiGrid.prototype._eventMouseDown = function( ev )
{

  if (ev.owner == this.name + ":nav")
  {

    // DISABLED!
    // this needs to be registered by the instanstiator
    // to make sure the proper controller gets the tool
    // depending on whether it's in the schematic or
    // pcb portion, not just the schematic portion.
    //
    //g_schematic_controller.tool = new toolNav();
    return;
  }

  else if ( ev.owner.match(/:(imperial|metric)$/) )
  {
    this._handleUnitEvent(ev);
  }

  //else if ( ev.owner.match(/:(\d+)$/) )
  else if ( ev.owner.match(/:dropgrid:(\d+)$/) )
  {
    this._handleSpacingEvent(ev);
  }

  else if ( ev.owner.match(/:dropclearance:(\d+)$/) )
  {
    this._handleClearanceEvent(ev);
  }

  else if ( ev.owner.match(/:droptracewidth:(\d+)$/) )
  {
    this._handleTraceWidthEvent(ev);
  }

  else if (ev.owner == this.name + ":dropunit:tab")
  {
    console.log("  unit tab!");

    // hide (or show) the tabs from other tools that stick out below it
    //
    //this.dropConn.iconTab.visible = !this.dropConn.iconTab.visible;
    //if ( this.dropConn.showDropdown ) this.dropConn.toggleList();

  }

  else if (ev.owner == this.name + ":dropgrid:tab")
  {
    console.log("  grid tab");

    //if ( this.dropWire.showDropdown ) this.dropWire.toggleList();
    //g_painter.dirty_flag = true;
  }

}

guiGrid.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);


}

guiGrid.prototype.draw = function()
{

}



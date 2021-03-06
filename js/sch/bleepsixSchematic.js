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


// TODO: arcs still need implementing
//

var bleepsixSchematicHeadless = false;
if (typeof module !== 'undefined')
{
  bleepsixSchematicHeadless = true;

  var numeric = require("../lib/numeric.js");
  //var $ = require("../lib/jquery.js");
  var bleepsixAux = require("../lib/meowaux.js");

  var guid = bleepsixAux.guid;
  var s4 = bleepsixAux.s4;
  var simplecopy = bleepsixAux.simplecopy;

}


function bleepsixSchematic()
{
  this.net          = {};
  this.wire         = {};
  this.netlist      = {};
  this.component    = {};
  this.connection   = {};

  this.kicad_sch_json = { "element":[] ,
                          "net_pin_id_map": {},
                          "component_lib" : {}  };

  // reference by id
  this.ref_lookup = {};

  //this.kicad_brd_json = { "element":[] };
  this.displayable = true;

  this.eventStack = { n : 0, pos : 0, stack : [] };

  this.queued_display_component_count = 0;

  //this.draw_bounding_box_flag = true;
  this.draw_bounding_box_flag = false;

  //this.draw_id_text_flag = true;
  this.draw_id_text_flag = false;

  this.highlight_net = [];
  this.highlight_net_flag = false;


  this.reference_number = {};

  this.log = [];
  this.id = 1;

  this.debug = false;

  //this.local_component_cache = {};

  //this.net_pin_id_map = {};

}



bleepsixSchematic.prototype.init = function( paint )
{
  this.painter = paint;
}

bleepsixSchematic.prototype.clear = function() 
{
  this.net          = {};
  this.wire         = {};
  this.netlist      = {};
  this.component    = {};
  this.connection   = {};

  this.boundingBox  = {};
  this.position     = {};
  this.orientation  = {};

  //this.local_component_cache = {};
}

// deprecated...
/*
bleepsixSchematic.prototype.setLocalComponentCache = function( component_cache )
{
  this.local_component_cache = component_cache;
}
*/


bleepsixSchematic.prototype._createId = function( parent_id )
{
  var id_str;
  var id = String( guid() );

  if ( typeof parent_id !== 'undefined' ) 
  {
    //id_str = parent_id + "," + String(this.id);
    id_str = parent_id + "," + id;
  }
  else
  {
    //id_str = String(this.id);
    id_str = id;
  }

  this.id++;
  return id_str;

}


bleepsixSchematic.prototype.getPinNetMap = function()
{
  //return this.net_pin_id_map ;
  return this.kicad_sch_json.net_pin_id_map ;
}

bleepsixSchematic.prototype.updateNets = function( net_info )
{

  //this.net_pin_id_map = net_info;
  this.kicad_sch_json.net_pin_id_map = net_info;

}

bleepsixSchematic.prototype.dataReplace = function( id, data )
{
  var sch = this.kicad_sch_json.element;
  for (var ind in sch)
  {
    if (sch[ind].id == id)
    {
      sch[ind] = data;
      this.ref_lookup[id] = data;
      return true;
    }
  }

  console.log("bleepsixSchematic.refUpdate: ERROR could not find id " + id );
  return false;
}

bleepsixSchematic.prototype.refUpdate = function( oldId, newId )
{
  if (oldId == newId)
    return;

  if ( oldId in this.ref_lookup )
  {
    this.ref_lookup[ newId ] = this.ref_lookup[ oldId ];
    delete this.ref_lookup[ oldId ];
  }
}

bleepsixSchematic.prototype.refLookup = function( id )
{

  if (id in this.ref_lookup)
    return this.ref_lookup[ id ];

  var sch = this.kicad_sch_json["element"];
  var ind;

  for (ind in sch)
  {

    this.ref_lookup[ sch[ind].id ] = sch[ind];

    if ( id == sch[ind].id )
      return this.ref_lookup[id];

    if (sch[ind].type == "component")
    {
      for (var t_ind in sch[ind].text)
      {
        this.ref_lookup[ sch[ind].text[t_ind].id ] = sch[ind].text[t_ind];
        if ( id == sch[ind].text[t_ind].id )
          return this.ref_lookup[ id ];
      }
    }

  }

  console.log("bleepsixSchematic.refLookup: ERROR: id " , id , " not found!");

  return null;

}

bleepsixSchematic.prototype.makeUnknownComponentTextField = function(x , y )
{
  var obj =
  {
    "bounding_box" : [ [ -50, -50] , [50,50] ],
    "text" : "??",
    "orientation": "H",
    "reference": "??",
    "hjustify": "C",
    "number": 0,
    "vjustify": "C",
    "visible": true,
    "bold": false,
    //"italic": true,
    "italic": false,
    "x": x,
    "y": y,
    "size": "100",
    "transform" : [ [ 1, 0 ], [ 0, -1 ] ],
    "flags" : "0000 C CNN"
  };

  return obj;

}

bleepsixSchematic.prototype.makeUnknownComponent= function( size, id, text_ids )
{
  //g_component_cache['unknown'] = {
  var obj = {
    "name": "unknown",
    "reference" : "Z",
    "bounding_box" : [ [ -250, -250], [250, 250] ],
    "type" : "component",
    "timestamp" : "52566B9A",
    "transform" : [ [1,0],[0,-1] ],
    "mm" : 1,
    "nn" : 1,

    "unknown_text_field" : 
      {
        "bounding_box" : [ [ -50, -50] , [50,50] ],
        "text" : "??",
        "orientation": "H",
        "reference": "??",
        "hjustify": "C",
        "number": 0,
        "vjustify": "C",
        "visible": true,
        "bold": false,
        "italic": true,
        "x": 0,
        "y": 0,
        "size": "100",
        "transform" : [ [ 1, 0 ], [ 0, -1 ] ],
        "flags" : "0000 C CNN"
      },


    "text" : [
      {
        "bounding_box" : [ [ -50, -50] , [50,50] ],
        "text" : "??",
        "orientation": "H",
        "reference": "Z",
        "hjustify": "C",
        "number": 0,
        "vjustify": "C",
        "visible": false,
        "bold": false,
        "italic": false,
        "y": "0",
        "x": "0",
        "size": "60",
        "flags" : "0000 C CNN"
      },

      {
        "bounding_box" : [ [ -50, -50] , [50,50] ],
        "text" : "??",
        "orientation": "H",
        "reference": "??",
        "hjustify": "C",
        "number": 1,
        "vjustify": "C",
        "visible": true,
        "bold": false,
        "italic": false,
        "y": "0",
        "x": "0",
        "size": "60",
        "flags" : "0000 C CNN"
      }

    ],

    "art" : [
      {
        "count" : 5,
        "line_width" : 0,
        "shape" : "path",
        "path" : [
          [  250,  250 ],
          [ -250,  250 ],
          [ -250, -250 ],
          [  250, -250 ],
          [  250,  250 ]
        ],
        "de_morgan_alternate_shape" : "1",
        "unit" : "0",
        "fill" : "N"
      }
     ]

  };

  return obj;

}



// Set default values for the name and reference of the component,
// taken from the library components two text fields.
// If there aren't two (but one?) we have to shove values in
// that might not be appropriate.  Revist when we get a chance...
//

bleepsixSchematic.prototype.extendComponentText = function( dst_comp_ref, src_comp_ref )
{
  var cx = parseFloat( src_comp_ref.x );
  var cy = parseFloat( src_comp_ref.y );

  var dst_cx = 0; //parseFloat( dst_comp_ref.x );
  var dst_cy = 0; //parseFloat( dst_comp_ref.y );

  for (var ind in src_comp_ref.text )
  {
    var tx = parseFloat( src_comp_ref.text[ind].x ) ;
    var ty = parseFloat( src_comp_ref.text[ind].y ) ;

    var dx = tx - cx;
    var dy = ty - cy;

    dst_comp_ref.text[ind].x = dst_cx + dx;
    dst_comp_ref.text[ind].y = dst_cy + dy;

    //dst_comp_ref.text[ind].x = dx;
    //dst_comp_ref.text[ind].y = dy;

    dst_comp_ref.text[ind].orientation = src_comp_ref.text[ind].orientation;

    // text position 0 is used as a reference that auto increments
    // so don't touch it so references can sort of work.
    // This will break if users start putting in their own references.
    // I don't know what to do in this situation, so this is subject
    // to change.
    //
    if (ind > 0)
      dst_comp_ref.text[ind].text = src_comp_ref.text[ind].text;

    // uhg, I really don't know what to do...
    // HACK!  copy name over for text reference 1?
    if (ind == 1)
    {
      dst_comp_ref.text[ind].name = src_comp_ref.text[ind].text;
      dst_comp_ref.text[ind].reference = src_comp_ref.text[ind].text;
    }


  }

}

// When loading in a new schematic, if we don't update the internal
// reference_number hash that's used to allocate new hashes,
// we'll get reference collsions.
// Update the reference_number hash based on what's in the schematic
// here.
//
bleepsixSchematic.prototype._updateReference = function()
{

  var sch = this.kicad_sch_json.element;

  for (var ind=0; ind<sch.length; ind++)
  {
    var ref = sch[ind];

    if (ref.type != "component")
      continue;


    var ref_name = ref.reference.replace( /[\d+\?]+$/, '' );

    var ref_num = '?';
    if ( ref.reference.match( /[\d+]+$/) )
    {
      ref_num = ref.reference.match( /[\d+]+$/ )[0];
    }

    if ( ref_num.length == 0 )
      ref_num = 1;

    if (ref_num != '?')
    {
      ref_num = parseInt(ref_num);
    }

    if (ref_name in this.reference_number)
    {
      if ( parseInt(this.reference_number[ref_name]) < ref_num )
        this.reference_number[ref_name] = ref_num;
    }
    else
    {
      this.reference_number[ref_name] = ref_num;
    }

  }

}


// Allocate and return a new reference identification based on the
// reference from the part data passed in.
//
bleepsixSchematic.prototype.getReferenceName = function( comp_ref )
{
  var ref_name = comp_ref.reference;
  var ref_num = 1;

  //console.log("getReferenceName: " + ref_name );
  //console.log( comp_ref );

  ref_name = ref_name.replace( /[\d+\?]+$/, '' );

  if (ref_name in this.reference_number)
  {
    ref_num = ++this.reference_number[ref_name];
  }
  else
  {
    this.reference_number[ref_name] = ref_num;
  }

  return ref_name + ref_num.toString();
}

bleepsixSchematic.prototype.setComponentTransform = function( comp_ref, trans )
{

  comp_ref["transform"][0][0] = trans[0][0];
  comp_ref["transform"][0][1] = trans[0][1];
  comp_ref["transform"][1][0] = trans[1][0];
  comp_ref["transform"][1][1] = trans[1][1];

}

bleepsixSchematic.prototype.setNonWirePosition = function( ref, x, y )
{
  ref["x"] = x;
  ref["y"] = y;
}


bleepsixSchematic.prototype.setWire = function( ref, startx, starty, endx, endy  )
{
  ref["startx"] = startx;
  ref["starty"] = starty;
  ref["endx"] = endx;
  ref["endy"] = endy;
}



bleepsixSchematic.prototype.findElement = function( id )
{

  for (var ind in this.kicad_sch_json["element"])
  {
    var ele = this.kicad_sch_json["element"][ind];

    if (id == ele["id"])
      return { "id":id, "ref":ele };
  }

  return null;
}


bleepsixSchematic.prototype.remove = function( id_ref )
{
  var ele;
  var id = id_ref.id;
  var ref = id_ref.ref;

  for (var ind in this.kicad_sch_json["element"] )
  {
    ele = this.kicad_sch_json["element"][ind];

    if (id == ele["id"])
    {

      var e = this.kicad_sch_json["element"].pop();
      if ( ind < this.kicad_sch_json["element"].length )
        this.kicad_sch_json["element"][ind] = e;

      //console.log("deleting id:" + id);
      delete this.ref_lookup[id];
      if (ref.type == "component")
      {
        for (var t_ind in ref.text)
        {
          if ( ref.text[t_ind].id in this.ref_lookup )
          {
            //console.log("deleting sub id:" + ref.text[t_ind].id );
            delete this.ref_lookup[ ref.text[t_ind].id ];
          }
        }
      }

      if (!bleepsixSchematicHeadless)
        g_painter.dirty_flag = true;
      return;

    }

  }
}

bleepsixSchematic.prototype.rotate90 = function( id_ref , ccw_flag )
{

  ccw_flag = ( typeof ccw_flag !== 'undefined' ? ccw_flag : true );
  var comp = id_ref["ref"];

  if ( ( comp["type"] == "noconn" ) ||
       ( comp["type"] == "connection" ) )
    return;

  if ( (comp.type == "textnote") ||
       (comp.type == "label") ||
       (comp.type == "labelglobal") ||
       (comp.type == "labelheirarchical") )
  {
    var di = ( ccw_flag ? 1 : 3 );
    comp.orientation = (parseInt(comp.orientation) + 1)%4;
    return;
  }

  var transform = [ [0, -1], [1, 0] ];
  if (ccw_flag) transform = [ [ 0, 1], [-1, 0] ];

  comp["transform"] = numeric.dot( transform, comp["transform"] );
  this.updateBoundingBox( comp );

  //g_painter.dirty_flag = true;

}

bleepsixSchematic.prototype.flip = function( id_ref )
{

  var comp = id_ref["ref"];

  if ( comp.type != 'component' )
  {
    console.log("WARNING: bleepsixSchematic.flip: trying to flip non component");
  }

  var transform = [ [-1, 0], [0, 1] ];

  comp["transform"] = numeric.dot( transform, comp["transform"] );
  this.updateBoundingBox( comp );

  //g_painter.dirty_flag = true;

}

bleepsixSchematic.prototype.centerOfMass = function ( id_refs )
{
  var x = 0, y = 0, n = 0

  if ( id_refs.length == 0 ) return null;

  for (var ind in id_refs)
  {
    ref  = id_refs[ind]["ref"];
    type = ref["type"];

    if ( (type == "component") ||
         (type == "noconn") ||
         (type == "connection") ||
         (type == "text") ||
         (type == "textnote") ||
         (type == "label") ||
         (type == "labelglobal") ||
         (type == "labelheirarchical") 
         )
    {

      x += parseInt( ref["x"] );
      y += parseInt( ref["y"] );

    }
    else 
    {
      x += ( parseInt( ref["startx"] ) + parseInt( ref["endx"] ) ) / 2;
      y += ( parseInt( ref["starty"] ) + parseInt( ref["endy"] ) ) / 2;
    }

  }

  return { "x" :  (x / id_refs.length), "y" : (y / id_refs.length) } ;

}

bleepsixSchematic.prototype.rotateAboutPoint90 = function ( id_refs, x, y, ccw_flag )
{
  x = parseInt(x);
  y = parseInt(y);

  ccw_flag = ( typeof ccw_flag !== 'undefined' ? ccw_flag : true );

  var T = [ [ 0, 1 ], [ -1, 0 ] ];
  if (ccw_flag) T = [ [0, -1], [1, 0] ];

  for (var ind in id_refs)
  {
    ref = id_refs[ind]["ref"];

    if ( ( ref["type"] == "noconn" ) ||
         ( ref["type"] == "connection" ) )
    {
      var v = [ parseInt( ref["x"] ) - x, parseInt( ref["y"] ) - y ];
      var v_t = numeric.dot( T, v );

      ref["x"] = v_t[0] + x;
      ref["y"] = v_t[1] + y;

    }

    else if ( ( ref.type == "label" ) ||
         ( ref.type == "labelglobal" ) ||
         ( ref.type == "labelheirarchical" ) )
    {

      //console.log("label ... " + ref.orientation);
      //console.log(ref);

      var v = [ parseInt( ref["x"] ) - x, parseInt( ref["y"] ) - y ];
      var v_t = numeric.dot( T, v );

      var di = ( ccw_flag ? 1 : 3 );
      ref.orientation = (parseInt(ref.orientation) + 1)%4;

      //console.log("..." + ref.orientation);

      ref["x"] = v_t[0] + x;
      ref["y"] = v_t[1] + y;
    }

    else if ( ref.type == "textnote" )
    {
      var v = [ parseInt( ref["x"] ) - x, parseInt( ref["y"] ) - y ];
      var v_t = numeric.dot( T, v );

      //console.log("textnote ... " + ref.orientation);

      var di = ( ccw_flag ? 1 : 3 );
      ref.orientation = (parseInt(ref.orientation) + 1)%4;

      ref["x"] = v_t[0] + x;
      ref["y"] = v_t[1] + y;
    }

    else if ( ref["type"] == "component")
    {
      var comp_x = parseInt( ref["x"] );
      var comp_y = parseInt( ref["y"] );

      var v = [ comp_x - x, comp_y - y ];
      var v_t = numeric.dot( T, v );

      ref["transform"] = numeric.dot( T, ref["transform"] );

      ref["x"] = v_t[0] + x;
      ref["y"] = v_t[1] + y;


      for (var t_ind in ref["text"])
      {
        text_x = parseInt(ref["text"][t_ind]["x"]);
        text_y = parseInt(ref["text"][t_ind]["y"]);

        // Even though text co-ordinates are stored in what appears to be absolute positon,
        // the actual position is the vector of that position minus the component position
        // with the transform applied.
        // This means we don't have to apply the transform to the local text coordinates, we
        // just need to reposition them as if the component itself wasn't rotated locally.
        //
        var local_text_coord = [ text_x - comp_x, text_y - comp_y ];
        ref["text"][t_ind]["x"] = ref["x"] + local_text_coord[0];
        ref["text"][t_ind]["y"] = ref["y"] + local_text_coord[1];

      }

    }
    //else if ( ref["type"] == "text" ) { }
    else 
    {
      
      var v = [ [ parseInt( ref["startx"] ) - x, parseInt( ref["starty"] ) - y ],
                [ parseInt( ref["endx"] ) - x, parseInt( ref["endy"] ) - y ] ];
      var v_t = numeric.transpose( numeric.dot( T, numeric.transpose(v) ) );

      ref["startx"] = v_t[0][0] + x;
      ref["starty"] = v_t[0][1] + y;

      ref["endx"] = v_t[1][0] + x;
      ref["endy"] = v_t[1][1] + y;

    }
  }

}

//-----------------------------------

bleepsixSchematic.prototype.toCacheName = function( name )
{
  //return encodeURIComponent( encodeURIComponent( name ) ) ;
  return (name);
}

//-----------------------------------

bleepsixSchematic.prototype.pickComponentPin = function( comp, x, y)
{

  //var name = comp.name;
  var name = this.toCacheName( comp.name );

  var component_lib = this.kicad_sch_json.component_lib;

  //if ( !(name in g_component_cache) )
  if ( !(name in component_lib) )
  {
    //console.log("ERROR: bleepsixSchematic.pickComponentPin, no entry in g_component_cache for " + name );
    console.log("ERROR: bleepsixSchematic.pickComponentPin, no entry in component_lib for " + name );
    return -1;
  }

  var transform = comp.transform;

  //for ( var ind in g_component_cache[name].pin )
  for ( var ind in component_lib[name].pin )
  {

    //var pin = g_component_cache[name].pin[ind];
    var pin = component_lib[name].pin[ind];
    var u = numeric.dot( transform, [ parseInt(pin.x), parseInt(pin.y) ] );

    u[0] += parseInt(comp.x);
    u[1] += parseInt(comp.y);

    if ( (Math.abs(u[0] - x) < 5) &&
         (Math.abs(u[1] - y) < 5) )
      return pin;

  }

  return null;
}

// might not be needed anymore
/*
bleepsixSchematic.prototype.pickComponent = function( comp, x, y )
{
  var bbox = comp["bounding_box"];

  var x0 = bbox[0][0];
  var y0 = bbox[0][1];
  var w = bbox[1][0] - bbox[0][0];
  var h = bbox[1][1] - bbox[0][1];

  var x1 = x0 + w;
  var y1 = y0 + h;

  var name = comp["name"];

  if ( ( x <= x1 ) && ( x >= x0 ) &&
       ( y <= y1 ) && ( y >= y0 ) )
    return { "id":comp["id"], "ref":comp};

  var text = comp["text"];
  for (var ind in text)
  {
    if ( !text[ind]["visible"] ) continue;

    bbox = text[ind]["bounding_box"];

    x0 = bbox[0][0];
    y0 = bbox[0][1];
    w = bbox[1][0] - bbox[0][0];
    h = bbox[1][1] - bbox[0][1];

    x1 = x0 + w;
    y1 = y0 + h;

    if ( ( x <= x1 ) && ( x >= x0 ) &&
         ( y <= y1 ) && ( y >= y0 ) ) 
      return text[ind]["id"];
  }

}
*/

/*

bleepsixSchematic.prototype.pickLine = function( comp, x, y )
{
}

bleepsixSchematic.prototype.pickNoconn = function( comp, x, y )
{
}

bleepsixSchematic.prototype.pickConnection= function( comp, x, y )
{
}

bleepsixSchematic.prototype.pickText = function( comp, x, y )
{
}

*/

bleepsixSchematic.prototype.pickElement = function( ele, x, y )
{
  if (!this.displayable) return null;

  var bbox = ele["bounding_box"];

  if (!bbox) return null;

  var x0 = bbox[0][0];
  var y0 = bbox[0][1];
  var w = bbox[1][0] - bbox[0][0];
  var h = bbox[1][1] - bbox[0][1];

  var x1 = x0 + w;
  var y1 = y0 + h;

  var name = ele["name"];

  var r_ref = null;
  if ( ( x <= x1 ) && ( x >= x0 ) &&
       ( y <= y1 ) && ( y >= y0 ) )
    //return { "id":ele["id"], "ref":ele };
    r_ref = { "id":ele["id"], "ref":ele };


  if (ele["type"] == "component")
  {

    var text = ele["text"];
    for (var ind in text)
    {
      if ( !text[ind]["visible"] ) continue;

      bbox = text[ind]["bounding_box"];

      x0 = bbox[0][0];
      y0 = bbox[0][1];
      w = bbox[1][0] - bbox[0][0];
      h = bbox[1][1] - bbox[0][1];

      x1 = x0 + w;
      y1 = y0 + h;

      if ( ( x <= x1 ) && ( x >= x0 ) &&
           ( y <= y1 ) && ( y >= y0 ) ) 
        return { "id": ele["id"], "ref" : ele, "type": "text", "index" : ind };
        //return { "id": text[ind]["id"], "ref" : ele, "type": "text", "index" : ind };
    }

  }

  return r_ref;

}



// precedence is component, lines, noconnect, connection
// x and y are world coordinates
// returns id of component if found, null otherwise
//
bleepsixSchematic.prototype.pick = function(x, y)
{

  if (!this.displayable) return [];

  var sch = this.kicad_sch_json["element"];
  var id_ref;
  var id_ref_save = null;

  for (var ind in sch)
  {
    id_ref = this.pickElement( sch[ind], x, y );
    if (id_ref) 
    {
      if (id_ref["ref"]["type"] == "component")
        return id_ref;
      else id_ref_save = id_ref;
    }
  }

  return id_ref_save;

}

// return an array of all elements within bounding box
//
bleepsixSchematic.prototype.pickAll = function(x, y)
{

  if (!this.displayable) return [];

  var ar = [];
  var sch = this.kicad_sch_json["element"];
  var id_ref;

  for (var ind in sch)
  {
    id_ref = this.pickElement( sch[ind], x, y );
    if (id_ref) 
      ar.push( id_ref );
  }

  return ar;

}

// http://stackoverflow.com/questions/2752349/fast-rectangle-to-rectangle-intersection
// function intersectRect(r1, r2) {
//   return !(r2.left > r1.right || 
//   r2.right < r1.left || 
//   r2.top > r1.bottom ||
//   r2.bottom < r1.top);
// }
//
// world y co-ordinate is negated
//
function box_box_intersect( bb0, bb1 )
{

  return !( (bb1[0][0] > bb0[1][0]) ||
            (bb1[1][0] < bb0[0][0]) ||
            (-bb1[1][1] > -bb0[0][1]) ||
            (-bb1[0][1] < -bb0[1][1]) );

}

// return an array of all elements within bounding box
//
bleepsixSchematic.prototype.pickBox = function(x0, y0, x1, y1)
{

  var ar = [];
  var sch = this.kicad_sch_json["element"];

  bbox = [ [ x0, y0 ], [ x1, y1] ];

  for (var ind in sch)
  {
    if (box_box_intersect( sch[ind]["bounding_box"], bbox ))
      ar.push( { "id" : sch[ind]["id"], "ref": sch[ind] } );
  }

  return ar;

}

bleepsixSchematic.prototype.relativeMoveElement = function( id_ref, dx, dy )
{
  dx = parseInt(dx);
  dy = parseInt(dy);

  ref = id_ref["ref"];

  if ( (ref["type"] == "connection") || 
       (ref["type"] == "noconn") ||
       (ref["type"] == "textnote") ||
       (ref["type"] == "label") ||
       (ref["type"] == "labelglobal") ||
       (ref["type"] == "labelheirarchical") 
       )
  {
    ref["x"] = parseInt(ref["x"]) + dx;
    ref["y"] = parseInt(ref["y"]) + dy;
  }
  else if (ref["type"] == "component")
  {

    ref["x"] = parseInt( ref["x"] ) + dx;
    ref["y"] = parseInt( ref["y"] ) + dy;

    for (var ind in ref["text"])
    {
      ref["text"][ind]["x"] = parseInt( ref["text"][ind]["x"] ) + dx ;
      ref["text"][ind]["y"] = parseInt( ref["text"][ind]["y"] ) + dy ;
    }

    if ("unknown_text_field" in ref)
    {
      ref["unknown_text_field"]["x"] = parseInt( ref["unknown_text_field"]["x"] ) + dx ;
      ref["unknown_text_field"]["y"] = parseInt( ref["unknown_text_field"]["y"] ) + dy ;
    }

  }

  // else if (ref["type"] == "text") { } 
  else {  // wire
    ref["startx"] = parseInt( ref["startx"] ) + dx;
    ref["starty"] = parseInt( ref["starty"] ) + dy;
    ref["endx"] = parseInt( ref["endx"] ) + dx;
    ref["endy"] = parseInt( ref["endy"] ) + dy;
  }

}


bleepsixSchematic.prototype.addWire = function(x0, y0, x1, y1, id)
{
  id  = ( (typeof id !== 'undefined') ? id : this._createId() );

  var line = {};
  line["startx"] = x0;
  line["starty"] = y0;

  line["endx"] = x1;
  line["endy"] = y1;

  line["type"] = "wireline";
  line["id"] = id;

  this.updateWireBoundingBox( line );

  this.kicad_sch_json["element"].push(line);

  return id;
}

bleepsixSchematic.prototype.addConnection = function( x, y, id )
{
  id  = ( (typeof id !== 'undefined') ? id : this._createId() );

  var conn = {};
  conn["type"] = "connection";
  conn["x"] = x;
  conn["y"] = y;
  conn["id"] = id;
  
  this.updateBoundingBox( conn );

  this.kicad_sch_json["element"].push(conn);
}

bleepsixSchematic.prototype.addNoconn = function( x, y, id )
{
  id  = ( (typeof id !== 'undefined') ? id : this._createId() );

  var noconn = {};
  noconn["type"] = "noconn";
  noconn["x"] = x;
  noconn["y"] = y;
  noconn["id"] = id;
  
  this.updateBoundingBox( noconn );

  this.kicad_sch_json["element"].push(noconn);
}

bleepsixSchematic.prototype.addLabel = function( text, x, y, orientation, dimension, id )
{

  dimension = ( (typeof dimension !== 'undefined') ? dimension : 60 );
  id  = ( (typeof id !== 'undefined') ? id : this._createId() );

  var label = {};
  label["type"] = "label";
  label["text"] = text;
  label["orientation"] = orientation;
  label["dimension"] = dimension;
  label["x"] = x;
  label["y"] = y;
  label["id"] = id;
  
  this.updateBoundingBox( label );

  this.kicad_sch_json["element"].push(label);

}


// still needs some fixing.
// 1) we need to decide if F0 (and all F(\d+) fields) should be stored as "text"
//   fields in the library json files as they are in the schematic files.
//   for consistency we probably should...
//   ***UPDATE: ok, so I did this.  library files have 'text' arrays in them with number fields
//     instead of e.g. 'f0' and 'f1'
//
// 2) I think the schematic is adding a few more text fields for one reason or
//   another...should we add a few just for consistency with KiCAD's sake?
// 3) timestamp???
//
bleepsixSchematic.prototype.addComponent = function( cache_comp_name, x, y, transform, id )
{

  transform = ( typeof transform !== 'undefined' ? transform : [ [1, 0], [0, 1] ] );

  //var comp_name = this.toCacheName( comp_name_raw );
  var comp_name = cache_comp_name;

  var component_lib = this.kicad_sch_json.component_lib;

  //if ( !(comp_name in g_component_cache) )
  if ( !(comp_name in component_lib) )
  {
    console.log("bleepsixSchematic.addComponent: ERROR: " + comp_name + " not in component cache");

    comp_name = "unknown";

    //return;

  }

  //json_component = g_component_cache[comp_name];
  //json_component = {};
  //$.extend(true, json_component, g_component_cache[comp_name] );
  //json_component = simplecopy( g_component_cache[comp_name] );
  json_component = simplecopy( component_lib[comp_name] );

  json_component.text[0].reference = json_component.text[0].reference + "?";

  this.addComponentData( json_component, x, y, transform, id );

}

bleepsixSchematic.prototype.updateComponentData = function( json_component, id )
{
  var ref = this.refLookup(id);
  if (!ref || (ref.type != "component"))
  {
    console.log("ERROR: updateComponentData failed to find component with id: " + id);
    return null;
  }

  //var t0xy = [ ref.text[0].x, ref.text[0].y ];
  //var t1xy = [ ref.text[1].x, ref.text[1].y ];
  var old_name = ref.name;
  var old_ref_name = ref.reference;

  var txt0 = json_component.text[0];
  var txt1 = json_component.text[1];
  var t0xy = [ parseFloat(ref.x) + parseFloat(txt0.x), 
               parseFloat(ref.y) + parseFloat(txt0.y) ];
  var t1xy = [ parseFloat(ref.x) + parseFloat(txt1.x), 
               parseFloat(ref.y) + parseFloat(txt1.y) ];

  //console.log(t0xy);
  //console.log(t1xy);

  ref["reference"] = json_component["reference"];
  ref["name"] = json_component["name"];

  for ( var key in json_component["text"][0] )
  {
    ref["text"][0][key] = json_component["text"][0][key];
  }
  ref["text"][0]["text"] = json_component.text[0].reference ;
  ref["text"][0]["x"] = t0xy[0];
  ref["text"][0]["y"] = t0xy[1];

  for ( var key in json_component["text"][1] )
  {
    ref["text"][1][key] = json_component["text"][1][key];
  }

  if (typeof json_component.text[1].text === 'undefined')
    ref["text"][1]["text"] = json_component["name"] ;
  else
    ref["text"][1]["text"] = json_component.text[1].text;
  ref["text"][1]["x"] = t1xy[0];
  ref["text"][1]["y"] = t1xy[1];

  ref["transform"] = [[1,0],[0,-1]];


}

bleepsixSchematic.prototype.addComponentData = function( json_component, x, y, transform, id, text_ids )
{
  id  = ( (typeof id !== 'undefined') ? id : this._createId() );
  text_ids = ( (typeof text_ids !== 'undefined') ? text_ids : [ this._createId(id), this._createId(id) ] );

  transform = ( typeof transform !== 'undefined' ? transform : [ [1, 0], [0, 1] ] );

  x = parseFloat(x);
  y = parseFloat(y);

  var comp_entry = {}

  comp_entry["type"] = "component";
  comp_entry["id"] = id;
  comp_entry["reference"] = json_component["reference"];
  comp_entry["name"] = json_component["name"];
  comp_entry["nn"] = "1";
  comp_entry["mm"] = "1";

  comp_entry["transform"] = [ [1,0],[0,1] ];
  comp_entry["transform"] = numeric.dot( transform, comp_entry["transform"] );

  comp_entry["timestamp"] = "5213C820";   //DUMMY!
  comp_entry["x"] = Math.floor(x);
  comp_entry["y"] = Math.floor(y);
  comp_entry["text"] = [ {}, {} ];

  for ( var key in json_component["text"][0] )
  {
    comp_entry["text"][0][key] = json_component["text"][0][key];
  }
  var fx = parseFloat(comp_entry["text"][0]["x"]);
  var fy = parseFloat(comp_entry["text"][0]["y"]);
  comp_entry["text"][0]["x"] = Math.floor(fx + x);
  comp_entry["text"][0]["y"] = Math.floor(fy + y);
  comp_entry["text"][0]["number"] = 0;
  //comp_entry["text"][0]["text"] = json_component.text[0].reference ;
  comp_entry["text"][0]["text"] = "";
  if ( ( "text" in json_component ) && 
       ( json_component.text.length > 0) &&
       ( "reference" in json_component.text[0] ) ) {
    comp_entry["text"][0]["text"] = json_component.text[0].reference ;
   }

  //comp_entry["text"][0]["id"] = id + "," + text_ids[0]
  comp_entry["text"][0]["id"] = text_ids[0]

  for ( var key in json_component["text"][1] )
  {
    comp_entry["text"][1][key] = json_component["text"][1][key];
  }
  var fx = parseFloat(comp_entry["text"][1]["x"]);
  var fy = parseFloat(comp_entry["text"][1]["y"]);
  comp_entry["text"][1]["x"] = Math.floor(fx + x);
  comp_entry["text"][1]["y"] = Math.floor(fy + y);
  comp_entry["text"][1]["number"] = 1;
  //comp_entry["text"][1]["id"] = id + "," + text_ids[1]
  comp_entry["text"][1]["id"] = text_ids[1]

  //comp_entry["text"][1]["text"] = json_component["name"] ;

  //UUUUHHHHHGGG!!!
  // I'll have to clean this up
  comp_entry["text"][1]["text"] = "";
  if ( ( "text" in json_component ) &&
       ( json_component.text.length > 1 ) &&
       ( "text" in json_component.text[1] ) ) {
  //if (typeof json_component.text[1].text === 'undefined')
    comp_entry["text"][1]["text"] = json_component.text[1].text;
  }
  else if ("name" in json_component) {
    comp_entry["text"][1]["text"] = json_component["name"] ;
  }

  //console.log("adding component");
  //console.log(json_component);

  //if ("bounding_box" in comp_entry)
  if (!bleepsixSchematicHeadless)
    this.updateComponentBoundingBox( comp_entry );

  this.kicad_sch_json["element"].push( comp_entry );


  if (!bleepsixSchematicHeadless)
    g_painter.dirty_flag = true;

  return id;
}

//function find_lower_left( pnt )
bleepsixSchematic.prototype.find_lower_left = function( pnt )
{
  var ind, ind_min = 0;
  var x_min, y_min;
  for (ind in pnt)
  {
    if (ind == 0)
    {
      x_min = parseFloat(pnt[0][0]);
      y_min = parseFloat(pnt[0][1]);
    }

    if ( parseFloat(pnt[ind][0]) < x_min )
    {
      x_min = parseFloat(pnt[ind][0]);
      y_min = parseFloat(pnt[ind][1]);

      ind_min = ind;
    }
  }

  for (ind in pnt)
  {
    if (parseFloat(pnt[ind][0]) == x_min)
    {
      if (parseFloat(pnt[ind][1]) < y_min)
      {
        y_min = parseFloat(pnt[ind][1]);
        ind_min = ind;
      }
    }
  }

  return pnt[ind_min];

}

//function find_upper_right( pnt )
bleepsixSchematic.prototype.find_upper_right = function( pnt )
{
  var ind, ind_max = 0;
  var x_max, y_max;
  for (ind in pnt)
  {
    if (ind == 0)
    {
      x_max = parseFloat(pnt[0][0]);
      y_max = parseFloat(pnt[0][1]);
    }

    if ( parseFloat(pnt[ind][0]) > x_max )
    {
      x_max = parseFloat(pnt[ind][0]);
      y_max = parseFloat(pnt[ind][1]);

      ind_max = ind;
    }
  }

  for (ind in pnt)
  {
    if (parseFloat(pnt[ind][0]) == x_max)
    {
      if (parseFloat(pnt[ind][1]) > y_max)
      {
        y_max = parseFloat(pnt[ind][1]);
        ind_max = ind;
      }
    }
  }

  return pnt[ind_max];

}

// ------
// helper component drawing functions
// ------
 
bleepsixSchematic.prototype.drawComponentPath = function( art_entry, x, y, transform )
{

  var shape_alternate = parseInt(art_entry["de_morgan_alternate_shape"]);
  if (shape_alternate == 2)
    return;

  var unit = parseInt( art_entry["unit"] );
  if (unit > 1)
    return;

  var p_t = numeric.transpose( art_entry["path"] );
  p_t = numeric.dot( transform, p_t );
  var p = numeric.transpose( p_t );

  var convert = parseInt(art_entry["convert"]);
  if (convert==2)
    return;

  var fill = false;
  var line_color = "rgb(136,0,0)";
  var fill_color = "rgb(136,0,0)";
  var line_width = 5;

  if ( art_entry["fill"] == "F" )
  {
    fill = true;
    fill_color = "rgb(136,0,0)";
    //line_width = 0;
  }
  else if ( art_entry["fill"] == 'f' )
  {
    fill = true;
    fill_color = "rgb(255, 255, 136)";
    //line_width = 0;
  }

  if ( parseInt(art_entry["line_width"]) > 0  ) 
    line_width = parseInt(art_entry["line_width"]);

  if ( fill )
    g_painter.drawPolygon( p, x, y, fill_color, true, 0 );
  if (line_width > 0)
    g_painter.drawPolygon( p, x, y, line_color, false, line_width );

}

bleepsixSchematic.prototype.drawComponentRectangle = function( art_entry, x, y, transform )
{

  var shape_alternate = parseInt(art_entry["de_morgan_alternate_shape"]);
  if (shape_alternate == 2)
    return;

  var unit = parseInt( art_entry["unit"] );
  if (unit > 1)
    return;

  var art_x = parseFloat( art_entry["x"] );
  var art_y = parseFloat( art_entry["y"] );
 
  var w = parseFloat( art_entry["width"] );
  var h = parseFloat( art_entry["height"] );

  var T = transform;

  var rect_coord = [ [ art_x, art_y], [art_x + w, art_y ], [art_x, art_y - h], [art_x + w, art_y - h] ];
  var rect_coord_t = numeric.transpose( numeric.dot( T, numeric.transpose(rect_coord)  ) );

  //var lower_left = find_lower_left( rect_coord_t );
  var lower_left = this.find_lower_left( rect_coord_t );

  var v_t = numeric.dot( T, [w, h] );

  var w_t = Math.abs(v_t[0]);
  var h_t = Math.abs(v_t[1]);

  var fill = false;
  var line_color = "rgb(136,0,0)";
  var line_width = 5;
  var fill_color = null;

  if (art_entry["fill"] == "F")
  {
    fill = true;
    fill_color = line_color;
  }
  else if ( art_entry["fill"] == "f" )
  {
    fill = true;
    fill_color = "rgb(255,255,136)";
  }

  //DEBUGGING
  if (this.debug)
  {
    var tx = x + lower_left[0];
    var ty = y + lower_left[1];
    console.log( tx + " " + ty + " w_t: " + w_t + " h_t: " + h_t);
  }

  g_painter.drawRectangle( x + lower_left[0],
                           y + lower_left[1],
                           w_t, 
                           h_t, 
                           line_width, line_color, fill, fill_color );

}

bleepsixSchematic.prototype.drawComponentCircle = function( art_entry, x, y, transform )
{
  var T = transform;

  var shape_alternate = parseInt(art_entry["de_morgan_alternate_shape"]);
  if (shape_alternate == 2)
    return;

  var unit = parseInt( art_entry["unit"] );
  if (unit > 1)
    return;


  var c = [ parseFloat(art_entry["x"]), parseFloat(art_entry["y"]) ];
  var c_r = parseFloat(art_entry["r"]);

  var c_t = numeric.dot( T, c );

  var line_width = 5;
  var line_color = "rgb(136,0,0)";
  var fill_flag = false;
  var fill_color = null;

  if ( art_entry["fill"] == "F" )
  {
    fill_color = "rgb(136,0,0)";
    fill_flag = true;
  }
  else if ( art_entry["fill"] == "f" )
  {
    fill_color = "rgb(255,255,136)";
    fill_flag = true;
  }

  g_painter.circle( x + c_t[0], 
                    y + c_t[1], 
                    c_r, 
                    line_width, line_color, fill_flag, fill_color )
}

bleepsixSchematic.prototype.drawComponentArc = function( art_entry, x, y, transform )
{
  var line_color = "rgb(136,0,0)";
  var r = art_entry["r"];
  var dx = parseFloat(art_entry["x"]);
  var dy = parseFloat(art_entry["y"]);
  var sa_rad = art_entry["start_angle"];
  var ea_rad = art_entry["end_angle"];
  var ccw_flag = art_entry["counterclockwise"];
  var fill_flag = art_entry["fill"];
  var line_width = parseInt(art_entry["line_width"]);
  if (line_width <= 0)
    line_width = 5;

  // I really don't know why, but KiCAD doesn't render these (by default?)
  //
  var shape_alternate = parseInt(art_entry["de_morgan_alternate_shape"]);
  if (shape_alternate == 2)
    return;

  var unit = parseInt( art_entry["unit"] );
  if (unit > 1)
    return;

  var u = [ [ Math.cos(sa_rad), Math.sin(sa_rad) ], 
            [ Math.cos(ea_rad), Math.sin(ea_rad) ],
            [ dx, dy ]
          ];
  var u_t = numeric.transpose( numeric.dot( transform, numeric.transpose( u ) ) );
  var dx_t = u_t[2][0];
  var dy_t = u_t[2][1];

  var sa_rad_t = Math.atan2( u_t[0][1], u_t[0][0] );
  var ea_rad_t = Math.atan2( u_t[1][1], u_t[1][0] );

  var fill_tf = false;
  var fill_color = "rgb(136, 0, 0)";
  if (fill_flag == "f")
    fill_color = "rgb(255,255,136)";
  else if (fill_flag == "F")
    fill_tf = true;

  g_painter.drawArc( x  + dx_t, 
                     y  + dy_t,
                     r, 
                     //-sa_rad, -ea_rad, ccw_flag, 
                     sa_rad_t, ea_rad_t, ccw_flag, 
                     line_width, line_color, 
                     fill_tf, fill_color );
}

bleepsixSchematic.prototype.drawComponentText = function( art_entry, x, y, transform )
{
  var color = "rgb(136,0,0)";
  var size = 60;
  if (art_entry["size"] )
      size = art_entry["size"];

  var dx = parseFloat(art_entry["x"]);
  var dy = parseFloat(art_entry["y"]);

  var u = numeric.dot( transform, [dx, dy] );

  var unit = parseInt(art_entry["unit"]);

  g_painter.drawText( art_entry["text"], x + u[0], y + u[1], color, size, 0.0, "C", "C");
}

// returns 2x2 array where first vector is endpoint, second is ssource of pin.
// For example:
//  [ [endpoint_x, endpoint_y] , [ source_x, source_y ] ]
// 
bleepsixSchematic.prototype._findPinEndpoints = function( pin_entry, x, y, transform  )
{
  var T = transform;

  var pin_length = parseFloat( pin_entry["length"] );

  var dx = 0.0;
  var dy = 0.0;
  if      (pin_entry["direction"] == "D" ) { dy = -pin_length; }
  else if (pin_entry["direction"] == "U" ) { dy =  pin_length; }
  else if (pin_entry["direction"] == "L" ) { dx = -pin_length; }
  else if (pin_entry["direction"] == "R" ) { dx =  pin_length; }

  var p = [ 
    [ parseFloat( pin_entry["x"] ), parseFloat( pin_entry["y"] ) ], 
    [0, 0] 
  ];

  p[1][0] = p[0][0] + dx;
  p[1][1] = p[0][1] + dy;

  var p_t = numeric.transpose( numeric.dot( T, numeric.transpose(p) ) );

  p_t[0][0] += x;
  p_t[0][1] += y;

  p_t[1][0] += x;
  p_t[1][1] += y;

  return p_t;

}


bleepsixSchematic.prototype.drawComponentPinLine = function( pin_entry, x, y, transform )
{
  var T = transform;

  var pin_length = parseFloat( pin_entry["length"] );


  /*
  var dx = 0.0;
  var dy = 0.0;
  var ang = 0.0;
  if      (pin_entry["direction"] == "D" ) { dy = -pin_length; ang = -90.0; }
  else if (pin_entry["direction"] == "U" ) { dy =  pin_length; ang = -90.0; }
  else if (pin_entry["direction"] == "L" ) { dx = -pin_length; }
  else if (pin_entry["direction"] == "R" ) { dx =  pin_length; }

  var hollow_circle_diam = 70;
 */

  var cx = 0;
  var cy = 0;
  var elec_I_diam = 70;
  var electrical_type = pin_entry["electrical_type"];
  var pin_type = pin_entry["pin_type"]

  //if      (pin_entry["direction"] == "D" ) { cy =  elec_I_diam; }
  //else if (pin_entry["direction"] == "U" ) { cy = -elec_I_diam; }
  if      (pin_entry["direction"] == "D" ) { cy = -elec_I_diam; }
  else if (pin_entry["direction"] == "U" ) { cy =  elec_I_diam; }
  else if (pin_entry["direction"] == "L" ) { cx = -elec_I_diam; }
  else if (pin_entry["direction"] == "R" ) { cx =  elec_I_diam; }

  var c_t = numeric.dot( transform, [ cx, cy ] );


  var p_t = this._findPinEndpoints( pin_entry, x, y, transform );

  var color = "rgb(136,0,0)";
  var line_width = 5;

  var x0 = p_t[0][0] ;
  var y0 = p_t[0][1] ;

  var x1 = p_t[1][0] ;
  var y1 = p_t[1][1] ;

  var dx = x1 - x0;
  var dy = y1 - y0;
  var dirx = 1;
  var diry = 1;

  var r = 12.5;

  var subx = 0;
  var suby = 0;

  if ( pin_type && pin_type.match(/I/) ) 
  {
    g_painter.circle( x1 - c_t[0]/2, y1 - c_t[1]/2, elec_I_diam/2, line_width, color );
    subx = c_t[0];
    suby = c_t[1];
  }
  
  if ( pin_type && pin_type.match(/C/) )  // clock
  {
    var path = [ [ 0, 0], [0, 40], [40, 0], [0, -40] ];
    var path_r = numeric.transpose( numeric.dot( transform, numeric.transpose(path) ) );
    g_painter.drawPolygon( path_r , x1, y1, color, false, line_width );
  }

  if ( pin_type && pin_type.match(/V/) )  // clock
  {
    var path = [ [0,0], [80, 0], [0, 40] ];
    var path_r = numeric.transpose( numeric.dot( transform, numeric.transpose(path) ) );
    g_painter.drawPolygon( path_r , x1, y1, color, false, line_width );
  }

  if ( pin_type && pin_type.match(/L/) )  // clock
  {
    var path = [ [-80,0], [-80, 40], [0, 0] ];
    var path_r = numeric.transpose( numeric.dot( transform, numeric.transpose(path) ) );
    g_painter.drawPolygon( path_r , x1, y1, color, false, line_width );
  }

  g_painter.line( x0, y0, x1 - subx, y1 - suby, color, line_width );

  if (pin_entry["visible"])
    g_painter.circle( x0, y0, r, 1, color );

}


bleepsixSchematic.prototype.drawComponentPinName = function(pin_entry, x, y, transform, text_offset )
{
  var font_width  = pin_entry["text_size_name"];
  var font_height = font_width / 0.6;
  var pix_font    = font_height;
  var sz          = font_height;

  var x_height    = Math.floor( 0.42 * font_height + 0.5 );
  var fudge_up    = (font_height - x_height)/4;

  var T = transform;

  var endpoint = this._findPinEndpoints( pin_entry, x, y, transform );
  var x0 = endpoint[0][0];
  var y0 = endpoint[0][1];

  var x1 = endpoint[1][0];
  var y1 = endpoint[1][1];

  var ang = 0.0;
  var justify = "C";

  var v_t, dx, dy;
  var tx = x1;
  var ty = y1;

  if (text_offset != 0)
  {
    
    var ofs = text_offset;
    if      (pin_entry["direction"] == "D" ) { dx=   0; dy= -ofs; }
    else if (pin_entry["direction"] == "U" ) { dx=   0; dy=  ofs; }
    else if (pin_entry["direction"] == "L" ) { dx=-ofs; dy=    0; }
    else if (pin_entry["direction"] == "R" ) { dx= ofs; dy=    0; }

    var D = numeric.dot( T, [ dx, dy ] );

    if      (D[0] >  0.5) { justify="L"; ang=  0.0; }
    else if (D[0] < -0.5) { justify="R"; ang=  0.0; }
    else if (D[1] >  0.5) { justify="R"; ang=-90.0; }
    else if (D[1] < -0.5) { justify="L"; ang=-90.0; }

    tx += D[0];
    ty += D[1];

  }
  else
  {

    if      (pin_entry["direction"] == "D" ) { dx= sz/2.0; dy=  0; }
    else if (pin_entry["direction"] == "U" ) { dx= sz/2.0; dy=  0; }
    else if (pin_entry["direction"] == "L" ) { dx=  0; dy=-sz/2.0; }
    else if (pin_entry["direction"] == "R" ) { dx=  0; dy=-sz/2.0; }
    justify = "C";

    // pump it through the part transform
    //
    var D = numeric.dot( T, [ dx, dy ] );

    // text is always draw left to right, bottom to top if rotated
    //
    if ( Math.abs( D[0] ) > 0.5 )
      ang = -90.0;

    // if text_offset is 0, text is drawn on left or top of pin, always
    //
    if (D[0] > 0.5) D[0] = -D[0];
    if (D[1] > 0.5) D[1] = -D[1];

    // though not needed, give a bit of extra separation in the case pin
    // numbers are drawn underneath the pin line (that is, when text_offset is 0)
    // 
    if (D[0] > 0.5) D[0] += fudge_up;
    if (D[1] > 0.5) D[1] += fudge_up;

    tx = x0 + (x1-x0)/2.0 + D[0];
    ty = y0 + (y1-y0)/2.0 + D[1];

  }

  munged_name = pin_entry["name"].replace( /~/g, " " );

  g_painter.drawText( munged_name, tx, ty, "rgb(0,136,136)", sz, ang, justify );

}


bleepsixSchematic.prototype.drawComponentPinNumber = function( pin_entry, x, y, transform, text_offset )
{

  var font_width  = pin_entry["text_size_number"];
  var font_height = font_width / 0.6;
  var pix_font    = font_height;
  var sz          = font_height;

  var x_height    = Math.floor( 0.42 * font_height + 0.5 );
  var fudge_up    = (font_height - x_height)/4.0;

  var T = transform;

  // another non rendering issue...
  //
  var unit = pin_entry["unit"];
  if (unit > 1)
    return;


  var endpoint = this._findPinEndpoints( pin_entry, x, y, transform );
  var x0 = endpoint[0][0];
  var y0 = endpoint[0][1];

  var x1 = endpoint[1][0];
  var y1 = endpoint[1][1];

  // dx,dy are from the center of the pin line .
  // Pin number text is drawn centered, so the shift 
  // is sz/2.0 for the offsets.
  //
  var dx = 0;
  var dy = 0;
  var ang = 0.0;
  if      (pin_entry["direction"] == "D" ) { dx=-sz/2.0; dy=  0; }
  else if (pin_entry["direction"] == "U" ) { dx=-sz/2.0; dy=  0; }
  else if (pin_entry["direction"] == "L" ) { dx=  0; dy=sz/2.0; }
  else if (pin_entry["direction"] == "R" ) { dx=  0; dy=sz/2.0; }

  // pump it through the part transform
  //
  var D = numeric.dot( T, [ dx, dy ] );

  // text is always draw left to right, bottom to top if rotated
  //
  if ( Math.abs( D[0] ) > 0.5 )
    ang = -90.0;

  // if text_offset is 0, text is always drawn on bottom or to the right
  //
  if (text_offset==0)
  {
    if (D[0] < -0.5) D[0] = -D[0];  // force right
    if (D[1] < -0.5) D[1] = -D[1];  // force bottom

  }

  // if text_offset isn't 0, 
  // text is always drawn on top or to the left side of the pin 
  //
  else
  {

    if (D[0] > 0.5) D[0] = -D[0];
    if (D[1] > 0.5) D[1] = -D[1];

  }


  // though not needed, give a bit of extra separation in the case pin
  // numbers are drawn underneath the pin line (that is, when text_offset is 0)
  // 
  if (D[0] > 0.5) D[0] += fudge_up;
  if (D[1] > 0.5) D[1] += fudge_up;

  // find ecnter of pin number and finally display it
  //
  var cx = x0 + (x1-x0)/2.0 + D[0];
  var cy = y0 + (y1-y0)/2.0 + D[1];

  g_painter.drawText( pin_entry["number"], cx, cy, "rgb(136,0,0)", sz, ang, "C" );

}


bleepsixSchematic.prototype.drawComponent = function( data, x, y, transform, draw_f01 )
{

  draw_f01 = ( typeof draw_f01 !== 'undefined' ? draw_f01 : false );
  debug_flag = ( typeof debug_flag !== 'undefined' ? debug_flag : false );

  var ind, p_ind;
  var name = data["name"];
  var art = data["art"];
  var pin = data["pin"];

  x = parseFloat(x);
  y = parseFloat(y);

  /* we're going to need to worry about the order of operations as filling rectangles might
   * overwrite the inside
   */
  for (ind in art)
  {

    var shape = art[ind]["shape"];

    if       ( shape == "path" )      { this.drawComponentPath( art[ind], x, y, transform ); }
    else if  ( shape == "rectangle" ) { this.drawComponentRectangle( art[ind], x, y, transform ); }
    else if  ( shape == "circle" )    { this.drawComponentCircle( art[ind], x, y, transform ); }
    else if  ( shape == "arc" )       { this.drawComponentArc( art[ind], x, y, transform ); }  
    else if  ( shape == "text" )      { this.drawComponentText( art[ind], x, y, transform ); }

  }

  if (draw_f01)
  {
    this.drawComponentTextField( data["text"][0], x, y, transform, true );
    this.drawComponentTextField( data["text"][1], x, y, transform, true );

  }

  if ( name == "unknown" )
  {
    g_painter.drawText( "??", x, y, "rgb(136,0,0)", 200, 0.0, "C", "C", false, true, true );
  }

  
  var text_offset = parseInt( data["text_offset"] );

  for (ind in pin)
  {

    // I really don't know why, but KiCAD doesn't render these (by default?)
    //
    var shape_alternate = parseInt(pin[ind]["de_morgan_alternate_shape"]);
    if (shape_alternate == 2)
      continue;

    var unit = parseInt(pin[ind]["unit"]);
    if (unit > 1)
      continue;


    this.drawComponentPinLine( pin[ind], x, y, transform );
    if (pin[ind]["visible"])
    {

      if ( data["draw_pin_name"] )   this.drawComponentPinName( pin[ind], x, y, transform, text_offset );
      if ( data["draw_pin_number"] ) this.drawComponentPinNumber( pin[ind], x, y, transform, text_offset );

    }

  }

}

bleepsixSchematic.prototype.drawSchematicLine = function( line )
{
  var color = "rgb(0,160,0)";
  var line_width = 5;

  if ( (line.type == "busline") ||
       (line.type == "entrybusbus") )
  {
    color = "rgb(0,0,160)";
    line_width = 10;
  }
  else if ( line.type == "notesline" )
  {
    color = "rgb(0,0,160)";
    line_width = 5;
  }

  g_painter.line( line["startx"], line["starty"], line["endx"], line["endy"], color, line_width );

  if ( this.draw_bounding_box_flag )
  {
    this.drawBoundingBox( line["bounding_box"] );
  }

  if (this.draw_id_text_flag)
  {
    var bb = line["bounding_box"];
    g_painter.drawText( line.id, bb[1][0], bb[1][1], "rgba(0,0,0,0.3)", 12, 0.0, "L", "C" );
  }

}

bleepsixSchematic.prototype.drawSchematicNoconn = function( noconn )
{

  var x = parseFloat(noconn["x"]);
  var y = parseFloat(noconn["y"]);

  var dx = 25.0;
  var dy = 25.0;

  g_painter.line( x - dx, y - dy, x + dx, y + dy, "rgb(0,0,192)" );
  g_painter.line( x - dx, y + dy, x + dx, y - dy, "rgb(0,0,192)" );

  if ( this.draw_bounding_box_flag )
  {
    this.drawBoundingBox( noconn["bounding_box"] );
  }

  if (this.draw_id_text_flag)
  {
    var bb = noconn["bounding_box"];
    g_painter.drawText( noconn.id, bb[1][0], bb[1][1], "rgba(0,0,0,0.3)", 12, 0.0, "L", "C" );
  }



}

bleepsixSchematic.prototype.drawSchematicConnection = function( conn )
{

  //console.log("bleepsixSchematic.drawSchematicConnection conn: " + conn);

  var x = parseFloat(conn["x"]);
  var y = parseFloat(conn["y"]);

  var rad = 15;

  g_painter.circle( x, y, rad, 0, null, true, "rgb(0,160,0)"  );

  if ( this.draw_bounding_box_flag )
  {
    this.drawBoundingBox( conn["bounding_box"] );
  }

  if (this.draw_id_text_flag)
  {
    var bb = conn["bounding_box"];
    g_painter.drawText( conn.id, bb[1][0], bb[1][1], "rgba(0,0,0,0.3)", 12, 0.0, "L", "C" );
  }


}

bleepsixSchematic.prototype.drawSchematicText = function( text )
{

  var s = text["text"];
  var x = parseFloat(text["x"]);
  var y = parseFloat(text["y"]);

  //var font_width = parseFloat(text["size"]);
  var font_width = parseFloat(text["dimension"]);
  var font_height = font_width / 0.6;

  //angle_deg = parseFloat(text["degree"]);

  //var text_color = "rgb(0,136,136)";
  var text_color = "rgb(0,0,160)";

  //g_painter.drawText( s, x, y, text_color, font_height, angle_deg );

  h_justify = "L";
  v_justify = "C";

  var a_text = s.split(/\\n/);

  var ds = [ 0, parseFloat(font_height) ];
  var ds_t = ds;

  x = parseFloat(x);
  y = parseFloat(y);

  angle_deg = 0;

  var rot_rad = Math.PI/2.0;

  var i_orientation = parseInt( text["orientation"] );
  if (i_orientation == 0)
  {
  }
  else if (i_orientation == 1)
  {
    ds_t = numeric.dot( this._R( rot_rad ), ds );
    angle_deg = -90;
    //h_justify = "L";
  }
  else if (i_orientation == 2)
  {
    ds_t = numeric.dot( this._R( 2*rot_rad ), ds );
    h_justify = "R";
  }
  else if (i_orientation == 3)
  {
    ds_t = numeric.dot( this._R( -rot_rad ), ds );
    angle_deg = -90;
    h_justify = "R";
  }



  for (var k in a_text)
  {
    var t = a_text[k];

    g_painter.drawText( 
        t, x, y, 
        text_color, 
        font_height, 
        angle_deg, 
        h_justify, v_justify );

    x += ds_t[0];
    y += ds_t[1];

  }

  if ( this.draw_bounding_box_flag )
  {
    this.drawBoundingBox( text["bounding_box"] );
  }


}

bleepsixSchematic.prototype._R = function( ang )
{
    return [ [ Math.cos(ang), Math.sin(ang) ], [ -Math.sin(ang), Math.cos(ang) ] ];
}


bleepsixSchematic.prototype.drawSchematicLabel = function( text )
{

  var s = text["text"];
  var x = parseFloat(text["x"]);
  var y = parseFloat(text["y"]);

  var w = 25;
  g_painter.drawRectangle( x-w/2, y-w/2, w, w, 5, "rgba(0,0,0,0.7)" );

  var font_width = parseFloat(text["dimension"]);
  var font_height = font_width / 0.6;

  //var font_height = parseFloat(text["dimension"]);
  //var font_width = 0.6 * font_height ;

  var angle_deg = 0;
  var h_justify = "C";
  var v_justify = "C";

  if      ( text["type"] == "label" )               h_justify = "L";
  else if ( text["type"] == "labelglobal" )         h_justify = "R";
  else if ( text["type"] == "labelheirarchical" )   h_justify = "R";
  else if ( text["type"] == "textnote" )            h_justify = "L";


  if      ( text["type"] == "label" )               v_justify = "B";
  else if ( text["type"] == "labelglobal" )         v_justify = "C";
  else if ( text["type"] == "labelheirarchical" )   v_justify = "C";
  else if ( text["type"] == "textnote" )            v_justify = "C";

  var dv = [0,0];

  if ( text.type == "labelglobal" )
    dv[0] = -45;
  if ( text.type == "lableheirarchical" )
    dv[0] = -85;

  var rot_rad = Math.PI/2.0;

  var i_orientation = parseInt( text["orientation"] );
  if (i_orientation == 0)
  {
  }
  else if (i_orientation == 1)
  {

    dv = numeric.dot( this._R( rot_rad ), dv );

    angle_deg = -90;

    if (text.type == "labelglobal")    h_justify = "L";
  }
  else if (i_orientation == 2)
  {
    dv = numeric.dot( this._R( 2*rot_rad ), dv );

    if (text.type == "label")       h_justify = "R";
    if (text.type == "labelglobal") h_justify = "L";
    if (text.type == "labelheirarchical") h_justify = "L";
  }
  else if (i_orientation == 3)
  {
    dv = numeric.dot( this._R( -rot_rad ), dv );

    angle_deg = -90;

    if      (text.type == "label")          h_justify = "R";
    if (text.type == "labelheirarchical") h_justify = "L";

  }


  var text_color = "rgb(160,0,0)";
  if ( text.type == "label")
    text_color = "rgb(0,0,0)";
  if ( text.type == "labelheirarchical" )
    text_color = "rgb(136,136,0)";

  g_painter.drawText( 
      s, 
      x + dv[0], y - dv[1], 
      text_color, 
      font_height, 
      angle_deg,
      h_justify,
      v_justify
      );

  if ( text.type == "labelglobal" )
  {
  }

  if ( text.type == "labelheirarchical" )
  {
  }


  if ( this.draw_bounding_box_flag )
  {
    this.drawBoundingBox( text["bounding_box"] );
  }

  if (this.draw_id_text_flag)
  {
    var bb = text["bounding_box"];
    g_painter.drawText( text.id, bb[1][0], bb[1][1], "rgba(0,0,0,0.3)", 12, 0.0, "L", "C" );
  }



}

bleepsixSchematic.prototype.moveComponentTextField = function( comp_ref, text_ind, world_x, world_y )
{
  var com_x = parseFloat(comp_ref.x);
  var com_y = parseFloat(comp_ref.y);

  var T = comp_ref.transform;
  var Tinv = numeric.transpose( T );

  var tx = parseFloat( comp_ref.text[text_ind].x );
  var ty = parseFloat( comp_ref.text[text_ind].y );

  var v = [ world_x - com_x, world_y - com_y ];
  v = numeric.dot( Tinv, v );
  v[0] += com_x;
  v[1] += com_y;

  comp_ref.text[text_ind].x = v[0];
  comp_ref.text[text_ind].y = v[1];
  
}
  
bleepsixSchematic.prototype.drawComponentTextField = function( text_field, comp_x, comp_y, transform, is_cache_component )
{

  is_cache_component = ( typeof is_cache_component !== 'undefined' ? is_cache_component : false );
  debug_flag = ( typeof debug_flag !== 'undefined' ? debug_flag : false );

  italic_flag = text_field.italic;
  bold_flag = text_field.bold;

  if (! text_field["visible"]) { return; }

  if (is_cache_component)
  {
    if ( /^~*$/.exec( text_field["reference"] ) ) { return; }
  }
  else
  {
    if ( /^~*$/.exec( text_field["text"] ) ) { return; }
  }

  comp_x = parseFloat(comp_x);
  comp_y = parseFloat(comp_y);

  var orient_vector = [ 1.0, 0.0 ];
  if (text_field["orientation"] == "V") { orient_vector = [ 0.0, 1.0 ]; }
  var orient_vector_t = numeric.dot( transform, orient_vector );

  var orient_hvector = [ 0.0, 1.0 ];
  if (text_field["orientation"] == "V") { orient_hvector = [ -1.0, 0.0 ]; }
  var orient_hvector_t = numeric.dot( transform, orient_hvector );

  var det = numeric.det( transform );

  var ang = ( ( Math.abs(orient_vector_t[0]) < 0.5 ) ? -90.0 : 0.0 );

  // Even though text co-ordinates are stored in what appears to be absolute positon,
  // the actual position is the vector of that position minus the component position
  // with the transform applied.
  //
  var local_text_coord = [ parseFloat(text_field["x"]) - comp_x , parseFloat(text_field["y"]) - comp_y ];
  if (is_cache_component)
    local_text_coord = [ parseFloat(text_field["x"]) , parseFloat(text_field["y"]) ];


  var local_text_coord_t = numeric.dot( transform, local_text_coord );

    if (debug_flag)
    {
      console.log( " >> local_coord " + local_text_coord + " comp " + comp_x + " " + comp_y );
    }


  var tx = local_text_coord_t[0] + comp_x;
  var ty = local_text_coord_t[1] + comp_y;

  var text_color = "rgb(0,136,136)";
  if (italic_flag)
    text_color = "rgb(160,0,160)";

  var font_width  = text_field["size"];
  var font_height = font_width / 0.6;
  var pix_font    = font_height;

  var sz          = font_height;

  var hjustify = text_field["hjustify"];
  var vjustify = text_field["vjustify"];

  if (!hjustify) hjustify = "C";
  if (!vjustify) vjustify = "C";



  if (text_field["orientation"] == "H")
  {
    if      ( (hjustify == "L") && ( orient_vector_t[0] < -0.5 ) ) hjustify = "R";
    else if ( (hjustify == "L") && ( orient_vector_t[1] >  0.5 ) ) hjustify = "R";
    else if ( (hjustify == "R") && ( orient_vector_t[0] < -0.5 ) ) hjustify = "L";
    else if ( (hjustify == "R") && ( orient_vector_t[1] >  0.5 ) ) hjustify = "L";

    if      ( (vjustify == "B") && ( orient_vector_t[0] < -0.5) ) vjustify = "T";
    else if ( (vjustify == "B") && ( orient_vector_t[1] >  0.5) ) vjustify = "T";
    else if ( (vjustify == "T") && ( orient_vector_t[0] < -0.5) ) vjustify = "B";
    else if ( (vjustify == "T") && ( orient_vector_t[1] >  0.5) ) vjustify = "B";

    if (det > 0)
    {
      if      (vjustify == "T") vjustify = "B";
      else if (vjustify == "B") vjustify = "T";
    }
  }
  else if (text_field["orientation"] == "V")
  {
    //still need to implement this
    //
  }


  if (is_cache_component)
  {
    g_painter.drawText( text_field["reference"], 
                        tx, ty, 
                        text_color, 
                        font_height, 
                        ang, 
                        hjustify, vjustify,
                        false,
                        italic_flag, bold_flag );
  }
  else
  {
    g_painter.drawText( text_field["text"], 
                        tx, ty, 
                        text_color, 
                        font_height, 
                        ang, 
                        hjustify, vjustify,
                        false,
                        italic_flag, bold_flag );
  }

  if (this.draw_bounding_box_flag)
  {
    //if (!use_reference_flag)
      this.drawBoundingBox( text_field["bounding_box"] );
  }

}

// Draw component as it appears from the schematic.
// Not to be confused with "drawComponent" which draws the art
// for the component taken from the component library.
// Also draw text fields associated with the component in the schematic.
//
bleepsixSchematic.prototype.drawSchematicComponent = function( comp )
{  
  var raw_name = comp["name"];

  //var name = raw_name.replace( /~/g, "");
  //var name = this.toCacheName( raw_name.replace( /~/g, "") );
  var name = raw_name;


  /*
  if ( !(name in g_component_cache) )
  {
    console.log("ERROR: controller.drawSchematicComponent " + name + " not in component cache ");
    return;
  }
  */

  var component_lib = this.kicad_sch_json.component_lib;

  var comp_x = parseFloat(comp["x"]);
  var comp_y = parseFloat(comp["y"]);

  //if ( name in g_component_cache )
  if ( name in component_lib)
  {
    //this.drawComponent( g_component_cache[ name ], comp["x"], comp["y"], comp["transform"]  );
    this.drawComponent( component_lib[ name ], comp["x"], comp["y"], comp["transform"]  );
  }
  else
  {

    //if (!("unknown" in g_component_cache))
    if (!("unknown" in component_lib))
    {
      //g_component_cache["unknown"] = this.makeUnknownComponent();
      component_lib["unknown"] = this.makeUnknownComponent();
    }

    if (!("unknown_text_field" in comp))
    {
      comp["unknown_text_field"] = this.makeUnknownComponentTextField( comp_x, comp_y );
    }

    //this.drawComponent( g_component_cache[ "unknown" ], comp["x"], comp["y"], comp["transform"]  );
    this.drawComponent( component_lib[ "unknown" ], comp["x"], comp["y"], comp["transform"]  );
    this.drawComponentTextField( comp["unknown_text_field"], comp_x, comp_y, comp["transform"] );
    return;
  }

  if (this.draw_bounding_box_flag)
  {
    this.drawBoundingBox( comp["bounding_box"] );
  }

  if (this.draw_id_text_flag)
  {
    var bb = comp["bounding_box"];

    g_painter.drawText( comp.id, bb[1][0], bb[1][1], "rgba(0,0,0,0.3)", 12, 0.0, "L", "C" );
  }

  var T = comp["transform"];

  // BUG: renders text always on top or to the right.
  //   bounding box updates get it right, not sure what's going on here. will have to look at it later
  //
  //   UPDATE:
  //   it's because we always render the text so it's bottom to top, left to right readable, which
  //   has consquences for how it's rendered.  For example, consider the string 'ABC' rendered at x=0,
  //   y=10, left justified (horizontal).  Rotate 180 and now the 'ABC' should be at x=0, y=-10, 
  //   except it should be 'left justified' _before rotation_, which means the 'C' will end at the x=0 line.
  //   
  //   I've fixed it for the "H" case, still need to figure out what to do about the "V" case.
  //   horribly special cased out and mostly untested.  Working on component "C"...
  //
  for ( text_ind in comp["text"] )
  {
    this.drawComponentTextField( comp["text"][text_ind], comp_x, comp_y, T );
  }

}

bleepsixSchematic.prototype.drawElement = function( ele )
{
  var type = ele.type;

  if      (type == "component")  { this.drawSchematicComponent( ele ); }
  else if (type == "connection") { this.drawSchematicConnection( ele ); }
  else if (type == "noconn")     { this.drawSchematicNoconn( ele ); }
  else if (type == "textnote")   { this.drawSchematicText( ele ); }

  else if (type == "label")             { this.drawSchematicLabel( ele ); }
  else if (type == "labelglobal")       { this.drawSchematicLabel( ele ); }
  else if (type == "labelheirarchical") { this.drawSchematicLabel( ele ); }

  else if (type == "busline")    { this.drawSchematicLine( ele ); }
  else if (type == "entrybusbus"){ this.drawSchematicLine( ele ); }
  else                           { this.drawSchematicLine( ele ); }

}

// we might have to worry about order...
bleepsixSchematic.prototype.drawSchematic = function( respect_headless )
{

  respect_headless = ( (typeof respect_headless === 'undefined') ? true : respect_headless );

  this.updateBoundingBox( undefined, respect_headless );

  var sch = this.kicad_sch_json["element"];

  for (var ind in sch)
  {
    type = sch[ind]["type"];

    if ( ( "hideFlag" in sch[ind] ) &&
         sch[ind].hideFlag )
    {
      continue;
    }

    this.drawElement( sch[ind] );

  }

  if ( this.highlight_net_flag )
  {

    for (var ind in this.highlight_net)
    {
      var hi_ele = this.highlight_net[ind];
      var type = hi_ele.type;

      if (type == "box")
      {
        var s2 = hi_ele.size/2;
        g_painter.drawRectangle( 
            hi_ele.x - s2, hi_ele.y - s2, 
            hi_ele.size, hi_ele.size,
            5, "rgba(0,0,0,0.8)",
            true, "rgba(0,0,0,0.1)" );

      }
      else if (type == "rect")
      {
        var w = Math.abs(hi_ele.endx - hi_ele.startx);
        var h = Math.abs(hi_ele.endy - hi_ele.starty);
        g_painter.drawRectangle( 
            hi_ele.startx - w/2, hi_ele.starty - h/2, 
            w, h, 
            1, "rgba(0,0,0,0.3)",
            true, "rgba(0,0,0,0.01)" );
      }
      else if (type == "circle")
      {
        var r2 = hi_ele.size/2;
        g_painter.circle( 
            hi_ele.x, hi_ele.y, 
            hi_ele.size,
            5, "rgba(0,0,0,0.9)",
            true, "rgba(0,0,0,0.1)" );

      }

    }
  }



}

//--- helper functions

//function find_part_art_circle_bbox ( bbox, art_entry )
bleepsixSchematic.prototype.find_part_art_circle_bbox = function( bbox, art_entry )
{
  var x = parseFloat( art_entry["x"] );
  var y = parseFloat( art_entry["y"] );
  var r = parseFloat( art_entry["r"] );

  bbox[0][0] = Math.min( bbox[0][0], x - r );
  bbox[0][1] = Math.min( bbox[0][1], y - r );

  bbox[1][0] = Math.max( bbox[1][0], x + r );
  bbox[1][1] = Math.max( bbox[1][1], y + r );

}

//function find_part_art_path_bbox ( bbox, art_entry )
bleepsixSchematic.prototype.find_part_art_path_bbox = function( bbox, art_entry )
{
  for (var ind in art_entry["path"])
  {
    var x = parseFloat( art_entry["path"][ind][0] );
    var y = parseFloat( art_entry["path"][ind][1] );

    bbox[0][0] = Math.min( bbox[0][0], x );
    bbox[0][1] = Math.min( bbox[0][1], y );

    bbox[1][0] = Math.max( bbox[1][0], x );
    bbox[1][1] = Math.max( bbox[1][1], y );

  }
}

//function find_part_art_rectangle_bbox ( bbox, art_entry )
bleepsixSchematic.prototype.find_part_art_rectangle_bbox = function( bbox, art_entry )
{

  var x = parseFloat( art_entry["x"] );
  var y = parseFloat( art_entry["y"] );

  var w = parseFloat( art_entry["width"] );
  var h = parseFloat( art_entry["height"] );

  bbox[0][0] = Math.min( bbox[0][0], x );
  bbox[0][1] = Math.min( bbox[0][1], y - h );

  bbox[1][0] = Math.max( bbox[1][0], x + w );
  bbox[1][1] = Math.max( bbox[1][1], y );

}

//function update_bbox_with_point(bbox, x, y )
bleepsixSchematic.prototype.update_bbox_with_point = function( bbox, x, y )
{
  bbox[0][0] = Math.min( bbox[0][0], x );
  bbox[0][1] = Math.min( bbox[0][1], y )

  bbox[1][0] = Math.max( bbox[1][0], x );
  bbox[1][1] = Math.max( bbox[1][1], y );
}

bleepsixSchematic.prototype.find_part_art_text_bbox = function( bbox, art_entry )
{
  var ds = 50;
  if ("size" in art_entry) {
    ds = parseFloat( art_entry.size );
  }
  var x = parseFloat( art_entry.x );
  var y = parseFloat( art_entry.y );

  this.update_bbox_with_point(bbox, x+ds, y-ds )
  this.update_bbox_with_point(bbox, x-ds, y-ds )
  this.update_bbox_with_point(bbox, x+ds, y+ds )
  this.update_bbox_with_point(bbox, x-ds, y+ds )

}

bleepsixSchematic.prototype.find_part_art_segment_bbox = function( bbox, art_entry )
{
  this.update_bbox_with_point(bbox,  art_entry["startx"], art_entry["starty"] )
  this.update_bbox_with_point(bbox,  art_entry["endx"], art_entry["endy"] )
}

//function find_part_art_arc_bbox ( bbox, art_entry )
bleepsixSchematic.prototype.find_part_art_arc_bbox = function( bbox, art_entry )
{
  var sa = parseFloat(art_entry.start_angle);
  var ea = parseFloat(art_entry.end_angle);
  var ccw_flag = art_entry.counterclockwise;

  var x = parseFloat(art_entry.x);
  var y = parseFloat(art_entry.y);
  var r = parseFloat(art_entry.r);

  var px = x + r*Math.cos(sa);
  var py = y + r*Math.sin(sa);

  //update_bbox_with_point(bbox,  x + r*Math.cos(sa), y + r*Math.sin(sa) );
  //update_bbox_with_point(bbox,  x + r*Math.cos(ea), y + r*Math.sin(ea) );

  this.update_bbox_with_point(bbox,  x + r*Math.cos(sa), y + r*Math.sin(sa) );
  this.update_bbox_with_point(bbox,  x + r*Math.cos(ea), y + r*Math.sin(ea) );

  var ang = [ 0.0, Math.PI/2.0, -Math.PI/2.0, Math.PI ];

  var first_angle = sa;
  var second_angle = ea;

  /*
  // swap direction?
  if (!ccw_flag)
  {
    first_angle = ea;
    second_angle = sa;
  }
  */

  if (first_angle > second_angle)
    second_angle += 2.0 * Math.PI;

  for (var ind in ang)
  {
    if ( (first_angle <= ang[ind]) && (ang[ind] <= second_angle))
      //update_bbox_with_point(bbox, x + r*Math.cos(ang[ind]), y + r*Math.sin(ang[ind]));
      this.update_bbox_with_point(bbox, x + r*Math.cos(ang[ind]), y + r*Math.sin(ang[ind]));
  }

}

//function find_part_pin_bbox ( bbox, art_entry )
bleepsixSchematic.prototype.find_part_pin_bbox = function( bbox, art_entry )
{
  var l = parseFloat( art_entry["length"] );
  var x = parseFloat( art_entry["x"] );
  var y = parseFloat( art_entry["y"] );
  
  var dx = 0;
  var dy = 0;

  if      (art_entry["direction"] == "R") { dx =  l; }
  else if (art_entry["direction"] == "L") { dx = -l; }
  else if (art_entry["direction"] == "U") { dy =  l; }
  else if (art_entry["direction"] == "D") { dy = -l; }


  bbox[0][0] = Math.min( bbox[0][0], x );
  bbox[0][1] = Math.min( bbox[0][1], y );

  bbox[1][0] = Math.max( bbox[1][0], x );
  bbox[1][1] = Math.max( bbox[1][1], y );

  bbox[0][0] = Math.min( bbox[0][0], x + dx);
  bbox[0][1] = Math.min( bbox[0][1], y + dy);

  bbox[1][0] = Math.max( bbox[1][0], x + dx);
  bbox[1][1] = Math.max( bbox[1][1], y + dy);

}

// I'll have to come back to it, but this constructs the bounding
// box for the reference instead of the text entry.
// Meant to be used for entries in the component cache rather
// than a schematic.
//
//function find_part_text_bbox ( coarse_bbox, text_entry )
bleepsixSchematic.prototype.find_part_text_bbox = function( coarse_bbox, text_entry )
{
  var text_x = parseFloat( text_entry["x"] );
  var text_y = parseFloat( text_entry["y"] );
  var text_width  = parseFloat( text_entry["size"] );
  var text_height = text_width / 0.6;

  var x_height    = Math.floor( 0.42 * text_height + 0.5 );
  var fudge_up    = (text_height - x_height)/4;

  var name = text_entry["reference"];

  if ( ! name ) 
  {
    text_entry["bounding_box"] = [[0,0],[0,0]];
    return;
  }

  var l = text_width * name.length;
  var h = text_height ;

  //var local_x = text_x - x ;
  //var local_y = text_y - y ;

  var local_x = text_x ;
  var local_y = text_y ;

  var xmin = local_x;
  var xmax = local_x;
  var ymin = local_y;
  var ymax = local_y;

  if ( text_entry["orientation"] == "V" )
  {
    if      ( text_entry["hjustify"] == "C" ) { xmin += -h/2.0;  xmax +=  h/2.0; }
    else if ( text_entry["hjustify"] == "R" ) { xmin += -h;      xmax +=      0; }
    else if ( text_entry["hjustify"] == "L" ) { xmin +=  0;      xmax +=      h; }

    if      ( text_entry["vjustify"] == "C" ) { ymin +=  l/2.0;  ymax += -l/2.0; }
    else if ( text_entry["vjustify"] == "B" ) { ymin +=      l;  ymax +=      0; }
    else if ( text_entry["vjustify"] == "T" ) { ymin +=      0;  ymax +=     -l; }
  }
  else 
  {
    if      ( text_entry["hjustify"] == "C" ) { xmin += -l/2.0;  xmax +=  l/2.0; }
    else if ( text_entry["hjustify"] == "R" ) { xmin += -l;      xmax +=      0; }
    else if ( text_entry["hjustify"] == "L" ) { xmin +=  0;      xmax +=      l; }

    if      ( text_entry["vjustify"] == "C" ) { ymin +=  h/2.0;  ymax += -h/2.0; }
    else if ( text_entry["vjustify"] == "B" ) { ymin +=      h;  ymax +=      0; }
    else if ( text_entry["vjustify"] == "T" ) { ymin +=      0;  ymax +=     -h; }
  }

  var transform = [ [1,0],[0,-1] ] ;

  var r = [ [xmin, ymin], [xmin, ymax], [xmax, ymax], [xmax,ymin] ];
  var r_t = numeric.transpose( numeric.dot( transform, numeric.transpose(r) ) );

  //var ll = find_lower_left( r_t );
  //var ur = find_upper_right( r_t );

  var ll = this.find_lower_left( r_t );
  var ur = this.find_upper_right( r_t );

  var bbox = [ [0,0],[0,0] ];

  bbox[0][0] = ll[0] ;
  bbox[0][1] = ll[1] ;
  bbox[1][0] = ur[0] ;
  bbox[1][1] = ur[1] ;

  // HACK!
  // 
  coarse_bbox[0][0] = Math.min( coarse_bbox[0][0], bbox[0][0] );
  coarse_bbox[0][1] = Math.min( coarse_bbox[0][1], -bbox[0][1] );
  coarse_bbox[1][0] = Math.max( coarse_bbox[1][0], bbox[1][0] );
  coarse_bbox[1][1] = Math.max( coarse_bbox[1][1], -bbox[1][1] );

  text_entry["bounding_box"] = bbox;

}

// Creates bounding box from the (newly loaded and cached) component element.
// Schematic uses this information as the base to move and transform it
// based on the component position in the schematic.
//
//function find_component_bounding_box( comp )
bleepsixSchematic.prototype.find_component_bounding_box = function( comp )
{
  var first = true;
  var art = comp["art"];
  var pin = comp["pin"];
  var text = comp["text"];

  var bbox = [ [ 0, 0 ], [ 0, 0 ] ];

  for ( var ind in art ) 
  {
    var shape = art[ind]["shape"];

    if      (shape == "circle")     { this.find_part_art_circle_bbox    ( bbox, art[ind] ); }
    else if (shape == "path")       { this.find_part_art_path_bbox      ( bbox, art[ind] ); }
    else if (shape == "rectangle")  { this.find_part_art_rectangle_bbox ( bbox, art[ind] ); }
    else if (shape == "arc")        { this.find_part_art_arc_bbox       ( bbox, art[ind] ); }
    else if (shape == "segment")    { this.find_part_art_segment_bbox   ( bbox, art[ind] ); }
    else if (shape == "text")       { this.find_part_art_text_bbox   ( bbox, art[ind] ); }

    /*
    if      (shape == "circle")     { find_part_art_circle_bbox    ( bbox, art[ind] ); }
    else if (shape == "path")       { find_part_art_path_bbox      ( bbox, art[ind] ); }
    else if (shape == "rectangle")  { find_part_art_rectangle_bbox ( bbox, art[ind] ); }
    else if (shape == "arc")        { find_part_art_arc_bbox       ( bbox, art[ind] ); }
    */

  }

  for (var ind in pin)
  {
    //find_part_pin_bbox( bbox, pin[ind] );
    this.find_part_pin_bbox( bbox, pin[ind] );
  }

  var coarse_bbox = [ [0,0],[0,0] ];
  coarse_bbox[0][0] = bbox[0][0];
  coarse_bbox[0][1] = bbox[0][1];
  coarse_bbox[1][0] = bbox[1][0];
  coarse_bbox[1][1] = bbox[1][1];

  for (var ind in text)
  {
    //find_part_text_bbox( coarse_bbox, text[ind] );
    this.find_part_text_bbox( coarse_bbox, text[ind] );
  }

  comp["bounding_box"] = bbox;
  comp["coarse_bounding_box"] = coarse_bbox;

}

bleepsixSchematic.prototype.drawBoundingBox = function( b )
{
  var w = b[1][0] - b[0][0];
  var h = b[1][1] - b[0][1];

  g_painter.drawRectangle( b[0][0], b[0][1], w, h, 10, "rgb(120,120,120)" );
}

bleepsixSchematic.prototype.updateTextBoundingBox = function( text_entry ) 
{
  var ds = 50;
  var x = parseFloat( text_entry.x );
  var y = parseFloat( text_entry.y );

  var bbox = [ [0,0],[0,0] ];

  bbox[0][0] = x - ds;
  bbox[0][1] = y - ds;
  bbox[1][0] = x + ds;
  bbox[1][1] = y + ds;

  text_entry.bounding_box = bbox;

  //console.log( text_entry.text + ", " + bbox[0] + ", " + bbox[1] );

}

bleepsixSchematic.prototype.updateLabelBoundingBox = function( label_entry ) 
{
  var ds = 50;
  var x = parseFloat( label_entry.x );
  var y = parseFloat( label_entry.y );

  var bbox = [ [0,0],[0,0] ];

  bbox[0][0] = x - ds;
  bbox[0][1] = y - ds;
  bbox[1][0] = x + ds;
  bbox[1][1] = y + ds;

  label_entry.bounding_box = bbox;

  var orientation_flag = "H";
  /*
  if ( (label_entry.orientation == 1) ||
       (label_entry.orientation == 3) )
    orientation_flag = "V";
    */

  var rot_rad = parseInt( label_entry.orientation ) * Math.PI / 2.0;
  var T = this._R( rot_rad );

  var hjustify = "L";
  var vjustify = "T";
  if ( (label_entry.orientation == 2) ||
       (label_entry.orientation == 3) )
  {
    vjustify = "B";
  }

  label_entry.coarse_bounding_box = 
    this._get_text_bbox( label_entry.text, x, y, x, y, T,
                         orientation_flag, hjustify, vjustify,
                         label_entry.dimension );

}


bleepsixSchematic.prototype.updatePointBoundingBox = function( pnt_entry )
{
  var ds = 50;

  var x = parseFloat( pnt_entry["x"] );
  var y = parseFloat( pnt_entry["y"] );

  var bbox = [ [0,0],[0,0] ];

  bbox[0][0] = x - ds;
  bbox[0][1] = y - ds;
  bbox[1][0] = x + ds;
  bbox[1][1] = y + ds;

  pnt_entry["bounding_box"] = bbox;
}

bleepsixSchematic.prototype.updateWireBoundingBox = function( wire_entry ) 
{

  var ds = 50;
  var eps = 5;

  var x0 = parseFloat( wire_entry["startx"] );
  var y0 = parseFloat( wire_entry["starty"] );

  var x1 = parseFloat( wire_entry["endx"] );
  var y1 = parseFloat( wire_entry["endy"] );

  if (x0 > x1) { var t = x0; x0 = x1; x1 = t; }
  if (y0 > y1) { var t = y0; y0 = y1; y1 = t; }

  var bbox = [ [x0,y0], [x1,y1] ];
  if ( Math.abs (x0-x1) < eps )
  {
    bbox[0][0] -= ds;
    bbox[1][0] += ds;
  }

  if (Math.abs (y0-y1) < eps )
  {
    bbox[0][1] -= ds;
    bbox[1][1] += ds;
  }

  wire_entry["bounding_box"] = bbox;

}


bleepsixSchematic.prototype.find_min_xy = function( xy )
{
  var n = xy.length;
  var x_min = xy[0][0];
  var y_min = xy[0][1];

  for (var ind=1; ind<n; ind++)
  {
    if (xy[ind][0] < x_min)
      x_min = xy[ind][0];
    if (xy[ind][1] < y_min)
      y_min = xy[ind][1];
  }

  return [ x_min, y_min ];
}


bleepsixSchematic.prototype.find_max_xy = function( xy )
{
  var n = xy.length;
  var x_max = xy[0][0];
  var y_max = xy[0][1];

  for (var ind=1; ind<n; ind++)
  {
    if (xy[ind][0] > x_max)
      x_max = xy[ind][0];
    if (xy[ind][1] > y_max)
      y_max = xy[ind][1];
  }

  return [ x_max, y_max ];
}

//DEBUG
var zonk_flag=false;

bleepsixSchematic.prototype._get_text_bbox = function( text, 
                                                       center_x, center_y,
                                                       text_x, text_y, transform, 
                                                       orientation, hjustify, vjustify, 
                                                       size) 
{

  var x = parseFloat( center_x );
  var y = parseFloat( center_y );

  text_x = parseFloat( text_x );
  text_y = parseFloat( text_y );

  var local_x = text_x - x ;
  var local_y = text_y - y ;

  var text_width  = parseFloat( size );
  var text_height = text_width / 0.6;

  var x_height    = Math.floor( 0.42 * text_height + 0.5 );
  var fudge_up    = (text_height - x_height)/4;

  var name = text;

  var bbox = [[0,0],[0,0]];

  var l = text_width * name.length;
  var h = text_height ;

  var xmin = local_x;
  var xmax = local_x;
  var ymin = local_y;
  var ymax = local_y;

  if ( orientation == "V" )
  {
    if      ( hjustify == "C" ) { xmin += -h/2.0;  xmax +=  h/2.0; }
    else if ( hjustify == "R" ) { xmin += -h;      xmax +=      0; }
    else if ( hjustify == "L" ) { xmin +=  0;      xmax +=      h; }

    if      ( vjustify == "C" ) { ymin +=  l/2.0;  ymax += -l/2.0; }
    else if ( vjustify == "B" ) { ymin +=      l;  ymax +=      0; }
    else if ( vjustify == "T" ) { ymin +=      0;  ymax +=     -l; }
  }
  else 
  {
    if      ( hjustify == "C" ) { xmin += -l/2.0;  xmax +=  l/2.0; }
    else if ( hjustify == "R" ) { xmin += -l;      xmax +=      0; }
    else if ( hjustify == "L" ) { xmin +=  0;      xmax +=      l; }

    if      ( vjustify == "C" ) { ymin +=  h/2.0;  ymax += -h/2.0; }
    else if ( vjustify == "B" ) { ymin +=      h;  ymax +=      0; }
    else if ( vjustify == "T" ) { ymin +=      0;  ymax +=     -h; }
  }

  var r = [ [xmin, ymin], [xmin, ymax], [xmax, ymax], [xmax,ymin] ];
  var r_t = numeric.transpose( numeric.dot( transform, numeric.transpose(r) ) );

  var ll = this.find_min_xy( r_t );
  var ur = this.find_max_xy( r_t );

  bbox[0][0] = ll[0] + x;
  bbox[0][1] = ll[1] + y;
  bbox[1][0] = ur[0] + x;
  bbox[1][1] = ur[1] + y;

  if ( !name ) 
  {
    var ds = 25;
    bbox[0][0] -= ds;
    bbox[0][1] -= ds;
    bbox[1][0] += ds;
    bbox[1][1] += ds;
    return bbox;
  }

  return bbox;
}

bleepsixSchematic.prototype.updateComponentTextBoundingBox = function( comp_text_entry, x, y, transform ) 
{
  comp_text_entry["bounding_box"] = 
    this._get_text_bbox( comp_text_entry.text, 
                            x, y, 
                            comp_text_entry.x, comp_text_entry.y,
                            transform,
                            comp_text_entry.orientation,
                            comp_text_entry.hjustify,
                            comp_text_entry.vjustify,
                            comp_text_entry.size );

}

bleepsixSchematic.prototype.updateComponentBoundingBox = function( comp_entry ) 
{
  var raw_name = comp_entry["name"];

  var name = this.toCacheName( raw_name );
  var bbox = [ [0,0],[0,0] ];

  if (!("component_lib" in this.kicad_sch_json)) {
    this.kicad_sch_json["component_lib"] = {};
  }

  var component_lib = this.kicad_sch_json.component_lib;


  if (name in component_lib)
  {
    bbox = component_lib[name]["bounding_box"];
  }
  else
  {
    if (!("unknown" in component_lib))
      component_lib["unknown"] = this.makeUnknownComponent();
    bbox = component_lib["unknown"]["bounding_box"];
  }

  var xl = bbox[0][0];
  var yb = bbox[0][1];

  var xr = bbox[1][0];
  var yt = bbox[1][1];

  var T = comp_entry["transform"];
  var r = [ [ xl, yb ], [ xl, yt ], [ xr, yt], [xr, yb] ];
  var r_t = numeric.transpose( numeric.dot( T, numeric.transpose(r) ) );

  var ll = this.find_lower_left( r_t );
  var ur = this.find_upper_right( r_t );

  var x = parseFloat( comp_entry["x"] );
  var y = parseFloat( comp_entry["y"] );

  var bbox_f = [ [0,0],[0,0] ];

  bbox_f[0][0] = ll[0] + x;
  bbox_f[0][1] = ll[1] + y;
  bbox_f[1][0] = ur[0] + x;
  bbox_f[1][1] = ur[1] + y;

  comp_entry["bounding_box"] = bbox_f;

  for (var ind in comp_entry["text"] )
  {
    this.updateComponentTextBoundingBox( comp_entry["text"][ind], x, y, comp_entry["transform"] );
  }

}

bleepsixSchematic.prototype.updateBoundingBox = function( ele, respect_headless ) 
{

  respect_headless = ( (typeof respect_headless === 'undefined') ? true : respect_headless );

  if ( typeof ele == 'undefined' )
  {
    var ind;
    var sch = this.kicad_sch_json["element"];

    for (ind in sch)
    {

      if (respect_headless && bleepsixSchematicHeadless)
        continue;

      if      ( sch[ind]["type"] == "component")  { this.updateComponentBoundingBox( sch[ind] ); }
      else if ( sch[ind]["type"] == "connection") { this.updatePointBoundingBox( sch[ind] ); }
      else if ( sch[ind]["type"] == "noconn")     { this.updatePointBoundingBox( sch[ind] ); }

      else if ( sch[ind]["type"] == "textnote" )  { this.updateTextBoundingBox( sch[ind] ); }

      else if ( sch[ind]["type"] == "label" )              { this.updateLabelBoundingBox( sch[ind] ); }
      else if ( sch[ind]["type"] == "labelglobal" )        { this.updateLabelBoundingBox( sch[ind] ); }
      else if ( sch[ind]["type"] == "labelheirarchical" )  { this.updateLabelBoundingBox( sch[ind] ); }

      //else if ( sch[ind]["type"] == "text")       { this.updateTextBoundingBox( sch[ind] ); }
      else                                        { this.updateWireBoundingBox( sch[ind] ); }

    }

  }
  else
  {
    var t = ele["type"];

    //if (bleepsixSchematicHeadless) return;
    if (respect_headless && bleepsixSchematicHeadless)
      return;

    if      (t == "component")    this.updateComponentBoundingBox( ele );
    else if (t == "noconnect")    this.updatePointBoundingBox( ele );
    else if (t == "connection")   this.updatePointBoundingBox( ele );
    else if (t == "noconn")     { this.updatePointBoundingBox( ele ); }

    else if ( t == "textnote" )  { this.updateTextBoundingBox( ele ); }

    else if ( t == "label" )              { this.updateLabelBoundingBox( ele ); }
    else if ( t == "labelglobal" )        { this.updateLabelBoundingBox( ele ); }
    else if ( t == "labelheirarchical" )  { this.updateLabelBoundingBox( ele ); }


    //else if (t == "text")         this.updateTextBoundingBox( ele );
    else                          this.updateWireBoundingBox( ele );
  }

}

// component cache and these load functions should really be separated out...
//
bleepsixSchematic.prototype.load_part = function(name, data)
{

  // component_cache is the cache of unique parts
  //
  this.kicad_sch_json.component_lib[name] = data;
  this.find_component_bounding_box( this.kicad_sch_json.component_lib[name] );
  
  this.queued_display_component_count--;
  if (this.queued_display_component_count == 0)
  {
    this.updateBoundingBox();
    this.displayable = true;
    g_painter.dirty_flag = true;
  }

}

bleepsixSchematic.prototype.load_part_error = function(part_json, jqxr, textStatus, error)
{
  console.log( "part load error (" + part_json +"): " + textStatus + ", " + error);
}


bleepsixSchematic.prototype._decorateSchematicWithIds = function( )
{
  var sch = this.kicad_sch_json["element"];
  var ind;

  for (ind in sch)
  {

    //ID already assigned, just skip
    //
    if ( (!("id" in sch[ind])) ||
         (String(sch[ind].id).length == 0)) 
      sch[ind]["id"] = this._createId();

    // Otherwise, give an ID to the element
    // and all of it's children.
    // Currently, text elements of components
    // are the only children.
    //
    if (sch[ind]["type"] == "component")
    {
      for (var t_ind in sch[ind]["text"])
      {

        if ( (!("id" in sch[ind].text[t_ind])) ||
               (String(sch[ind].text[t_ind].id).length == 0)) 
          sch[ind].text[t_ind].id  = this._createId( sch[ind].id );
      }
    }

  }

}

// Change all references that have a trailing question
// mark to be numbered.
//
// This function changes components 'reference' property
// and their 'text[0].text' property.
//
bleepsixSchematic.prototype._annoteSchematic = function( )
{

  var sch = this.kicad_sch_json["element"];
  var ind;

  for (ind in sch)
  {
    var ref = sch[ind];
    if (ref.type == "component")
    {

      // If either has a question mark at the end,
      // allocate a new reference.
      //
      if ( !(ref.reference.match( /\?$/ ) ||
             ref.text[0].text.match( /\?$/ ) ) )
      {
        continue;
      }

      var ref_name = this.getReferenceName( ref );
      ref.reference = ref_name;
      ref.text[0].text = ref_name;

    }

  }

}

/*
bleepsixSchematic.prototype.cache_component = function( name )
{
  if (name in g_component_cache) return;

  var part_json = g_component_location[name].location;

  if (name == "unknown")
  {
    var unknown_json = this.makeUnknownComponent();
    g_component_cache["unknown"] = unknown_json;
    return;
  }

  this.queued_display_component_count++;

  var schem = this;
  $.ajaxSetup({ cache : false });
  $.getJSON( part_json,
    ( function(a) {
        return function(data) {
          schem.load_part(a, data);
        }
      }
    )(name)
  ).fail(
    ( function(a) {
        return function(jqxhr, textStatus, error) {
          schem.load_part_error(a, jqxhr, textStatus, error);
        }
      }
    )(part_json)
  );			

}
*/

// We can get into a situation where we've loaded the g_component_location
// from a default, then we've authenticated, then we load a g_component_location
// based on user preferences.
// If we try to render a schematic that has a missing component from the default
// location but has it in the user location, we need to reload the part when
// the new location becomes present.
// As a first attempt to clear this issue up, a request will be sent every half
// second to try and fetch the new component.
bleepsixSchematic.prototype._deferLoadComponent = function( name )
{
  if ( !(name in g_component_location) ) {
    setTimeout( (function(xx) { return function() { xx._deferLoadComponent( name ); } })(this), 500 );
    return;
  }

}

bleepsixSchematic.prototype.load_schematic = function( json )
{

  this.kicad_sch_json = json;

  // We don't need to wait for the component cache to load as that's
  // only the art.  By the time we have the json for the schematic,
  // we have full information and can decorate each relevant item
  // with an id.

  this._updateReference();
  this._decorateSchematicWithIds();
  this._annoteSchematic();

  var sch = this.kicad_sch_json["element"];
  var component_lib = this.kicad_sch_json.component_lib;

  for (var ind in sch)
  {

    sch[ind].hideFlag = false;

    if (sch[ind]["type"] != "component") continue;

    var comp = sch[ind];

    var name = this.toCacheName( comp["name"] );

    if (bleepsixSchematicHeadless)
      continue;


    //if (name in g_component_cache)
    if (name in component_lib)
    {
      // nothing to do...
    }
    else
    {

      if ( !(name in g_component_location)) 
      {

        if (name != "unknown") 
        {
          console.log("ERROR: bleepsixSchematic.load_schematic: " + name + " not in g_component_location");
        } 
        else
        {
          console.log("'unknown' part...");
        }

        sch[ind]["unknown_text_field"] = 
        {
          "bounding_box" : [ [ -50, -50] , [50,50] ],
          "text" : "??",
          "orientation": "H",
          "reference": "??",
          "hjustify": "C",
          "number": 0,
          "vjustify": "C",
          "visible": true,
          "bold": false,
          "italic": true,
          "x": comp["x"],
          "y": comp["y"],
          "size": "100",
          "transform" : [ [ 1, 0 ], [ 0, -1 ] ],
          "flags" : "0000 C CNN"
        };


        // it's an unknown part, so display the 'unknown' special symbol
        //
        continue;
      }

      this.displayable = false;

      // This should no longer be necessary as the component_lib
      // is now required to have the component information that's
      // in the schematic.
      //
      /* 
      var part_json = g_component_location[name].location;

      // A litle fancy footing here.
      // If we just created a callback via 'function(data) { controller.load_part( name, data); }',
      // this would reference the global name and data.  By forcing an evaluation, it loads
      // the current value of name and data, then scope is withdrawn and the old values stick.
      // blech, bad description, see here: 
      //   http://stackoverflow.com/questions/750486/javascript-closure-inside-loops-simple-practical-example


      g_schnetwork.fetchComponent( 
          name, 
          part_json, 

          (function(xx) { 
            return function(nam, dat) { 
              g_component_cache[nam] = dat;
              xx.load_part(nam, dat); 
            }; 
          })(this) ,

          (function(xx) { 
            return function(dat, jqxhr, textStatus, error) { 
              xx.load_part_error( dat, jqxhr, textStatus, error);
            };
          })(this)

        )

      this.queued_display_component_count++;

      */

    }
  }

  // The case where all our library components are cached, we need to ask for a redraw
  //

  if (bleepsixSchematicHeadless)
    return;

  if (this.queued_display_component_count == 0)
    g_painter.dirty_flag = true;

}

bleepsixSchematic.prototype.getSchematicBoundingBox = function()
{
  var sch = this.kicad_sch_json["element"];

  var fin_bbox = [ [0,0], [0,0] ];
  var first = true;

  for (var ind in sch)
  {

    if (sch[ind].hideFlag) continue;

    var comp = sch[ind];
    if ( !("bounding_box" in comp) ) continue;
    var bbox = comp["bounding_box"];

    var x0 = bbox[0][0];
    var y0 = bbox[0][1];

    var x1 = bbox[1][0];
    var y1 = bbox[1][1];


    var mx = ( (x0 < x1) ? x0 : x1 );
    var Mx = ( (x0 < x1) ? x1 : x0 );

    var my = ( (y0 < y1) ? y0 : y1 );
    var My = ( (y0 < y1) ? y1 : y0 );

    if (first) {
      fin_bbox[0][0] = mx;
      fin_bbox[0][1] = my;
      fin_bbox[1][0] = Mx;
      fin_bbox[1][1] = My;
      first = false;
    }

    if (fin_bbox[0][0] > mx) fin_bbox[0][0] = mx;
    if (fin_bbox[0][1] > my) fin_bbox[0][1] = my;
    if (fin_bbox[1][0] < Mx) fin_bbox[1][0] = Mx;
    if (fin_bbox[1][1] < My) fin_bbox[1][1] = My;

  }

  return fin_bbox;

}


if (typeof module !== 'undefined')
{
  module.exports = bleepsixSchematic;
}

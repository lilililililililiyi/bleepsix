var drawing = true,
    running = true,
    mouseDown = false,
    visible = true;

var msec = 0;
var frame = 0;
var lastTime = new Date();

var g_snapgrid = null;
var g_painter = null;
var g_schematic_controller = null;
var g_controller = null;

var g_imgcache = null;


var g_canvas = "canvas";
var g_context = null;

var g_schnetwork = null;

var g_show_fps = false;

function canvasFocus()
{
  var c = document.getElementById("canvas");
  c.focus();
}

function position_html_button_elements(w, h) {
  var top = [ "3px", "0px", "0px", "0px" ];
  var tf = [ 0, 0, 0, 0 ];

  var left = [ "0px", "50px", "100px", "150px" ];
  var base_left = [ 500, 700, 750, 900 ];

  for (var i=0; i<base_left.length; i++) {
    var offset = (1200-w);
    if (offset < 0) offset = 0;
    left[i] = String( base_left[i] - offset ) + 'px';
  }

  if (w<1000) {
    top = [ "38px", "35px", "35px", "35px" ];
    left = [ "70px", "100px", "130px", "180px"  ]
  }

  ele = document.getElementById('homeButton');
  ele.style.top = top[0];
  ele.style.left = left[0];

  var ele = document.getElementById('uploadButton');
  ele.style.top = top[1];
  ele.style.left = left[1];

  ele = document.getElementById('downloadButton');
  ele.style.top = top[2];
  ele.style.left = left[2];

  ele = document.getElementById('snapButton');
  ele.style.top = top[3];
  ele.style.left = left[3];

}


function loop() {

  frame = frame + 1;
  if ( frame >= 30 ) {
    var d = new Date();
    msec = (d.getTime() - lastTime ) / frame;
    lastTime = d;
    frame = 0;
  }

  if (g_show_fps) 
  {
    var container = document.querySelector( 'section' );
    container.innerHTML = "FPS: " + (1000.0/msec);
  }

  var saved_dirty = g_painter.dirty_flag;

  g_schematic_controller.redraw();
  requestAnimationFrame( loop, 1 );
}

$(document).ready( function() {

  var s = location.search.replace('?', '').split('&').map(function(val){
    return val.split('=');
  });

  /*
  var projectId = null;
  if ( s.length > 0 )
  {
    if (s[0][0] == "project") { projectId = s[0][1]; }
  }
  */

  var viewUserId = $(document).getUrlParam('user');
  if (!viewUserId)
    viewUserId = undefined;

  var projectId = $(document).getUrlParam('project');
  if (!projectId)
    projectId = undefined;

  bleepsixBoardHeadless = true;

  meowmeow();

  var cvs = document.getElementById('canvas');
  cvs.onselectstart = function() { return false; }

  g_snapgrid = new snapGrid(true, "deci-mil", 50);

  g_painter = new bleepsixRender( "canvas" );
  g_painter.setGrid ( 1 );

  g_schematic_controller = new bleepsixSchematicController( true );
  g_schematic_controller.init( "canvas" );
  g_context = g_schematic_controller.context;

  g_controller = g_schematic_controller;

  g_schematic_controller.schematic.setLocalComponentCache( g_component_cache );


  // setup image cache and preload some generic items
  //
  var img_base = "img";
  g_imgcache = new imageCache();
  g_imgcache.add( "cursor", img_base + "/cursor_custom_base_s24.png" );
  g_imgcache.add( "cursor:wire", img_base + "/cursor_custom_wire_s24.png" );
  g_imgcache.add( "cursor:bus", img_base + "/cursor_custom_bus_s24.png" );
  g_imgcache.add( "cursor:conn", img_base + "/cursor_custom_conn_s24.png" );
  g_imgcache.add( "cursor:noconn", img_base + "/cursor_custom_noconn_s24.png" );

  requestAnimationFrame( loop, 1 );

  g_schnetwork = new bleepsixSchematicNetwork( MEOWURL, true );

  if ( (typeof viewUserId !== "undefined") &&
       (typeof projectId !== "undefined") )
  {
    load_component_location( viewUserId, null, projectId );
    load_footprint_location( viewUserId, null, projectId );
  }
  else
  {
    load_component_location();
    load_footprint_location();
  }


  position_html_button_elements( 1200, 700 );

  // camera snapshot
  //
  $( "#snapElement" ).hover(

    function() {
      g_schematic_controller.drawSnapArea = true;
      g_painter.dirty_flag = true;
    },

    function() {
      g_schematic_controller.drawSnapArea = false;
      g_painter.dirty_flag = true;
    }

  );


  canvasFocus();

  var w = $(window).width();
  var h = $(window).height();
  var canv = document.getElementById('canvas');
  canv.width = w;
  canv.height = h;
  g_painter.setWidthHeight( w, h );

  position_html_button_elements( w, h );
  g_schematic_controller.resize(w,h);

  $(window).resize( function(ee) {
    var w = $(window).width();
    var h = $(window).height();
    var canv = document.getElementById('canvas');
    canv.width = w;
    canv.height = h;
    g_painter.setWidthHeight( w, h );

    position_html_button_elements( w, h );
    g_schematic_controller.resize(w,h,ee);
  });


  if (projectId)
  {
    var container = { "type" : "schJSON", "projectId" : projectId };
    var str_data = JSON.stringify( container );
    $.ajax({
      url: "bleepsixDataManager.py",
      type: 'POST',
      data: str_data,
      success: deferLoadSchematic,
      error: function(jqxhr, status, err) { console.log(jqxhr); console.log(status); console.log(err); }
    });
  }

});

/* we need to make sure the component library is loaded
 * or the parts won't render properly.
 */
function deferLoadSchematic(xx) {
  if (!g_component_location_ready)
  {
    setTimeout( function() { deferLoadSchematic(xx); }, 500 );
    return;
  }
  g_schematic_controller.schematic.load_schematic(xx.json_sch); 
}

if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
      return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function( callback, element ) {
        window.setTimeout( callback, 1000 );
      };
    } )();
}

function schJSONDownload( json_container )
{

  var msg_type = json_container["type"];
  if (msg_type != "id")
  {
    console.log("error, expected id, got: " + msg_type);
    console.log(json_container);
    return;
  }

  // fiddle with iframe to send a download request
  //
  var id = json_container["id"];
  var ifrm = document.getElementById( "downloadFrame" );
  ifrm.src = "bleepsixDownloadManager.py?id=" + id;

}


function initiateDownload( json_container )
{
  var msg_type = json_container["type"];
  if (msg_type != "id")
  {
    console.log("error, expected id, got: " + msg_type);
    console.log(json_container);
    return;
  }

  // fiddle with iframe to send a download request
  //
  var id = json_container["id"];
  var ifrm = document.getElementById( "downloadFrame" );

  url = "bleepsixDownloadManager.py?id=" + id;
  if ("name" in json_container)
  {
    url += '&name=' + json_container["name"]
  }
  ifrm.src = url;
}


function downloadSchematic( )
{
  var json_data = g_schematic_controller.schematic.kicad_sch_json ;

  var container = { "type" : "createKiCADSchematic", data: json_data };
  var str_data = JSON.stringify( container );

  $.ajax({
    url: "bleepsixDataManager.py",
    type: 'POST',
    data: str_data,
    success: schJSONDownload,
    error: function(jqxhr, status, err) { console.log(jqxhr); console.log(status); console.log(err); }

    });
}

function downloadProject( )
{
  var sch_data = g_schematic_controller.schematic.kicad_sch_json ;
  var brd_data = g_schematic_controller.board.kicad_brd_json ;

  var container = { "type" : "downloadProject", board: brd_data, schematic: sch_data };
  var str_data = JSON.stringify( container );

  $.ajax({
    url: "bleepsixDataManager.py",
    type: 'POST',
    data: str_data,
    success: initiateDownload,
    error: function(jqxhr, status, err) { console.log(jqxhr); console.log(status); console.log(err); }

  });
}

function populateIframe(id,path)
{
  var ifrm = document.getElementById(id);
  ifrm.src = "bleepsixDownloadManager.php?path=" + path;
}

function uploadComplete(x)
{
  var json_data = JSON.parse( this.response  );
  if ( json_data["type"] == "error" )
  {
    console.log("error..." + json_data["message"] );
  }
  else
  {
    g_schematic_controller.schematic.load_schematic( json_data );
    g_schematic_controller.schematicUpdate = true;
  }
}

function uploadError()
{
  console.log("upload error");
}

function uploadAbort()
{
  console.log("upload abort");
}

function uploadProgress()
{
  console.log("upload progress");
}


function sendFile( file )
{

  console.log("file:");
  console.log(file);

  var formData = new FormData();
  formData.append( "fileType", "sch" );
  formData.append( "fileData", file );
  console.log(formData);

  var uri = "bleepsixUploadManager.py";
  var xhr = new XMLHttpRequest();
  xhr.upload.addEventListener("progress", uploadProgress, false );
  xhr.addEventListener("load", uploadComplete, false );
  xhr.addEventListener("error", uploadError, false );
  xhr.addEventListener("abort", uploadAbort, false );

  xhr.open( "POST", uri );
  xhr.send( formData );

}

function handleFiles( files )
{
  var n = files.length;
  for (var i=0; i<n; i++)
    sendFile(files[i]);

  canvasFocus();
}

function foo( files)
{
  console.log("foo");
  console.log(files);
}

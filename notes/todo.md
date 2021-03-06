
# TODO

## General

## important
* Load Adafruit, Dangerous Prototypes and Sparkfun libraries
* Download spinner
* Initial loading indicator (spinner or something)
* Add Eagle import

## moderate
* Formalize KiCAD JSON spec
* Fix upload, both in schematic and in board.  Need to decide how exactly to do this.  Add elements
  one at a time?  If a board and a schematic is specified we should try to tie them together?
  UPDATE: this should probably be taken out altogether and expose another interface through
  the web page (meowcad) to upload.
* Add KiCAD export
* Consider context aware functionality (for mobile)
  - every action needs a 'tap to execute' followed by a 'tap to execute' model.
  - undo (button) needs to present
  - trash or some other cancel button needs to be present
  - pan/zoom issues?

## low
* Accessibility?
* CLI
  - might solve some mobile issues?
  - might solve some accessibility issues?
  - have the mouse interact (select a point, have it show up in the CLI)
  - tab complete
  - enter on blank or esc to quit, enter in toolnav to enable
  - help prominent
  - try to match bash shell nicesims (ctrl skip word, arrows etc)
* Add timestamps to sessions, portfolios and the like.


* ~~Tooltips~~
* ~~Undo/Redo buttons~~
* ~~DRC checks for both~~
* ~~Produce drill file~~
* ~~Through hole not rotation properly in gerber production?  for example: CR2032H not rotation~~
* ~~Cross browser net highlights~~
* ~~Export issues with zone.  KiCAD expects path not to overlap with any open regions.  Convert
  to appropriate polyscorners so KiCAD doesn't get confused (gerber is fine).~~ (fixed with weakpwh)
* ~~undo/redo batching and server communication~~
* ~~Add in name verification to delete project.~~

## Schematic

* Wire "grabbing" instead of free floating pick and move.

* ~~Need cursor icon for label.~~
* ~~toolWire needs to take into account component rotation when highlighting net~~
* ~~Power lines need to be treated as a net so nets connect in board.~~
* ~~**Import modules.**~~

## Board

* toolTrace needs self intersection test.
* Move text for modules.
* Add via tool.
* DXF imports edges/copper.

* ~~toolTrace gets confused when trying to connect two lines without an intermediate click.~~ ??
* ~~Highlighting nets across tabs are just fucked up.  They highlight pads they shouldn't, they're all over
  the place.  Fix them.~~
* ~~Don't highlight net 0~~
* ~~Highlight pin/pad when hovering (and not part of a net or of net 0)~~
* ~~Fix pad hilighting after initial placement~~
* ~~make unknown capital 'U' instead of lowercase 'u'~~
* ~~toolBoardNav rotate needs to split/join net.~~
* ~~rat's nest initially is wonky (somtimes?)~~
* ~~toolTrace needs some work with regards to the initial joint pair.  Sometimes it gets confused
  if it intersects geometry initially.~~
* ~~Shift auto placed parts so they don't stack on top of each other.~~
* ~~Need cursor for edges, track fcolor, zone and text.~~
* ~~toolTrace net highlighting still not working.  Sometimes shows wrong highlighted net.~~
* ~~rat's nest needs to be recalculated consistently.  Sometimes it just disappears after operation.~~
* ~~toolTrace needs to either highlight net show the airwire so we know where we're
  routing to.~~
* ~~Recalculate rats nest after placement of parts and traces~~
* ~~rats nest and schematic net to board net highlighting issues when splitting/deleting traces.~~
* ~~When splitting nets, the newly created split net isn't persisting across refreshes.  It's not being
  saved in the database?~~
* ~~Group/Track/Module moves need to ghost if they fall within the forbidden zone.~~
* ~~refLookups are failing.~~
* ~~Element moves need to induce splits and joins for their nets.~~
* ~~There was a hang when trying to add a trace to a via.  Having a hard time reproducing.~~
* ~~Store sch_pin_id_net_map and call updateSchematicNetcodeMap appripriately (bug fix).~~
* ~~zone sometimes makes thin connections to thermal reliefs.~~
* ~~Flip needs to go into opCommand and special consideration needs to be done for through hole parts.~~
* ~~**Import modules.**~~

* ~~BUG: There's a stray via that got into one of the board layouts.  I'm nto sure if adding/deleting put
  it there or if I accidentally did an 'undo' and screwed things up.  Project-id: 174c284d-b216-40d3-b78b-89b86f3d2a94~~



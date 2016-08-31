/* =============================================================================
VIOLENCIA
````````````````````````````````````````````````````````````````````````````````

We want to load data from .json files -- these are where we'll have entity logic,
stats, and similar.

A basic file for a monster:
{
  name: "Monster",
  sprite: "monster",
  onBirth: function() {
  },
  onDeath: function() {
    // game is accessible here!
    game.createParticles("blood", ...);
  },
  onThink: function() {
  }
}

To make 'game' visible, we'll have to run `eval('('+code+')')` -- whilst the hordes
wouldeth cryeth outeth that this is a blasphemy, I declare it as okay.

,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Engine Structure
````````````````````````````````
  * game
    * classes
      * Contains all classes loaded and used for object creation
    * objects
      * Contains all objects loaded (for the current map/area...?)
  * loadGameData
    * Loads the file "data/game.json" and
      * starts loading the necessary data files

,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Game State Logic
````````````````````````````````
  * Menu
    * Start Game
      * Begin NetStart
    * Join Game
      * Begin NetJoin
  * NetStart
    * set up WebRTC stuff
    * start NetJoin to ourself
  * NetJoin
    * connect to server
    * receive pertinent information:
      * Our Player ID
      * All Players
      * etc
    * On finish, switch to NetGame
  * NetGame
    * Begins on TravelState
      * TravelState clears the game world, creates the map, and places entities in it
      * on finish, GameState is switched to
    * GameState
      * if server
        * handle received player commands
        * tick the world
        * send world delta for each player
        * if "travel" is triggered, send Travel to all clients and switch to TravelState
      * if client
        * Handle user keypresses/commands and send to server
        * if not server
          * update entities with received server data
          * Locally predict velocities of entities
          * if "travel" is received, switch to TravelState

,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Mid-game Netcode Flow
````````````````````````````````
[server]                         [client]
handleNetData   <-------------- send {CMD} (MOVE dir, ACT id, LEAVE, CHAT, etc.)
 check net->player id
  handlePlayerInput(id, CMD)
run world                       run world (simulate velocities)
 send change deltas ----------->  update objects with deltas
                                  ---- OR IF ALSO SERVER ----
                                        do nothing
============================================================================= */ 

var ktk = ktk || {};
/*
The render has built-in rendering optimizations! This is dictated by a "virtual size" that splits the map into sections and places sprites within those sections for rendering. The quadrant sizes are dictated by (canvas.width*2 x canvas.height*2).
*/
ktk.rndr = (function() {
  /* ================ PRIVATE ================ */
  var target = { w: 320, h: 160 };
  var screen = { w: 0, h: 0 };
  var virtual = { w: 0, h: 0, x: 0, y: 0 };
  var f_images = {}; // flipped images
  var images = {};
  var sprite_data = {};
  var sprites = []; // global sprites
  var quadrants = [];
  // 1. find our rendering type
  var type = 'null';
  var display = null;
  var canvas = document.createElement('canvas');
  var o_canvas = document.createElement('canvas');
  var o_context = o_canvas.getContext('2d');
  o_canvas.style.display = 'none';
  if (canvas.getContext) {
    type = 'canvas';
  } else {
    console.log('Error, no canvas support!');
  }
  // 2. initialize renderer
  if (type == 'canvas') {
    var context = null;
    function initDisplay(display_) {
      display = display_;
      context = canvas.getContext('2d');
      display.appendChild(canvas);
      window.addEventListener('resize', handleDisplayResize, false);
      // add our offscreen canvas
      display.appendChild(o_canvas);
    }
    function handleDisplayResize() {
      var win = window.getComputedStyle(display, null);
      var d_w = parseInt(win.getPropertyValue('width'));
      var d_h = parseInt(win.getPropertyValue('height'));

      screen.w = d_w;
      screen.h = d_h;

      var ratio = Math.floor(Math.min(d_w / target.w, d_h / target.h));
      var t_w = target.w * ratio;
      var t_h = target.h * ratio;
      if (virtual.w < target.w || virtual.h < target.h) setupQuadrants();
      canvas.width = target.w;
      canvas.height = target.h;
      canvas.style.marginLeft = (screen.w - t_w)/2+'px';
      canvas.style.marginTop = (screen.h - t_h)/2+'px';
      canvas.style.width = t_w+'px';
      canvas.style.height = t_h+'px';
      canvas.style.border = '1px solid red';
    }
    function onRender(delta) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      var start = getQuadrantIntersection(virtual.x - screen.w, virtual.y - screen.h);
      var end = getQuadrantIntersection(virtual.x + screen.w, virtual.y + screen.h);
      for (var i in quadrants[start.x][start.y].sprites) {
        var sprite = quadrants[start.x][start.y].sprites[i];
        // TODO: probably have a "getImage" function that returns a dummy image if the file isn't loaded yet?
        if (images[sprite.image]) {
          var frame = sprite_data[sprite.image].A[sprite.anim].S[sprite.set].F[sprite.frame];
          if (sprite.animate) {
            // increase our frame if enough time has passed
            sprite.elapsed += delta;
            while (sprite.elapsed >= frame.t) {
              sprite.elapsed -= frame.t;
              if (sprite_data[sprite.image].A[sprite.anim].S[sprite.set].F.length-1 <= sprite.frame) {
                sprite.frame = 0;
              } else {
                sprite.frame++;
              }
              frame = sprite_data[sprite.image].A[sprite.anim].S[sprite.set].F[sprite.frame];
            }
          }
          // FIXME: the entire sprite flipping code is bad
          // draw it
          if (sprite.flip) {
            context.drawImage(f_images[sprite.image], (f_images[sprite.image].width-frame.w)-frame.x, frame.y, frame.w, frame.h, Math.floor(sprite.x), Math.floor(sprite.y), frame.w, frame.h);
          } else {
            context.drawImage(images[sprite.image], frame.x, frame.y, frame.w, frame.h, Math.floor(sprite.x), Math.floor(sprite.y), frame.w, frame.h);
          }
        }
      }
      for (var x = start.x; x != end.x; x++) {
        for (var y = start.y; y != end.y; y++) {
          for (var i in quadrants[x][y].sprites) {
            var sprite = quadrants[x][y].sprites[i];
            context.drawImage(images[sprite.image], sprite.x, sprite.y);
          }
        }
      }
    }
  }
  /* ======== Quadrant ======== */
  function setupQuadrants() {
    // collect old sprites
    for (var i = 0; i < quadrants.length; i++) {
      for (var j = 0; j < quadrants[i].length; j++) {
        sprites = sprites.concat(quadrants[i][j].sprites);
      }
    }
    // create new quadrants
    var x = Math.ceil(virtual.w / (screen.w*2));
    if (x == 0) x = 1;
    var y = Math.ceil(virtual.h / (screen.h*2));
    if (y == 0) y = 1;
    console.log('creating ' + x + 'x' + y + ' quadrants');
    for (var i = 0; i < x; i++) {
      quadrants[i] = [];
      for (var j = 0; j < y; j++) {
        quadrants[i][j] = new Quadrant();
      }
    }
    // add sprites to quadrants
    for (var i = 0; i < sprites.length; i++) {
      var inter = getQuadrantIntersection(sprites[i].x, sprites[i].y);
      addSpriteToQuadrant(sprites[i], inter.x, inter.y);
    }
    sprites = [];
  };
  function addSpriteToQuadrant(sprite, x, y) {
    sprite.quadrant.x = x;
    sprite.quadrant.y = y;
    sprite.quadrant.index = quadrants[x][y].sprites.length;
    quadrants[x][y].sprites.push(sprite);
    console.log('added sprite to ' + x + 'x' + y);
  };
  function removeSpriteFromQuadrant(sprite) {
    quadrants[sprite.quadrant.x][sprite.quadrant.y].sprites.splice(sprite.quadrant.index, 1);
    sprite.quadrant.index = sprite.quadrant.x = sprite.quadrant.y = -1;
  };
  function moveSpriteToQuadrant(sprite) {
    var inter = getQuadrantIntersection(sprite.x, sprite.y);
    if (sprite.quadrant.x == inter.x && sprite.quadrant.y == inter.y) {
      return;
    }
    removeSpriteFromQuadrant(sprite);
    addSpriteToQuadrant(sprite, inter.x, inter.y);
  };
  function getQuadrantIntersection(x, y) {
    var x = Math.floor(x / (screen.w*2));
    if (x < 0) x = 0;
    else if (x > quadrants.length) x = quadrants.length-1;
    var y = Math.floor(y / (screen.h*2));
    if (y < 0) y = 0;
    else if (y > quadrants[0].length) y = quadrants[0].length-1;
    return {x: x, y: y};
  };
  function Quadrant() {
    this.sprites = [];
  };
  /* ======== Sprite ======== */
  function setupSprite(sprite) {
    var inter = getQuadrantIntersection(sprite.x, sprite.y);
    addSpriteToQuadrant(sprite, inter.x, inter.y);
  };
  function Sprite(image, x, y) {
    this.parent = null;
    this.children = [];
    this.id = 0;
    this.x = x;
    this.y = y;
    this.image = image;
    this.anim = '';
    this.set = '';
    this.frame = 0;
    this.elapsed = 0;
    this.flip = false;
    this.animate = true;
    this.quadrant = {
      x: 0,
      y: 0,
      index: 0
    };
    //
    this.detach = function() {
      if (!this.parent) return;
      var i = this.parent.children.indexOf(this);
      if (i != 1) this.parent.children.splice(i, 1);
      this.parent = null;
    };
    this.attach = function(parent) {
      if (this.id != 0) {
        sprite_ids.push(sprite_id);
        sprites.splice(sprite.id, 1);
      } else if (this.quadrant.index != -1) {
        removeSpriteFromQuadrant(sprite);
      }
      this.detach();
      this.parent = parent;
      this.parent.children.push(this);
    };
    this.setAnim = function(anim) {
      this.anim = anim;
    };
    this.setSet = function(set) {
      this.set = set;
    };
    this.setFrame = function(frame) {
      this.frame = frame;
    };
    this.incFrame = function() {
      this.frame += 1;
      // TODO: on sprite data load, rebuild data to be a fairly basic set of arrays with all the pertinent data stored in the frame object.
      //if (this.frame >= sprite_data[this.anim][this.set].length) this.frame = 0;
    };
    this.decFrame = function(frame) {
      this.frame -= 1;
    };
  };
  /* ================ PUBLIC ================ */
  return {
    fromElement: function(ele) {
      initDisplay(ele);
      handleDisplayResize();
      return this;
    },
    getSize: function() {
      return {w: canvas.width, h: canvas.height};
    },
    setVirtualSize: function(w, h) {
      virtual.w = w;
      virtual.h = h;
      setupQuadrants();
    },
    setVirtualPosition: function(x, y) {
      virtual.x = x;
      virtual.y = y;
    },
    loadSpriteData: function(name) {
      name = name.split(":")[0];
      return new Promise(function(resolve, reject) {
        ktk.Filer.load('data/sprites/'+name+'.json').then(function(data) {
          // THIS IS REALLY NASTY (basically we're setting frames to inherit properties from set>animation>conf -- perhaps if we did something like "Object.assign(..frame.., (frame[...]->...), set.Conf, anim.conf, global.conf)"
          // using eval to skip extra chars required by JSON.parse
          var sprite_datum = eval('('+data+')');
          sprite_datum.I = sprite_datum.I || name;
          sprite_datum.C = sprite_datum.C || {};
          for (var anim_name in sprite_datum.A) {
            var anim = sprite_datum.A[anim_name];
            anim.C = anim.C || {};
            for (var set_name in anim.S) {
              var set = anim.S[set_name];
              set.C = set.C || {};
              for (var frame_idx in set.F) {
                var frame = set.F[frame_idx];
                var frame_obj = { x: frame[0] || 0, y: frame[1] || 0, w: frame[2] || 16, h: frame[3] || 16, t: frame[4] || 100 };
                Object.assign(frame_obj, sprite_datum.C, anim.C, set.C, frame_obj);
                // replace old array with actual frame object
                set.F[frame_idx] = frame_obj;
              }
            }
          }
          sprite_data[name] = sprite_datum;
        }, function(error) {
          reject(error);
        }).then(function() {
          if (typeof images[name] === 'undefined') {
            // FIXME: this is pretty ugly -- we should probably load the data via Filer instead of using src directly
            f_images[name] = new Image();
            images[name] = new Image();
            images[name].onload = function(e) {
              o_canvas.width = images[name].width;
              o_canvas.height = images[name].height;
              o_context.save();
              o_context.scale(-1,1);
              o_context.drawImage(images[name], -images[name].width, 0);
              o_context.restore();
              f_images[name].src = o_canvas.toDataURL();
            };
            f_images[name].src = 'data/sprites/'+sprite_data[name].I+'.png';
            images[name].src = f_images[name].src;
          }
          resolve("loaded");
        });
      });
    },
    loadImageURL: function(name, url) {
      if (typeof images[name] !== 'undefined') return;
      images[name] = new Image();
      images[name].src = url;
    },
    getSpriteId: function() {
      var id = sprites.length;
      if (sprite_ids.length > 0) {
        id = sprite_ids.shift();
      }
      return id;
    },
    createSprite: function(name, x, y, global) {
      var parts = name.split(":");
      var sprite = new Sprite(parts[0], x, y);
      sprite.anim = parts[1] ? parts[1] : '';
      sprite.set = parts[2] ? parts[2] : '';
      sprite.frame = parts[3] ? parseInt(parts[3]) : 0;
      if (global) {
        sprite.id = getSpriteId();
        sprites.push(sprite);
      } else {
        setupSprite(sprite);
      }
      return sprite;
    },
    deleteSprite: function(sprite) {
      if (sprite.id != 0) {
        sprite_ids.push(sprite_id);
        sprites.splice(sprite.id, 1);
      } else {
        removeSpriteFromQuadrant(sprite);
      }
    },
    doRender: onRender
  };
})();

ktk.Filer = (function() {
  return {
    load: function(url) {
      return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url);
        req.addEventListener('load', function() {
          if (req.status == 200) {
            resolve(req.response);
          } else {
            reject(Error(req.statusText));
          }
        });
        req.addEventListener('error', function() {
          reject(Error("Network error"));
        });
        req.send();
      });
    }
  };
})();

ktk.vio = (function() {
  /* ** input ** */
  var keys = [];
  /* ** logic ** */
  var is_server = true;
  /* ** display ** */
  var display = null;
  var renderer = null;
  /* ** tick related ** */
  var is_running = false;
  // run at 20 ticks per second, I guess?
  var accumulator = 0;
  var tickrate = (1000 / 20);
  var tick_last = 0;
  /* ** frame related ** */
  var is_rendering = false;
  // 60 fps? Should we even design the engine to have a separate tick v. frame update?
  var framerate = (1000 / 60);
  var frame_last = 0;
  //
  var state = null;
  /* ** file loading ? ** */
  var classes = [];
  classes_pending = [];

  var game = {
    players: [], // id: {name, stats, object}
    objects: [],
    map: {}
  };
  /* ==== Game stuff ==== */
  function addForce(object, x, y) {
    object.vel.x += x;
    object.vel.y += y;
  }
  /* ==== Networking ==== */
  var handleMessage = function(e) {
    if (is_server) {
      // determine message type:
      //   * TRAVEL
      //   * CHAT
      //   * GAME
      //     * send to game input processing queue
      //   * QUIT
    } else {
      // determine message type:
      //   * TRAVEL
      //   * CHAT
      //   * GAME
      //   * QUIT
    }
  };
  var nsend = function(type, data) {
  };
  var nsendall = function(type, data) {
  };
  /* ==== State ==== */
  var MenuState = {
    onTick: function(elapsed) {
    }
  };
  var LobbyState = {
    // herein lies joining a lobby and creating TravelState
  };
  var TravelState = {
    // herein lies connecting to a given server and resetting world objects
  };
  var GameState = {
    // herein lies the game physics state, calls TravelState on map change
    onInit: function() {
      renderer.setVirtualSize(1920, 1080);
      createObject("birb");
      var a = createObject("text");
      a.set("wat");
    },
    onTick: function(elapsed) {
      if (is_server) {
        for (var i in game.objects) {
          if (game.objects[i].onThink) game.objects[i].onThink();
          // run physics
          game.objects[i].x += game.objects[i].v.x;
          game.objects[i].y += game.objects[i].v.y;
          game.objects[i].sprite.x = game.objects[i].x;
          game.objects[i].sprite.y = game.objects[i].y;
          game.objects[i].v.x *= 0.5;
          game.objects[i].v.y *= 0.5;
          if (game.objects[i].y < 120) {
            game.objects[i].v.y += 0.5;
            game.objects[i].v.y *= 1.5;
          }

          // potential changes:
          //   position, velocity, facing, animation, set, frame, state(?), hp, destroy, create
          //var dirty = game.objects[i].D;
          //dirty & 1 ? nsendall(4, [i, 0, game.objects[i].x, game.objects[i].y]) : '';
          //dirty & 2 ? nsendall(4, [i, 1, game.objects[i].v.x, game.objects[i].v.y]) : '';
          /*
          if object's velocity, position, animation, frame, or otherwise has changed
            iterate over each player and calculate the delta of the player's last packet data with the above changes in mind. These calculations are then added as Messages to the message queue?
          */
        }
        for (var i in game.players) {
          if (i != game.this_player) {
            // ???
          }
        }
      }
      // client
      {
        keys[37] ? nsend(3,0): ''; // left
        keys[39] ? nsend(3,1): ''; // right
        keys[38] ? nsend(3,2): ''; // up
        keys[40] ? nsend(3,3): ''; // down
        keys[90] ? nsend(3,4): ''; // z
        /*
        check for pending game packets and update our objects in accordance with them
        */
        for (var i in game.objects) {
          // run projected velocity
        }
      }
    }
  };
  var TestState = {
    local_objects: [],
    onInit: function() {
      renderer.setVirtualSize(1920, 1080);
      createObject("birb");
    },
    onTick: function(elapsed) {
      for (var i in game.objects) {
        game.objects[i].onThink();
      }
    }
  };
  /* ==== Class load/create ==== */
  function loadClasses(names) {
    return new Promise(function(resolve, reject) {
      console.log("Loading classes...");
      classes_pending = classes_pending.concat(names);
      loadPendingClass(resolve, reject);
    });
  }
  function loadPendingClass(resolve, reject) {
    if (classes_pending.length <= 0) {
      resolve();
      return;
    }
    var name = classes_pending.shift();
    ktk.Filer.load('data/classes/'+name+'.json').then(function(data) {
      loadClass(name, data);
    }, function(error) {
      reject("Could not load class '" + name + "': " + error);
    }).then(function() {
      if (typeof classes[name].sprite !== 'undefined') {
        console.log('Loading sprite "' +classes[name].sprite+ '"...');
        renderer.loadSpriteData(classes[name].sprite).then(function(ok) {
          console.log(ok);
        }, function(err) {
          console.log(err);
        });
      }
    }).then(function() {
      loadPendingClass(resolve, reject);
    });
  }
  function loadClass(name, code) {
    if (typeof classes[name] !== 'undefined') {
      console.log('class ' + name + ' already exists, overwriting');
    }
    var evaluated = eval('('+code+')');
    if (typeof evaluated.inherits !== 'undefined') {
      if (typeof classes[evaluated.inherits] === 'undefined') {
        console.log(name + ': Warning, inherited class ' + evaluated.inherits + ' does not exist!');
        // ... load?
      } else {
        evaluated = Object.assign({}, {D:0,x:0,y:0,v:{x:0,y:0},f:0,}, classes[evaluated.inherits], evaluated);
      }
    } else {
      evaluated = Object.assign({}, {D:0,x:0,y:0,v:{x:0,y:0},f:0,}, evaluated);
    }
    classes[name] = evaluated;
    console.log('...' + name);
  }
  /* ==== Objects ==== */
  function createObject(name) {
    var object = {};
    if (typeof classes[name] === 'undefined') {
      console.log('Error, class ' + name + ' does not exist!');
    } else {
      object = Object.create(classes[name]);
    }
    // TODO: game object id
    if (object.sprite) object.sprite = renderer.createSprite(object.sprite, 16, 16);
    if (object.onConception) object.onConception();
    game.objects.push(object);
    if (object.onBirth) object.onBirth();

    return object;
  }
  /* ==== Game Logic ==== */
  function loadGameData() {
    return new Promise(function(resolve, reject) {
      ktk.Filer.load('data/game.json').then(function(data) {
        // FIXME: don't eval!
        var game_data = eval('('+data+')');
        if (game_data.title) {
          game.title = game_data.title;
        }
        if (game_data.classes) {
          loadClasses(game_data.classes).then(function() {
            console.log('loaded all classes!');
            resolve();
          }, function(error) {
            console.log("Failed to load classes: " + error);
            reject();
          });
        }
      }, function(error) {
        console.log("Failed to load game data: " + error);
        reject();
      });
    });
  }
  /* ==== Tick and Render ==== */
  function onTick(elapsed) {
    // probably use a state machine?
    state.onTick(elapsed);
  }
  function onRender(delta) {
    renderer.doRender(delta);
  }
  /* ==== Loops ==== */
  function onRenderLoop() {
    if (!is_rendering) return;
    var frame_current = new Date();
    var frame_delta = frame_current - frame_last;
    frame_last = frame_current;
    onRender(frame_delta);
    var wait_time = framerate - (frame_current - new Date());
    if (wait_time > framerate) wait_time = framerate;
    setTimeout(onRenderLoop, wait_time);
  }
  //
  function onLoop() {
    if (!is_running) return;
    var tick_current = new Date();
    var tick_delta = tick_current - tick_last;
    // begin ticking!
    accumulator += tick_delta;
    tick_last = tick_current;
    while (accumulator >= tickrate) {
      onTick(tickrate);
      accumulator -= tickrate;
    }
    var wait_time = tickrate - (accumulator + (tick_current - new Date()));
    if (wait_time > tickrate) wait_time = tickrate;
    setTimeout(onLoop, wait_time);
  }

  function onInit() {
    // get display
    display = document.getElementById('display');
    renderer = ktk.rndr.fromElement(display);
    // set up keyboard hooks
    window.addEventListener('keydown', function(e) { keys[e.which] = true; }, false);
    window.addEventListener('keyup', function(e) { keys[e.which] = false; }, false);
    // start rendering
    is_rendering = true;
    frame_last = new Date();
    onRenderLoop();
    // load our game data
    loadGameData().then(function() {
      // start our logic loop
      is_running = true;
      tick_last = new Date();
      state = GameState;
      state.onInit();
      onLoop();
    });
  }

  return {
    gogogo: onInit
  }
})();

window.addEventListener('load', ktk.vio.gogogo);

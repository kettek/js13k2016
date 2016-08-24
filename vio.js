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
============================================================================= */ 

var ktk = ktk || {};

ktk.getCallerName = function() {
  var name = ktk.getCallerName.caller.toString();
  name = name.substr('function '.length);
  name = name.substr(0, name.indexOf('('));
  name = name + '> ';
  return name;
};

Object.defineProperty(this, 'fn', {
  get: ktk.getCallerName
});

var logr = (function() {
  var depth = 0;
  return function LOG() {
    if (arguments.length > 0) {
      var args = Array.prototype.slice.call(arguments);
      var name = LOG.caller.toString();
      name = name.substr('function '.length);
      name = name.substr(0, name.indexOf('('));
      args.unshift(name+'> ');
      args.unshift(Array(depth).join(' '));
      console.log.apply(console, args);
    } 
    return function(inc) {
      depth += inc;
      if (depth < 0) depth = 0;
    }
  }
})();

/*
The render has built-in rendering optimizations! This is dictated by a "virtual size" that splits the map into sections and places sprites within those sections for rendering. The quadrant sizes are dictated by (canvas.width*2 x canvas.height*2).
*/
ktk.rndr = (function() {
  /* ================ PRIVATE ================ */
  var screen = { w: 0, h: 0 };
  var virtual = { w: 0, h: 0, x: 0, y: 0 };
  var images = {};
  var sprite_data = {};
  var sprites = [];
  var quadrants = [];
  // 1. find our rendering type
  var type = 'null';
  var canvas = document.createElement('canvas');
  if (canvas.getContext) {
    type = 'canvas';
  } else {
    console.log('Error, no canvas support!');
  }
  // 2. initialize renderer
  if (type == 'canvas') {
    var context = null;
    function initDisplay(display) {
      canvas.width = window.getComputedStyle(display, null).getPropertyValue('width');
      canvas.height = window.getComputedStyle(display, null).getPropertyValue('height');
      context = canvas.getContext('2d');
      display.appendChild(canvas);
    }
    function onRender() {
      var start = getQuadrantIntersection(virtual.x - screen.w, virtual.y - screen.h);
      var end = getQuadrantIntersection(virtual.x + screen.w, virtual.y + screen.h);
      for (var i in quadrants[start.x][start.y].sprites) {
        var sprite = quadrants[start.x][start.y].sprites[i];
        // TODO: probably have a "getImage" function that returns a dummy image if the file isn't loaded yet?
        if (images[sprite.image]) {
          var frame = sprite_data[sprite.image].Animations[sprite.anim].Sets[sprite.set].Frames[sprite.frame];
          context.drawImage(images[sprite.image], frame.x, frame.y, frame.w, frame.h, sprite.x, sprite.y, frame.w, frame.h);
          // TODO: set sprite.frame in engine's onTick!
          //context.drawImage(images[sprite.image], sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, sprite.x, sprite.y, sprite.frame.w, sprite.frame.h);
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
    this.id = 0;
    this.x = x;
    this.y = y;
    this.image = image;
    this.anim = '';
    this.set = '';
    this.frame = 0;
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
      if (this.quadrant.index != -1) {
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
      return this;
    },
    setSize: function(w, h) {
      screen.w = w;
      screen.h = h;
      if (virtual.w < w || virtual.h < h) setupQuadrants();
      canvas.width = w;
      canvas.height = h;
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
          var sprite_datum = JSON.parse(data);
          sprite_datum.Img = sprite_datum.Img || {};
          sprite_datum.Conf = sprite_datum.Conf || {};
          for (var anim_name in sprite_datum["Animations"]) {
            var anim = sprite_datum["Animations"][anim_name];
            anim.Conf = anim.Conf || {};
            for (var set_name in anim["Sets"]) {
              var set = anim["Sets"][set_name];
              set.Conf = set.Conf || {};
              for (var frame_idx in set["Frames"]) {
                var frame = set["Frames"][frame_idx];
                var frame_obj = { x: frame[0] || 0, y: frame[1] || 0, w: frame[2] || 16, h: frame[3] || 16, t: frame[4] || 100 };
                Object.assign(frame_obj, sprite_datum.Conf, anim.Conf, set.Conf, frame_obj);
                // replace old array with actual frame object
                set["Frames"][frame_idx] = frame_obj;
              }
            }
          }
          sprite_data[name] = sprite_datum;
        }, function(error) {
          reject(error);
        }).then(function() {
          if (typeof images[name] === 'undefined') {
            images[name] = new Image();
            images[name].src = 'data/sprites/'+sprite_data[name].Img+'.png';
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
    createSprite: function(name, x, y) {
      var parts = name.split(":");
      var sprite = new Sprite(parts[0], x, y);
      sprite.anim = parts[1] ? parts[1] : '';
      sprite.set = parts[2] ? parts[2] : '';
      sprite.frame = parts[3] ? parseInt(parts[3]) : 0;
      setupSprite(sprite);
      return sprite;
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
  classes_pending = [];

  var game = {
    classes: [],
    objects: []
  };

  /* ==== State ==== */
  var MenuState = {
    onTick: function(elapsed) {
    }
  };
  var LobbyState = {
  };
  var TravelState = {
  };
  var GameState = {
  };
  var TestState = {
    local_objects: [],
    onInit: function() {
      renderer.setVirtualSize(1920, 1080);

      this.local_objects.push(createObject("player"));
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
      if (typeof game.classes[name].sprite !== 'undefined') {
        console.log('Loading sprite "' +game.classes[name].sprite+ '"...');
        renderer.loadSpriteData(game.classes[name].sprite).then(function(ok) {
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
    if (typeof game.classes[name] !== 'undefined') {
      console.log('class ' + name + ' already exists, overwriting');
    }
    var evaluated = eval('('+code+')');
    if (typeof evaluated.inherits !== 'undefined') {
      if (typeof game.classes[evaluated.inherits] === 'undefined') {
        console.log(name + ': Warning, inherited class ' + evaluated.inherits + ' does not exist!');
        // ... load?
      } else {
        evaluated = Object.assign({}, game.classes[evaluated.inherits], evaluated);
      }
    } else {
    }
    game.classes[name] = evaluated;
    console.log('...' + name);
  }
  /* ==== Objects ==== */
  function createObject(name) {
    var object = {};
    if (typeof game.classes[name] === 'undefined') {
      console.log('Error, class ' + name + ' does not exist!');
    } else {
      object = Object.create(game.classes[name]);
    }
    // TODO: game object id
    if (object.sprite) object.sprite = renderer.createSprite(object.sprite, 8, 8);
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
  function onRender() {
    renderer.doRender();
  }
  /* ==== Loops ==== */
  function onRenderLoop() {
    if (!is_rendering) return;
    var frame_current = new Date();
    var frame_delta = frame_current - frame_last;
    onRender();
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
    renderer.setSize(parseInt(window.getComputedStyle(display, null).getPropertyValue('width')), parseInt(window.getComputedStyle(display, null).getPropertyValue('height')));
    // start rendering
    is_rendering = true;
    frame_last = new Date();
    onRenderLoop();
    // load our game data
    loadGameData().then(function() {
      // start our logic loop
      is_running = true;
      tick_last = new Date();
      state = TestState;
      state.onInit();
      onLoop();
    });
  }

  return {
    gogogo: onInit
  }
})();

window.addEventListener('load', ktk.vio.gogogo);

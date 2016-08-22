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

/*
The render has built-in rendering optimizations! This is dictated by a "virtual size" that splits the map into sections and places sprites within those sections for rendering. The quadrant sizes are dictated by (canvas.width*2 x canvas.height*2).
*/
ktk.rndr = (function() {
  /* ================ PRIVATE ================ */
  var screen = { w: 0, h: 0 };
  var virtual = { w: 0, h: 0, x: 0, y: 0 };
  var images = {};
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
  console.log('rndr: using ' + type);
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
        context.drawImage(images[sprite.image], sprite.x, sprite.y);
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
  function moveSpriteToQuadrant(sprite) {
    var inter = getQuadrantIntersection(sprite.x, sprite.y);
    if (sprite.quadrant.x == inter.x && sprite.quadrant.y == inter.y) {
      return;
    }
    quadrants[sprite.quadrant.x][sprite.quadrant.y].sprites.splice(sprite.quadrant.index, 1);
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
    this.quadrant = {
      x: 0,
      y: 0,
      index: 0
    };
    this.image = image;
    //
    this.setImage = function(image) {
      this.image = image;
    };
    this.doRender = function(x, y) {
      context.drawImage(this.image, x, y);
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
    loadImageURL: function(name, url) {
      if (typeof images[name] !== 'undefined') return;
      images[name] = new Image();
      images[name].src = url;
    },
    createSprite: function(image, x, y) {
      var sprite = new Sprite(image, x, y);
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
  /* ** file loading ? ** */
  classes_pending = [];

  var game = {
    classes: [],
    objects: []
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
      loadPendingClass(resolve, reject);
    }, function(error) {
      reject("Could not load class '" + name + "': " + error);
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
    console.log('  ' + name);
  }
  /* ==== Objects ==== */
  function createObject(name) {
    if (typeof game.classes[name] === 'undefined') {
      console.log('Error, class ' + name + ' does not exist!');
      return {};
    }
    return Object.create(game.classes[name]);
  }
  /* ==== Game Logic ==== */
  function loadGameData() {
    ktk.Filer.load('data/game.json').then(function(data) {
      // FIXME: don't eval!
      var game_data = eval('('+data+')');
      if (game_data.title) {
        game.title = game_data.title;
      }
      if (game_data.classes) {
        loadClasses(game_data.classes).then(function() {
          console.log('loaded all classes!');
        }, function(error) {
          console.log("Failed to load classes: " + error);
        });
      }
    }, function(error) {
      console.log("Failed to load game data: " + error);
    });
  }

  /* ==== Tick and Render ==== */
  function onTick(elapsed) {
    // probably use a state machine?
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
    console.log(renderer);
    renderer.setSize(parseInt(window.getComputedStyle(display, null).getPropertyValue('width')), parseInt(window.getComputedStyle(display, null).getPropertyValue('height')));
    // start running
    is_running = true;
    tick_last = new Date();
    onLoop();
    is_rendering = true;
    frame_last = new Date();
    onRenderLoop();
    loadGameData();
    // bogus video test
    renderer.loadImageURL('test', 'data/sprites/test.png');
    renderer.createSprite('test', 16, 16);
    renderer.setVirtualSize(1920, 1080);
  }

  return {
    gogogo: onInit
  }
})();

window.addEventListener('load', ktk.vio.gogogo);

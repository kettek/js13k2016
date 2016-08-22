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
    console.log('loaded class: ' + name);
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
    // for each sprite in quandrants intersecting with (player[cur_player].x - screen_w . . .), render contained sprites
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
    is_running = true;
    tick_last = new Date();
    onLoop();
    is_rendering = true;
    frame_last = new Date();
    onRenderLoop();
    loadGameData();
  }

  return {
    gogogo: onInit
  }
})();

window.addEventListener('load', ktk.vio.gogogo);

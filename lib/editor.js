var editor = (function() {
  //
  var Mapr = (function() {
    var current_map = null;
    var canvas = null;
    var ctx = null;
    var map_canvas = null; // used for rendering the map
    var map_ctx = null;
    var map_dirty = true;
    var overlay_canvas = null;
    var overlay_ctx = null;
    var overlay_dirty = true;
    var mouse = {x: 0, y: 0, w: 0};
    var zoom = 1;
    var maps = [];
    function setupCanvii() {
      var w = current_map.w;
      var h = current_map.h;
      var cw = current_map.cw;
      var ch = current_map.ch;
      if (!map_canvas) {
        map_canvas = document.createElement('canvas');
        map_canvas.width = (w*(cw+1));
        map_canvas.height = (h*(ch+1));
        map_canvas.style.width = (w*(cw+1))+'px';
        map_canvas.style.height = (h*(ch+1))+'px';
        map_ctx = map_canvas.getContext('2d');
        map_ctx.mozImageSmoothingEnabled = false;
        map_ctx.webkitImageSmoothingEnabled = false;
        map_ctx.msImageSmoothingEnabled = false;
        map_ctx.imageSmoothingEnabled = false;

        map_ctx.lineWidth = 1;
      }
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = (w*(cw+2));
        canvas.height = (h*(ch+2));
        canvas.style.width = (w*(cw+2))+'px';
        canvas.style.height = (h*(ch+2))+'px';
        ctx = canvas.getContext('2d');
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        ctx.lineWidth = 1;

        function handleWheel(e) {
          var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
          zoomMap(zoom+delta);
        }
        function handleClick() {
          var mouse_cell_x = Math.floor( (mouse.x) / (current_map.cw*zoom) );
          var mouse_cell_y = Math.floor( (mouse.y) / (current_map.ch*zoom) );
          if ((mouse_cell_x < 0 || mouse_cell_y < 0) || (mouse_cell_x >= current_map.w || mouse_cell_y >= current_map.h)) return;
          if (mouse.w == 1) {
            if (Spritr.sprites.length > Spritr.selected) {
              current_map.cells[mouse_cell_y][mouse_cell_x].tile = Spritr.selected;
              map_dirty = true;
            }
          } else if (mouse.w == 3) {
            current_map.cells[mouse_cell_y][mouse_cell_x].tile = -1;
            map_dirty = true;
          }
        }
        canvas.addEventListener('mousewheel', handleWheel);
        canvas.addEventListener('DOMMouseScroll', handleWheel);
  
        canvas.addEventListener('mousemove', function(e) {
          mouse.x = e.offsetX;
          mouse.y = e.offsetY;
          if (mouse.w != 0) handleClick();
          renderCanvas();
        });
        canvas.addEventListener('mouseover', function(e) {
          canvas.style.cursor = 'none';
        });
        canvas.addEventListener('mouseout', function(e) {
          canvas.style.cursor = null;
          mouse.w = 0;
        });
        canvas.addEventListener('mousedown', function(e) {
          e.preventDefault();
          mouse.w = e.which;
          handleClick();
        });
        canvas.addEventListener('mouseup', function(e) {
          e.preventDefault();
          mouse.w = 0;
        });
        canvas.addEventListener('contextmenu', function(e) {
          e.preventDefault();
        });
        box_canvas.appendChild(canvas);
      }
      if (!overlay_canvas) {
        overlay_canvas = document.createElement('canvas');
        overlay_canvas.width = canvas.width;
        overlay_canvas.height = canvas.height;
        overlay_ctx = overlay_canvas.getContext('2d');
        overlay_ctx.imageSmoothingEnabled = false;
        overlay_ctx.lineWidth = 1;
      }
    }
    function newMap(w, h, cw, ch) {
      // create our data
      var map = {
        w: w,
        h: h,
        cw: cw,
        ch: ch,
        cells: []
      };
      for (var y = 0; y < h; y++) {
        map.cells[y] = [];
        for (var x = 0; x < w; x++) {
          var cell = {tile: -1, flags: 0};
          map.cells[y].push(cell);
        }
      }
      maps.push(map);
      current_map = map;
      // create our view
      setupCanvii();
      renderCanvas();
    }
    function zoomMap(amount) {
      if (!canvas || !current_map) return;
      if (amount <= 0 || amount > 10) return;
      in_zoom.value = amount;
      zoom = amount;
      overlay_dirty = true;
      renderCanvas();
    }
    function renderMap() {
      map_ctx.clearRect(0, 0, map_canvas.width, map_canvas.height);
      for (var y = 0; y < current_map.h; y++) {
        for (var x = 0; x < current_map.w; x++) {
          if (current_map.cells[y][x].tile >= 0) {
            if (Spritr.sprites.length > current_map.cells[y][x].tile) {
              var sprite = Spritr.sprites[current_map.cells[y][x].tile];
              map_ctx.drawImage(Spritr.image, sprite.x, sprite.y, sprite.w, sprite.h, x*current_map.cw, y*current_map.ch, sprite.w, sprite.h);
            }
          }
        }
      }
      map_dirty = false;
    }
    function renderCanvas() {
      if (!canvas || !ctx || !current_map) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // copy and scale our map buffer onto our display buffer
      if (map_dirty) renderMap();
      ctx.drawImage(map_canvas, 0, 0, map_canvas.width, map_canvas.height, 0, 0, map_canvas.width*zoom, map_canvas.height*zoom);
      // copy our overlay buffer over
      if (overlay_dirty) renderOverlay();
      ctx.drawImage(overlay_canvas, 0, 0);
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#0000FF';
      var mouse_cell_x = Math.floor( (mouse.x) / (current_map.cw*zoom) );
      var mouse_cell_y = Math.floor( (mouse.y) / (current_map.ch*zoom) );
      ctx.strokeRect((mouse_cell_x*current_map.cw*zoom)+0.5, (mouse_cell_y*current_map.ch*zoom)+0.5, current_map.cw*zoom, current_map.ch*zoom);
      ctx.globalAlpha = 1.0;
    }
    function resizeCanvas(w, h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w+'px';
      canvas.style.height = h+'px';
      overlay_canvas.width = w;
      overlay_canvas.height = h;
      overlay_dirty = true;
    }
    function renderOverlay() {
      overlay_ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (in_border.checked) {
        overlay_ctx.globalAlpha = 0.25;
        for (var y = 0; y < current_map.h; y++) {
          for (var x = 0; x < current_map.w; x++) {
            overlay_ctx.strokeStyle = '#DDD';
            overlay_ctx.strokeRect((x*current_map.cw*zoom)+0.5, (y*current_map.ch*zoom)+0.5, current_map.cw*zoom, current_map.ch*zoom);
          }
        }
        overlay_ctx.globalAlpha = 1;
      }
      overlay_dirty = false;
    }
    function resizeMap(w, h) {
      if (!current_map) return;
      if (h > current_map.h) {
        for (var y = current_map.h; y < h; y++) {
          for (var x = 0; x < w; x++) {
            var cell = {tile: 0, flags: 0};
            current_map.cells[y].push(cell);
          }
        }
      } else if (h < current_map.h) {
        current_map.cells.splice(h);
      }
      current_map.h = h;
      if (w > current_map.w) {
        for (var y = 0; y < h; y++) {
          for (var x = current_map.w; x < w; x++) {
            var cell = {tile: 0, flags: 0};
            current_map.cells[y].push(cell);
          }
        }
      } else if (w < current_map.w) {
        for (var y = 0; y < h; y++) {
          current_map.cells[y].splice(w);
        }
      }
      reformGrid();
    }
    //
    return {
      newMap: newMap,
      resizeMap: resizeMap,
      zoomMap: zoomMap,
      renderMap: renderMap,
      resizeCanvas: resizeCanvas,
      renderCanvas: renderCanvas,
      handleMouse: function(x, y) {
        mouse.x = x;
        mouse.y = y;
        renderCanvas();
      },
      dirtyOverlay: function() { overlay_dirty = true; },
      dirtyMap: function() { map_dirty = true; }
    }
  })();
  var Spritr = (function() {
    var is_data_loaded = false;
    var is_sprite_loaded = false;
    var is_indices_loaded = false;
    var data = null;
    var indices = null;
    function loadData(new_data) {
      is_data_loaded = true;
      data = JSON.parse('{'+new_data+'}');
      updateSprites();
    }
    function loadSheet(sheet) {
      is_sprite_loaded = true;
      Spritr.spritesheet = sheet;
      Spritr.image = new Image();
      Spritr.image.src = sheet;
      updateSprites();
    }
    function loadIndices(new_indices) {
      is_indices_loaded = true;
      console.log(new_indices);
      indices = JSON.parse('{'+new_indices+'}');
      updateSprites();
    }
    var selected_el = null;
    function updateSprites() {
      if (!is_data_loaded || !is_sprite_loaded || !is_indices_loaded) return;
      div_sprites.innerHTML = '';
      Spritr.sprites = [];
      for (var i in indices) {
        var sp = indices[i].split(':');
        var anim = sp[0];
        var set = sp[1];
        var frame = sp.length > 2 ? sp[2] : 0;
        var sprite = getFrame(data, anim, set, frame);
        if (sprite) {
          sprite = Object.assign(sprite, {'anim': anim, 'set': set, 'frame': frame});
          Spritr.sprites.push(sprite);
        }
      }
      // create our view
      div_sprites.style.transformOrigin = 'top left';
      div_sprites.style.transform = 'scale(4)';
      for (var i = 0; i < Spritr.sprites.length; i++) {
        var el = document.createElement('div');
        el.style.float = 'left';
        el.style.backgroundImage = 'url('+Spritr.spritesheet+')';
        el.style.border = '1px solid #000';
        el.style.width = Spritr.sprites[i].w+'px';
        el.style.height = Spritr.sprites[i].h+'px';
        el.style.backgroundPosition = -(Spritr.sprites[i].x)+'px '+(-Spritr.sprites[i].y)+'px';
        el.addEventListener('click', (function(el, i) {return function(e) {
          if (selected_el) selected_el.style.border = '1px solid #000';
          selected_el = el;
          selected_el.style.border = '1px solid #0000ff';
          in_spriteindex.value = i;
          Spritr.selected = i;
        }})(el, i));
        div_sprites.appendChild(el);
      }
    }

    return {
      loadData: loadData,
      loadSheet: loadSheet,
      loadIndices: loadIndices,
      updateSprites: updateSprites,
      spritesheet: null,
      image: null,
      selected: 0,
      sprites: []
    }
  })();
  //
  var in_width, in_height, in_zoom, in_spriteindex, in_spritedata, in_spritesheet, in_spriteindices, in_border;
  function attachInputs() {
    in_width          = document.getElementById('in-width');
    in_height         = document.getElementById('in-height');
    in_zoom           = document.getElementById('in-zoom');
    in_spriteindex    = document.getElementById('in-spriteindex');
    in_spritedata     = document.getElementById('in-spritedata');
    in_spritesheet    = document.getElementById('in-spritesheet');
    in_spriteindices  = document.getElementById('in-spriteindices');
    in_border         = document.getElementById('in-border');
    in_zoom.addEventListener('change', function(e) {
      Mapr.zoomMap(e.target.value);
    });
    in_border.addEventListener('change', function(e) {
      Mapr.dirtyOverlay();
      Mapr.renderCanvas();
    });
    in_spritedata.addEventListener('change', function(e) {
      if (e.target.files.length <= 0) return;
      var reader = new FileReader;
      reader.onload = function(e) {
        Spritr.loadData(e.target.result);
      };
      reader.readAsText(e.target.files[0]);
    });
    in_spritesheet.addEventListener('change', function(e) {
      if (e.target.files.length <= 0) return;
      var reader = new FileReader;
      reader.onload = function(e) {
        Spritr.loadSheet(e.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    });
    in_spriteindices.addEventListener('change', function(e) {
      if (e.target.files.length <= 0) return;
      var reader = new FileReader;
      reader.onload = function(e) {
        Spritr.loadIndices(e.target.result);
      };
      reader.readAsText(e.target.files[0]);
    });
  }
  //
  var btn_new, btn_load, btn_save;
  function attachButtons() {
    btn_new     = document.getElementById('btn-new');
    btn_load    = document.getElementById('btn-load');
    btn_save    = document.getElementById('btn-save');
    btn_resize  = document.getElementById('btn-resize');
    btn_new.addEventListener('click', function() {
      Mapr.newMap(in_width.value, in_height.value, 4, 4);
      var rect = box_canvas.getBoundingClientRect();
      Mapr.resizeCanvas(rect.width-4, rect.height-4);
      Mapr.renderCanvas();
    });
    btn_resize.addEventListener('click', function(e) {
      Mapr.resizeMap(in_width.value, in_height.value);
    });
  }
  var div_sprites, box_canvas;
  function attachInterface() {
    div_sprites = document.getElementById('div-sprites');
    box_canvas = document.getElementById('box-canvas');
    window.addEventListener('resize', function(e) {
      var rect = box_canvas.getBoundingClientRect();
      Mapr.resizeCanvas(rect.width-4, rect.height-4);
    });
  }
  return {
    gogogo: function() {
      attachButtons();
      attachInputs();
      attachInterface();
    }
  }
})();

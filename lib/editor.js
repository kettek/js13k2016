var editor = (function() {
  //
  var Mapr = (function() {
    var current_map = null;
    var current_grid = null;
    var maps = [];
    function newMap(w, h, cw, ch) {
      // create our data
      var map = {
        w: w,
        h: h,
        cells: []
      };
      for (var y = 0; y < h; y++) {
        map.cells[y] = [];
        for (var x = 0; x < w; x++) {
          var cell = {tile: 0, flags: 0};
          map.cells[y].push(cell);
        }
      }
      maps.push(map);
      current_map = map;
      // create our view
      var tab = document.createElement('tab');
      var grid = document.createElement('grid');

      grid.className = 'grid';
      grid.setAttribute('rows', h);
      grid.setAttribute('cols', w);
      grid.setAttribute('cellwidth', cw);
      grid.setAttribute('cellheight', ch);
      tab.appendChild(grid);
      document.getElementById('tabs-map').appendChild(tab);
      current_grid = grid;
    }
    function reformGrid() {
      if (!current_grid) return;
      var parent = current_grid.parentNode;
      if (parent) parent.removeChild(current_grid);
      current_grid.innerHTML = '';
      current_grid.setAttribute('ktkInit', 0);
      current_grid.setAttribute('rows', current_map.h);
      current_grid.setAttribute('cols', current_map.w);
      if (parent) parent.appendChild(current_grid);
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
    return {
      newMap: newMap,
      resizeMap: resizeMap
    }
  })();
  var Spritr = (function() {
    var is_data_loaded = false;
    var is_sprite_loaded = false;
    var spritesheet = null;
    var data = null;
    var sprites = [];
    function loadData(new_data) {
      is_data_loaded = true;
      data = JSON.parse('{'+new_data+'}');
      updateSprites();
    }
    function loadSheet(sheet) {
      is_sprite_loaded = true;
      spritesheet = sheet;
      updateSprites();
    }
    function updateSprites() {
      if (!is_data_loaded || !is_sprite_loaded) return;
      div_sprites.innerHTML = '';
      sprites = [];
      for (var A_i in data.A) {
        var A = data.A[A_i];
        for (var S_i in A.S) {
          var S = A.S[S_i];
          var x = S.C.x || 0;
          var y = S.C.y || 0;
          var w = S.C.w || 0;
          var h = S.C.h || 0;
          if (S.F.length > 0) {
            x = S.F[0].x || S.C.x;
            y = S.F[0].y || S.C.y;
            w = S.F[0].w || S.C.w;
            h = S.F[0].h || S.C.h;
          }
          sprites.push({'name': S_i, 'x': x, 'y': y, 'w': w, 'h': h});
        }
      }
      // create our view
      div_sprites.style.transformOrigin = 'top left';
      div_sprites.style.transform = 'scale(4)';
      for (var i = 0; i < sprites.length; i++) {
        var el = document.createElement('div');
        el.style.backgroundImage = 'url('+spritesheet+')';
        el.style.border = '1px solid #000';
        el.style.width = sprites[i].w+'px';
        el.style.height = sprites[i].h+'px';
        el.style.backgroundPosition = sprites[i].x+'px '+sprites[i].y+'px';
        el.addEventListener('click', (function(el, i) {return function(e) {
          in_spriteindex.value = i;
        }})(el, i));
        div_sprites.appendChild(el);
      }

    }

    return {
      loadData: loadData,
      loadSheet: loadSheet,
      updateSprites: updateSprites
    }
  })();
  //
  var in_width, in_height, in_zoom, in_spriteindex;
  function attachInputs() {
    in_width        = document.getElementById('in-width');
    in_height       = document.getElementById('in-height');
    in_zoom         = document.getElementById('in-zoom');
    in_spriteindex  = document.getElementById('in-spriteindex');
    in_spritedata   = document.getElementById('in-spritedata');
    in_spritesheet  = document.getElementById('in-spritesheet');
    in_zoom.addEventListener('change', function(e) {
      var grids = document.getElementsByTagName('grid');
      for (var i = 0; i < grids.length; i++) {
        grids[i].style.transform = 'scale('+e.target.value+')';
      }
      console.log(e.target.value);
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
    });
    btn_resize.addEventListener('click', function(e) {
      Mapr.resizeMap(in_width.value, in_height.value);
    });
  }
  var div_sprites;
  function attachInterface() {
    div_sprites = document.getElementById('div-sprites');
  }
  return {
    gogogo: function() {
      attachButtons();
      attachInputs();
      attachInterface();
    }
  }
})();

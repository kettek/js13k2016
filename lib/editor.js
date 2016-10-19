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
  //
  var in_width, in_height, in_zoom;
  function attachInputs() {
    in_width    = document.getElementById('in-width');
    in_height   = document.getElementById('in-height');
    in_zoom     = document.getElementById('in-zoom');
    in_zoom.addEventListener('change', function(e) {
      var grids = document.getElementsByTagName('grid');
      for (var i = 0; i < grids.length; i++) {
        grids[i].style.transform = 'scale('+e.target.value+')';
      }
      console.log(e.target.value);
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
  return {
    gogogo: function() {
      attachButtons();
      attachInputs();
    }
  }
})();

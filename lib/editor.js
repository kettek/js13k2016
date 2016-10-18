var editor = (function() {
  //
  var Mapr = (function() {
    function newMap(w, h, cw, ch) {
      var tab = document.createElement('tab');
      var grid = document.createElement('grid');
      grid.className = 'grid';
      grid.setAttribute('rows', h);
      grid.setAttribute('cols', w);
      grid.setAttribute('cellwidth', cw);
      grid.setAttribute('cellheight', ch);
      tab.appendChild(grid);
      document.getElementById('tabs-map').appendChild(tab);
    }
    return {
      newMap: newMap
    }
  })();
  //
  var in_width, in_height;
  function attachInputs() {
    in_width = document.getElementById('in-width');
    in_height = document.getElementById('in-height');
  }
  //
  var btn_new, btn_load, btn_save;
  function attachButtons() {
    btn_new = document.getElementById('btn-new');
    if (btn_new) {
      btn_new.addEventListener('click', function() {
        Mapr.newMap(in_width.value, in_height.value, 4, 4);
      });
    }
    btn_load = document.getElementById('btn-load');
    btn_save = document.getElementById('btn-save');
  }
  return {
    gogogo: function() {
      attachButtons();
      attachInputs();
    }
  }
})();

function cloneObject(c) {
  var r;
  if (c instanceof Array) {
    r = [];
  } else if (c instanceof Object) {
    r = {};
  } else {
    return c;
  }
  for (p in c) {
    if (!(c[p] instanceof Function)) {
      r[p] = cloneObject(c[p]);
    } else {
      r[p] = c[p];
    }
  }
  return r;
}

function setFrame(data, anim, set, frame, fdata) {
  var A = data.A[anim];
  if (!A) return false;
  var S = A.S[set];
  if (!S) return false;
  if (!S.F[frame]) return false;
  if (S.F[frame].constructor === Array) {
    var new_frame = {x: 0, y: 0, w: 0, h: 0, t: 0};
    for (var i = 0; i < S.F[frame].length; i++) {
      if (i == 0) new_frame.x = S.F[frame][i];
      if (i == 1) new_frame.y = S.F[frame][i];
      if (i == 2) new_frame.w = S.F[frame][i];
      if (i == 3) new_frame.h = S.F[frame][i];
      if (i == 4) new_frame.t = S.F[frame][i];
    }
    data.A[anim].S[set].F[frame] = Object.assign(new_frame, fdata);
  } else {
    data.A[anim].S[set].F[frame] = Object.assign(S.F[frame], fdata);
  }
}

function getFrame(data, anim, set, frame) {
  var cx = 0, cy = 0, cw = 0, ch = 0, ct = 0;
  if (!data.C) data.C = {};
  cx = data.C.x ? data.C.x : cx; cy = data.C.y ? data.C.y : cy;
  cw = data.C.w ? data.C.w : cw; ch = data.C.h ? data.C.h : ch;
  ct = data.C.t ? data.C.t : ct;
  if (data.A[anim]) {
    var A = data.A[anim];
    var ax = 0, ay = 0, aw = 0, ah = 0, at = 0;
    if (!A.C) A.C = {};
    ax = A.C.x ? A.C.x : cx; ay = A.C.y ? A.C.y : cy;
    aw = A.C.w ? A.C.w : cw; ah = A.C.h ? A.C.h : ch;
    at = A.C.t ? A.C.t : ct;
    if (A.S[set]) {
      var S = A.S[set];
      var x = 0, y = 0, w = 0, h = 0, t = 0;
      if (!S.C) S.C = {};
      x = S.C.x ? S.C.x : ax; y = S.C.y ? S.C.y : ay;
      w = S.C.w ? S.C.w : aw; h = S.C.h ? S.C.h : ah;
      t = S.C.t ? S.C.t : at;
      if (S.F.length > frame) {
        if (S.F[frame].constructor === Array) {
          x = S.F[frame].length > 0 ? S.F[frame][0] : x; y = S.F[frame].length > 1 ? S.F[frame][1] : y;
          w = S.F[frame].length > 2 ? S.F[frame][2] : w; h = S.F[frame].length > 3 ? S.F[frame][3] : h;
          t = S.F[frame].length > 4 ? S.F[frame][4] : t;
          return {'x': x, 'y': y, 'w': w, 'h': h, 't': t};
        } else {
          x = (typeof S.F[frame].x !== 'undefined' ? S.F[frame].x : x);
          y = (typeof S.F[frame].y !== 'undefined' ? S.F[frame].y : y);
          w = (typeof S.F[frame].w !== 'undefined' ? S.F[frame].w : w);
          h = (typeof S.F[frame].h !== 'undefined' ? S.F[frame].h : h);
          t = (typeof S.F[frame].t !== 'undefined' ? S.F[frame].t : t);
          return {'x': x, 'y': y, 'w': w, 'h': h, 't': t};
        }
      }
    }
  }
  return null;
}

function optimizeData(l_data) {
  var x = 0, y = 0, w = 0, h = 0, t = 0;
  if (!l_data.C) l_data.C = {};
  if (typeof l_data.C.x !== 'undefined') {
    if (l_data.C.x == '') delete l_data.C.x;
    else x = l_data.C.x;
  }
  if (typeof l_data.C.y !== 'undefined') {
    if (l_data.C.y == '') delete l_data.C.y;
    else y = l_data.C.y;
  }
  if (typeof l_data.C.w !== 'undefined') {
    if (l_data.C.w == '') delete l_data.C.w;
    else w = l_data.C.w;
  }
  if (typeof l_data.C.h !== 'undefined') {
    if (l_data.C.h == '') delete l_data.C.h;
    else h = l_data.C.h;
  }
  if (typeof l_data.C.t !== 'undefined') {
    if (l_data.C.t == '') delete l_data.C.t;
    else t = l_data.C.t;
  }
  if (l_data.C.a) delete l_data.C.a;
  for (i in l_data.C) {
    l_data.C[i] = parseInt(l_data.C[i]);
  }
  if (Object.getOwnPropertyNames(l_data.C).length === 0) delete l_data.C;
  for (var A in l_data.A) {
    if (l_data.A[A].C.x == '' || l_data.A[A].C.x == x) delete l_data.A[A].C.x;
    else x = l_data.A[A].C.x;
    if (l_data.A[A].C.y == '' || l_data.A[A].C.y == y) delete l_data.A[A].C.y;
    else y = l_data.A[A].C.y;
    if (l_data.A[A].C.w == '' || l_data.A[A].C.w == w) delete l_data.A[A].C.w;
    else w = l_data.A[A].C.w;
    if (l_data.A[A].C.h == '' || l_data.A[A].C.h == h) delete l_data.A[A].C.h;
    else h = l_data.A[A].C.h;
    if (l_data.A[A].C.t == '' || l_data.A[A].C.t == t) delete l_data.A[A].C.t;
    else t = l_data.A[A].C.t;
    if (l_data.A[A].C.a) delete l_data.A[A].C.a;
    for (var i in l_data.A[A].C) {
      l_data.A[A].C[i] = parseInt(l_data.A[A].C[i]);
    }
    if (Object.getOwnPropertyNames(l_data.A[A].C).length === 0) delete l_data.A[A].C;
    for (var s in l_data.A[A].S) {
      if (l_data.A[A].S[s].C) {
        if (l_data.A[A].S[s].C.x == '' || l_data.A[A].S[s].C.x == x) delete l_data.A[A].S[s].C.x;
        else x = l_data.A[A].S[s].C.x;
        if (l_data.A[A].S[s].C.y == '' || l_data.A[A].S[s].C.y == y) delete l_data.A[A].S[s].C.y;
        else y = l_data.A[A].S[s].C.y;
        if (l_data.A[A].S[s].C.w == '' || l_data.A[A].S[s].C.w == w) delete l_data.A[A].S[s].C.w;
        else w = l_data.A[A].S[s].C.w;
        if (l_data.A[A].S[s].C.h == '' || l_data.A[A].S[s].C.h == h) delete l_data.A[A].S[s].C.h;
        else h = l_data.A[A].S[s].C.h;
        if (l_data.A[A].S[s].C.t == '' || l_data.A[A].S[s].C.t == t) delete l_data.A[A].S[s].C.t;
        else t = l_data.A[A].S[s].C.t;
        if (l_data.A[A].S[s].C.a) delete l_data.A[A].S[s].C.a;
        for (i in l_data.A[A].S[s].C) {
          l_data.A[A].S[s].C[i] = parseInt(l_data.A[A].S[s].C[i]);
        }
        if (Object.getOwnPropertyNames(l_data.A[A].S[s].C).length === 0) delete l_data.A[A].S[s].C;
      }
      for (f in l_data.A[A].S[s].F) {
        var F = l_data.A[A].S[s].F[f];
        if (F.constructor === Array) {
          if (F.length == 5) {
            if (F[4] == null) F.splice(4,1);
          }
        } else {
          F.x = parseInt(F.x);
          F.y = parseInt(F.y);
          F.w = parseInt(F.w);
          F.h = parseInt(F.h);
          F.t = parseInt(F.t);
          l_data.A[A].S[s].F[f] = [];
          if (F.t != t && !isNaN(F.t)) {
            l_data.A[A].S[s].F[f].push(F.x);
            l_data.A[A].S[s].F[f].push(F.y);
            l_data.A[A].S[s].F[f].push(F.w);
            l_data.A[A].S[s].F[f].push(F.h);
            l_data.A[A].S[s].F[f].push(F.t);
          } else if (F.h != h) {
            l_data.A[A].S[s].F[f].push(F.x);
            l_data.A[A].S[s].F[f].push(F.y);
            l_data.A[A].S[s].F[f].push(F.w);
            l_data.A[A].S[s].F[f].push(F.h);
          } else if (F.w != w) {
            l_data.A[A].S[s].F[f].push(F.x);
            l_data.A[A].S[s].F[f].push(F.y);
            l_data.A[A].S[s].F[f].push(F.w);
          } else if (F.y != y) {
            l_data.A[A].S[s].F[f].push(F.x);
            l_data.A[A].S[s].F[f].push(F.y);
          } else if (F.x != x) {
            l_data.A[A].S[s].F[f].push(F.x);
          }
        }
      }
    }
  }
  return l_data;
}

/*
mapSegment {
  name: "",
  indices: ["tiles:brick1", ...],
  w: Number,
  h: Number,
  cells: [[{tile: Number, flag: Number}, ... ], ...]
}
*/
var MapSegment = function(data) {
  this.vers = 0;
  this.type = 0;
  this.name = '';
  this.indices = [];
  this.w = 0;
  this.h = 0;
  this.cells = [];
  if (data) this.loadFrom(data);
};
MapSegment.prototype.loadFrom = function(data) {
  if (data.vers) this.vers = data.vers;
  if (data.name) this.name = data.name;
  if (data.indices) this.indices = data.indices;
  if (data.w) this.w = data.w;
  if (data.h) this.h = data.h;
  if (data.cells) this.cells = data.cells;
};
MapSegment.prototype.compress = function() {
  if (this.type == 1) return;
  this.type = 1;
  var i = 0;
  var c = 0;
  var t = -2;
  var f = -2;
  var cells = [];
  for (var y = 0; y < this.h; y++) {
    for (var x = 0; x < this.w; x++) {
      i = y*this.w+x;
      if (this.cells[y][x].tile != t) {
        // write previous count
        if (c != 0) {
          cells.push([c,t]);
        }
        t = this.cells[y][x].tile;
        c = 0;
      }
      c++;
    }
  }
  cells.push([c,t]);
  this.cells = cells;
};
MapSegment.prototype.decompress = function() {
  if (this.type != 1) return;
  this.type = 0;
  var c = 0;
  var t = -2;
  var f = -2;
  var cells = [];
  var last_y = 0;
  var last_x = 0;
  var last_c = 0;
  for (var i = 0; i < this.cells.length; i++) {
    c += this.cells[i][0];
    var diff_c = c - last_c; // difference between last c and this c

    var y = Math.floor(c / this.w);
    var x = c % Math.floor(y*this.w);
    if (!cells[y]) cells[y] = [];
  }
}
MapSegment.prototype.toJSON = function() {
  return {vers: this.vers, name: this.name, indices: this.indices, w: this.w, h: this.h, cells: this.cells};
};

function saveData(name, data, type) {
  var a = document.createElement('a');
  var file = new Blob([data], {type: type});
  var url = URL.createObjectURL(file);
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url);
  }, 0);
}

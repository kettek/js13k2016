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

function optimizeData(l_data) {
  var x = 0, y = 0, w = 0, h = 0, t = 0;
  if (l_data.C.x == '') delete l_data.C.x;
  else x = l_data.C.x;
  if (l_data.C.y == '') delete l_data.C.y;
  else y = l_data.C.y;
  if (l_data.C.w == '') delete l_data.C.w;
  else w = l_data.C.w;
  if (l_data.C.h == '') delete l_data.C.h;
  else h = l_data.C.h;
  if (l_data.C.t == '') delete l_data.C.t;
  else t = l_data.C.t;
  if (l_data.C.a) delete l_data.C.a;
  for (i in l_data.C) {
    l_data.C[i] = parseInt(l_data.C[i]);
  }
  if (Object.getOwnPropertyNames(l_data.C).length === 0) delete l_data.C;
  for (A in l_data.A) {
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
    for (i in l_data.A[A].C) {
      l_data.A[A].C[i] = parseInt(l_data.A[A].C[i]);
    }
    if (Object.getOwnPropertyNames(l_data.A[A].C).length === 0) delete l_data.A[A].C;
    for (s in l_data.A[A].S) {
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


var s2d = (function() {
  function getVal(val) {
    if (typeof val !== 'undefined') return val;
    return '';
  }
  
  /* ================ TREE CREATION ================ */
  var tree, ptree;
  function parseConfBranch(c) {
    var o = {};
    for (i in c) {
      var e = c[i].title_element.children[1];
      if (e.name == 'a') { 
        o[e.name] = e.checked ? 1 : 0;
      } else {
        o[e.name] = e.value;
      }
    }
    return o;
  }
  
  function createPNode(parent) {
    var pnode = parent.addBranch('');
    pnode.addText('Sprite: ');
    pnode.addInput('text', 'sprite', '', function(cb) {
    });
    pnode.addText('Anim: ');
    pnode.addInput('text', 'anim', '', function(cb) {
    });
    pnode.addText('FOffset: ');
    pnode.addInput('number', 'offset', '0', function(cb) {
    });
    pnode.addInput("button", "delete", '-', function(cb) {
      pnode.implode();
    });
    pnode.addInput("button", "add", "add attach", function(cb) {
      createPNode(pnode);
    });
  }
  
  function createPTree() {
    if (ptree) ptree.implode();
    ptree = new Branch(document.getElementById('ptree'), '');
    ptree.addText(' Set: ');
    ptree.addInput('text', 'set', '', function(cb) {
    });
    ptree.addInput('button', 'add', 'Add Animation', function(cb) {
      createPNode(ptree);
    });
  }
  /* */
  var g_tree = null, g_anim = null, g_set = null, g_frames = null, g_frame = null;
  var g_tree_name = '', g_anim_name = '', g_set_name = '', g_frame_number = 0;
  var i_tree, i_anim, i_set, i_frame;
  function setFocus(tree, anim, set, frames, frame) {
    if (tree != null) {
      i_tree.value = tree.getInput('name').value;
      g_tree = tree;
      g_tree_name = i_tree.value;
    }
    if (anim != null) {
      i_anim.value = anim.getInput('name').value;
      anim.getInput('anim').checked = true;
      g_anim = anim;
      g_anim_name = i_anim.value;
    }
    if (set != null) {
      i_set.value = set.getInput('name').value;
      set.getInput('set').checked = true;
      g_set = set;
      g_set_name = i_set.value;
    }
    if (frames != null) {
      g_frames = frames;
    }
    if (frame != null) {
      i_frame.value = g_frames.branches.indexOf(frame);
      frame.getInput('frame').checked = true;
      g_frame = frame;
      g_frame_number = parseInt(i_frame.value);
      setFrameDraw();
    }
  }
  var g_trees = {};
  var g_can_sync = {};
  var g_sprite_data = {};
  function createTree(name) {
    if (g_trees[name]) g_trees[name].implode();
    var tree = new Branch(document.getElementById('tree'), 'Sprite: ');
    tree.addInput("text", "name", name, function(e) {
      if (e.target.value != name) {
        delete g_trees[name];
        g_sprite_data[e.target.value] = cloneObject(g_sprite_data[name]);
        delete g_sprite_data[name];
        name = e.target.value;
        g_trees[name] = tree;
      }
      setFocus(tree, null, null, null, null);
    });
    tree.addInput("button", "del", "x", function() {
      tree.implode();
      delete g_trees[name];
    });
    tree.addInput('button', 'save', 'save', function() {
      console.log('yee ' + name);
      stopAnim();
      disableSync(name);
      var a = document.createElement('a');
      var l_data = optimizeData(g_sprite_data[name]);
      var str = JSON.stringify(l_data);
      str = str.slice(1, str.length-1); // cut off '{' and '}'
      var file = new Blob([str], {type: 'text/javascript'});
      var url = URL.createObjectURL(file);
      a.href = url;
      a.download = name+'.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url);
      }, 0);
      enableSync(name);
    });

    var conf = tree.addBranch('Configuration');
    conf.addBranch("X: ").addInput("number", "x", '', function(){syncData(name)});
    conf.addBranch("Y: ").addInput("number", "y", '', function(){syncData(name)});
    conf.addBranch("Width: ").addInput("number", "w", '', function(){syncData(name)});
    conf.addBranch("Height: ").addInput("number", "h", '', function(){syncData(name)});
    conf.addBranch("Frametime: ").addInput("number", "t", '', function(){syncData(name)});
    var animations = tree.addBranch('<b>Animations:</b> ');
    animations.addInput('button', 'add', '+', function(cb) {
      var anim = animations.addBranch('')
      anim.addInput('radio', 'anim', '', function(cb) {
        setFocus(tree, anim, null, null, null);
      });
      anim.addInput("text", "name", '', function() {
        syncData(name);
        setFocus(tree, anim, null, null, null);
      });
      anim.addText("   ").addInput("button", "delete", '-', function(cb) {
        anim.implode();
        setFocus(tree, null, null, null, null);
        syncData(name);
      });
      anim.addInput('button', 'up', '^', function(cb) {
        anim.moveUp();
        syncData(name);
      });
      anim.addInput('button', 'down', 'v', function(cb) {
        anim.moveDown();
        syncData(name);
      });
      anim.addHandler('click', function(e) {
        setFocus(tree, anim, null, null, null);
      });
  
      var conf = anim.addBranch("Configuration");
      conf.addBranch("X: ").addInput("number", "x", '', function(){syncData(name)});
      conf.addBranch("Y: ").addInput("number", "y", '', function(){syncData(name)});
      conf.addBranch("Width: ").addInput("number", "w", '', function(){syncData(name)});
      conf.addBranch("Height: ").addInput("number", "h", '', function(){syncData(name)});
      conf.addBranch("Frametime: ").addInput("number", "t", '', function(){syncData(name)});
      var sets = anim.addBranch('<b>Sets:</b> ');
  
      sets.addInput('button', 'add', '+', function(cb) {
        var set = sets.addBranch('');
        set.addInput('radio', 'set', '', function(cb) {
          setFocus(tree, anim, set, null, null);
        });
  
        set.addInput('text', 'name', '', function() {
          setFocus(tree, anim, set, null, null);
          syncData(name);
        });
        set.addText("   ").addInput("button", "delete", ' -', function(cb) {
          set.implode();
          setFocus(tree, anim, null, null, null);
          syncData(name);
        });
        set.addHandler('click', function(e) {
          setFocus(tree, anim, set, null, null);
        });
        set.addInput('button', 'up', '^', function(cb) {
          set.moveUp();
          syncData(name);
        });
        set.addInput('button', 'down', 'v', function(cb) {
          set.moveDown();
          syncData(name);
        });
  
        var conf = set.addBranch("Configuration");
        conf.addBranch("X: ").addInput("number", "x", '', function(){syncData(name)});
        conf.addBranch("Y: ").addInput("number", "y", '', function(){syncData(name)});
        conf.addBranch("Width: ").addInput("number", "w", '', function(){syncData(name)});
        conf.addBranch("Height: ").addInput("number", "h", '', function(){syncData(name)});
        conf.addBranch("Frametime: ").addInput("number", "t", '', function(){syncData(name)});
        var points = set.addBranch('<b>Points:</b> ');
        points.addInput('button', 'add', '+', function(cb) {
          var point = points.addBranch('');
          point.addInput('text', 'name', '', function(){syncData(name)});
          point.addInput('button', '', '-', function(cb) {
            point.implode();
            syncData(name);
          });
          point.addInput('button', 'up', '^', function(cb) {
            point.moveUp();
            syncData(name);
          });
          point.addInput('button', 'down', 'v', function(cb) {
            point.moveDown();
            syncData(name);
          });
          point.addInput('button', 'add', '+', function(cb) {
            var pframe = point.addBranch('');
            pframe.addInput('number', 'x', '', function(){syncData(name)});
            pframe.addInput('number', 'y', '', function(){syncData(name)});
            pframe.addInput('button', '', '-', function(cb) {
              pframe.implode();
              syncData(name);
            });
            pframe.addInput('button', 'up', '^', function(cb) {
              pframe.moveUp();
              syncData(name);
            });
            pframe.addInput('button', 'down', 'v', function(cb) {
              pframe.moveDown();
              syncData(name);
            });
            syncData(name);
          });
          syncData(name);
        });
        var frames = set.addBranch('<b>Frames:</b> ');
        frames.addInput('button', 'add', '+', function(cb) {
          var frame = frames.addBranch('');
          frame.addHandler('click', function(e) {
            setFocus(tree, anim, set, frames, frame);
          });
          frame.addInput('radio', 'frame', '', function(cb) {
            setFocus(tree, anim, set, frames, frame);
          });
          frame.addInput('number', 'x', '', function(){syncData(name)});
          frame.addInput('number', 'y', '', function(){syncData(name)});
          frame.addInput('number', 'w', '', function(){syncData(name)});
          frame.addInput('number', 'h', '', function(){syncData(name)});
          frame.addInput('number', 'ms', '', function(){syncData(name)});
          frame.addInput('button', '', '-', function(cb) {
            frame.implode();
            setFocus(tree, anim, set, frames, null);
            syncData(name);
          });
          frame.addInput('button', 'up', '^', function(cb) {
            frame.moveUp();
            syncData(name);
          });
          frame.addInput('button', 'down', 'v', function(cb) {
            frame.moveDown();
            syncData(name);
          });
          syncData(name);
        });
        syncData(name);
      });
      syncData(name);
    });
    g_trees[name] = tree;
  }
  function disableSync(name) {
    g_can_sync[name] = false;
  }
  function enableSync(name) {
    g_can_sync[name] = true;
  }
  function syncData(name) {
    if (!g_can_sync[name]) return;
    var tree = g_trees[name];
    var sprite_data = {C: {}, A: {}};
    // read conf
    sprite_data.C = parseConfBranch(tree.branches[0].branches);
    // read animations
    sprite_data.A = {};
    for (i in tree.branches[1].branches) {
      var A = tree.branches[1].branches[i];
      var A_name = A.title_element.children[2].value;
      sprite_data.A[A_name] = {C: {}, S:{}};
      sprite_data.A[A_name].C = parseConfBranch(A.branches[0].branches);
      Object.assign(sprite_data.A[A_name].C, sprite_data.C, sprite_data.A[A_name].C);
      // parse sets
      for (i in A.branches[1].branches) {
        var S = A.branches[1].branches[i];
        var S_name = S.title_element.children[2].value;
        sprite_data.A[A_name].S[S_name] = {C: {}, F: []};
        sprite_data.A[A_name].S[S_name].C = parseConfBranch(S.branches[0].branches);
        Object.assign(sprite_data.A[A_name].S[S_name].C, sprite_data.A[A_name].C, sprite_data.A[A_name].S[S_name].C);
        // parse frames
        var j = 0;
        // points
        for (i in S.branches[1].branches) {
          var P = S.branches[1].branches[i];
          var vals = P.title_element.children;
          var pname = P.getInput('name').value;
          var pobj = [];
          for (i in P.branches) {
            var x = P.branches[i].getInput('x').value;
            var y = P.branches[i].getInput('y').value;
            pobj.push([x,y]);
          }
          if (!sprite_data.A[A_name].S[S_name].P) sprite_data.A[A_name].S[S_name].P= {};
          sprite_data.A[A_name].S[S_name].P[pname] = pobj;
        }
        // frames
        for (i in S.branches[2].branches) {
          var F = S.branches[2].branches[i];
          var frame = {};
          frame.x = parseInt(F.getInput('x').value || sprite_data.A[A_name].S[S_name].C.x || 0);
          frame.y = parseInt(F.getInput('y').value || sprite_data.A[A_name].S[S_name].C.y || 0);
          frame.w = parseInt(F.getInput('w').value || sprite_data.A[A_name].S[S_name].C.w || 16);
          frame.h = parseInt(F.getInput('h').value || sprite_data.A[A_name].S[S_name].C.h || 16);
          frame.t = parseInt(F.getInput('ms').value || sprite_data.A[A_name].S[S_name].C.t || 100);
          sprite_data.A[A_name].S[S_name].F.push(frame);
          j++;
        }
      }
    }
    g_sprite_data[name] = sprite_data;
  }
  function syncDataToTree(name) {
    createTree(name);
    disableSync(name);
    var tree = g_trees[name];
    var sprite_data = g_sprite_data[name];
    var conf = tree.getBranch('Configuration');
    conf.getBranch('X: ').setInput('x', getVal(sprite_data.C.x));
    conf.getBranch('Y: ').setInput('y', getVal(sprite_data.C.y));
    conf.getBranch('Width: ').setInput('w', getVal(sprite_data.C.w));
    conf.getBranch('Height: ').setInput('h', getVal(sprite_data.C.h));
    conf.getBranch('Frametime: ').setInput('t', getVal(sprite_data.C.t));
    var A = tree.getBranch('<b>Animations:</b> ');
    var a_i = 0;
    for (i in sprite_data.A) {
      s_A = sprite_data.A[i];
      if (!sprite_data.A.hasOwnProperty(i)) continue;
      var evt = new Event('click');
      A.getInput('add').dispatchEvent(evt);
      //
      var a = A.branches[a_i++];
      a.setInput('name', i);
      var conf = a.getBranch('Configuration');
      if (!s_A.C) s_A.C = {};
      conf.getBranch('X: ').setInput('x', getVal(s_A.C.x));
      conf.getBranch('Y: ').setInput('y', getVal(s_A.C.y));
      conf.getBranch('Width: ').setInput('w', getVal(s_A.C.w));
      conf.getBranch('Height: ').setInput('h', getVal(s_A.C.h));
      conf.getBranch('Frametime: ').setInput('t', getVal(s_A.C.t));
      var S = a.getBranch('<b>Sets:</b> ');
      var s_i = 0;
      for (i in s_A.S) {
        s_S = s_A.S[i];
        var evt = new Event('click');
        S.getInput('add').dispatchEvent(evt);
        //
        var s = S.branches[s_i++];
        s.setInput('name', i);
        var conf = s.getBranch('Configuration');
        if (!s_S.C) s_S.C = {};
        conf.getBranch('X: ').setInput('x', getVal(s_S.C.x));
        conf.getBranch('Y: ').setInput('y', getVal(s_S.C.y));
        conf.getBranch('Width: ').setInput('w', getVal(s_S.C.w));
        conf.getBranch('Height: ').setInput('h', getVal(s_S.C.h));
        conf.getBranch('Frametime: ').setInput('t', getVal(s_S.C.t));
        var P = s.getBranch('<b>Points:</b> ');
        for (i in s_S.P) {
          s_P = s_S.P[i];
          var evt = new Event('click');
          P.getInput('add').dispatchEvent(evt);
          var p = P.branches[P.branches.length-1];
          p.setInput('name', getVal(i));
          for (j in s_P) {
            p.getInput('add').dispatchEvent(evt);
            var pf = p.branches[p.branches.length-1];
            pf.setInput('x', getVal(s_P[j][0]));
            pf.setInput('y', getVal(s_P[j][1]));
          }
        }
        var F = s.getBranch('<b>Frames:</b> ');
        for (i in s_S.F) {
          s_F = s_S.F[i];
          var evt = new Event('click');
          F.getInput('add').dispatchEvent(evt);
          //
          var f = F.branches[F.branches.length-1];
          if (s_F.constructor === Array) {
            f.setInput('x', getVal(s_F[0]));
            f.setInput('y', getVal(s_F[1]));
            f.setInput('w', getVal(s_F[2]));
            f.setInput('h', getVal(s_F[3]));
            f.setInput('t', getVal(s_F[4]));
          } else {
            f.setInput('x', getVal(s_F.x));
            f.setInput('y', getVal(s_F.y));
            f.setInput('w', getVal(s_F.w));
            f.setInput('h', getVal(s_F.h));
            f.setInput('t', getVal(s_F.t));
          }
        }
      }
    }
    enableSync(name);
    syncData(name);
  }
  /* ================ TREE SYNCHRONIZATION ================ */
  function setFrameDraw() {
    var sprite_data = g_sprite_data[g_tree_name];
    if (!sprite_data) {
      frame_draw.do_draw = 0;
      drawCanvas();
      return;
    }
    var a = sprite_data.A[g_anim_name];
    if (!a) {
      frame_draw.do_draw = 0;
      drawCanvas();
      return;
    }
    s_frame = a.S[g_set_name].F[g_frame_number];
    if (s_frame) {
      frame_draw.do_draw = 1;
      frame_draw.x = s_frame.x;
      frame_draw.y = s_frame.y;
      frame_draw.w = s_frame.w;
      frame_draw.h = s_frame.h;
      frame_draw.t = s_frame.t;
      drawCanvas();
    } else {
      frame_draw.do_draw = 0;
      drawCanvas();
    }
  }
  /* ================ RENDERING ================ */
  var canvas, ctx, cboard, img, img_loaded, points, points_loaded, d_zoom, p_zoom;
  var c_preview, p_ctx, p_color;
  var frame_draw = { do_draw: 0, x: 0, y: 0, w: 0, h: 0 };
  var mouse = { held: 0, sx: 0, sy: 0, ex: 0, ey: 0 };
  var canvas_offset = { x: 0, y: 0 };
  
  p_color = '#EEE';
  function drawPreview() {
    p_ctx.clearRect(0, 0, c_preview.width, c_preview.height);
    if (img_loaded) {
      var sprite_data = g_sprite_data[g_tree_name];
      if (!sprite_data) return;
      var a = sprite_data.A[g_anim_name];
      if (!a) return;
      var s = a.S[g_set_name];
      if (!s) return;
      var f = s.F[g_frame_number];
      if (!f) return;
  
      // set our offset
      var o_x = 0, o_y = 0;
      if (s.P) {
        if (s.P["offset"]) {
          if (s.P["offset"][g_frame_number]) {
            o_x = s.P["offset"][g_frame_number][0];
            o_y = s.P["offset"][g_frame_number][1];
          }
        }
      }
  
      p_ctx.drawImage(img, f.x, f.y, f.w||1, f.h||1, o_x, o_y, f.w, f.h);
    }
  }
  
  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cboard, 0, 0);
    if (img_loaded) ctx.drawImage(img, -canvas_offset.x, -canvas_offset.y, img.width, img.height);
    if (points_loaded) ctx.drawImage(points, -canvas_offset.x, -canvas_offset.y, points.width, points.height);
    if (mouse.held) {
      var x = Math.floor(mouse.sx/d_zoom);
      var y = Math.floor(mouse.sy/d_zoom);
      var w = Math.floor(mouse.ex/d_zoom - mouse.sx/d_zoom);
      var h = Math.floor(mouse.ey/d_zoom - mouse.sy/d_zoom);
      ctx.strokeStyle = "#FFFF00";
      // THE MYSTERIES OF HTML5 CANVII
      ctx.strokeRect(-canvas_offset.x+x+0.5, -canvas_offset.y+y+0.5, w, h);
    }
    if (frame_draw.do_draw) {
      ctx.strokeStyle = "#00FFFF";
      ctx.strokeRect(-canvas_offset.x+frame_draw.x+0.5, -canvas_offset.y+frame_draw.y+0.5, frame_draw.w-1, frame_draw.h-1);
    }
  }
  
  var is_playing = false;
  var play_timer = null;
  
  function playAnim() {
    if (!is_playing) return;
    var sprite_data = g_sprite_data[g_tree_name];
    if (!sprite_data) return;
  
    var a = sprite_data.A[g_anim_name];
    if (!a) return;
    var s = a.S[g_set_name];
    if (!s) return;
  
    if (g_frame_number >= s.F.length-1) {
      g_frame_number = 0;
    } else {
      g_frame_number++;
    }
    i_frame.value = g_frame_number;
    s_frame = s.F[g_frame_number];
    frame_draw.do_draw = 0;
    if (!s_frame) return;
  
    drawPreview();
  
    frame_draw.do_draw = 1;
    frame_draw.x = s_frame.x;
    frame_draw.y = s_frame.y;
    frame_draw.w = s_frame.w;
    frame_draw.h = s_frame.h;
    frame_draw.t = s_frame.t;
  
    drawCanvas();
    play_timer = setTimeout(playAnim, s_frame.t);
  }
  function stopAnim() {
    is_playing = false;
    if (play_timer) clearTimeout(play_timer);
  }
  var cboard_w = 8;
  var cboard_h = 8;
  
  var e_view, e_left, e_save;
  var e_d_zoom;
  var e_cb_width, e_cb_height;
  var e_preview, e_p_zoom, e_p_color, e_p_height;

  /* Checkerboard */
  cboard = new Image();
  cboard.onload = function() {
    drawCanvas();
  }
  function createCBoard() {
    c_offscreen.width = canvas.width;
    c_offscreen.height = canvas.height;
    o_ctx.clearRect(0, 0, c_offscreen.width, c_offscreen.height)
    var w = Math.round(c_offscreen.width/cboard_w);
    var h = Math.round(c_offscreen.height/cboard_h);
    for (x = 0; x < w; x++) {
      for (y = 0; y < h; y++) {
        o_ctx.fillStyle = (x+y)%2 ? '#AAA' : '#CCC';
        o_ctx.fillRect(x*cboard_w,y*cboard_h,cboard_w,cboard_h);
      }
    }
    cboard.src = c_offscreen.toDataURL();
  }

  function setupCanvas() {
    canvas = document.getElementById('display');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.lineWidth=1;
    // offscreen canvas
    c_offscreen = document.createElement('canvas');
    o_ctx = c_offscreen.getContext('2d');
    o_ctx.imageSmoothingEnabled = false;
  }
  function setupPreview() {
    c_preview = document.getElementById('preview');
    c_preview.width = 16;
    c_preview.height = 16;
    c_preview.style.width = 32+'px';
    c_preview.style.height = 32+'px';
    p_ctx = c_preview.getContext('2d');
    p_ctx.imageSmoothingEnabled = false;
  }

  function setupElements() {
    i_tree = document.getElementById('i_tree');
    i_anim = document.getElementById('i_anim');
    i_set = document.getElementById('i_set');
    i_frame = document.getElementById('i_frame');

    anim = document.getElementById('i_anim').value;
    set = document.getElementById('i_set').value;
    frame = document.getElementById('i_frame').value;
    document.getElementById('play').addEventListener('click', function() {
      is_playing = true;
      playAnim();
    });
    document.getElementById('stop').addEventListener('click', stopAnim);
  }
  /* POINTS */
  var dpoints;
  var point_colors = {
    "wing": "ff00ff",
    "tail": "00ffff",
    "head": "ff0000",
    "arm": "00ff00",
    "leg": "0000ff"
  };
  function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255) return '000000';
    return ("000000" + ((r<<16)|(g<<8)|b).toString(16)).slice(-6);
  }
  function loadPoints() {
    c_offscreen.width = points.width;
    c_offscreen.height = points.height;
    o_ctx.clearRect(0, 0, c_offscreen.width, c_offscreen.height);
    o_ctx.drawImage(points, 0, 0);

    dpoints = {};

    var idat = o_ctx.getImageData(0, 0, c_offscreen.width, c_offscreen.height);
    var pixels = idat.data;
    for (var i = 0, n = pixels.length; i < n; i +=4) {
      var p = i / 4;
      var x = p % c_offscreen.width;
      var y = Math.floor(p / c_offscreen.width);
      var hex = rgbToHex(pixels[i], pixels[i+1], pixels[i+2]);
      for (p in point_colors) {
        if (point_colors[p] == hex) {
          if (!dpoints[p]) dpoints[p] = [];
          dpoints[p].push([x,y]);
          break;
        }
      }
    }
    console.log(dpoints);

    drawCanvas();
  }
  // this function maps loaded `dpoints` with existing sprite frames
  function mapPoints() {
    var target_t = document.getElementById('map_tree').value;
    var target_a = document.getElementById('map_anim').value;
    var target_s = document.getElementById('map_set').value;
    var x = 0, y = 0, w = 0, h = 0;
    var sprite_data = g_sprite_data[target_t];
    if (!sprite_data) return;
    for (A in sprite_data.A) {
      if (target_a != '' && target_a != A) continue;
      x = sprite_data.A[A].C.x || 0;
      y = sprite_data.A[A].C.y || 0;
      w = sprite_data.A[A].C.w || 0;
      h = sprite_data.A[A].C.h || 0;
      for (s in sprite_data.A[A].S) {
      if (target_s != '' && target_s != s) continue;
        x = sprite_data.A[A].S[s].C.x || x;
        y = sprite_data.A[A].S[s].C.y || y;
        w = sprite_data.A[A].S[s].C.w || w;
        h = sprite_data.A[A].S[s].C.h || h;
        for (f in sprite_data.A[A].S[s].F) {
          var F = sprite_data.A[A].S[s].F[f];
          x = F.x || x;
          y = F.y || y;
          w = F.w || w;
          h = F.h || h;
          for (i in dpoints) {
            for (j in dpoints[i]) {
              var px = dpoints[i][j][0];
              var py = dpoints[i][j][1];
              if ( (px <= (x+w) && px >= x) && (py <= (y+h) && py >= y) ) {
                /*for (p in sprite_data.A[A].S[s].P) {
                  // check to see if the given point already exists?
                }*/
                if (!sprite_data.A[A].S[s].P) sprite_data.A[A].S[s].P = {};
                if (!sprite_data.A[A].S[s].P[i]) sprite_data.A[A].S[s].P[i] = [];
                sprite_data.A[A].S[s].P[i].push([px,py]);
                //sprite_data.A[A].S[s].P;
                console.log(j+':'+i+': ' + px+'x'+py);
                console.log(sprite_data.A[A].S[s].P[i]);
              }
            }
          }
        }
      }
    }
    syncDataToTree(target_t);
  }

  /* FILE ACCESS */
  function loadImageFile(files) {
    if (files.length > 0) {
      var file = files[0];
      if (typeof FileReader !== 'undefined' && file.type.indexOf('image') != -1) {
        var reader = new FileReader;
        reader.onload = function(evt) {
          img.onload = loadImage;
          img_loaded = 1;
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }
  function loadImage() {
    drawCanvas();
  }
  function loadPointFile(files) {
    if (files.length > 0) {
      var file = files[0];
      if (typeof FileReader !== 'undefined' && file.type.indexOf('image') != -1) {
        var reader = new FileReader;
        reader.onload = function(evt) {
          points.onload = loadPoints;
          points_loaded = 1;
          points.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }
  function loadDataFile(files) {
    if (files.length > 0) {
      var file = files[0];
      sprite_data_filename = file.name;
      var name = file.name.substr(0, file.name.lastIndexOf('.'));
      var ext = file.name.substr(file.name.lastIndexOf('.')+1);
      if (typeof FileReader !== 'undefined') {
        var reader = new FileReader;
        reader.onload = function(evt) {
          loadData(name, evt.target.result);
        };
        reader.readAsText(file);
      }
    }
  }
  function loadData(name, data_) {
    g_sprite_data[name] = eval('({'+data_+'})');
    syncDataToTree(name);
  }
  function saveDataFile() {
    // TODO: implement saving large data
  }

  function gogogo() {
    setupElements();
    createPTree();
    setupCanvas();
    setupPreview();
    // begin actual view
    img = new Image();
    img_loaded = false;
    points = new Image();
    points_loaded = false;
    d_zoom = 3, p_zoom = 3;
  
    // canvas mouse handling
    function mousewheelCanvas(evt) {
      evt.preventDefault();
      var dir = Math.max(-1, Math.min(1, (evt.wheelDelta || -evt.detail)));
  
      if (d_zoom+dir > 0) {
        document.getElementById('d_zoom').value = d_zoom+dir;
        var e = new Event('change');
        document.getElementById('d_zoom').dispatchEvent(e);
      }
    }
    canvas.addEventListener('DOMMouseScroll', mousewheelCanvas);
    canvas.addEventListener('mousewheel', mousewheelCanvas);
    function mousedownCanvas(e) {
      e.preventDefault();
      mouse.held = e.which;
      mouse.sx = e.offsetX;
      mouse.sy = e.offsetY;
    }
    canvas.addEventListener('mousedown', mousedownCanvas);
    function mouseupCanvas(e) {
      e.preventDefault();
      mouse.ex = e.offsetX;
      mouse.ey = e.offsetY;
      if (g_frame && mouse.held == 1) {
        var sx = Math.min(mouse.ex, mouse.sx);
        var sy = Math.min(mouse.ey, mouse.sy);
        var w = Math.abs(mouse.ex-mouse.sx);
        var h = Math.abs(mouse.ey-mouse.sy);
        var x = Math.floor((sx-0.5)/d_zoom);
        x = x < 0 ? 0 : x;
        var y = Math.floor((sy-0.5)/d_zoom);
        y = y < 0 ? 0 : y;
        g_frame.setInput('x', x);
        g_frame.setInput('y', y);
        g_frame.setInput('w', Math.round(w/d_zoom+0.5));
        g_frame.setInput('h', Math.round(h/d_zoom+0.5));
        syncData(g_tree_name);
      }
      mouse.held = 0;
      setFrameDraw();
      drawCanvas();
      drawPreview();
    }
    canvas.addEventListener('mouseup', mouseupCanvas);
    function mousemoveCanvas(e) {
      e.preventDefault();
      if (!mouse.held) return;
      mouse.ex = e.offsetX;
      mouse.ey = e.offsetY;
      drawCanvas();
    }
    canvas.addEventListener('mousemove', mousemoveCanvas);
    // canvas <-> image
    function resizeDisplay() {
      c_preview.width = 16;
      c_preview.height = 16;
      c_preview.style.width = 16*p_zoom+'px';
      c_preview.style.height = 16*p_zoom+'px';
  
      var w = window.getComputedStyle(document.getElementById('view'), null);
      var d_w = parseInt(w.getPropertyValue('width'));
      var d_h = parseInt(w.getPropertyValue('height')) - parseInt(c_preview.style.height);
  
      canvas.width = d_w/d_zoom;
      canvas.height = d_h/d_zoom;
      canvas.style.width = d_w+'px'
      canvas.style.height = d_h+'px'
      createCBoard();
    }
    function setDisplayZoom(val) {
      d_zoom = parseInt(val);
      resizeDisplay();
      drawCanvas();
    }
    function setPreviewZoom(val) {
      p_zoom = parseInt(val);
      resizeDisplay();
      drawPreview();
    }
  
    resizeDisplay();
    window.addEventListener('resize', resizeDisplay, false);
    // disable default window dropping
    window.addEventListener('dragover', function(evt) { evt.preventDefault(); }, false); window.addEventListener('drop', function(evt) { evt.preventDefault(); }, false);
  
    e_view = document.getElementById('view');
    e_left = document.getElementById('left');
    e_save = document.getElementById('save');
    e_d_zoom = document.getElementById('d_zoom');
    e_p_zoom = document.getElementById('p_zoom');
    e_cb_width = document.getElementById('cb_width');
    e_cb_height = document.getElementById('cb_height');
    e_p_color = document.getElementById('p_color');
    e_p_height = document.getElementById('p_height');
    e_preview = document.getElementById('preview');
  
    // add our handlers
    e_view.addEventListener('drop', function(evt) {
      evt.preventDefault();
      loadImageFile(evt.dataTransfer.files);
    }, false);
    e_left.addEventListener('drop', function(evt) {
      evt.preventDefault();
      loadPointFile(evt.dataTransfer.files);
    }, false);
    e_left.addEventListener('drop', function(evt) {
      evt.preventDefault();
      loadDataFile(evt.dataTransfer.files);
    }, false);
    e_save.addEventListener('click', saveDataFile, false);
    e_d_zoom.addEventListener('change', function(e) {
      setDisplayZoom(parseInt(e.target.value));
    });
    setDisplayZoom(parseInt(e_d_zoom.value));
  
    e_p_zoom.addEventListener('change', function(e) {
      setPreviewZoom(parseInt(e.target.value));
    });
    setPreviewZoom(parseInt(e_p_zoom.value));
  
    e_cb_width.addEventListener('change', function(e) {
      cboard_w = parseInt(e.target.value);
      resizeDisplay();
    });
    e_cb_height.addEventListener('change', function(e) {
      cboard_h = parseInt(e.target.value);
      resizeDisplay();
    });
    e_p_color.addEventListener('change', function(e) {
      e_preview.style.backgroundColor = e.target.value;
    });
    e_preview.style.backgroundColor = e_p_color.value;
    document.getElementById('map_datapoints').addEventListener('click', mapPoints, false);
    var tabs = new Tabs(document.getElementById('tabs'));
    tabs.addTabFrom('Editor', document.getElementById('tree'));
    tabs.addTabFrom('Attachmentor', document.getElementById('ptree'));
    // set up load stuff
    var h_load_image = document.createElement('input');
    h_load_image.type = 'file';
    h_load_image.addEventListener('change', function(e) {
        loadImageFile(e.target.files);
    });
    var e_load_image = document.getElementById('load_image');
    e_load_image.addEventListener('click', function() {
      h_load_image.click();
    });
    var h_load_data = document.createElement('input');
    h_load_data.type = 'file';
    h_load_data.addEventListener('change', function(e) {
      loadDataFile(e.target.files);
    });
    var e_load_data = document.getElementById('load_data');
    e_load_data.addEventListener('click', function() {
      h_load_data.click();
    });
    var h_load_points = document.createElement('input');
    h_load_points.type = 'file';
    h_load_points.addEventListener('change', function(e) {
        loadPointFile(e.target.files);
    });
    var e_load_points = document.getElementById('load_points');
    e_load_points.addEventListener('click', function() {
      h_load_points.click();
    });
    //
    var e_new_sprite = document.getElementById('new_sprite');
    e_new_sprite.addEventListener('click', function() {
      var name = 1;
      while (g_trees[name]) {
        name++;
      }
      createTree(name);
      g_sprite_data[name] = {C: {}, A: {}};
    });
  }
  return {
    gogogo: gogogo
  };
})();

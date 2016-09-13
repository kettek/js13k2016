function Branch(parent, content) {
  this.element = document.createElement('li');
  this.title_element = document.createElement('span');

  this.text_element = document.createElement('span');
  this.text_element.innerHTML = content;
  this.branch_element = null;
  this.hide_element = null;

  this.elements = [];

  this.branches = [];
  this.branch_map = {};
  this.input_map = {};

  this.title_element.branch = this;
  this.title_element.appendChild(this.text_element);
  this.element.appendChild(this.title_element);

  this.parent = parent;
  this.element.branch = this;
  if (parent instanceof HTMLElement) {
    parent.appendChild(this.element);
  } else {
    parent.branch_element.appendChild(this.element);
  }
}
Branch.prototype.getText = function() {
  return this.text_element.innerHTML;
}
Branch.prototype.addHandler = function(type, cb) {
  this.element.addEventListener(type, cb);
}
Branch.prototype.getInput = function(id) {
  return this.input_map[id];
}
Branch.prototype.setInput = function(id, value) {
  var input = this.getInput(id);
  if (input) {
    if (input.type == 'checkbox') {
      input.checked = (value == 0 ? true : false);
    } else {
      input.value = value;
    }
  }
}
Branch.prototype.addInput = function(type, id, value, cb) {
  var input_element = document.createElement('input');
  input_element.type = type || 'text';
  if (type == 'number') {
    input_element.style.width = '3em';
  } else if (type == 'text') {
    input_element.style.width = '6em';
  }
  input_element.autocomplete = 'off';
  input_element.id = id || '';
  input_element.name = id || '';
  input_element.value = value;
  if (cb) input_element.addEventListener('change', cb);
  if (cb) input_element.addEventListener('click', cb);

  if (id) this.input_map[id] = input_element;
  this.title_element.appendChild(input_element);
  this.elements.push(input_element);
  return this;
}
Branch.prototype.addText = function(value) {
  var text_element = document.createElement('span');
  text_element.innerText = value;
  this.title_element.appendChild(text_element);
  this.elements.push(text_element);
  return this;
}
Branch.prototype.implode = function() {
  for (i in this.branches) {
    this.branches[i].implode();
  }
  if (!(this.parent instanceof HTMLElement)) {
    this.parent.branches.splice(this.parent.branches.indexOf(this), 1);
  }
  if (this.element.parentElement) this.element.parentElement.removeChild(this.element);
}
Branch.prototype.showBranches = function() {
  if (this.branch_element) this.branch_element.style.display = 'block';
}
Branch.prototype.hideBranches = function() {
  if (this.branch_element) this.branch_element.style.display = 'none';
}
Branch.prototype.moveUp = function() {
  var e;
  if (this.parent instanceof HTMLElement) {
    e = this.parent;
  } else {
    e = this.parent.branch_element;
    var i = this.parent.branches.indexOf(this);
    if (i > 0) {
      this.parent.branches.splice(i, 1);
      this.parent.branches.splice(i-1, 0, this);
    }
  }
  if (this.element.previousSibling) {
    e.insertBefore(this.element, this.element.previousSibling);
  }
}
Branch.prototype.moveDown = function() {
  var p;
  if (this.parent instanceof HTMLElement) {
    p = this.parent;
  } else {
    p = this.parent.branch_element;
    var i = this.parent.branches.indexOf(this);
    if (i != this.parent.branches.length) {
      this.parent.branches.splice(i, 1);
      this.parent.branches.splice(i+1, 0, this);
    }
  }
  var e = this.element.nextSibling;
  if (!e) return;
  e = e.nextSibling;
  if (e) p.insertBefore(this.element, e);
  else p.appendChild(this.element);
}
Branch.prototype.getBranch = function(name) {
  return this.branch_map[name];
}
Branch.prototype.addBranch = function(content) {
  if (!this.hide_element) {
    this.hide_element = document.createElement('input');
    var _ = this;
    this.hide_element.type = 'checkbox';
    this.hide_element.checked = true;
    this.hide_element.addEventListener('change', function(e) {
        if (e.target.checked) {
          _.showBranches();
        } else {
          _.hideBranches();
        }
    });
    this.element.insertBefore(this.hide_element, this.title_element);
  }
  if (!this.branch_element) {
    this.branch_element = document.createElement('ul');
    this.element.appendChild(this.branch_element);
  }
  this.branches.push(new Branch(this, content));
  this.branch_map[content] = this.branches[this.branches.length-1];
  return this.branches[this.branches.length-1];
}

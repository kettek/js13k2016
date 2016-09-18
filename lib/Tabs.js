function Tabs(parent) {
  // contains everything
  this.container = document.createElement('div');
  // contains clickable tabs
  this.tab_container = document.createElement('div');
  // contains tab content
  this.content_container = document.createElement('div');

  this.tabs = [];
  this.contents = [];

  this.selected = -1;

  this.container.className = 'Tabs-container';
  this.tab_container.className = 'Tabs-tabs';
  this.content_container.className = 'Tabs-contents';
  this.container.appendChild(this.tab_container);
  this.container.appendChild(this.content_container);
  parent.appendChild(this.container);
}
Tabs.prototype.addTabs = function(container) {
  var children = container.children;
  for (var i = children.length-1; i >= 0; i--) {
    var id = this.addTab(i, '');
    this.contents[id].appendChild(children[i]);
  }
}
Tabs.prototype.addTabFrom = function(name, container) {
  var id = this.addTab(name, '');
  this.contents[id].appendChild(container);
}
Tabs.prototype.addTab = function(name, data) {
  var self = this;
  var id = this.tabs.length;
  // create tab
  var tab = document.createElement('button');
  tab.className = 'Tabs-tab';
  tab.innerHTML = name;
  tab.addEventListener('click', function(e) {
    self.selectTab(id);
  }, true);
  this.tab_container.appendChild(tab);
  this.tabs.push(tab);
  // create content
  var content = document.createElement('div');
  content.innerHTML = data;
  content.className = 'Tabs-content';
  content.style.display = 'none';
  this.content_container.appendChild(content);
  this.contents.push(content);
  if (this.selected == -1) this.selectTab(id);
  return id;
}
Tabs.prototype.removeTab = function(id) {
  var tab = this.tab_container[id];
  var content = this.content_container[id];

  tab.parentNode.removeChild(tab);
  content.parentNode.removeChild(content);

  this.tabs.splice(id, 1);
  this.contents.splice(id, 1);
}
Tabs.prototype.selectTab = function(id) {
  if (id != this.selected) {
    if (this.selected >= 0) {
      this.tabs[this.selected].className = 'Tabs-tab';
      this.contents[this.selected].style.display = "none";
    }
    this.tabs[id].className = 'Tabs-tab-selected';
    this.contents[id].style.display = "block";
    this.selected = id;
  }
}
Tabs.prototype.getTab = function(id) {
  return this.tab_container[id];
}
Tabs.prototype.getContent = function(id) {
  return this.content_container[id];
}
Tabs.prototype.setTab = function(id, name) {
  getTab(id).innerHTML = name;
}
Tabs.prototype.setContent = function(id, content) {
  getContent(id).innerHTML = content;
}

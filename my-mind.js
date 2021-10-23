(() => {
  // .js/mm.js
  window.MM = {};

  // .js/promise.js
  window.Promise = function(executor) {
    this._state = 0;
    this._value = null;
    this._cb = {
      fulfilled: [],
      rejected: []
    };
    this._thenPromises = [];
    executor && executor(this.fulfill.bind(this), this.reject.bind(this));
  };
  Promise.resolve = function(value) {
    return new Promise().fulfill(value);
  };
  Promise.reject = function(value) {
    return new Promise().reject(value);
  };
  Promise.prototype.then = function(onFulfilled, onRejected) {
    this._cb.fulfilled.push(onFulfilled);
    this._cb.rejected.push(onRejected);
    var thenPromise = new Promise();
    this._thenPromises.push(thenPromise);
    if (this._state > 0) {
      setTimeout(this._processQueue.bind(this), 0);
    }
    return thenPromise;
  };
  Promise.prototype.fulfill = function(value) {
    if (this._state != 0) {
      return this;
    }
    this._state = 1;
    this._value = value;
    this._processQueue();
    return this;
  };
  Promise.prototype.reject = function(value) {
    if (this._state != 0) {
      return this;
    }
    this._state = 2;
    this._value = value;
    this._processQueue();
    return this;
  };
  Promise.prototype.chain = function(promise) {
    return this.then(promise.fulfill.bind(promise), promise.reject.bind(promise));
  };
  Promise.prototype["catch"] = function(onRejected) {
    return this.then(null, onRejected);
  };
  Promise.prototype._processQueue = function() {
    while (this._thenPromises.length) {
      var onFulfilled = this._cb.fulfilled.shift();
      var onRejected = this._cb.rejected.shift();
      this._executeCallback(this._state == 1 ? onFulfilled : onRejected);
    }
  };
  Promise.prototype._executeCallback = function(cb) {
    var thenPromise = this._thenPromises.shift();
    if (typeof cb != "function") {
      if (this._state == 1) {
        thenPromise.fulfill(this._value);
      } else {
        thenPromise.reject(this._value);
      }
      return;
    }
    try {
      var returned = cb(this._value);
      if (returned && typeof returned.then == "function") {
        var fulfillThenPromise = function(value) {
          thenPromise.fulfill(value);
        };
        var rejectThenPromise = function(value) {
          thenPromise.reject(value);
        };
        returned.then(fulfillThenPromise, rejectThenPromise);
      } else {
        thenPromise.fulfill(returned);
      }
    } catch (e) {
      thenPromise.reject(e);
    }
  };

  // .js/repo.js
  MM.Repo = {
    id: "",
    label: "",
    getAll: function() {
      var all = [];
      for (var p in this) {
        var val = this[p];
        if (this.isPrototypeOf(val)) {
          all.push(val);
        }
      }
      return all;
    },
    getByProperty: function(property, value) {
      return this.getAll().filter((item) => {
        return item[property] == value;
      })[0] || null;
    },
    getById: function(id) {
      return this.getByProperty("id", id);
    },
    buildOption: function() {
      var o = document.createElement("option");
      o.value = this.id;
      o.innerHTML = this.label;
      return o;
    }
  };

  // .js/pubsub.js
  var subscribers = new Map();
  function publish(message, publisher, data) {
    let subs = subscribers.get(message) || [];
    subs.forEach(function(subscriber) {
      subscriber.handleMessage(message, publisher, data);
    });
  }
  function subscribe(message, subscriber) {
    if (!subscribers.has(message)) {
      subscribers.set(message, []);
    }
    let subs = subscribers.get(message) || [];
    let index = subs.indexOf(subscriber);
    if (index == -1) {
      subs.push(subscriber);
    }
  }
  function unsubscribe(message, subscriber) {
    let subs = subscribers.get(message) || [];
    let index = subs.indexOf(subscriber);
    if (index > -1) {
      subs.splice(index, 1);
    }
  }

  // .js/tip.js
  MM.Tip = {
    _node: null,
    handleEvent: function() {
      this._hide();
    },
    handleMessage: function() {
      this._hide();
    },
    init: function() {
      this._node = document.querySelector("#tip");
      this._node.addEventListener("click", this);
      subscribe("command-child", this);
      subscribe("command-sibling", this);
    },
    _hide: function() {
      unsubscribe("command-child", this);
      unsubscribe("command-sibling", this);
      this._node.removeEventListener("click", this);
      this._node.classList.add("hidden");
      this._node = null;
    }
  };

  // .js/action.js
  MM.Action = function() {
  };
  MM.Action.prototype.perform = function() {
  };
  MM.Action.prototype.undo = function() {
  };
  MM.Action.Multi = function(actions) {
    this._actions = actions;
  };
  MM.Action.Multi.prototype = Object.create(MM.Action.prototype);
  MM.Action.Multi.prototype.perform = function() {
    this._actions.forEach(function(action) {
      action.perform();
    });
  };
  MM.Action.Multi.prototype.undo = function() {
    this._actions.slice().reverse().forEach(function(action) {
      action.undo();
    });
  };
  MM.Action.InsertNewItem = function(parent, index) {
    this._parent = parent;
    this._index = index;
    this._item = new MM.Item();
  };
  MM.Action.InsertNewItem.prototype = Object.create(MM.Action.prototype);
  MM.Action.InsertNewItem.prototype.perform = function() {
    this._parent.expand();
    this._parent.insertChild(this._item, this._index);
    MM.App.select(this._item);
  };
  MM.Action.InsertNewItem.prototype.undo = function() {
    this._parent.removeChild(this._item);
    MM.App.select(this._parent);
  };
  MM.Action.AppendItem = function(parent, item) {
    this._parent = parent;
    this._item = item;
  };
  MM.Action.AppendItem.prototype = Object.create(MM.Action.prototype);
  MM.Action.AppendItem.prototype.perform = function() {
    this._parent.insertChild(this._item);
    MM.App.select(this._item);
  };
  MM.Action.AppendItem.prototype.undo = function() {
    this._parent.removeChild(this._item);
    MM.App.select(this._parent);
  };
  MM.Action.RemoveItem = function(item) {
    this._item = item;
    this._parent = item.parent;
    this._index = this._parent.children.indexOf(this._item);
  };
  MM.Action.RemoveItem.prototype = Object.create(MM.Action.prototype);
  MM.Action.RemoveItem.prototype.perform = function() {
    this._parent.removeChild(this._item);
    MM.App.select(this._parent);
  };
  MM.Action.RemoveItem.prototype.undo = function() {
    this._parent.insertChild(this._item, this._index);
    MM.App.select(this._item);
  };
  MM.Action.MoveItem = function(item, newParent, newIndex, newSide) {
    this._item = item;
    this._newParent = newParent;
    this._newIndex = arguments.length < 3 ? null : newIndex;
    this._newSide = newSide || "";
    this._oldParent = item.parent;
    this._oldIndex = this._oldParent.children.indexOf(item);
    this._oldSide = item.side;
  };
  MM.Action.MoveItem.prototype = Object.create(MM.Action.prototype);
  MM.Action.MoveItem.prototype.perform = function() {
    this._item.side = this._newSide;
    if (this._newIndex === null) {
      this._newParent.insertChild(this._item);
    } else {
      this._newParent.insertChild(this._item, this._newIndex);
    }
    MM.App.select(this._item);
  };
  MM.Action.MoveItem.prototype.undo = function() {
    this._item.side = this._oldSide;
    this._oldParent.insertChild(this._item, this._oldIndex);
    MM.App.select(this._newParent);
  };
  MM.Action.Swap = function(item, diff) {
    this._item = item;
    this._parent = item.parent;
    var children = this._parent.children;
    var sibling = this._parent.resolvedLayout.pickSibling(this._item, diff);
    this._sourceIndex = children.indexOf(this._item);
    this._targetIndex = children.indexOf(sibling);
  };
  MM.Action.Swap.prototype = Object.create(MM.Action.prototype);
  MM.Action.Swap.prototype.perform = function() {
    this._parent.insertChild(this._item, this._targetIndex);
  };
  MM.Action.Swap.prototype.undo = function() {
    this._parent.insertChild(this._item, this._sourceIndex);
  };
  MM.Action.SetLayout = function(item, layout) {
    this._item = item;
    this._layout = layout;
    this._oldLayout = item.layout;
  };
  MM.Action.SetLayout.prototype = Object.create(MM.Action.prototype);
  MM.Action.SetLayout.prototype.perform = function() {
    this._item.layout = this._layout;
  };
  MM.Action.SetLayout.prototype.undo = function() {
    this._item.layout = this._oldLayout;
  };
  MM.Action.SetShape = function(item, shape) {
    this._item = item;
    this._shape = shape;
    this._oldShape = item.shape;
  };
  MM.Action.SetShape.prototype = Object.create(MM.Action.prototype);
  MM.Action.SetShape.prototype.perform = function() {
    this._item.shape = this._shape;
  };
  MM.Action.SetShape.prototype.undo = function() {
    this._item.shape = this._oldShape;
  };
  MM.Action.SetColor = function(item, color) {
    this._item = item;
    this._color = color;
    this._oldColor = item.color;
  };
  MM.Action.SetColor.prototype = Object.create(MM.Action.prototype);
  MM.Action.SetColor.prototype.perform = function() {
    this._item.color = this._color;
  };
  MM.Action.SetColor.prototype.undo = function() {
    this._item.color = this._oldColor;
  };
  MM.Action.SetText = function(item, text) {
    this._item = item;
    this._text = text;
    this._oldText = item.text;
    this._oldValue = item.value;
  };
  MM.Action.SetText.prototype = Object.create(MM.Action.prototype);
  MM.Action.SetText.prototype.perform = function() {
    this._item.text = this._text;
    var numText = Number(this._text);
    if (numText == this._text) {
      this._item.value = numText;
    }
  };
  MM.Action.SetText.prototype.undo = function() {
    this._item.text = this._oldText;
    this._item.value = this._oldValue;
  };
  MM.Action.SetValue = function(item, value) {
    this._item = item;
    this._value = value;
    this._oldValue = item.value;
  };
  MM.Action.SetValue.prototype = Object.create(MM.Action.prototype);
  MM.Action.SetValue.prototype.perform = function() {
    this._item.value = this._value;
  };
  MM.Action.SetValue.prototype.undo = function() {
    this._item.value = this._oldValue;
  };
  MM.Action.SetStatus = function(item, status) {
    this._item = item;
    this._status = status;
    this._oldStatus = item.status;
  };
  MM.Action.SetStatus.prototype = Object.create(MM.Action.prototype);
  MM.Action.SetStatus.prototype.perform = function() {
    this._item.status = this._status;
  };
  MM.Action.SetStatus.prototype.undo = function() {
    this._item.status = this._oldStatus;
  };
  MM.Action.SetIcon = function(item, icon) {
    this._item = item;
    this._icon = icon;
    this._oldIcon = item.icon;
  };
  MM.Action.SetIcon.prototype = Object.create(MM.Action.prototype);
  MM.Action.SetIcon.prototype.perform = function() {
    this._item.icon = this._icon;
  };
  MM.Action.SetIcon.prototype.undo = function() {
    this._item.icon = this._oldIcon;
  };
  MM.Action.SetSide = function(item, side) {
    this._item = item;
    this._side = side;
    this._oldSide = item.side;
  };
  MM.Action.SetSide.prototype = Object.create(MM.Action.prototype);
  MM.Action.SetSide.prototype.perform = function() {
    this._item.side = this._side;
    this._item.map.update();
  };
  MM.Action.SetSide.prototype.undo = function() {
    this._item.side = this._oldSide;
    this._item.map.update();
  };

  // .js/html.js
  function node(name, attrs) {
    let node4 = document.createElement(name);
    Object.assign(node4, attrs);
    return node4;
  }

  // .js/svg.js
  var NS = "http://www.w3.org/2000/svg";
  function node2(name, attrs) {
    let node4 = document.createElementNS(NS, name);
    for (let attr in attrs) {
      node4.setAttribute(attr, attrs[attr]);
    }
    return node4;
  }
  function group() {
    return node2("g");
  }
  function foreignObject() {
    let fo = node2("foreignObject");
    fo.setAttribute("width", "1");
    fo.setAttribute("height", "1");
    return fo;
  }

  // .js/shape/shape.js
  var VERTICAL_OFFSET = 0.5;
  var Shape = class {
    constructor(id, label) {
      this.id = id;
      this.label = label;
      repo.set(this.id, this);
    }
    update(item) {
      item.dom.content.style.borderColor = item.resolvedColor;
    }
    getHorizontalAnchor(item) {
      const { contentPosition, contentSize } = item;
      return Math.round(contentPosition[0] + contentSize[0] / 2) + 0.5;
    }
    getVerticalAnchor(item) {
      const { contentPosition, contentSize } = item;
      return contentPosition[1] + Math.round(contentSize[1] * VERTICAL_OFFSET) + 0.5;
    }
  };
  var repo = new Map();

  // .js/layout/layout.js
  var Layout = class {
    constructor(id, label, childDirection = "right") {
      this.id = id;
      this.label = label;
      this.childDirection = childDirection;
      this.SPACING_CHILD = 4;
      repo2.set(this.id, this);
    }
    getChildDirection(_child) {
      return this.childDirection;
    }
    computeAlignment(item) {
      let direction = item.isRoot ? this.childDirection : item.parent.resolvedLayout.getChildDirection(item);
      if (direction == "left") {
        return "right";
      }
      return "left";
    }
    pick(item, dir) {
      var opposite = {
        left: "right",
        right: "left",
        top: "bottom",
        bottom: "top"
      };
      if (!item.isCollapsed()) {
        var children = item.children;
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (this.getChildDirection(child) == dir) {
            return child;
          }
        }
      }
      if (item.isRoot) {
        return item;
      }
      var parentLayout = item.parent.resolvedLayout;
      var thisChildDirection = parentLayout.getChildDirection(item);
      if (thisChildDirection == dir) {
        return item;
      } else if (thisChildDirection == opposite[dir]) {
        return item.parent;
      } else {
        return parentLayout.pickSibling(item, dir == "left" || dir == "top" ? -1 : 1);
      }
    }
    pickSibling(item, dir) {
      if (item.isRoot) {
        return item;
      }
      var children = item.parent.children;
      var index = children.indexOf(item);
      index += dir;
      index = (index + children.length) % children.length;
      return children[index];
    }
    anchorToggle(item, point, side) {
      var node4 = item.dom.toggle;
      var w = node4.offsetWidth;
      var h = node4.offsetHeight;
      let [l, t] = point;
      switch (side) {
        case "left":
          t -= h / 2;
          l -= w;
          break;
        case "right":
          t -= h / 2;
          break;
        case "top":
          l -= w / 2;
          t -= h;
          break;
        case "bottom":
          l -= w / 2;
          break;
      }
      node4.style.left = Math.round(l) + "px";
      node4.style.top = Math.round(t) + "px";
    }
    getChildAnchor(item, side) {
      let { position, contentPosition, contentSize } = item;
      if (side == "left" || side == "right") {
        var pos = position[0] + contentPosition[0];
        if (side == "left") {
          pos += contentSize[0];
        }
      } else {
        var pos = position[1] + contentPosition[1];
        if (side == "top") {
          pos += contentSize[1];
        }
      }
      return pos;
    }
    computeChildrenBBox(children, childIndex) {
      var bbox = [0, 0];
      var rankIndex = (childIndex + 1) % 2;
      children.forEach((child) => {
        const { size } = child;
        bbox[rankIndex] = Math.max(bbox[rankIndex], size[rankIndex]);
        bbox[childIndex] += size[childIndex];
      });
      if (children.length > 1) {
        bbox[childIndex] += this.SPACING_CHILD * (children.length - 1);
      }
      return bbox;
    }
  };
  var repo2 = new Map();

  // .js/item.js
  var COLOR = "#999";
  var RE = /\b(([a-z][\w-]+:\/\/\w)|(([\w-]+\.){2,}[a-z][\w-]+)|([\w-]+\.[a-z][\w-]+\/))[^\s]*([^\s,.;:?!<>\(\)\[\]'"])?($|\b)/i;
  var UPDATE_OPTIONS = {
    parent: true,
    children: false
  };
  var Item = class {
    constructor() {
      this._id = generateId();
      this._parent = null;
      this._collapsed = false;
      this._icon = null;
      this._notes = null;
      this._value = null;
      this._status = null;
      this._color = null;
      this._side = null;
      this._shape = null;
      this._layout = null;
      this.originalText = "";
      this.dom = {
        node: group(),
        connectors: group(),
        content: node("div"),
        notes: node("div"),
        status: node("span"),
        icon: node("span"),
        value: node("span"),
        text: node("div"),
        toggle: node("div")
      };
      this.children = [];
      const { dom } = this;
      dom.node.classList.add("item");
      dom.content.classList.add("content");
      dom.notes.classList.add("notes-indicator");
      dom.status.classList.add("status");
      dom.icon.classList.add("icon");
      dom.value.classList.add("value");
      dom.text.classList.add("text");
      dom.toggle.classList.add("toggle");
      dom.icon.classList.add("icon");
      let foContent = foreignObject();
      dom.node.append(dom.connectors, foContent);
      foContent.append(dom.content);
      dom.content.append(dom.status, dom.value, dom.icon, dom.text, dom.notes);
      dom.toggle.addEventListener("click", this);
    }
    static fromJSON(data) {
      return new this().fromJSON(data);
    }
    get id() {
      return this._id;
    }
    get parent() {
      return this._parent;
    }
    set parent(parent) {
      this._parent = parent;
      this.update({ children: true });
    }
    get size() {
      const bbox = this.dom.node.getBBox();
      return [bbox.width, bbox.height];
    }
    get position() {
      const { node: node4 } = this.dom;
      const transform = node4.getAttribute("transform");
      return transform.match(/\d+/g).map(Number);
    }
    set position(position) {
      const { node: node4 } = this.dom;
      const transform = `translate(${position.join(" ")})`;
      node4.setAttribute("transform", transform);
    }
    get contentSize() {
      const { content } = this.dom;
      const fo = content.parentNode;
      return [fo.getAttribute("width"), fo.getAttribute("height")].map(Number);
    }
    get contentPosition() {
      const { content } = this.dom;
      const fo = content.parentNode;
      return [fo.getAttribute("x"), fo.getAttribute("y")].map(Number);
    }
    set contentPosition(position) {
      const { content } = this.dom;
      const fo = content.parentNode;
      fo.setAttribute("x", String(position[0]));
      fo.setAttribute("y", String(position[1]));
    }
    toJSON() {
      let data = {
        id: this.id,
        text: this.text,
        notes: this.notes
      };
      if (this._side) {
        data.side = this._side;
      }
      if (this._color) {
        data.color = this._color;
      }
      if (this._icon) {
        data.icon = this._icon;
      }
      if (this._value) {
        data.value = this._value;
      }
      if (this._status) {
        data.status = this._status;
      }
      if (this._layout) {
        data.layout = this._layout.id;
      }
      if (this._shape) {
        data.shape = this._shape.id;
      }
      if (this._collapsed) {
        data.collapsed = 1;
      }
      if (this.children.length) {
        data.children = this.children.map((child) => child.toJSON());
      }
      return data;
    }
    fromJSON(data) {
      this.text = data.text;
      if (data.id) {
        this._id = data.id;
      }
      if (data.notes) {
        this.notes = data.notes;
      }
      if (data.side) {
        this._side = data.side;
      }
      if (data.color) {
        this._color = data.color;
      }
      if (data.icon) {
        this._icon = data.icon;
      }
      if (data.value) {
        this._value = data.value;
      }
      if (data.status) {
        if (data.status == "yes") {
          this._status = true;
        } else if (data.status == "no") {
          this._status = false;
        } else {
          this._status = data.status;
        }
      }
      if (data.collapsed) {
        this.collapse();
      }
      if (data.layout) {
        this._layout = repo2.get(data.layout);
      }
      if (data.shape) {
        this.shape = repo.get(data.shape);
      }
      (data.children || []).forEach((child) => {
        this.insertChild(Item.fromJSON(child));
      });
      return this;
    }
    mergeWith(data) {
      var dirty = 0;
      if (this.text != data.text && !this.dom.text.contentEditable) {
        this.text = data.text;
      }
      if (this._side != data.side) {
        this._side = data.side;
        dirty = 1;
      }
      if (this._color != data.color) {
        this._color = data.color;
        dirty = 2;
      }
      if (this._icon != data.icon) {
        this._icon = data.icon;
        dirty = 1;
      }
      if (this._value != data.value) {
        this._value = data.value;
        dirty = 1;
      }
      if (this._status != data.status) {
        this._status = data.status;
        dirty = 1;
      }
      if (this._collapsed != !!data.collapsed) {
        this[this._collapsed ? "expand" : "collapse"]();
      }
      if (this.layout != data.layout) {
        this._layout = repo2.get(data.layout);
        dirty = 2;
      }
      if (this.shape != data.shape) {
        this.shape = repo.get(data.shape);
      }
      (data.children || []).forEach((child, index) => {
        if (index >= this.children.length) {
          this.insertChild(Item.fromJSON(child));
        } else {
          var myChild = this.children[index];
          if (myChild.id == child.id) {
            myChild.mergeWith(child);
          } else {
            this.removeChild(this.children[index]);
            this.insertChild(Item.fromJSON(child), index);
          }
        }
      });
      var newLength = (data.children || []).length;
      while (this.children.length > newLength) {
        this.removeChild(this.children[this.children.length - 1]);
      }
      if (dirty == 1) {
        this.update({ children: false });
      }
      if (dirty == 2) {
        this.update({ children: true });
      }
    }
    clone() {
      var data = this.toJSON();
      var removeId = function(obj) {
        delete obj.id;
        obj.children && obj.children.forEach(removeId);
      };
      removeId(data);
      return Item.fromJSON(data);
    }
    select() {
      this.dom.node.classList.add("current");
      if (window.editor) {
        if (this.notes) {
          window.editor.setContent(this.notes);
        } else {
          window.editor.setContent("");
        }
      }
      this.map.ensureItemVisibility(this);
      MM.Clipboard.focus();
      publish("item-select", this);
    }
    deselect() {
      if (MM.App.editing) {
        MM.Command.Finish.execute();
      }
      this.dom.node.classList.remove("current");
    }
    update(options = {}) {
      options = Object.assign({}, UPDATE_OPTIONS, options);
      const { map, children, parent } = this;
      if (!map || !map.isVisible) {
        return;
      }
      if (options.children) {
        let childUpdateOptions = { parent: false, children: true };
        children.forEach((child) => child.update(childUpdateOptions));
      }
      publish("item-change", this);
      this.updateStatus();
      this.updateIcon();
      this.updateValue();
      const { resolvedLayout, resolvedShape, dom } = this;
      dom.notes.classList.toggle("notes-indicator-visible", !!this.notes);
      dom.node.classList.toggle("collapsed", this._collapsed);
      dom.node.dataset.shape = resolvedShape.id;
      dom.node.dataset.align = resolvedLayout.computeAlignment(this);
      let fo = dom.content.parentNode;
      fo.setAttribute("width", String(dom.content.offsetWidth));
      fo.setAttribute("height", String(dom.content.offsetHeight));
      dom.connectors.innerHTML = "";
      resolvedLayout.update(this);
      resolvedShape.update(this);
      if (options.parent) {
        parent.update({ children: false });
      }
    }
    get text() {
      return this.dom.text.innerHTML;
    }
    set text(text) {
      this.dom.text.innerHTML = text;
      findLinks(this.dom.text);
      this.update();
    }
    get notes() {
      return this._notes;
    }
    set notes(notes) {
      this._notes = notes;
      this.update();
    }
    collapse() {
      if (this._collapsed) {
        return;
      }
      this._collapsed = true;
      this.update();
    }
    expand() {
      if (!this._collapsed) {
        return;
      }
      this._collapsed = false;
      this.update();
      this.update({ children: true });
    }
    isCollapsed() {
      return this._collapsed;
    }
    get value() {
      return this._value;
    }
    set value(value) {
      this._value = value;
      this.update();
    }
    get resolvedValue() {
      const value = this._value;
      if (typeof value == "number") {
        return value;
      }
      let childValues = this.children.map((child) => child.resolvedValue);
      switch (value) {
        case "max":
          return Math.max(...childValues);
          break;
        case "min":
          return Math.min(...childValues);
          break;
        case "sum":
          return childValues.reduce((prev, cur) => prev + cur, 0);
          break;
        case "avg":
          var sum = childValues.reduce((prev, cur) => prev + cur, 0);
          return childValues.length ? sum / childValues.length : 0;
          break;
        default:
          return 0;
          break;
      }
    }
    get status() {
      return this._status;
    }
    set status(status) {
      this._status = status;
      this.update();
    }
    get resolvedStatus() {
      let status = this._status;
      if (status == "computed") {
        return this.children.every((child) => {
          return child.resolvedStatus !== false;
        });
      } else {
        return status;
      }
    }
    get icon() {
      return this._icon;
    }
    set icon(icon) {
      this._icon = icon;
      this.update();
    }
    get side() {
      return this._side;
    }
    set side(side) {
      this._side = side;
    }
    get color() {
      return this._color;
    }
    set color(color) {
      this._color = color;
      this.update({ children: true });
    }
    get resolvedColor() {
      if (this._color) {
        return this._color;
      }
      const { parent } = this;
      if (parent instanceof Item) {
        return parent.resolvedColor;
      }
      return COLOR;
    }
    get layout() {
      return this._layout;
    }
    set layout(layout) {
      this._layout = layout;
      this.update({ children: true });
    }
    get resolvedLayout() {
      if (this._layout) {
        return this._layout;
      }
      const { parent } = this;
      if (!(parent instanceof Item)) {
        throw new Error("Non-connected item does not have layout");
      }
      return parent.resolvedLayout;
    }
    get shape() {
      return this._shape;
    }
    set shape(shape) {
      this._shape = shape;
      this.update();
    }
    get resolvedShape() {
      if (this._shape) {
        return this._shape;
      }
      let depth = 0;
      let node4 = this;
      while (!node4.isRoot) {
        depth++;
        node4 = node4.parent;
      }
      switch (depth) {
        case 0:
          return repo.get("ellipse");
        case 1:
          return repo.get("box");
        default:
          return repo.get("underline");
      }
    }
    get map() {
      let item = this.parent;
      while (item) {
        if (item instanceof Map2) {
          return item;
        }
        item = item.parent;
      }
      return null;
    }
    get isRoot() {
      return this.parent instanceof Map2;
    }
    insertChild(child, index) {
      if (!child) {
        child = new Item();
      } else if (child.parent && child.parent instanceof Item) {
        child.parent.removeChild(child);
      }
      if (!this.children.length) {
        this.dom.node.appendChild(this.dom.toggle);
      }
      if (arguments.length < 2) {
        index = this.children.length;
      }
      var next = null;
      if (index < this.children.length) {
        next = this.children[index].dom.node;
      }
      this.dom.node.insertBefore(child.dom.node, next);
      this.children.splice(index, 0, child);
      child.parent = this;
    }
    removeChild(child) {
      var index = this.children.indexOf(child);
      this.children.splice(index, 1);
      var node4 = child.dom.node;
      node4.parentNode.removeChild(node4);
      child.parent = null;
      if (!this.children.length) {
        this.dom.toggle.parentNode.removeChild(this.dom.toggle);
      }
      this.update();
    }
    startEditing() {
      this.originalText = this.text;
      this.dom.text.contentEditable = "true";
      this.dom.text.focus();
      document.execCommand("styleWithCSS", null, "false");
      this.dom.text.addEventListener("input", this);
      this.dom.text.addEventListener("keydown", this);
      this.dom.text.addEventListener("blur", this);
    }
    stopEditing() {
      this.dom.text.removeEventListener("input", this);
      this.dom.text.removeEventListener("keydown", this);
      this.dom.text.removeEventListener("blur", this);
      this.dom.text.blur();
      this.dom.text.contentEditable = "false";
      var result = this.dom.text.innerHTML;
      this.dom.text.innerHTML = this.originalText;
      this.originalText = "";
      this.update();
      MM.Clipboard.focus();
      return result;
    }
    handleEvent(e) {
      switch (e.type) {
        case "input":
          this.update();
          this.map.ensureItemVisibility(this);
          break;
        case "keydown":
          if (e.keyCode == 9) {
            e.preventDefault();
          }
          break;
        case "blur":
          MM.Command.Finish.execute();
          break;
        case "click":
          if (this._collapsed) {
            this.expand();
          } else {
            this.collapse();
          }
          MM.App.select(this);
          break;
      }
    }
    updateStatus() {
      const { resolvedStatus, dom } = this;
      dom.status.className = "status";
      dom.status.hidden = false;
      switch (resolvedStatus) {
        case true:
          dom.status.classList.add("yes");
          break;
        case false:
          dom.status.classList.add("no");
          break;
        default:
          dom.status.hidden = true;
          break;
      }
    }
    updateIcon() {
      var icon = this._icon;
      this.dom.icon.className = "icon";
      this.dom.icon.hidden = !icon;
      if (icon) {
        this.dom.icon.classList.add("fa");
        this.dom.icon.classList.add(icon);
      }
    }
    updateValue() {
      const { dom, _value } = this;
      if (_value === null) {
        dom.value.hidden = true;
        return;
      }
      dom.value.hidden = false;
      if (typeof _value == "number") {
        dom.value.textContent = String(_value);
      } else {
        let resolved = this.resolvedValue;
        dom.value.textContent = String(Math.round(resolved) == resolved ? resolved : resolved.toFixed(3));
      }
    }
  };
  function findLinks(node4) {
    var children = [].slice.call(node4.childNodes);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      switch (child.nodeType) {
        case 1:
          if (child.nodeName.toLowerCase() == "a") {
            continue;
          }
          findLinks(child);
          break;
        case 3:
          var result = child.nodeValue.match(RE);
          if (result) {
            var before = child.nodeValue.substring(0, result.index);
            var after = child.nodeValue.substring(result.index + result[0].length);
            var link = document.createElement("a");
            link.innerHTML = link.href = result[0];
            if (before) {
              node4.insertBefore(document.createTextNode(before), child);
            }
            node4.insertBefore(link, child);
            if (after) {
              child.nodeValue = after;
              i--;
            } else {
              node4.removeChild(child);
            }
          }
          break;
      }
    }
  }
  function generateId() {
    let str = "";
    for (var i = 0; i < 8; i++) {
      let code = Math.floor(Math.random() * 26);
      str += String.fromCharCode("a".charCodeAt(0) + code);
    }
    return str;
  }
  MM.Item = Item;

  // .js/map.js
  var UPDATE_OPTIONS2 = {
    children: true
  };
  var Map2 = class {
    constructor(options) {
      this.node = node2("svg");
      this.position = [0, 0];
      options = Object.assign({
        root: "My Mind Map",
        layout: repo2.get("map")
      }, options);
      let root = new Item();
      root.text = options.root;
      root.layout = options.layout;
      this.root = root;
    }
    static fromJSON(data) {
      return new this().fromJSON(data);
    }
    toJSON() {
      let data = {
        root: this._root.toJSON()
      };
      return data;
    }
    fromJSON(data) {
      this.root = Item.fromJSON(data.root);
      return this;
    }
    get root() {
      return this._root;
    }
    set root(root) {
      const { node: node4 } = this;
      this._root = root;
      node4.innerHTML = "";
      node4.append(root.dom.node);
      root.parent = this;
    }
    mergeWith(data) {
      var ids = [];
      var current2 = MM.App.current;
      var node4 = current2;
      while (node4 != this) {
        ids.push(node4.id);
        node4 = node4.parent;
      }
      this._root.mergeWith(data.root);
      if (current2.map) {
        var node4 = current2.parent;
        var hidden = false;
        while (node4 != this) {
          if (node4.isCollapsed()) {
            hidden = true;
          }
          node4 = node4.parent;
        }
        if (!hidden) {
          return;
        }
      }
      if (MM.App.editing) {
        current2.stopEditing();
      }
      var idMap = {};
      var scan = function(item) {
        idMap[item.id] = item;
        item.children.forEach(scan);
      };
      scan(this._root);
      while (ids.length) {
        var id = ids.shift();
        if (id in idMap) {
          MM.App.select(idMap[id]);
          return;
        }
      }
    }
    get isVisible() {
      return !!this.node.parentNode;
    }
    update(options) {
      options = Object.assign({}, UPDATE_OPTIONS2, options);
      options.children && this._root.update({ parent: false, children: true });
      const { node: node4 } = this;
      const { size } = this._root;
      node4.setAttribute("width", String(size[0]));
      node4.setAttribute("height", String(size[1]));
    }
    show(where) {
      where.append(this.node);
      this.update();
      this.center();
      MM.App.select(this._root);
    }
    hide() {
      this.node.remove();
    }
    center() {
      let { size } = this._root;
      const port2 = MM.App.portSize;
      let position = [
        (port2[0] - size[0]) / 2,
        (port2[1] - size[1]) / 2
      ].map(Math.round);
      this.moveTo(position);
    }
    moveBy(diff) {
      let position = this.position.map((p, i) => p + diff[i]);
      return this.moveTo(position);
    }
    getClosestItem(point) {
      let all = [];
      function scan(item) {
        let rect = item.dom.content.getBoundingClientRect();
        let dx = rect.left + rect.width / 2 - point[0];
        let dy = rect.top + rect.height / 2 - point[1];
        let distance = dx * dx + dy * dy;
        all.push({ dx, dy, item, distance });
        if (!item.isCollapsed()) {
          item.children.forEach(scan);
        }
      }
      scan(this._root);
      all.sort((a, b) => a.distance - b.distance);
      return all[0];
    }
    getItemFor(node4) {
      let content = node4.closest(".content");
      if (!content) {
        return null;
      }
      function scanForContent(item) {
        if (item.dom.content == content) {
          return item;
        }
        for (let child of item.children) {
          let found = scanForContent(child);
          if (found) {
            return found;
          }
        }
        return null;
      }
      return scanForContent(this._root);
    }
    ensureItemVisibility(item) {
      const padding = 10;
      let itemRect = item.dom.content.getBoundingClientRect();
      var parentRect = this.node.parentNode.getBoundingClientRect();
      var delta = [0, 0];
      var dx = parentRect.left - itemRect.left + padding;
      if (dx > 0) {
        delta[0] = dx;
      }
      var dx = parentRect.right - itemRect.right - padding;
      if (dx < 0) {
        delta[0] = dx;
      }
      var dy = parentRect.top - itemRect.top + padding;
      if (dy > 0) {
        delta[1] = dy;
      }
      var dy = parentRect.bottom - itemRect.bottom - padding;
      if (dy < 0) {
        delta[1] = dy;
      }
      if (delta[0] || delta[1]) {
        this.moveBy(delta);
      }
    }
    get name() {
      let name = this._root.text;
      return MM.Format.br2nl(name).replace(/\n/g, " ").replace(/<.*?>/g, "").trim();
    }
    get id() {
      return this._root.id;
    }
    pick(item, direction) {
      var candidates = [];
      var currentRect = item.dom.content.getBoundingClientRect();
      this._getPickCandidates(currentRect, this._root, direction, candidates);
      if (!candidates.length) {
        return item;
      }
      candidates.sort((a, b) => a.dist - b.dist);
      return candidates[0].item;
    }
    _getPickCandidates(currentRect, item, direction, candidates) {
      if (!item.isCollapsed()) {
        item.children.forEach(function(child) {
          this._getPickCandidates(currentRect, child, direction, candidates);
        }, this);
      }
      var node4 = item.dom.content;
      var rect = node4.getBoundingClientRect();
      if (direction == "left" || direction == "right") {
        var x1 = currentRect.left + currentRect.width / 2;
        var x2 = rect.left + rect.width / 2;
        if (direction == "left" && x2 > x1) {
          return;
        }
        if (direction == "right" && x2 < x1) {
          return;
        }
        var diff1 = currentRect.top - rect.bottom;
        var diff2 = rect.top - currentRect.bottom;
        var dist = Math.abs(x2 - x1);
      } else {
        var y1 = currentRect.top + currentRect.height / 2;
        var y2 = rect.top + rect.height / 2;
        if (direction == "top" && y2 > y1) {
          return;
        }
        if (direction == "bottom" && y2 < y1) {
          return;
        }
        var diff1 = currentRect.left - rect.right;
        var diff2 = rect.left - currentRect.right;
        var dist = Math.abs(y2 - y1);
      }
      var diff = Math.max(diff1, diff2);
      if (diff > 0) {
        return;
      }
      if (!dist || dist < diff) {
        return;
      }
      candidates.push({ item, dist });
    }
    moveTo(point) {
      this.position = point;
      this.node.style.left = `${point[0]}px`;
      this.node.style.top = `${point[1]}px`;
    }
  };

  // .js/clipboard.js
  MM.Clipboard = {
    _item: null,
    _mode: "",
    _delay: 50,
    _node: document.createElement("textarea")
  };
  MM.Clipboard.init = function() {
    this._node.style.position = "absolute";
    this._node.style.width = 0;
    this._node.style.height = 0;
    this._node.style.left = "-100px";
    this._node.style.top = "-100px";
    document.body.appendChild(this._node);
  };
  MM.Clipboard.focus = function() {
    this._node.focus();
    this._empty();
  };
  MM.Clipboard.copy = function(sourceItem) {
    this._endCut();
    this._item = sourceItem.clone();
    this._mode = "copy";
    this._expose();
  };
  MM.Clipboard.paste = function(targetItem) {
    setTimeout(function() {
      var pasted = this._node.value;
      this._empty();
      if (!pasted) {
        return;
      }
      if (this._item && pasted == MM.Format.Plaintext.to(this._item.toJSON())) {
        this._pasteItem(this._item, targetItem);
      } else {
        this._pastePlaintext(pasted, targetItem);
      }
    }.bind(this), this._delay);
  };
  MM.Clipboard._pasteItem = function(sourceItem, targetItem) {
    switch (this._mode) {
      case "cut":
        if (sourceItem == targetItem || sourceItem.parent == targetItem) {
          this._endCut();
          return;
        }
        var item = targetItem;
        while (!item.isRoot) {
          if (item == sourceItem) {
            return;
          }
          item = item.parent;
        }
        var action = new MM.Action.MoveItem(sourceItem, targetItem);
        MM.App.action(action);
        this._endCut();
        break;
      case "copy":
        var action = new MM.Action.AppendItem(targetItem, sourceItem.clone());
        MM.App.action(action);
        break;
    }
  };
  MM.Clipboard._pastePlaintext = function(plaintext, targetItem) {
    if (this._mode == "cut") {
      this._endCut();
    }
    var json = MM.Format.Plaintext.from(plaintext);
    var map = Map2.fromJSON(json);
    var root = map.root;
    if (root.text) {
      var action = new MM.Action.AppendItem(targetItem, root);
      MM.App.action(action);
    } else {
      var actions = root.children.map(function(item) {
        return new MM.Action.AppendItem(targetItem, item);
      });
      var action = new MM.Action.Multi(actions);
      MM.App.action(action);
    }
  };
  MM.Clipboard.cut = function(sourceItem) {
    this._endCut();
    this._item = sourceItem;
    this._item.dom.node.classList.add("cut");
    this._mode = "cut";
    this._expose();
  };
  MM.Clipboard._expose = function() {
    var json = this._item.toJSON();
    var plaintext = MM.Format.Plaintext.to(json);
    this._node.value = plaintext;
    this._node.selectionStart = 0;
    this._node.selectionEnd = this._node.value.length;
    setTimeout(this._empty.bind(this), this._delay);
  };
  MM.Clipboard._empty = function() {
    this._node.value = "\n";
    this._node.selectionStart = 0;
    this._node.selectionEnd = this._node.value.length;
  };
  MM.Clipboard._endCut = function() {
    if (this._mode != "cut") {
      return;
    }
    this._item.dom.node.classList.remove("cut");
    this._item = null;
    this._mode = "";
  };

  // .js/menu.js
  MM.Menu = {
    _dom: {},
    _port: null,
    open: function(x, y) {
      this._dom.node.style.display = "";
      var w = this._dom.node.offsetWidth;
      var h = this._dom.node.offsetHeight;
      var left = x;
      var top = y;
      if (left > this._port.offsetWidth / 2) {
        left -= w;
      }
      if (top > this._port.offsetHeight / 2) {
        top -= h;
      }
      this._dom.node.style.left = left + "px";
      this._dom.node.style.top = top + "px";
    },
    close: function() {
      this._dom.node.style.display = "none";
    },
    handleEvent: function(e) {
      if (e.currentTarget != this._dom.node) {
        this.close();
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      var command = e.target.getAttribute("data-command");
      if (!command) {
        return;
      }
      command = MM.Command[command];
      if (!command.isValid()) {
        return;
      }
      command.execute();
      this.close();
    },
    init: function(port2) {
      this._port = port2;
      this._dom.node = document.querySelector("#menu");
      var buttons = this._dom.node.querySelectorAll("[data-command]");
      [].slice.call(buttons).forEach(function(button) {
        button.innerHTML = MM.Command[button.getAttribute("data-command")].label;
      });
      this._port.addEventListener("mousedown", this);
      this._dom.node.addEventListener("mousedown", this);
      this.close();
    }
  };

  // .js/command/command.js
  var PAN_AMOUNT = 15;
  function isMac() {
    return !!navigator.platform.match(/mac/i);
  }
  MM.Command = Object.create(MM.Repo, {
    keys: { value: [] },
    editMode: { value: false },
    prevent: { value: true },
    label: { value: "" }
  });
  MM.Command.isValid = function() {
    return this.editMode === null || this.editMode == MM.App.editing;
  };
  MM.Command.execute = function() {
  };
  MM.Command.Notes = Object.create(MM.Command, {
    label: { value: "Notes" },
    keys: { value: [{ keyCode: "M".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.Notes.isValid = function() {
    return MM.Command.isValid.call(this);
  };
  MM.Command.Notes.execute = function() {
    MM.App.notes.toggle();
  };
  MM.Command.Undo = Object.create(MM.Command, {
    label: { value: "Undo" },
    keys: { value: [{ keyCode: "Z".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.Undo.isValid = function() {
    return MM.Command.isValid.call(this) && !!MM.App.historyIndex;
  };
  MM.Command.Undo.execute = function() {
    MM.App.history[MM.App.historyIndex - 1].undo();
    MM.App.historyIndex--;
  };
  MM.Command.Redo = Object.create(MM.Command, {
    label: { value: "Redo" },
    keys: { value: [{ keyCode: "Y".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.Redo.isValid = function() {
    return MM.Command.isValid.call(this) && MM.App.historyIndex != MM.App.history.length;
  };
  MM.Command.Redo.execute = function() {
    MM.App.history[MM.App.historyIndex].perform();
    MM.App.historyIndex++;
  };
  MM.Command.InsertSibling = Object.create(MM.Command, {
    label: { value: "Insert a sibling" },
    keys: { value: [{ keyCode: 13 }] }
  });
  MM.Command.InsertSibling.execute = function() {
    var item = MM.App.current;
    if (item.isRoot) {
      var action = new MM.Action.InsertNewItem(item, item.children.length);
    } else {
      var parent = item.parent;
      var index = parent.children.indexOf(item);
      var action = new MM.Action.InsertNewItem(parent, index + 1);
    }
    MM.App.action(action);
    MM.Command.Edit.execute();
    publish("command-sibling");
  };
  MM.Command.InsertChild = Object.create(MM.Command, {
    label: { value: "Insert a child" },
    keys: { value: [
      { keyCode: 9, ctrlKey: false },
      { keyCode: 45 }
    ] }
  });
  MM.Command.InsertChild.execute = function() {
    var item = MM.App.current;
    var action = new MM.Action.InsertNewItem(item, item.children.length);
    MM.App.action(action);
    MM.Command.Edit.execute();
    publish("command-child");
  };
  MM.Command.Delete = Object.create(MM.Command, {
    label: { value: "Delete an item" },
    keys: { value: [{ keyCode: isMac() ? 8 : 46 }] }
  });
  MM.Command.Delete.isValid = function() {
    return MM.Command.isValid.call(this) && !MM.App.current.isRoot;
  };
  MM.Command.Delete.execute = function() {
    var action = new MM.Action.RemoveItem(MM.App.current);
    MM.App.action(action);
  };
  MM.Command.Swap = Object.create(MM.Command, {
    label: { value: "Swap sibling" },
    keys: { value: [
      { keyCode: 38, ctrlKey: true },
      { keyCode: 40, ctrlKey: true }
    ] }
  });
  MM.Command.Swap.execute = function(e) {
    var current2 = MM.App.current;
    if (current2.isRoot || current2.parent.children.length < 2) {
      return;
    }
    var diff = e.keyCode == 38 ? -1 : 1;
    var action = new MM.Action.Swap(MM.App.current, diff);
    MM.App.action(action);
  };
  MM.Command.Side = Object.create(MM.Command, {
    label: { value: "Change side" },
    keys: { value: [
      { keyCode: 37, ctrlKey: true },
      { keyCode: 39, ctrlKey: true }
    ] }
  });
  MM.Command.Side.execute = function(e) {
    var current2 = MM.App.current;
    if (current2.isRoot || !current2.parent.isRoot) {
      return;
    }
    var side = e.keyCode == 37 ? "left" : "right";
    var action = new MM.Action.SetSide(MM.App.current, side);
    MM.App.action(action);
  };
  MM.Command.Save = Object.create(MM.Command, {
    label: { value: "Save map" },
    keys: { value: [{ keyCode: "S".charCodeAt(0), ctrlKey: true, shiftKey: false }] }
  });
  MM.Command.Save.execute = function() {
    MM.App.io.quickSave();
  };
  MM.Command.SaveAs = Object.create(MM.Command, {
    label: { value: "Save as&hellip;" },
    keys: { value: [{ keyCode: "S".charCodeAt(0), ctrlKey: true, shiftKey: true }] }
  });
  MM.Command.SaveAs.execute = function() {
    MM.App.io.show("save");
  };
  MM.Command.Load = Object.create(MM.Command, {
    label: { value: "Load map" },
    keys: { value: [{ keyCode: "O".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.Load.execute = function() {
    MM.App.io.show("load");
  };
  MM.Command.Center = Object.create(MM.Command, {
    label: { value: "Center map" },
    keys: { value: [{ keyCode: 35 }] }
  });
  MM.Command.Center.execute = function() {
    MM.App.map.center();
  };
  MM.Command.New = Object.create(MM.Command, {
    label: { value: "New map" },
    keys: { value: [{ keyCode: "N".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.New.execute = function() {
    if (!confirm("Throw away your current map and start a new one?")) {
      return;
    }
    var map = new Map2();
    MM.App.setMap(map);
    publish("map-new", this);
  };
  MM.Command.ZoomIn = Object.create(MM.Command, {
    label: { value: "Zoom in" },
    keys: { value: [{ charCode: "+".charCodeAt(0) }] }
  });
  MM.Command.ZoomIn.execute = function() {
    MM.App.adjustFontSize(1);
  };
  MM.Command.ZoomOut = Object.create(MM.Command, {
    label: { value: "Zoom out" },
    keys: { value: [{ charCode: "-".charCodeAt(0) }] }
  });
  MM.Command.ZoomOut.execute = function() {
    MM.App.adjustFontSize(-1);
  };
  MM.Command.Help = Object.create(MM.Command, {
    label: { value: "Show/hide help" },
    keys: { value: [{ charCode: "?".charCodeAt(0) }] }
  });
  MM.Command.Help.execute = function() {
    MM.App.help.toggle();
  };
  MM.Command.UI = Object.create(MM.Command, {
    label: { value: "Show/hide UI" },
    keys: { value: [{ charCode: "*".charCodeAt(0) }] }
  });
  MM.Command.UI.execute = function() {
    MM.App.ui.toggle();
  };
  MM.Command.Pan = Object.create(MM.Command, {
    label: { value: "Pan the map" },
    keys: { value: [
      { keyCode: "W".charCodeAt(0), ctrlKey: false, altKey: false, metaKey: false },
      { keyCode: "A".charCodeAt(0), ctrlKey: false, altKey: false, metaKey: false },
      { keyCode: "S".charCodeAt(0), ctrlKey: false, altKey: false, metaKey: false },
      { keyCode: "D".charCodeAt(0), ctrlKey: false, altKey: false, metaKey: false }
    ] },
    chars: { value: [] }
  });
  MM.Command.Pan.execute = function(e) {
    var ch = String.fromCharCode(e.keyCode);
    var index = this.chars.indexOf(ch);
    if (index > -1) {
      return;
    }
    if (!this.chars.length) {
      window.addEventListener("keyup", this);
      this.interval = setInterval(this._step.bind(this), 50);
    }
    this.chars.push(ch);
    this._step();
  };
  MM.Command.Pan._step = function() {
    var dirs = {
      "W": [0, 1],
      "A": [1, 0],
      "S": [0, -1],
      "D": [-1, 0]
    };
    let offset = [0, 0];
    this.chars.forEach((ch) => {
      offset[0] += dirs[ch][0] * PAN_AMOUNT;
      offset[1] += dirs[ch][1] * PAN_AMOUNT;
    });
    MM.App.map.moveBy(offset);
  };
  MM.Command.Pan.handleEvent = function(e) {
    var ch = String.fromCharCode(e.keyCode);
    var index = this.chars.indexOf(ch);
    if (index > -1) {
      this.chars.splice(index, 1);
      if (!this.chars.length) {
        window.removeEventListener("keyup", this);
        clearInterval(this.interval);
      }
    }
  };
  MM.Command.Copy = Object.create(MM.Command, {
    label: { value: "Copy" },
    prevent: { value: false },
    keys: { value: [
      { keyCode: "C".charCodeAt(0), ctrlKey: true },
      { keyCode: "C".charCodeAt(0), metaKey: true }
    ] }
  });
  MM.Command.Copy.execute = function() {
    MM.Clipboard.copy(MM.App.current);
  };
  MM.Command.Cut = Object.create(MM.Command, {
    label: { value: "Cut" },
    prevent: { value: false },
    keys: { value: [
      { keyCode: "X".charCodeAt(0), ctrlKey: true },
      { keyCode: "X".charCodeAt(0), metaKey: true }
    ] }
  });
  MM.Command.Cut.execute = function() {
    MM.Clipboard.cut(MM.App.current);
  };
  MM.Command.Paste = Object.create(MM.Command, {
    label: { value: "Paste" },
    prevent: { value: false },
    keys: { value: [
      { keyCode: "V".charCodeAt(0), ctrlKey: true },
      { keyCode: "V".charCodeAt(0), metaKey: true }
    ] }
  });
  MM.Command.Paste.execute = function() {
    MM.Clipboard.paste(MM.App.current);
  };
  MM.Command.Fold = Object.create(MM.Command, {
    label: { value: "Fold/Unfold" },
    keys: { value: [{ charCode: "f".charCodeAt(0), ctrlKey: false }] }
  });
  MM.Command.Fold.execute = function() {
    var item = MM.App.current;
    if (item.isCollapsed()) {
      item.expand();
    } else {
      item.collapse();
    }
    MM.App.map.ensureItemVisibility(item);
  };

  // .js/command/command.edit.js
  MM.Command.Edit = Object.create(MM.Command, {
    label: { value: "Edit item" },
    keys: { value: [
      { keyCode: 32 },
      { keyCode: 113 }
    ] }
  });
  MM.Command.Edit.execute = function() {
    MM.App.current.startEditing();
    MM.App.editing = true;
  };
  MM.Command.Finish = Object.create(MM.Command, {
    keys: { value: [{ keyCode: 13, altKey: false, ctrlKey: false, shiftKey: false }] },
    editMode: { value: true }
  });
  MM.Command.Finish.execute = function() {
    MM.App.editing = false;
    var text = MM.App.current.stopEditing();
    if (text) {
      var action = new MM.Action.SetText(MM.App.current, text);
    } else {
      var action = new MM.Action.RemoveItem(MM.App.current);
    }
    MM.App.action(action);
  };
  MM.Command.Newline = Object.create(MM.Command, {
    label: { value: "Line break" },
    keys: { value: [
      { keyCode: 13, shiftKey: true },
      { keyCode: 13, ctrlKey: true }
    ] },
    editMode: { value: true }
  });
  MM.Command.Newline.execute = function() {
    var range = getSelection().getRangeAt(0);
    var br = document.createElement("br");
    range.insertNode(br);
    range.setStartAfter(br);
    MM.App.current.update({ parent: true, children: true });
  };
  MM.Command.Cancel = Object.create(MM.Command, {
    editMode: { value: true },
    keys: { value: [{ keyCode: 27 }] }
  });
  MM.Command.Cancel.execute = function() {
    MM.App.editing = false;
    MM.App.current.stopEditing();
    var oldText = MM.App.current.text;
    if (!oldText) {
      var action = new MM.Action.RemoveItem(MM.App.current);
      MM.App.action(action);
    }
  };
  MM.Command.Style = Object.create(MM.Command, {
    editMode: { value: null },
    command: { value: "" }
  });
  MM.Command.Style.execute = function() {
    if (MM.App.editing) {
      document.execCommand(this.command, null, null);
    } else {
      MM.Command.Edit.execute();
      var selection = getSelection();
      var range = selection.getRangeAt(0);
      range.selectNodeContents(MM.App.current.dom.text);
      selection.removeAllRanges();
      selection.addRange(range);
      this.execute();
      MM.Command.Finish.execute();
    }
  };
  MM.Command.Bold = Object.create(MM.Command.Style, {
    command: { value: "bold" },
    label: { value: "Bold" },
    keys: { value: [{ keyCode: "B".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.Underline = Object.create(MM.Command.Style, {
    command: { value: "underline" },
    label: { value: "Underline" },
    keys: { value: [{ keyCode: "U".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.Italic = Object.create(MM.Command.Style, {
    command: { value: "italic" },
    label: { value: "Italic" },
    keys: { value: [{ keyCode: "I".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.Strikethrough = Object.create(MM.Command.Style, {
    command: { value: "strikeThrough" },
    label: { value: "Strike-through" },
    keys: { value: [{ keyCode: "S".charCodeAt(0), ctrlKey: true }] }
  });
  MM.Command.Value = Object.create(MM.Command, {
    label: { value: "Set value" },
    keys: { value: [{ charCode: "v".charCodeAt(0), ctrlKey: false, metaKey: false }] }
  });
  MM.Command.Value.execute = function() {
    var item = MM.App.current;
    var oldValue = item.value;
    var newValue = prompt("Set item value", oldValue);
    if (newValue == null) {
      return;
    }
    if (!newValue.length) {
      newValue = null;
    }
    var numValue = parseFloat(newValue);
    var action = new MM.Action.SetValue(item, isNaN(numValue) ? newValue : numValue);
    MM.App.action(action);
  };
  MM.Command.Yes = Object.create(MM.Command, {
    label: { value: "Yes" },
    keys: { value: [{ charCode: "y".charCodeAt(0), ctrlKey: false }] }
  });
  MM.Command.Yes.execute = function() {
    var item = MM.App.current;
    var status = item.status === true ? null : true;
    var action = new MM.Action.SetStatus(item, status);
    MM.App.action(action);
  };
  MM.Command.No = Object.create(MM.Command, {
    label: { value: "No" },
    keys: { value: [{ charCode: "n".charCodeAt(0), ctrlKey: false }] }
  });
  MM.Command.No.execute = function() {
    var item = MM.App.current;
    var status = item.status === false ? null : false;
    var action = new MM.Action.SetStatus(item, status);
    MM.App.action(action);
  };
  MM.Command.Computed = Object.create(MM.Command, {
    label: { value: "Computed" },
    keys: { value: [{ charCode: "c".charCodeAt(0), ctrlKey: false, metaKey: false }] }
  });
  MM.Command.Computed.execute = function() {
    var item = MM.App.current;
    var status = item.status == "computed" ? null : "computed";
    var action = new MM.Action.SetStatus(item, status);
    MM.App.action(action);
  };

  // .js/command/command.select.js
  MM.Command.Select = Object.create(MM.Command, {
    label: { value: "Move selection" },
    keys: { value: [
      { keyCode: 38, ctrlKey: false },
      { keyCode: 37, ctrlKey: false },
      { keyCode: 40, ctrlKey: false },
      { keyCode: 39, ctrlKey: false }
    ] }
  });
  MM.Command.Select.execute = function(e) {
    var dirs = {
      37: "left",
      38: "top",
      39: "right",
      40: "bottom"
    };
    var dir = dirs[e.keyCode];
    var layout = MM.App.current.resolvedLayout;
    var item = layout.pick(MM.App.current, dir);
    MM.App.select(item);
  };
  MM.Command.SelectRoot = Object.create(MM.Command, {
    label: { value: "Select root" },
    keys: { value: [{ keyCode: 36 }] }
  });
  MM.Command.SelectRoot.execute = function() {
    var item = MM.App.current;
    while (!item.isRoot) {
      item = item.parent;
    }
    MM.App.select(item);
  };
  if (!isMac()) {
    MM.Command.SelectParent = Object.create(MM.Command, {
      label: { value: "Select parent" },
      keys: { value: [{ keyCode: 8 }] }
    });
    MM.Command.SelectParent.execute = function() {
      if (MM.App.current.isRoot) {
        return;
      }
      MM.App.select(MM.App.current.parent);
    };
  }

  // .js/format/format.js
  MM.Format = Object.create(MM.Repo, {
    extension: { value: "" },
    mime: { value: "" }
  });
  MM.Format.getByName = function(name) {
    var index = name.lastIndexOf(".");
    if (index == -1) {
      return null;
    }
    var extension = name.substring(index + 1).toLowerCase();
    return this.getByProperty("extension", extension);
  };
  MM.Format.getByMime = function(mime) {
    return this.getByProperty("mime", mime);
  };
  MM.Format.to = function(data) {
  };
  MM.Format.from = function(data) {
  };
  MM.Format.nl2br = function(str) {
    return str.replace(/\n/g, "<br/>");
  };
  MM.Format.br2nl = function(str) {
    return str.replace(/<br\s*\/?>/g, "\n");
  };

  // .js/format/format.json.js
  MM.Format.JSON = Object.create(MM.Format, {
    id: { value: "json" },
    label: { value: "Native (JSON)" },
    extension: { value: "mymind" },
    mime: { value: "application/vnd.mymind+json" }
  });
  MM.Format.JSON.to = function(data) {
    return JSON.stringify(data, null, "	") + "\n";
  };
  MM.Format.JSON.from = function(data) {
    return JSON.parse(data);
  };

  // .js/format/format.freemind.js
  MM.Format.FreeMind = Object.create(MM.Format, {
    id: { value: "freemind" },
    label: { value: "FreeMind" },
    extension: { value: "mm" },
    mime: { value: "application/x-freemind" }
  });
  MM.Format.FreeMind.to = function(data) {
    var doc = document.implementation.createDocument(null, null, null);
    var map = doc.createElement("map");
    map.setAttribute("version", "1.0.1");
    map.appendChild(this._serializeItem(doc, data.root));
    doc.appendChild(map);
    var serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  };
  MM.Format.FreeMind.from = function(data) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(data, "application/xml");
    if (doc.documentElement.nodeName.toLowerCase() == "parsererror") {
      throw new Error(doc.documentElement.textContent);
    }
    var root = doc.documentElement.getElementsByTagName("node")[0];
    if (!root) {
      throw new Error("No root node found");
    }
    var json = {
      root: this._parseNode(root, { shape: "underline" })
    };
    json.root.layout = "map";
    json.root.shape = "ellipse";
    return json;
  };
  MM.Format.FreeMind._serializeItem = function(doc, json) {
    var elm = this._serializeAttributes(doc, json);
    (json.children || []).forEach(function(child) {
      elm.appendChild(this._serializeItem(doc, child));
    }, this);
    return elm;
  };
  MM.Format.FreeMind._serializeAttributes = function(doc, json) {
    var elm = doc.createElement("node");
    elm.setAttribute("TEXT", MM.Format.br2nl(json.text));
    elm.setAttribute("ID", json.id);
    if (json.side) {
      elm.setAttribute("POSITION", json.side);
    }
    if (json.shape == "box") {
      elm.setAttribute("STYLE", "bubble");
    }
    if (json.collapsed) {
      elm.setAttribute("FOLDED", "true");
    }
    if (json.notes) {
      var notesElm = doc.createElement("richcontent");
      notesElm.setAttribute("TYPE", "NOTE");
      notesElm.appendChild(doc.createCDATASection("<html><head></head><body>" + json.notes + "</body></html>"));
      elm.appendChild(notesElm);
    }
    return elm;
  };
  MM.Format.FreeMind._parseNode = function(node4, parent) {
    var json = this._parseAttributes(node4, parent);
    for (var i = 0; i < node4.childNodes.length; i++) {
      var child = node4.childNodes[i];
      if (child.nodeName.toLowerCase() == "node") {
        json.children.push(this._parseNode(child, json));
      }
    }
    return json;
  };
  MM.Format.FreeMind._parseAttributes = function(node4, parent) {
    var json = {
      children: [],
      text: MM.Format.nl2br(node4.getAttribute("TEXT") || ""),
      id: node4.getAttribute("ID")
    };
    var position = node4.getAttribute("POSITION");
    if (position) {
      json.side = position;
    }
    var style = node4.getAttribute("STYLE");
    if (style == "bubble") {
      json.shape = "box";
    } else {
      json.shape = parent.shape;
    }
    if (node4.getAttribute("FOLDED") == "true") {
      json.collapsed = 1;
    }
    var children = node4.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      switch (child.nodeName.toLowerCase()) {
        case "richcontent":
          if (child.getAttribute("TYPE") == "NOTE") {
            var body = child.querySelector("body > *");
            if (body) {
              var serializer = new XMLSerializer();
              json.notes = serializer.serializeToString(body).trim();
            }
          }
          break;
        case "font":
          if (child.getAttribute("ITALIC") == "true") {
            json.text = "<i>" + json.text + "</i>";
          }
          if (child.getAttribute("BOLD") == "true") {
            json.text = "<b>" + json.text + "</b>";
          }
          break;
      }
    }
    return json;
  };

  // .js/format/format.mma.js
  MM.Format.MMA = Object.create(MM.Format.FreeMind, {
    id: { value: "mma" },
    label: { value: "Mind Map Architect" },
    extension: { value: "mma" }
  });
  MM.Format.MMA._parseAttributes = function(node4, parent) {
    var json = {
      children: [],
      text: MM.Format.nl2br(node4.getAttribute("title") || ""),
      shape: "box"
    };
    if (node4.getAttribute("expand") == "false") {
      json.collapsed = 1;
    }
    var direction = node4.getAttribute("direction");
    if (direction == "0") {
      json.side = "left";
    }
    if (direction == "1") {
      json.side = "right";
    }
    var color = node4.getAttribute("color");
    if (color) {
      var re = color.match(/^#(....)(....)(....)$/);
      if (re) {
        var r = parseInt(re[1], 16) >> 8;
        var g = parseInt(re[2], 16) >> 8;
        var b = parseInt(re[3], 16) >> 8;
        r = Math.round(r / 17).toString(16);
        g = Math.round(g / 17).toString(16);
        b = Math.round(b / 17).toString(16);
      }
      json.color = "#" + [r, g, b].join("");
    }
    json.icon = node4.getAttribute("icon");
    return json;
  };
  MM.Format.MMA._serializeAttributes = function(doc, json) {
    var elm = doc.createElement("node");
    elm.setAttribute("title", MM.Format.br2nl(json.text));
    elm.setAttribute("expand", json.collapsed ? "false" : "true");
    if (json.side) {
      elm.setAttribute("direction", json.side == "left" ? "0" : "1");
    }
    if (json.color) {
      var parts = json.color.match(/^#(.)(.)(.)$/);
      var r = new Array(5).join(parts[1]);
      var g = new Array(5).join(parts[2]);
      var b = new Array(5).join(parts[3]);
      elm.setAttribute("color", "#" + [r, g, b].join(""));
    }
    if (json.icon) {
      elm.setAttribute("icon", json.icon);
    }
    return elm;
  };

  // .js/format/format.mup.js
  MM.Format.Mup = Object.create(MM.Format, {
    id: { value: "mup" },
    label: { value: "MindMup" },
    extension: { value: "mup" }
  });
  MM.Format.Mup.to = function(data) {
    var root = this._MMtoMup(data.root);
    return JSON.stringify(root, null, 2);
  };
  MM.Format.Mup.from = function(data) {
    var source = JSON.parse(data);
    var root = this._MupToMM(source);
    root.layout = "map";
    var map = {
      root
    };
    return map;
  };
  MM.Format.Mup._MupToMM = function(item) {
    var json = {
      text: MM.Format.nl2br(item.title),
      id: item.id,
      shape: "box",
      icon: item.icon
    };
    if (item.attr && item.attr.style && item.attr.style.background) {
      json.color = item.attr.style.background;
    }
    if (item.attr && item.attr.collapsed) {
      json.collapsed = 1;
    }
    if (item.ideas) {
      var data = [];
      for (var key in item.ideas) {
        var child = this._MupToMM(item.ideas[key]);
        var num = parseFloat(key);
        child.side = num < 0 ? "left" : "right";
        data.push({
          child,
          num
        });
      }
      data.sort(function(a, b) {
        return a.num - b.num;
      });
      json.children = data.map(function(item2) {
        return item2.child;
      });
    }
    return json;
  };
  MM.Format.Mup._MMtoMup = function(item, side) {
    var result = {
      id: item.id,
      title: MM.Format.br2nl(item.text),
      icon: item.icon,
      attr: {}
    };
    if (item.color) {
      result.attr.style = { background: item.color };
    }
    if (item.collapsed) {
      result.attr.collapsed = true;
    }
    if (item.children) {
      result.ideas = {};
      for (var i = 0; i < item.children.length; i++) {
        var child = item.children[i];
        var childSide = side || child.side;
        var key = i + 1;
        if (childSide == "left") {
          key *= -1;
        }
        result.ideas[key] = this._MMtoMup(child, childSide);
      }
    }
    return result;
  };

  // .js/format/format.plaintext.js
  MM.Format.Plaintext = Object.create(MM.Format, {
    id: { value: "plaintext" },
    label: { value: "Plain text" },
    extension: { value: "txt" },
    mime: { value: "application/vnd.mymind+txt" }
  });
  MM.Format.Plaintext.to = function(data) {
    return this._serializeItem(data.root || data);
  };
  MM.Format.Plaintext.from = function(data) {
    var lines = data.split("\n").filter(function(line) {
      return line.match(/\S/);
    });
    var items = this._parseItems(lines);
    if (items.length == 1) {
      var result = {
        root: items[0]
      };
    } else {
      var result = {
        root: {
          text: "",
          children: items
        }
      };
    }
    result.root.layout = "map";
    return result;
  };
  MM.Format.Plaintext._serializeItem = function(item, depth) {
    depth = depth || 0;
    var lines = (item.children || []).map(function(child) {
      return this._serializeItem(child, depth + 1);
    }, this);
    var prefix = new Array(depth + 1).join("	");
    lines.unshift(prefix + item.text.replace(/\n/g, ""));
    return lines.join("\n") + (depth ? "" : "\n");
  };
  MM.Format.Plaintext._parseItems = function(lines) {
    var items = [];
    if (!lines.length) {
      return items;
    }
    var firstPrefix = this._parsePrefix(lines[0]);
    var currentItem = null;
    var childLines = [];
    var convertChildLinesToChildren = function() {
      if (!currentItem || !childLines.length) {
        return;
      }
      var children = this._parseItems(childLines);
      if (children.length) {
        currentItem.children = children;
      }
      childLines = [];
    };
    lines.forEach(function(line, index) {
      if (this._parsePrefix(line) == firstPrefix) {
        convertChildLinesToChildren.call(this);
        currentItem = { text: line.match(/^\s*(.*)/)[1] };
        items.push(currentItem);
      } else {
        childLines.push(line);
      }
    }, this);
    convertChildLinesToChildren.call(this);
    return items;
  };
  MM.Format.Plaintext._parsePrefix = function(line) {
    return line.match(/^\s*/)[0];
  };

  // .js/backend/backend.js
  MM.Backend = Object.create(MM.Repo);
  MM.Backend.reset = function() {
  };
  MM.Backend.save = function(data, name) {
  };
  MM.Backend.load = function(name) {
  };

  // .js/backend/backend.local.js
  MM.Backend.Local = Object.create(MM.Backend, {
    label: { value: "Browser storage" },
    id: { value: "local" },
    prefix: { value: "mm.map." }
  });
  MM.Backend.Local.save = function(data, id, name) {
    localStorage.setItem(this.prefix + id, data);
    var names = this.list();
    names[id] = name;
    localStorage.setItem(this.prefix + "names", JSON.stringify(names));
  };
  MM.Backend.Local.load = function(id) {
    var data = localStorage.getItem(this.prefix + id);
    if (!data) {
      throw new Error("There is no such saved map");
    }
    return data;
  };
  MM.Backend.Local.remove = function(id) {
    localStorage.removeItem(this.prefix + id);
    var names = this.list();
    delete names[id];
    localStorage.setItem(this.prefix + "names", JSON.stringify(names));
  };
  MM.Backend.Local.list = function() {
    try {
      var data = localStorage.getItem(this.prefix + "names") || "{}";
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  };

  // .js/backend/backend.webdav.js
  MM.Backend.WebDAV = Object.create(MM.Backend, {
    id: { value: "webdav" },
    label: { value: "Generic WebDAV" }
  });
  MM.Backend.WebDAV.save = function(data, url) {
    return this._request("PUT", url, data);
  };
  MM.Backend.WebDAV.load = function(url) {
    return this._request("GET", url);
  };
  MM.Backend.WebDAV._request = async function(method, url, data) {
    let init3 = {
      method,
      credentials: "include"
    };
    if (data) {
      init3.body = data;
    }
    let response = await fetch(url, init3);
    let text = await response.text();
    if (response.status == 200) {
      return text;
    } else {
      throw new Error("HTTP/" + response.status + "\n\n" + text);
    }
  };

  // .js/backend/backend.image.js
  MM.Backend.Image = Object.create(MM.Backend, {
    id: { value: "image" },
    label: { value: "Image" },
    url: { value: "", writable: true }
  });
  MM.Backend.Image.save = function() {
    let serializer = new XMLSerializer();
    let xml = serializer.serializeToString(MM.App.map.node);
    let base64 = btoa(xml);
    let img = new Image();
    img.src = `data:image/svg+xml;base64,${base64}`;
    window.img = img;
    img.onload = () => {
      let canvas = document.createElement("canvas");
      window.canvas = canvas;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        let link = document.createElement("a");
        link.download = MM.App.map.name;
        link.href = URL.createObjectURL(blob);
        link.click();
      }, "image/png");
    };
  };

  // .js/backend/backend.file.js
  MM.Backend.File = Object.create(MM.Backend, {
    id: { value: "file" },
    label: { value: "File" },
    input: { value: document.createElement("input") }
  });
  MM.Backend.File.save = function(data, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    var promise = new Promise().fulfill();
    return promise;
  };
  MM.Backend.File.load = function() {
    var promise = new Promise();
    this.input.type = "file";
    this.input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function() {
        promise.fulfill({ data: reader.result, name: file.name });
      };
      reader.onerror = function() {
        promise.reject(reader.error);
      };
      reader.readAsText(file);
    }.bind(this);
    this.input.click();
    return promise;
  };

  // .js/backend/backend.firebase.js
  MM.Backend.Firebase = Object.create(MM.Backend, {
    label: { value: "Firebase" },
    id: { value: "firebase" },
    ref: { value: null, writable: true },
    _current: { value: {
      id: null,
      name: null,
      data: null
    } }
  });
  MM.Backend.Firebase.connect = function(server, auth) {
    var config = {
      apiKey: "AIzaSyBO_6uCK8pHjoz1c9htVwZi6Skpm8o4LtQ",
      authDomain: "my-mind.firebaseapp.com",
      databaseURL: "https://" + server + ".firebaseio.com",
      projectId: "firebase-my-mind",
      storageBucket: "firebase-my-mind.appspot.com",
      messagingSenderId: "666556281676"
    };
    firebase.initializeApp(config);
    this.ref = firebase.database().ref();
    this.ref.child("names").on("value", function(snap) {
      publish("firebase-list", this, snap.val() || {});
    }, this);
    if (auth) {
      return this._login(auth);
    } else {
      return new Promise().fulfill();
    }
  };
  MM.Backend.Firebase.save = function(data, id, name) {
    var promise = new Promise();
    try {
      this.ref.child("names/" + id).set(name);
      this.ref.child("data/" + id).set(data, function(result) {
        if (result) {
          promise.reject(result);
        } else {
          promise.fulfill();
          this._listenStart(data, id);
        }
      }.bind(this));
    } catch (e) {
      promise.reject(e);
    }
    return promise;
  };
  MM.Backend.Firebase.load = function(id) {
    var promise = new Promise();
    this.ref.child("data/" + id).once("value", function(snap) {
      var data = snap.val();
      if (data) {
        promise.fulfill(data);
        this._listenStart(data, id);
      } else {
        promise.reject(new Error("There is no such saved map"));
      }
    }, this);
    return promise;
  };
  MM.Backend.Firebase.remove = function(id) {
    var promise = new Promise();
    try {
      this.ref.child("names/" + id).remove();
      this.ref.child("data/" + id).remove(function(result) {
        if (result) {
          promise.reject(result);
        } else {
          promise.fulfill();
        }
      });
    } catch (e) {
      promise.reject(e);
    }
    return promise;
  };
  MM.Backend.Firebase.reset = function() {
    this._listenStop();
  };
  MM.Backend.Firebase.mergeWith = function(data, name) {
    var id = this._current.id;
    if (name != this._current.name) {
      this._current.name = name;
      this.ref.child("names/" + id).set(name);
    }
    var dataRef = this.ref.child("data/" + id);
    var oldData = this._current.data;
    this._listenStop();
    this._recursiveRefMerge(dataRef, oldData, data);
    this._listenStart(data, id);
  };
  MM.Backend.Firebase._recursiveRefMerge = function(ref, oldData, newData) {
    var updateObject = {};
    if (newData instanceof Array) {
      for (var i = 0; i < newData.length; i++) {
        var newValue = newData[i];
        if (!(i in oldData)) {
          updateObject[i] = newValue;
        } else if (typeof newValue == "object") {
          this._recursiveRefMerge(ref.child(i), oldData[i], newValue);
        } else if (newValue !== oldData[i]) {
          updateObject[i] = newValue;
        }
      }
      for (var i = newData.length; i < oldData.length; i++) {
        updateObject[i] = null;
      }
    } else {
      for (var p in newData) {
        var newValue = newData[p];
        if (!(p in oldData)) {
          updateObject[p] = newValue;
        } else if (typeof newValue == "object") {
          this._recursiveRefMerge(ref.child(p), oldData[p], newValue);
        } else if (newValue !== oldData[p]) {
          updateObject[p] = newValue;
        }
      }
      for (var p in oldData) {
        if (!(p in newData)) {
          updateObject[p] = null;
        }
      }
    }
    if (Object.keys(updateObject).length) {
      ref.update(updateObject);
    }
  };
  MM.Backend.Firebase._listenStart = function(data, id) {
    if (this._current.id && this._current.id == id) {
      return;
    }
    this._listenStop();
    this._current.id = id;
    this._current.data = data;
    this.ref.child("data/" + id).on("value", this._valueChange, this);
  };
  MM.Backend.Firebase._listenStop = function() {
    if (!this._current.id) {
      return;
    }
    this.ref.child("data/" + this._current.id).off("value");
    this._current.id = null;
    this._current.name = null;
    this._current.data = null;
  };
  MM.Backend.Firebase._valueChange = function(snap) {
    this._current.data = snap.val();
    if (this._changeTimeout) {
      clearTimeout(this._changeTimeout);
    }
    this._changeTimeout = setTimeout(function() {
      publish("firebase-change", this, this._current.data);
    }.bind(this), 200);
  };
  MM.Backend.Firebase._login = function(type) {
    var provider;
    switch (type) {
      case "github":
        provider = new firebase.auth.GithubAuthProvider();
        break;
      case "facebook":
        provider = new firebase.auth.FacebookAuthProvider();
        break;
      case "twitter":
        provider = new firebase.auth.TwitterAuthProvider();
        break;
      case "google":
        provider = new firebase.auth.GoogleAuthProvider();
        break;
    }
    return firebase.auth().signInWithPopup(provider).then(function(result) {
      return result.user;
    });
  };

  // .js/backend/backend.gdrive.js
  MM.Backend.GDrive = Object.create(MM.Backend, {
    id: { value: "gdrive" },
    label: { value: "Google Drive" },
    scope: { value: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install" },
    clientId: { value: "767837575056-h87qmlhmhb3djhaaqta5gv2v3koa9hii.apps.googleusercontent.com" },
    apiKey: { value: "AIzaSyCzu1qVxlgufneOYpBgDJXN6Z9SNVcHYWM" },
    fileId: { value: null, writable: true }
  });
  MM.Backend.GDrive.reset = function() {
    this.fileId = null;
  };
  MM.Backend.GDrive.save = function(data, name, mime) {
    return this._connect().then(function() {
      return this._send(data, name, mime);
    }.bind(this));
  };
  MM.Backend.GDrive._send = function(data, name, mime) {
    var promise = new Promise();
    var path = "/upload/drive/v2/files";
    var method = "POST";
    if (this.fileId) {
      path += "/" + this.fileId;
      method = "PUT";
    }
    var boundary = "b" + Math.random();
    var delimiter = "--" + boundary;
    var body = [
      delimiter,
      "Content-Type: application/json",
      "",
      JSON.stringify({ title: name }),
      delimiter,
      "Content-Type: " + mime,
      "",
      data,
      delimiter + "--"
    ].join("\r\n");
    var request = gapi.client.request({
      path,
      method,
      headers: {
        "Content-Type": "multipart/mixed; boundary='" + boundary + "'"
      },
      body
    });
    request.execute(function(response) {
      if (!response) {
        promise.reject(new Error("Failed to upload to Google Drive"));
      } else if (response.error) {
        promise.reject(response.error);
      } else {
        this.fileId = response.id;
        promise.fulfill();
      }
    }.bind(this));
    return promise;
  };
  MM.Backend.GDrive.load = function(id) {
    return this._connect().then(this._load.bind(this, id));
  };
  MM.Backend.GDrive._load = function(id) {
    this.fileId = id;
    var promise = new Promise();
    var request = gapi.client.request({
      path: "/drive/v2/files/" + this.fileId,
      method: "GET"
    });
    request.execute(function(response) {
      if (response && response.id) {
        var xhr = new XMLHttpRequest();
        xhr.open("get", "https://www.googleapis.com/drive/v2/files/" + response.id + "?alt=media", true);
        xhr.setRequestHeader("Authorization", "Bearer " + gapi.auth.getToken().access_token);
        Promise.send(xhr).then(function(xhr2) {
          promise.fulfill({ data: xhr2.responseText, name: response.title, mime: response.mimeType });
        }, function(xhr2) {
          promise.reject(xhr2.responseText);
        });
      } else {
        promise.reject(response && response.error || new Error("Failed to download file"));
      }
    }.bind(this));
    return promise;
  };
  MM.Backend.GDrive.pick = function() {
    return this._connect().then(this._pick.bind(this));
  };
  MM.Backend.GDrive._pick = function() {
    var promise = new Promise();
    var token = gapi.auth.getToken();
    var formats = MM.Format.getAll();
    var mimeTypes = ["application/json; charset=UTF-8", "application/json"];
    formats.forEach(function(format) {
      if (format.mime) {
        mimeTypes.unshift(format.mime);
      }
    });
    var view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(mimeTypes.join(",")).setMode(google.picker.DocsViewMode.LIST);
    var picker = new google.picker.PickerBuilder().enableFeature(google.picker.Feature.NAV_HIDDEN).addView(view).setOAuthToken(token.access_token).setDeveloperKey(this.apiKey).setCallback(function(data) {
      switch (data[google.picker.Response.ACTION]) {
        case google.picker.Action.PICKED:
          var doc = data[google.picker.Response.DOCUMENTS][0];
          promise.fulfill(doc.id);
          break;
        case google.picker.Action.CANCEL:
          promise.fulfill(null);
          break;
      }
    }).build();
    picker.setVisible(true);
    return promise;
  };
  MM.Backend.GDrive._connect = function() {
    if (window.gapi && window.gapi.auth.getToken()) {
      return new Promise().fulfill();
    } else {
      return this._loadGapi().then(this._auth.bind(this));
    }
  };
  MM.Backend.GDrive._loadGapi = function() {
    var promise = new Promise();
    if (window.gapi) {
      return promise.fulfill();
    }
    var script = document.createElement("script");
    var name = ("cb" + Math.random()).replace(".", "");
    window[name] = promise.fulfill.bind(promise);
    script.src = "https://apis.google.com/js/client:picker.js?onload=" + name;
    document.body.appendChild(script);
    return promise;
  };
  MM.Backend.GDrive._auth = function(forceUI) {
    var promise = new Promise();
    gapi.auth.authorize({
      "client_id": this.clientId,
      "scope": this.scope,
      "immediate": !forceUI
    }, function(token) {
      if (token && !token.error) {
        promise.fulfill();
      } else if (!forceUI) {
        this._auth(true).then(promise.fulfill.bind(promise), promise.reject.bind(promise));
      } else {
        promise.reject(token && token.error || new Error("Failed to authorize with Google"));
      }
    }.bind(this));
    return promise;
  };

  // .js/ui/ui.js
  var node3;
  MM.UI = function() {
    this._node = document.querySelector(".ui");
    node3 = this._node;
    this._toggle = this._node.querySelector("#toggle");
    this._layout = new MM.UI.Layout();
    this._shape = new MM.UI.Shape();
    this._icon = new MM.UI.Icon();
    this._color = new MM.UI.Color();
    this._value = new MM.UI.Value();
    this._status = new MM.UI.Status();
    subscribe("item-select", this);
    subscribe("item-change", this);
    this._node.addEventListener("click", this);
    this._node.addEventListener("change", this);
    this.toggle();
  };
  MM.UI.prototype.handleMessage = function(message, publisher) {
    switch (message) {
      case "item-select":
        this._update();
        break;
      case "item-change":
        if (publisher == MM.App.current) {
          this._update();
        }
        break;
    }
  };
  MM.UI.prototype.handleEvent = function(e) {
    switch (e.type) {
      case "click":
        if (e.target.nodeName.toLowerCase() != "select") {
          MM.Clipboard.focus();
        }
        if (e.target == this._toggle) {
          this.toggle();
          return;
        }
        var node4 = e.target;
        while (node4 != document) {
          var command = node4.getAttribute("data-command");
          if (command) {
            MM.Command[command].execute();
            return;
          }
          node4 = node4.parentNode;
        }
        break;
      case "change":
        MM.Clipboard.focus();
        break;
    }
  };
  MM.UI.prototype.toggle = function() {
    this._node.classList.toggle("visible");
    publish("ui-change", this);
  };
  MM.UI.prototype.getWidth = function() {
    return this._node.classList.contains("visible") ? this._node.offsetWidth : 0;
  };
  MM.UI.prototype._update = function() {
    this._layout.update();
    this._shape.update();
    this._icon.update();
    this._value.update();
    this._status.update();
  };

  // .js/ui/ui.layout.js
  MM.UI.Layout = function() {
    this._select = document.querySelector("#layout");
    let layout = repo2.get("map");
    this._select.append(new Option(layout.label, layout.id));
    var label = this._buildGroup("Graph");
    let graphOptions = ["right", "left", "bottom", "top"].map((name) => {
      let layout2 = repo2.get(`graph-${name}`);
      return new Option(layout2.label, layout2.id);
    });
    label.append(...graphOptions);
    var label = this._buildGroup("Tree");
    let treeOptions = ["right", "left"].map((name) => {
      let layout2 = repo2.get(`tree-${name}`);
      return new Option(layout2.label, layout2.id);
    });
    label.append(...treeOptions);
    this._select.addEventListener("change", this);
  };
  MM.UI.Layout.prototype.update = function() {
    var value = "";
    var layout = MM.App.current.layout;
    if (layout) {
      value = layout.id;
    }
    this._select.value = value;
    this._getOption("").disabled = MM.App.current.isRoot;
    this._getOption("map").disabled = !MM.App.current.isRoot;
  };
  MM.UI.Layout.prototype.handleEvent = function(e) {
    var layout = repo2.get(this._select.value);
    var action = new MM.Action.SetLayout(MM.App.current, layout);
    MM.App.action(action);
  };
  MM.UI.Layout.prototype._getOption = function(value) {
    return this._select.querySelector("option[value='" + value + "']");
  };
  MM.UI.Layout.prototype._buildGroup = function(label) {
    var node4 = document.createElement("optgroup");
    node4.label = label;
    this._select.appendChild(node4);
    return node4;
  };

  // .js/ui/ui.shape.js
  MM.UI.Shape = function() {
    this._select = document.querySelector("#shape");
    repo.forEach((shape) => {
      this._select.append(new Option(shape.label, shape.id));
    });
    this._select.addEventListener("change", this);
  };
  MM.UI.Shape.prototype.update = function() {
    var value = "";
    var shape = MM.App.current.shape;
    if (shape) {
      value = shape.id;
    }
    this._select.value = value;
  };
  MM.UI.Shape.prototype.handleEvent = function(e) {
    var shape = repo.get(this._select.value);
    var action = new MM.Action.SetShape(MM.App.current, shape);
    MM.App.action(action);
  };

  // .js/ui/ui.value.js
  MM.UI.Value = function() {
    this._select = document.querySelector("#value");
    this._select.addEventListener("change", this);
  };
  MM.UI.Value.prototype.update = function() {
    var value = MM.App.current.value;
    if (value === null) {
      value = "";
    }
    if (typeof value == "number") {
      value = "num";
    }
    this._select.value = value;
  };
  MM.UI.Value.prototype.handleEvent = function(e) {
    var value = this._select.value;
    if (value == "num") {
      MM.Command.Value.execute();
    } else {
      var action = new MM.Action.SetValue(MM.App.current, value || null);
      MM.App.action(action);
    }
  };

  // .js/ui/ui.status.js
  var STATUS_MAP = {
    "yes": true,
    "no": false,
    "": null
  };
  function statusToString(status) {
    for (let key in STATUS_MAP) {
      if (STATUS_MAP[key] === status) {
        return key;
      }
    }
    return status;
  }
  function stringToStatus(str) {
    return str in STATUS_MAP ? STATUS_MAP[str] : str;
  }
  MM.UI.Status = function() {
    this._select = document.querySelector("#status");
    this._select.addEventListener("change", this);
  };
  MM.UI.Status.prototype.update = function() {
    this._select.value = statusToString(MM.App.current.status);
  };
  MM.UI.Status.prototype.handleEvent = function(e) {
    let status = stringToStatus(this._select.value);
    var action = new MM.Action.SetStatus(MM.App.current, status);
    MM.App.action(action);
  };

  // .js/ui/ui.color.js
  MM.UI.Color = function() {
    this._node = document.querySelector("#color");
    this._node.addEventListener("click", this);
    var items = this._node.querySelectorAll("[data-color]");
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      item.style.backgroundColor = item.getAttribute("data-color");
    }
  };
  MM.UI.Color.prototype.handleEvent = function(e) {
    e.preventDefault();
    if (!e.target.hasAttribute("data-color")) {
      return;
    }
    var color = e.target.getAttribute("data-color") || null;
    var action = new MM.Action.SetColor(MM.App.current, color);
    MM.App.action(action);
  };

  // .js/ui/ui.icon.js
  MM.UI.Icon = function() {
    this._select = document.querySelector("#icons");
    this._select.addEventListener("change", this);
  };
  MM.UI.Icon.prototype.update = function() {
    this._select.value = MM.App.current.icon || "";
  };
  MM.UI.Icon.prototype.handleEvent = function(e) {
    var action = new MM.Action.SetIcon(MM.App.current, this._select.value || null);
    MM.App.action(action);
  };

  // .js/ui/ui.help.js
  MM.UI.Help = function() {
    this._node = document.querySelector("#help");
    this._map = {
      8: "Backspace",
      9: "Tab",
      13: "\u21A9",
      32: "Spacebar",
      33: "PgUp",
      34: "PgDown",
      35: "End",
      36: "Home",
      37: "\u2190",
      38: "\u2191",
      39: "\u2192",
      40: "\u2193",
      45: "Insert",
      46: "Delete",
      65: "A",
      68: "D",
      83: "S",
      87: "W",
      112: "F1",
      113: "F2",
      114: "F3",
      115: "F4",
      116: "F5",
      117: "F6",
      118: "F7",
      119: "F8",
      120: "F9",
      121: "F10",
      "-": "&minus;"
    };
    this._build();
  };
  MM.UI.Help.prototype.toggle = function() {
    this._node.classList.toggle("visible");
  };
  MM.UI.Help.prototype._build = function() {
    var t = this._node.querySelector(".navigation");
    this._buildRow(t, "Pan");
    this._buildRow(t, "Select");
    this._buildRow(t, "SelectRoot");
    this._buildRow(t, "SelectParent");
    this._buildRow(t, "Center");
    this._buildRow(t, "ZoomIn", "ZoomOut");
    this._buildRow(t, "Fold");
    var t = this._node.querySelector(".manipulation");
    this._buildRow(t, "InsertSibling");
    this._buildRow(t, "InsertChild");
    this._buildRow(t, "Swap");
    this._buildRow(t, "Side");
    this._buildRow(t, "Delete");
    this._buildRow(t, "Copy");
    this._buildRow(t, "Cut");
    this._buildRow(t, "Paste");
    var t = this._node.querySelector(".editing");
    this._buildRow(t, "Value");
    this._buildRow(t, "Yes", "No", "Computed");
    this._buildRow(t, "Edit");
    this._buildRow(t, "Newline");
    this._buildRow(t, "Bold");
    this._buildRow(t, "Italic");
    this._buildRow(t, "Underline");
    this._buildRow(t, "Strikethrough");
    var t = this._node.querySelector(".other");
    this._buildRow(t, "Undo", "Redo");
    this._buildRow(t, "Save");
    this._buildRow(t, "SaveAs");
    this._buildRow(t, "Load");
    this._buildRow(t, "Help");
    this._buildRow(t, "Notes");
    this._buildRow(t, "UI");
  };
  MM.UI.Help.prototype._buildRow = function(table, commandName) {
    var row = table.insertRow(-1);
    var labels = [];
    var keys = [];
    for (var i = 1; i < arguments.length; i++) {
      var command = MM.Command[arguments[i]];
      if (!command) {
        continue;
      }
      labels.push(command.label);
      keys = keys.concat(command.keys.map(this._formatKey, this));
    }
    row.insertCell(-1).innerHTML = labels.join("/");
    row.insertCell(-1).innerHTML = keys.join("/");
  };
  MM.UI.Help.prototype._formatKey = function(key) {
    var str = "";
    if (key.ctrlKey) {
      str += "Ctrl+";
    }
    if (key.altKey) {
      str += "Alt+";
    }
    if (key.shiftKey) {
      str += "Shift+";
    }
    if (key.charCode) {
      var ch = String.fromCharCode(key.charCode);
      str += this._map[ch] || ch.toUpperCase();
    }
    if (key.keyCode) {
      str += this._map[key.keyCode] || String.fromCharCode(key.keyCode);
    }
    return str;
  };
  MM.UI.Help.prototype.close = function() {
    if (this._node.classList.contains("visible")) {
      this._node.classList.toggle("visible");
    }
  };

  // .js/ui/ui.notes.js
  MM.UI.Notes = function() {
    this._node = document.querySelector("#notes");
  };
  MM.UI.Notes.prototype.toggle = function() {
    this._node.classList.toggle("visible");
  };
  MM.UI.Notes.prototype.close = function() {
    if (this._node.classList.contains("visible")) {
      this._node.classList.toggle("visible");
      MM.Clipboard.focus();
    }
  };
  MM.UI.Notes.prototype.update = function(html2) {
    if (html2.trim().length === 0) {
      MM.App.current.notes = null;
    } else {
      MM.App.current.notes = html2;
    }
    MM.App.current.update();
  };

  // .js/ui/ui.io.js
  MM.UI.IO = function() {
    this._prefix = "mm.app.";
    this._mode = "";
    this._node = document.querySelector("#io");
    this._heading = this._node.querySelector("h3");
    this._backend = this._node.querySelector("#backend");
    this._currentBackend = null;
    this._backends = {};
    var ids = ["local", "firebase", "gdrive", "file", "webdav", "image"];
    ids.forEach(function(id) {
      var ui2 = MM.UI.Backend.getById(id);
      ui2.init(this._backend);
      this._backends[id] = ui2;
    }, this);
    this._backend.value = localStorage.getItem(this._prefix + "backend") || MM.Backend.File.id;
    this._backend.addEventListener("change", this);
    subscribe("map-new", this);
    subscribe("save-done", this);
    subscribe("load-done", this);
  };
  MM.UI.IO.prototype.restore = function() {
    var parts = {};
    location.search.substring(1).split("&").forEach(function(item) {
      var keyvalue = item.split("=");
      parts[decodeURIComponent(keyvalue[0])] = decodeURIComponent(keyvalue[1]);
    });
    if ("map" in parts) {
      parts.url = parts.map;
    }
    if ("url" in parts && !("b" in parts)) {
      parts.b = "webdav";
    }
    var backend = MM.UI.Backend.getById(parts.b);
    if (backend) {
      backend.setState(parts);
      return;
    }
    if (parts.state) {
      try {
        var state = JSON.parse(parts.state);
        if (state.action == "open") {
          state = {
            b: "gdrive",
            id: state.ids[0]
          };
          MM.UI.Backend.GDrive.setState(state);
        } else {
          history.replaceState(null, "", ".");
        }
        return;
      } catch (e) {
      }
    }
  };
  MM.UI.IO.prototype.handleMessage = function(message, publisher) {
    switch (message) {
      case "map-new":
        this._setCurrentBackend(null);
        break;
      case "save-done":
      case "load-done":
        this.hide();
        this._setCurrentBackend(publisher);
        break;
    }
  };
  MM.UI.IO.prototype.show = function(mode) {
    this._mode = mode;
    this._node.classList.add("visible");
    this._heading.innerHTML = mode;
    this._syncBackend();
    window.addEventListener("keydown", this);
  };
  MM.UI.IO.prototype.hide = function() {
    if (!this._node.classList.contains("visible")) {
      return;
    }
    this._node.classList.remove("visible");
    MM.Clipboard.focus();
    window.removeEventListener("keydown", this);
  };
  MM.UI.IO.prototype.quickSave = function() {
    if (this._currentBackend) {
      this._currentBackend.save();
    } else {
      this.show("save");
    }
  };
  MM.UI.IO.prototype.handleEvent = function(e) {
    switch (e.type) {
      case "keydown":
        if (e.keyCode == 27) {
          this.hide();
        }
        break;
      case "change":
        this._syncBackend();
        break;
    }
  };
  MM.UI.IO.prototype._syncBackend = function() {
    [...this._node.querySelectorAll("div[id]")].forEach((node4) => node4.hidden = true);
    this._node.querySelector("#" + this._backend.value).hidden = false;
    this._backends[this._backend.value].show(this._mode);
  };
  MM.UI.IO.prototype._setCurrentBackend = function(backend) {
    if (this._currentBackend && this._currentBackend != backend) {
      this._currentBackend.reset();
    }
    if (backend) {
      localStorage.setItem(this._prefix + "backend", backend.id);
    }
    this._currentBackend = backend;
    try {
      this._updateURL();
    } catch (e) {
    }
  };
  MM.UI.IO.prototype._updateURL = function() {
    var data = this._currentBackend && this._currentBackend.getState();
    if (!data) {
      history.replaceState(null, "", ".");
    } else {
      var arr = Object.keys(data).map(function(key) {
        return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
      });
      history.replaceState(null, "", "?" + arr.join("&"));
    }
  };

  // .js/ui/backend/ui.backend.js
  MM.UI.Backend = Object.create(MM.Repo);
  MM.UI.Backend.init = function(select) {
    this._backend = MM.Backend.getById(this.id);
    this._mode = "";
    this._prefix = "mm.app." + this.id + ".";
    this._node = document.querySelector("#" + this.id);
    this._cancel = this._node.querySelector(".cancel");
    this._cancel.addEventListener("click", this);
    this._go = this._node.querySelector(".go");
    this._go.addEventListener("click", this);
    select.appendChild(this._backend.buildOption());
  };
  MM.UI.Backend.reset = function() {
    this._backend.reset();
  };
  MM.UI.Backend.setState = function(data) {
  };
  MM.UI.Backend.getState = function() {
    return null;
  };
  MM.UI.Backend.handleEvent = function(e) {
    switch (e.target) {
      case this._cancel:
        MM.App.io.hide();
        break;
      case this._go:
        this._action();
        break;
    }
  };
  MM.UI.Backend.save = function() {
  };
  MM.UI.Backend.load = function() {
  };
  MM.UI.Backend.show = function(mode) {
    this._mode = mode;
    this._go.innerHTML = mode.charAt(0).toUpperCase() + mode.substring(1);
    [...this._node.querySelectorAll("[data-for]")].forEach((node4) => node4.hidden = true);
    [...this._node.querySelectorAll(`[data-for~=${mode}]`)].forEach((node4) => node4.hidden = false);
    this._go.focus();
  };
  MM.UI.Backend._action = function() {
    switch (this._mode) {
      case "save":
        this.save();
        break;
      case "load":
        this.load();
        break;
    }
  };
  MM.UI.Backend._saveDone = function() {
    MM.App.setThrobber(false);
    publish("save-done", this);
  };
  MM.UI.Backend._loadDone = function(json) {
    MM.App.setThrobber(false);
    try {
      MM.App.setMap(Map2.fromJSON(json));
      publish("load-done", this);
    } catch (e) {
      this._error(e);
    }
  };
  MM.UI.Backend._error = function(e) {
    MM.App.setThrobber(false);
    alert("IO error: " + e.message);
  };
  MM.UI.Backend._buildList = function(list, select) {
    var data = [];
    for (var id in list) {
      data.push({ id, name: list[id] });
    }
    data.sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    data.forEach(function(item) {
      var o = document.createElement("option");
      o.value = item.id;
      o.innerHTML = item.name;
      select.appendChild(o);
    });
  };

  // .js/ui/backend/ui.backend.file.js
  MM.UI.Backend.File = Object.create(MM.UI.Backend, {
    id: { value: "file" }
  });
  MM.UI.Backend.File.init = function(select) {
    MM.UI.Backend.init.call(this, select);
    this._format = this._node.querySelector(".format");
    this._format.appendChild(MM.Format.JSON.buildOption());
    this._format.appendChild(MM.Format.FreeMind.buildOption());
    this._format.appendChild(MM.Format.MMA.buildOption());
    this._format.appendChild(MM.Format.Mup.buildOption());
    this._format.appendChild(MM.Format.Plaintext.buildOption());
    this._format.value = localStorage.getItem(this._prefix + "format") || MM.Format.JSON.id;
  };
  MM.UI.Backend.File.show = function(mode) {
    MM.UI.Backend.show.call(this, mode);
    this._go.innerHTML = mode == "save" ? "Save" : "Browse";
  };
  MM.UI.Backend.File._action = function() {
    localStorage.setItem(this._prefix + "format", this._format.value);
    MM.UI.Backend._action.call(this);
  };
  MM.UI.Backend.File.save = function() {
    var format = MM.Format.getById(this._format.value);
    var json = MM.App.map.toJSON();
    var data = format.to(json);
    var name = MM.App.map.name + "." + format.extension;
    this._backend.save(data, name).then(this._saveDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.File.load = function() {
    this._backend.load().then(this._loadDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.File._loadDone = function(data) {
    try {
      var format = MM.Format.getByName(data.name) || MM.Format.JSON;
      var json = format.from(data.data);
    } catch (e) {
      this._error(e);
    }
    MM.UI.Backend._loadDone.call(this, json);
  };

  // .js/ui/backend/ui.backend.webdav.js
  MM.UI.Backend.WebDAV = Object.create(MM.UI.Backend, {
    id: { value: "webdav" }
  });
  MM.UI.Backend.WebDAV.init = function(select) {
    MM.UI.Backend.init.call(this, select);
    this._url = this._node.querySelector(".url");
    this._url.value = localStorage.getItem(this._prefix + "url") || "";
    this._current = "";
  };
  MM.UI.Backend.WebDAV.getState = function() {
    var data = {
      url: this._current
    };
    return data;
  };
  MM.UI.Backend.WebDAV.setState = function(data) {
    this._load(data.url);
  };
  MM.UI.Backend.WebDAV.save = function() {
    MM.App.setThrobber(true);
    var map = MM.App.map;
    var url = this._url.value;
    localStorage.setItem(this._prefix + "url", url);
    if (url.match(/\.mymind$/)) {
    } else {
      if (url.charAt(url.length - 1) != "/") {
        url += "/";
      }
      url += map.name + "." + MM.Format.JSON.extension;
    }
    this._current = url;
    var json = map.toJSON();
    var data = MM.Format.JSON.to(json);
    this._backend.save(data, url).then(this._saveDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.WebDAV.load = function() {
    this._load(this._url.value);
  };
  MM.UI.Backend.WebDAV._load = function(url) {
    this._current = url;
    MM.App.setThrobber(true);
    var lastIndex = url.lastIndexOf("/");
    this._url.value = url.substring(0, lastIndex);
    localStorage.setItem(this._prefix + "url", this._url.value);
    this._backend.load(url).then(this._loadDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.WebDAV._loadDone = function(data) {
    try {
      var json = MM.Format.JSON.from(data);
    } catch (e) {
      this._error(e);
    }
    MM.UI.Backend._loadDone.call(this, json);
  };

  // .js/ui/backend/ui.backend.image.js
  MM.UI.Backend.Image = Object.create(MM.UI.Backend, {
    id: { value: "image" }
  });
  MM.UI.Backend.Image.save = function() {
    this._backend.save();
  };
  MM.UI.Backend.Image.load = null;

  // .js/ui/backend/ui.backend.local.js
  MM.UI.Backend.Local = Object.create(MM.UI.Backend, {
    id: { value: "local" }
  });
  MM.UI.Backend.Local.init = function(select) {
    MM.UI.Backend.init.call(this, select);
    this._list = this._node.querySelector(".list");
    this._remove = this._node.querySelector(".remove");
    this._remove.addEventListener("click", this);
  };
  MM.UI.Backend.Local.handleEvent = function(e) {
    MM.UI.Backend.handleEvent.call(this, e);
    switch (e.target) {
      case this._remove:
        var id = this._list.value;
        if (!id) {
          break;
        }
        this._backend.remove(id);
        this.show(this._mode);
        break;
    }
  };
  MM.UI.Backend.Local.show = function(mode) {
    MM.UI.Backend.show.call(this, mode);
    this._go.disabled = false;
    if (mode == "load") {
      var list = this._backend.list();
      this._list.innerHTML = "";
      if (Object.keys(list).length) {
        this._go.disabled = false;
        this._remove.disabled = false;
        this._buildList(list, this._list);
      } else {
        this._go.disabled = true;
        this._remove.disabled = true;
        var o = document.createElement("option");
        o.innerHTML = "(no maps saved)";
        this._list.appendChild(o);
      }
    }
  };
  MM.UI.Backend.Local.setState = function(data) {
    this._load(data.id);
  };
  MM.UI.Backend.Local.getState = function() {
    var data = {
      b: this.id,
      id: MM.App.map.id
    };
    return data;
  };
  MM.UI.Backend.Local.save = function() {
    var json = MM.App.map.toJSON();
    var data = MM.Format.JSON.to(json);
    try {
      this._backend.save(data, MM.App.map.id, MM.App.map.name);
      this._saveDone();
    } catch (e) {
      this._error(e);
    }
  };
  MM.UI.Backend.Local.load = function() {
    this._load(this._list.value);
  };
  MM.UI.Backend.Local._load = function(id) {
    try {
      var data = this._backend.load(id);
      var json = MM.Format.JSON.from(data);
      this._loadDone(json);
    } catch (e) {
      this._error(e);
    }
  };

  // .js/ui/backend/ui.backend.firebase.js
  MM.UI.Backend.Firebase = Object.create(MM.UI.Backend, {
    id: { value: "firebase" }
  });
  MM.UI.Backend.Firebase.init = function(select) {
    MM.UI.Backend.init.call(this, select);
    this._online = false;
    this._itemChangeTimeout = null;
    this._list = this._node.querySelector(".list");
    this._server = this._node.querySelector(".server");
    this._server.value = localStorage.getItem(this._prefix + "server") || "my-mind";
    this._auth = this._node.querySelector(".auth");
    this._auth.value = localStorage.getItem(this._prefix + "auth") || "";
    this._remove = this._node.querySelector(".remove");
    this._remove.addEventListener("click", this);
    this._go.disabled = false;
    subscribe("firebase-list", this);
    subscribe("firebase-change", this);
  };
  MM.UI.Backend.Firebase.setState = function(data) {
    this._connect(data.s, data.a).then(this._load.bind(this, data.id), this._error.bind(this));
  };
  MM.UI.Backend.Firebase.getState = function() {
    var data = {
      id: MM.App.map.id,
      b: this.id,
      s: this._server.value
    };
    if (this._auth.value) {
      data.a = this._auth.value;
    }
    return data;
  };
  MM.UI.Backend.Firebase.show = function(mode) {
    MM.UI.Backend.show.call(this, mode);
    this._sync();
  };
  MM.UI.Backend.Firebase.handleEvent = function(e) {
    MM.UI.Backend.handleEvent.call(this, e);
    switch (e.target) {
      case this._remove:
        var id = this._list.value;
        if (!id) {
          break;
        }
        MM.App.setThrobber(true);
        this._backend.remove(id).then(function() {
          MM.App.setThrobber(false);
        }, this._error.bind(this));
        break;
    }
  };
  MM.UI.Backend.Firebase.handleMessage = function(message, publisher, data) {
    switch (message) {
      case "firebase-list":
        this._list.innerHTML = "";
        if (Object.keys(data).length) {
          this._buildList(data, this._list);
        } else {
          var o = document.createElement("option");
          o.innerHTML = "(no maps saved)";
          this._list.appendChild(o);
        }
        this._sync();
        break;
      case "firebase-change":
        if (data) {
          unsubscribe("item-change", this);
          MM.App.map.mergeWith(data);
          subscribe("item-change", this);
        } else {
          console.log("remote data disappeared");
        }
        break;
      case "item-change":
        if (this._itemChangeTimeout) {
          clearTimeout(this._itemChangeTimeout);
        }
        this._itemChangeTimeout = setTimeout(this._itemChange.bind(this), 200);
        break;
    }
  };
  MM.UI.Backend.Firebase.reset = function() {
    this._backend.reset();
    unsubscribe("item-change", this);
  };
  MM.UI.Backend.Firebase._itemChange = function() {
    var map = MM.App.map;
    this._backend.mergeWith(map.toJSON(), map.name);
  };
  MM.UI.Backend.Firebase._action = function() {
    if (!this._online) {
      this._connect(this._server.value, this._auth.value);
      return;
    }
    MM.UI.Backend._action.call(this);
  };
  MM.UI.Backend.Firebase.save = function() {
    MM.App.setThrobber(true);
    var map = MM.App.map;
    this._backend.save(map.toJSON(), map.id, map.name).then(this._saveDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.Firebase.load = function() {
    this._load(this._list.value);
  };
  MM.UI.Backend.Firebase._load = function(id) {
    MM.App.setThrobber(true);
    this._backend.load(id).then(this._loadDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.Firebase._connect = function(server, auth) {
    var promise = new Promise();
    this._server.value = server;
    this._auth.value = auth;
    this._server.disabled = true;
    this._auth.disabled = true;
    localStorage.setItem(this._prefix + "server", server);
    localStorage.setItem(this._prefix + "auth", auth || "");
    this._go.disabled = true;
    MM.App.setThrobber(true);
    this._backend.connect(server, auth).then(function() {
      this._connected();
      promise.fulfill();
    }.bind(this), promise.reject.bind(promise));
    return promise;
  };
  MM.UI.Backend.Firebase._connected = function() {
    MM.App.setThrobber(false);
    this._online = true;
    this._sync();
  };
  MM.UI.Backend.Firebase._sync = function() {
    if (!this._online) {
      this._go.innerHTML = "Connect";
      return;
    }
    this._go.disabled = false;
    if (this._mode == "load" && !this._list.value) {
      this._go.disabled = true;
    }
    this._go.innerHTML = this._mode.charAt(0).toUpperCase() + this._mode.substring(1);
  };
  MM.UI.Backend.Firebase._loadDone = function() {
    subscribe("item-change", this);
    MM.UI.Backend._loadDone.apply(this, arguments);
  };
  MM.UI.Backend.Firebase._saveDone = function() {
    subscribe("item-change", this);
    MM.UI.Backend._saveDone.apply(this, arguments);
  };

  // .js/ui/backend/ui.backend.gdrive.js
  MM.UI.Backend.GDrive = Object.create(MM.UI.Backend, {
    id: { value: "gdrive" }
  });
  MM.UI.Backend.GDrive.init = function(select) {
    MM.UI.Backend.init.call(this, select);
    this._format = this._node.querySelector(".format");
    this._format.appendChild(MM.Format.JSON.buildOption());
    this._format.appendChild(MM.Format.FreeMind.buildOption());
    this._format.appendChild(MM.Format.MMA.buildOption());
    this._format.appendChild(MM.Format.Mup.buildOption());
    this._format.appendChild(MM.Format.Plaintext.buildOption());
    this._format.value = localStorage.getItem(this._prefix + "format") || MM.Format.JSON.id;
  };
  MM.UI.Backend.GDrive.save = function() {
    MM.App.setThrobber(true);
    var format = MM.Format.getById(this._format.value);
    var json = MM.App.map.toJSON();
    var data = format.to(json);
    var name = MM.App.map.name;
    var mime = "text/plain";
    if (format.mime) {
      mime = format.mime;
    } else {
      name += "." + format.extension;
    }
    this._backend.save(data, name, mime).then(this._saveDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.GDrive.load = function() {
    MM.App.setThrobber(true);
    this._backend.pick().then(this._picked.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.GDrive._picked = function(id) {
    MM.App.setThrobber(false);
    if (!id) {
      return;
    }
    MM.App.setThrobber(true);
    this._backend.load(id).then(this._loadDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.GDrive.setState = function(data) {
    this._picked(data.id);
  };
  MM.UI.Backend.GDrive.getState = function() {
    var data = {
      b: this.id,
      id: this._backend.fileId
    };
    return data;
  };
  MM.UI.Backend.GDrive._loadDone = function(data) {
    try {
      var format = MM.Format.getByMime(data.mime) || MM.Format.getByName(data.name) || MM.Format.JSON;
      var json = format.from(data.data);
    } catch (e) {
      this._error(e);
    }
    MM.UI.Backend._loadDone.call(this, json);
  };

  // .js/layout/graph.js
  var SPACING_RANK = 16;
  var R = SPACING_RANK / 2;
  var GraphLayout = class extends Layout {
    update(item) {
      this.layoutItem(item, this.childDirection);
      if (this.childDirection == "left" || this.childDirection == "right") {
        this.drawLinesHorizontal(item, this.childDirection);
      } else {
        this.drawLinesVertical(item, this.childDirection);
      }
    }
    layoutItem(item, rankDirection) {
      var rankIndex = rankDirection == "left" || rankDirection == "right" ? 0 : 1;
      var childIndex = (rankIndex + 1) % 2;
      const { contentSize } = item;
      var bbox = this.computeChildrenBBox(item.children, childIndex);
      var rankSize = contentSize[rankIndex];
      if (bbox[rankIndex]) {
        rankSize += bbox[rankIndex] + SPACING_RANK;
      }
      var childSize = Math.max(bbox[childIndex], contentSize[childIndex]);
      var offset = [0, 0];
      if (rankDirection == "right") {
        offset[0] = contentSize[0] + SPACING_RANK;
      }
      if (rankDirection == "bottom") {
        offset[1] = contentSize[1] + SPACING_RANK;
      }
      offset[childIndex] = Math.round((childSize - bbox[childIndex]) / 2);
      this.layoutChildren(item.children, rankDirection, offset, bbox);
      var labelPos = 0;
      if (rankDirection == "left") {
        labelPos = rankSize - contentSize[0];
      }
      if (rankDirection == "top") {
        labelPos = rankSize - contentSize[1];
      }
      let contentPosition = [Math.round((childSize - contentSize[childIndex]) / 2), labelPos];
      if (rankIndex == 0) {
        contentPosition = contentPosition.reverse();
      }
      item.contentPosition = contentPosition;
    }
    layoutChildren(children, rankDirection, offset, bbox) {
      var rankIndex = rankDirection == "left" || rankDirection == "right" ? 0 : 1;
      var childIndex = (rankIndex + 1) % 2;
      children.forEach((child) => {
        const { size } = child;
        if (rankDirection == "left") {
          offset[0] = bbox[0] - size[0];
        }
        if (rankDirection == "top") {
          offset[1] = bbox[1] - size[1];
        }
        child.position = offset;
        offset[childIndex] += size[childIndex] + this.SPACING_CHILD;
      });
      return bbox;
    }
    drawLinesHorizontal(item, side) {
      const { contentPosition, contentSize, resolvedShape, resolvedColor, children, dom } = item;
      if (children.length == 0) {
        return;
      }
      let itemAnchor = [
        contentPosition[0] + (side == "right" ? contentSize[0] + 0.5 : -0.5),
        resolvedShape.getVerticalAnchor(item)
      ];
      this.anchorToggle(item, itemAnchor, side);
      if (item.isCollapsed()) {
        return;
      }
      let d = [];
      if (children.length == 1) {
        var child = children[0];
        const { position, resolvedShape: resolvedShape2 } = child;
        let childAnchor = [
          this.getChildAnchor(child, side),
          resolvedShape2.getVerticalAnchor(child) + position[1]
        ];
        let mid = (itemAnchor[0] + childAnchor[0]) / 2;
        d.push(`M ${itemAnchor}`, `C ${[mid, itemAnchor[1]]} ${[mid, childAnchor[1]]} ${childAnchor}`);
        let path2 = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
        dom.connectors.append(path2);
        return;
      }
      let center = [
        itemAnchor[0] + (side == "left" ? -R : R),
        itemAnchor[1]
      ];
      d.push(`M ${itemAnchor}`, `L ${center}`);
      const firstChild = children[0];
      const lastChild = children[children.length - 1];
      const cornerEndX = center[0] + (side == "left" ? -R : R);
      const sweep = cornerEndX < center[0] ? 1 : 0;
      let firstAnchor = [
        this.getChildAnchor(firstChild, side),
        firstChild.resolvedShape.getVerticalAnchor(firstChild) + firstChild.position[1]
      ];
      let lastAnchor = [
        this.getChildAnchor(lastChild, side),
        lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1]
      ];
      d.push(`M ${firstAnchor}`, `L ${cornerEndX} ${firstAnchor[1]}`, `A ${R} ${R} 0 0 ${sweep} ${center[0]} ${firstAnchor[1] + R}`, `L ${center[0]} ${lastAnchor[1] - R}`, `A ${R} ${R} 0 0 ${sweep} ${cornerEndX} ${lastAnchor[1]}`, `L ${lastAnchor}`);
      for (let i = 1; i < children.length - 1; i++) {
        const c = children[i];
        const y = c.resolvedShape.getVerticalAnchor(c) + c.position[1];
        let lineStart = [center[0], y];
        let childAnchor = [this.getChildAnchor(c, side), y];
        d.push(`M ${lineStart}`, `L ${childAnchor}`);
      }
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
    drawLinesVertical(item, side) {
      const { contentSize, size, resolvedShape, resolvedColor, children, dom } = item;
      if (children.length == 0) {
        return;
      }
      const height = children.length == 1 ? 2 * R : R;
      let itemAnchor = [
        resolvedShape.getHorizontalAnchor(item),
        side == "top" ? size[1] - contentSize[1] : resolvedShape.getVerticalAnchor(item)
      ];
      let center = [
        itemAnchor[0],
        (side == "top" ? itemAnchor[1] - height : contentSize[1] + height) + 0.5
      ];
      this.anchorToggle(item, itemAnchor, side);
      if (item.isCollapsed()) {
        return;
      }
      let d = [];
      d.push(`M ${itemAnchor}`, `L ${center}`);
      if (children.length == 1) {
        let path2 = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
        dom.connectors.append(path2);
        return;
      }
      const firstChild = children[0];
      const lastChild = children[children.length - 1];
      const cornerEndY = center[1] + (side == "top" ? -R : R);
      const sweep = cornerEndY > center[1] ? 1 : 0;
      let firstAnchor = [
        firstChild.resolvedShape.getHorizontalAnchor(firstChild) + firstChild.position[0],
        this.getChildAnchor(firstChild, side)
      ];
      let lastAnchor = [
        lastChild.resolvedShape.getHorizontalAnchor(lastChild) + lastChild.position[0],
        this.getChildAnchor(lastChild, side)
      ];
      d.push(`M ${firstAnchor}`, `L ${firstAnchor[0]} ${cornerEndY}`, `A ${R} ${R} 0 0 ${sweep} ${firstAnchor[0] + R} ${center[1]}`, `L ${lastAnchor[0] - R} ${center[1]}`, `A ${R} ${R} 0 0 ${sweep} ${lastAnchor[0]} ${cornerEndY}`, `L ${lastAnchor}`);
      for (var i = 1; i < children.length - 1; i++) {
        const c = children[i];
        const x = c.resolvedShape.getHorizontalAnchor(c) + c.position[0];
        let lineStart = [x, center[1]];
        let childAnchor = [x, this.getChildAnchor(c, side)];
        d.push(`M ${lineStart}`, `L ${childAnchor}`);
      }
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
  };
  new GraphLayout("graph-bottom", "Bottom", "bottom");
  new GraphLayout("graph-top", "Top", "top");
  new GraphLayout("graph-left", "Left", "left");
  new GraphLayout("graph-right", "Right", "right");

  // .js/layout/tree.js
  var SPACING_RANK2 = 32;
  var R2 = SPACING_RANK2 / 4;
  var LINE_OFFSET = SPACING_RANK2 / 2;
  var TreeLayout = class extends Layout {
    update(item) {
      this.layoutItem(item, this.childDirection);
      this.drawLines(item, this.childDirection);
    }
    layoutItem(item, rankDirection) {
      const { contentSize, children } = item;
      let bbox = this.computeChildrenBBox(children, 1);
      let rankSize = contentSize[0];
      if (bbox[0]) {
        rankSize = Math.max(rankSize, bbox[0] + SPACING_RANK2);
      }
      let offset = [SPACING_RANK2, contentSize[1] + this.SPACING_CHILD];
      if (rankDirection == "left") {
        offset[0] = rankSize - bbox[0] - SPACING_RANK2;
      }
      this.layoutChildren(children, rankDirection, offset, bbox);
      let labelPos = 0;
      if (rankDirection == "left") {
        labelPos = rankSize - contentSize[0];
      }
      item.contentPosition = [labelPos, 0];
    }
    layoutChildren(children, rankDirection, offset, bbox) {
      children.forEach((child) => {
        const { size } = child;
        let left = offset[0];
        if (rankDirection == "left") {
          left += bbox[0] - size[0];
        }
        child.position = [left, offset[1]];
        offset[1] += size[1] + this.SPACING_CHILD;
      });
    }
    drawLines(item, side) {
      const { size, resolvedShape, resolvedColor, children, dom } = item;
      let pointAnchor = [
        (side == "left" ? size[0] - LINE_OFFSET : LINE_OFFSET) + 0.5,
        resolvedShape.getVerticalAnchor(item)
      ];
      this.anchorToggle(item, pointAnchor, "bottom");
      if (children.length == 0 || item.isCollapsed()) {
        return;
      }
      let lastChild = children[children.length - 1];
      let lineEnd = [
        pointAnchor[0],
        lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1] - R2
      ];
      let d = [`M ${pointAnchor}`, `L ${lineEnd}`];
      let cornerEndX = lineEnd[0] + (side == "left" ? -R2 : R2);
      let sweep = cornerEndX < lineEnd[0] ? 1 : 0;
      children.forEach((child) => {
        const { resolvedShape: resolvedShape2, position } = child;
        const y = resolvedShape2.getVerticalAnchor(child) + position[1];
        d.push(`M ${pointAnchor[0]} ${y - R2}`, `A ${R2} ${R2} 0 0 ${sweep} ${cornerEndX} ${y}`, `L ${this.getChildAnchor(child, side)} ${y}`);
      });
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
  };
  new TreeLayout("tree-left", "Left", "left");
  new TreeLayout("tree-right", "Right", "right");

  // .js/layout/map.js
  var MapLayout = class extends GraphLayout {
    constructor() {
      super(...arguments);
      this.LINE_THICKNESS = 8;
    }
    update(item) {
      if (item.isRoot) {
        this.layoutRoot(item);
      } else {
        var side = this.getChildDirection(item);
        repo2.get(`graph-${side}`).update(item);
      }
    }
    getChildDirection(child) {
      while (!child.parent.isRoot) {
        child = child.parent;
      }
      var side = child.side;
      if (side) {
        return side;
      }
      var counts = { left: 0, right: 0 };
      var children = child.parent.children;
      for (var i = 0; i < children.length; i++) {
        var side = children[i].side;
        if (!side) {
          side = counts.right > counts.left ? "left" : "right";
          children[i].side = side;
        }
        counts[side]++;
      }
      return child.side;
    }
    pickSibling(item, dir) {
      if (item.isRoot) {
        return item;
      }
      const parent = item.parent;
      var children = parent.children;
      if (parent.isRoot) {
        var side = this.getChildDirection(item);
        children = children.filter((child) => this.getChildDirection(child) == side);
      }
      var index = children.indexOf(item);
      index += dir;
      index = (index + children.length) % children.length;
      return children[index];
    }
    layoutRoot(item) {
      const { children, contentSize } = item;
      let childrenLeft = [];
      let childrenRight = [];
      let contentPosition = [0, 0];
      children.forEach((child) => {
        var side = this.getChildDirection(child);
        if (side == "left") {
          childrenLeft.push(child);
        } else {
          childrenRight.push(child);
        }
      });
      var bboxLeft = this.computeChildrenBBox(childrenLeft, 1);
      var bboxRight = this.computeChildrenBBox(childrenRight, 1);
      var height = Math.max(bboxLeft[1], bboxRight[1], contentSize[1]);
      var left = 0;
      this.layoutChildren(childrenLeft, "left", [left, Math.round((height - bboxLeft[1]) / 2)], bboxLeft);
      left += bboxLeft[0];
      if (childrenLeft.length) {
        left += SPACING_RANK;
      }
      contentPosition[0] = left;
      left += contentSize[0];
      if (childrenRight.length) {
        left += SPACING_RANK;
      }
      this.layoutChildren(childrenRight, "right", [left, Math.round((height - bboxRight[1]) / 2)], bboxRight);
      left += bboxRight[0];
      contentPosition[1] = Math.round((height - contentSize[1]) / 2);
      item.contentPosition = contentPosition;
      this.drawRootConnectors(item, "left", childrenLeft);
      this.drawRootConnectors(item, "right", childrenRight);
    }
    drawRootConnectors(item, side, children) {
      if (children.length == 0 || item.isCollapsed()) {
        return;
      }
      const { contentSize, contentPosition, resolvedShape, dom } = item;
      let x1 = contentPosition[0] + contentSize[0] / 2;
      let y1 = resolvedShape.getVerticalAnchor(item);
      const half = this.LINE_THICKNESS / 2;
      let paths = children.map((child) => {
        const { resolvedColor, resolvedShape: resolvedShape2, position } = child;
        let x2 = this.getChildAnchor(child, side);
        let y2 = resolvedShape2.getVerticalAnchor(child) + position[1];
        let angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
        let dx = Math.cos(angle) * half;
        let dy = Math.sin(angle) * half;
        let d = [
          `M ${x1 - dx} ${y1 - dy}`,
          `Q ${(x2 + x1) / 2} ${y2} ${x2} ${y2}`,
          `Q ${(x2 + x1) / 2} ${y2} ${x1 + dx} ${y1 + dy}`,
          `Z`
        ];
        let attrs = {
          d: d.join(" "),
          fill: resolvedColor,
          stroke: resolvedColor
        };
        return node2("path", attrs);
      });
      dom.connectors.append(...paths);
    }
  };
  new MapLayout("map", "Map");

  // .js/shape/box.js
  var Box = class extends Shape {
    constructor() {
      super("box", "Box");
    }
  };
  new Box();

  // .js/shape/ellipse.js
  var Ellipse = class extends Shape {
    constructor() {
      super("ellipse", "Ellipse");
    }
  };
  new Ellipse();

  // .js/shape/underline.js
  var VERTICAL_OFFSET2 = -3;
  var Underline = class extends Shape {
    constructor() {
      super("underline", "Underline");
    }
    update(item) {
      const { contentPosition, resolvedColor, contentSize, dom } = item;
      let left = contentPosition[0];
      let right = left + contentSize[0];
      let top = this.getVerticalAnchor(item);
      let d = [
        `M ${left} ${top}`,
        `L ${right} ${top}`
      ];
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
    getVerticalAnchor(item) {
      const { contentPosition, contentSize } = item;
      return contentPosition[1] + contentSize[1] + VERTICAL_OFFSET2 + 0.5;
    }
  };
  new Underline();

  // .js/keyboard.js
  function handleEvent(e) {
    if (node3.contains(document.activeElement)) {
      return;
    }
    let command = MM.Command.getAll().find((command2) => {
      if (!command2.isValid()) {
        return false;
      }
      return command2.keys.find((key) => keyOK(key, e));
    });
    if (command) {
      command.prevent && e.preventDefault();
      command.execute(e);
    }
  }
  function init() {
    window.addEventListener("keydown", handleEvent);
    window.addEventListener("keypress", handleEvent);
  }
  function keyOK(key, e) {
    if ("keyCode" in key && e.type != "keydown") {
      return false;
    }
    if ("charCode" in key && e.type != "keypress") {
      return false;
    }
    for (let p in key) {
      if (key[p] != e[p]) {
        return false;
      }
    }
    return true;
  }

  // .js/mouse.js
  var TOUCH_DELAY = 500;
  var SHADOW_OFFSET = 5;
  var touchContextTimeout = null;
  var current = {
    mode: "",
    cursor: [],
    item: null,
    ghost: null,
    ghostPosition: [],
    previousDragState: null
  };
  var port;
  function init2(_port) {
    port = _port;
    port.addEventListener("touchstart", onDragStart);
    port.addEventListener("mousedown", onDragStart);
    port.addEventListener("click", (e) => {
      let item = MM.App.map.getItemFor(e.target);
      if (MM.App.editing && item == MM.App.current) {
        return;
      }
      item && MM.App.select(item);
    });
    port.addEventListener("dblclick", (e) => {
      let item = MM.App.map.getItemFor(e.target);
      item && MM.Command.Edit.execute();
    });
    port.addEventListener("wheel", (e) => {
      const { deltaY } = e;
      if (!deltaY) {
        return;
      }
      let dir = deltaY > 0 ? -1 : 1;
      MM.App.adjustFontSize(dir);
    });
    port.addEventListener("contextmenu", (e) => {
      onDragEnd(e);
      e.preventDefault();
      let item = MM.App.map.getItemFor(e.target);
      item && MM.App.select(item);
      MM.Menu.open(e.clientX, e.clientY);
    });
  }
  function onDragStart(e) {
    let point = eventToPoint(e);
    if (!point) {
      return;
    }
    let item = MM.App.map.getItemFor(e.target);
    if (MM.App.editing) {
      if (item == MM.App.current) {
        return;
      }
      MM.Command.Finish.execute();
    }
    current.cursor = point;
    if (item && !item.isRoot) {
      current.mode = "drag";
      current.item = item;
    } else {
      current.mode = "pan";
      port.style.cursor = "move";
    }
    if (e.type == "mousedown") {
      e.preventDefault();
      port.addEventListener("mousemove", onDragMove);
      port.addEventListener("mouseup", onDragEnd);
    }
    if (e.type == "touchstart") {
      touchContextTimeout = setTimeout(function() {
        item && MM.App.select(item);
        MM.Menu.open(point[0], point[1]);
      }, TOUCH_DELAY);
      port.addEventListener("touchmove", onDragMove);
      port.addEventListener("touchend", onDragEnd);
    }
  }
  function onDragMove(e) {
    let point = eventToPoint(e);
    if (!point) {
      return;
    }
    clearTimeout(touchContextTimeout);
    e.preventDefault();
    let delta = [
      point[0] - current.cursor[0],
      point[1] - current.cursor[1]
    ];
    current.cursor = point;
    switch (current.mode) {
      case "drag":
        if (!current.ghost) {
          port.style.cursor = "move";
          buildGhost(current.item);
        }
        moveGhost(delta);
        let state = computeDragState();
        visualizeDragState(state);
        break;
      case "pan":
        MM.App.map.moveBy(delta);
        break;
    }
  }
  function onDragEnd(_e) {
    clearTimeout(touchContextTimeout);
    port.style.cursor = "";
    port.removeEventListener("mousemove", onDragMove);
    port.removeEventListener("mouseup", onDragEnd);
    const { mode, ghost } = current;
    if (mode == "pan") {
      return;
    }
    if (ghost) {
      let state = computeDragState();
      finishDragDrop(state);
      ghost.remove();
      current.ghost = null;
    }
    current.item = null;
  }
  function buildGhost(item) {
    const { content } = item.dom;
    let ghost = content.cloneNode(true);
    ghost.classList.add("ghost");
    port.append(ghost);
    let rect = content.getBoundingClientRect();
    current.ghost = ghost;
    current.ghostPosition = [rect.left, rect.top];
  }
  function moveGhost(delta) {
    let { ghost, ghostPosition } = current;
    ghostPosition[0] += delta[0];
    ghostPosition[1] += delta[1];
    ghost.style.left = ghostPosition[0] + "px";
    ghost.style.top = ghostPosition[1] + "px";
  }
  function finishDragDrop(state) {
    visualizeDragState(null);
    const { target, result, direction } = state;
    let action;
    switch (result) {
      case "append":
        action = new MM.Action.MoveItem(current.item, target);
        break;
      case "sibling":
        let index = target.parent.children.indexOf(target);
        let targetIndex = index + (direction == "right" || direction == "bottom" ? 1 : 0);
        action = new MM.Action.MoveItem(current.item, target.parent, targetIndex, target.side);
        break;
      default:
        return;
        break;
    }
    MM.App.action(action);
  }
  function computeDragState() {
    let rect = current.ghost.getBoundingClientRect();
    let point = [rect.left + rect.width / 2, rect.top + rect.height / 2];
    let closest = MM.App.map.getClosestItem(point);
    let target = closest.item;
    let state = {
      result: "",
      target,
      direction: "left"
    };
    let tmp = target;
    while (!tmp.isRoot) {
      if (tmp == current.item) {
        return state;
      }
      tmp = tmp.parent;
    }
    let itemContentSize = current.item.contentSize;
    let targetContentSize = target.contentSize;
    const w = Math.max(itemContentSize[0], targetContentSize[0]);
    const h = Math.max(itemContentSize[1], targetContentSize[1]);
    if (target.isRoot) {
      state.result = "append";
    } else if (Math.abs(closest.dx) < w && Math.abs(closest.dy) < h) {
      state.result = "append";
    } else {
      state.result = "sibling";
      let childDirection = target.parent.resolvedLayout.getChildDirection(target);
      if (childDirection == "left" || childDirection == "right") {
        state.direction = closest.dy < 0 ? "bottom" : "top";
      } else {
        state.direction = closest.dx < 0 ? "right" : "left";
      }
    }
    return state;
  }
  function visualizeDragState(state) {
    let { previousDragState } = current;
    if (previousDragState && state && previousDragState.target == state.target && previousDragState.result == state.result) {
      return;
    }
    if (previousDragState) {
      previousDragState.target.dom.content.style.boxShadow = "";
    }
    if (!state) {
      return;
    }
    let x = 0, y = 0;
    if (state.result == "sibling") {
      if (state.direction == "left") {
        x = -1;
      }
      if (state.direction == "right") {
        x = 1;
      }
      if (state.direction == "top") {
        y = -1;
      }
      if (state.direction == "bottom") {
        y = 1;
      }
    }
    let spread = x || y ? -2 : 2;
    state.target.dom.content.style.boxShadow = `${x * SHADOW_OFFSET}px ${y * SHADOW_OFFSET}px 2px ${spread}px #000`;
    current.previousDragState = state;
  }
  function eventToPoint(e) {
    if ("touches" in e) {
      if (e.touches.length > 1) {
        return null;
      }
      return [e.touches[0].clientX, e.touches[0].clientY];
    } else {
      return [e.clientX, e.clientY];
    }
  }

  // .js/my-mind.js
  MM.App = {
    keyboard: null,
    current: null,
    editing: false,
    history: [],
    historyIndex: 0,
    portSize: [0, 0],
    map: null,
    ui: null,
    io: null,
    help: null,
    _port: null,
    _throbber: null,
    _drag: {
      pos: [0, 0],
      item: null,
      ghost: null
    },
    _fontSize: 100,
    action: function(action) {
      if (this.historyIndex < this.history.length) {
        this.history.splice(this.historyIndex, this.history.length - this.historyIndex);
      }
      this.history.push(action);
      this.historyIndex++;
      action.perform();
      return this;
    },
    setMap: function(map) {
      if (this.map) {
        this.map.hide();
      }
      this.history = [];
      this.historyIndex = 0;
      this.map = map;
      this.map.show(this._port);
    },
    select: function(item) {
      if (this.current && this.current != item) {
        this.current.deselect();
      }
      this.current = item;
      this.current.select();
    },
    adjustFontSize: function(diff) {
      this._fontSize = Math.max(30, this._fontSize + 10 * diff);
      this._port.style.fontSize = this._fontSize + "%";
      this.map.update();
      this.map.ensureItemVisibility(this.current);
    },
    handleMessage: function(message, publisher) {
      switch (message) {
        case "ui-change":
          this._syncPort();
          break;
        case "item-change":
          if (publisher.isRoot && publisher.map == this.map) {
            document.title = this.map.name + " :: My Mind";
          }
          break;
      }
    },
    handleEvent: function(e) {
      switch (e.type) {
        case "resize":
          this._syncPort();
          break;
        case "keyup":
          if (e.key === "Escape") {
            MM.App.notes.close();
            MM.App.help.close();
          }
          break;
        case "message":
          if (e.data && e.data.action) {
            switch (e.data.action) {
              case "setContent":
                MM.App.notes.update(e.data.value);
                break;
              case "closeEditor":
                MM.App.notes.close();
                break;
            }
          }
          break;
        case "beforeunload":
          e.preventDefault();
          return "";
          break;
      }
    },
    setThrobber: function(visible) {
      this._throbber.classList[visible ? "add" : "remove"]("visible");
    },
    init: function() {
      this._port = document.querySelector("#port");
      this._throbber = document.querySelector("#throbber");
      this.ui = new MM.UI();
      this.io = new MM.UI.IO();
      this.help = new MM.UI.Help();
      this.notes = new MM.UI.Notes();
      MM.Tip.init();
      init();
      MM.Menu.init(this._port);
      init2(this._port);
      MM.Clipboard.init();
      window.addEventListener("resize", this);
      window.addEventListener("beforeunload", this);
      window.addEventListener("keyup", this);
      window.addEventListener("message", this, false);
      subscribe("ui-change", this);
      subscribe("item-change", this);
      this._syncPort();
      this.setMap(new Map2());
    },
    _syncPort: function() {
      this.portSize = [window.innerWidth - this.ui.getWidth(), window.innerHeight];
      this._port.style.width = this.portSize[0] + "px";
      this._port.style.height = this.portSize[1] + "px";
      this._throbber.style.right = 20 + this.ui.getWidth() + "px";
      if (this.map) {
        this.map.ensureItemVisibility(this.current);
      }
    }
  };
})();

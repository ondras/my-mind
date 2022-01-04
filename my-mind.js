(() => {
  var __defProp = Object.defineProperty;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __export = (target, all2) => {
    __markAsModule(target);
    for (var name in all2)
      __defProp(target, name, { get: all2[name], enumerable: true });
  };

  // .js/html.js
  function node(name, attrs) {
    let node11 = document.createElement(name);
    Object.assign(node11, attrs);
    return node11;
  }

  // .js/svg.js
  var NS = "http://www.w3.org/2000/svg";
  function node2(name, attrs) {
    let node11 = document.createElementNS(NS, name);
    for (let attr in attrs) {
      node11.setAttribute(attr, attrs[attr]);
    }
    return node11;
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

  // .js/pubsub.js
  var subscribers = new Map();
  function publish(message, publisher, data) {
    let subs = subscribers.get(message) || [];
    subs.forEach((sub) => {
      if (typeof sub == "function") {
        sub(message, publisher, data);
      } else {
        sub.handleMessage(message, publisher, data);
      }
    });
  }
  function subscribe(message, subscriber) {
    if (!subscribers.has(message)) {
      subscribers.set(message, []);
    }
    let subs = subscribers.get(message) || [];
    let index2 = subs.indexOf(subscriber);
    if (index2 == -1) {
      subs.push(subscriber);
    }
  }
  function unsubscribe(message, subscriber) {
    let subs = subscribers.get(message) || [];
    let index2 = subs.indexOf(subscriber);
    if (index2 > -1) {
      subs.splice(index2, 1);
    }
  }

  // .js/history.js
  var index = 0;
  var actions = [];
  function reset() {
    index = 0;
    actions = [];
  }
  function push(action2) {
    if (index < actions.length) {
      actions.splice(index, actions.length - index);
    }
    actions.push(action2);
    index++;
  }
  function back() {
    actions[--index].undo();
  }
  function forward() {
    actions[index++].do();
  }
  function canBack() {
    return !!index;
  }
  function canForward() {
    return index != actions.length;
  }

  // .js/ui/help.js
  var help_exports = {};
  __export(help_exports, {
    close: () => close,
    init: () => init,
    toggle: () => toggle
  });
  var node3 = document.querySelector("#help");
  var MAP = {
    "Enter": "\u21A9",
    "Space": "Spacebar",
    "ArrowLeft": "\u2190",
    "ArrowUp": "\u2191",
    "ArrowRight": "\u2192",
    "ArrowDown": "\u2193",
    "-": "\u2212"
  };
  function toggle() {
    node3.hidden = !node3.hidden;
  }
  function init() {
    let t = node3.querySelector(".navigation");
    buildRow(t, "pan");
    buildRow(t, "select");
    buildRow(t, "select-root");
    buildRow(t, "select-parent");
    buildRow(t, "center");
    buildRow(t, "zoom-in", "zoom-out");
    buildRow(t, "fold");
    t = node3.querySelector(".manipulation");
    buildRow(t, "insert-sibling");
    buildRow(t, "insert-child");
    buildRow(t, "swap");
    buildRow(t, "side");
    buildRow(t, "delete");
    t = node3.querySelector(".editing");
    buildRow(t, "value");
    buildRow(t, "yes", "no", "computed");
    buildRow(t, "edit");
    buildRow(t, "newline");
    buildRow(t, "bold");
    buildRow(t, "italic");
    buildRow(t, "underline");
    buildRow(t, "strikethrough");
    t = node3.querySelector(".other");
    buildRow(t, "undo", "redo");
    buildRow(t, "save");
    buildRow(t, "save-as");
    buildRow(t, "load");
    buildRow(t, "help");
    buildRow(t, "notes");
    buildRow(t, "ui");
  }
  function buildRow(table, ...commandNames) {
    var row = table.insertRow(-1);
    let labels = [];
    let keys = [];
    commandNames.forEach((name) => {
      let command = repo.get(name);
      if (!command) {
        console.warn(name);
        return;
      }
      labels.push(command.label);
      keys = keys.concat(command.keys.map(formatKey));
    });
    row.insertCell(-1).textContent = labels.join("/");
    row.insertCell(-1).textContent = keys.join("/");
  }
  function formatKey(key) {
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
    if (key.key) {
      let ch = key.key;
      str += MAP[ch] || ch.toUpperCase();
    }
    if (key.code) {
      let code = key.code;
      if (code.startsWith("Key")) {
        str += code.substring(3);
      } else {
        str += MAP[code] || code;
      }
    }
    return str;
  }
  function close() {
    node3.hidden = true;
  }

  // .js/ui/notes.js
  var notes_exports = {};
  __export(notes_exports, {
    close: () => close2,
    init: () => init2,
    toggle: () => toggle2
  });
  var node4 = document.querySelector("#notes");
  var iframe = node4.querySelector("iframe");
  function toggle2() {
    node4.hidden = !node4.hidden;
  }
  function close2() {
    if (node4.hidden) {
      return;
    }
    node4.hidden = true;
  }
  function onMessage(e) {
    if (!e.data || !e.data.action) {
      return;
    }
    switch (e.data.action) {
      case "setContent":
        currentItem.notes = e.data.value.trim();
        break;
      case "closeEditor":
        close2();
        break;
    }
  }
  function init2() {
    subscribe("item-select", (_message, publisher) => {
      iframe.contentWindow && iframe.contentWindow.postMessage({
        action: "setContent",
        value: publisher.notes
      }, "*");
    });
    window.addEventListener("message", onMessage);
  }

  // .js/ui/color.js
  var color_exports = {};
  __export(color_exports, {
    init: () => init3
  });

  // .js/action.js
  var Action = class {
    do() {
    }
    undo() {
    }
  };
  var Multi = class extends Action {
    constructor(actions13) {
      super();
      this.actions = actions13;
    }
    do() {
      this.actions.forEach((action2) => action2.do());
    }
    undo() {
      this.actions.slice().reverse().forEach((action2) => action2.undo());
    }
  };
  var InsertNewItem = class extends Action {
    constructor(parent, index2) {
      super();
      this.parent = parent;
      this.index = index2;
      this.item = new Item();
    }
    do() {
      this.parent.collapsed = false;
      this.parent.insertChild(this.item, this.index);
      selectItem(this.item);
    }
    undo() {
      this.parent.removeChild(this.item);
      selectItem(this.parent);
    }
  };
  var AppendItem = class extends Action {
    constructor(parent, item) {
      super();
      this.parent = parent;
      this.item = item;
    }
    do() {
      this.parent.insertChild(this.item);
      selectItem(this.item);
    }
    undo() {
      this.parent.removeChild(this.item);
      selectItem(this.parent);
    }
  };
  var RemoveItem = class extends Action {
    constructor(item) {
      super();
      this.item = item;
      this.parent = item.parent;
      this.index = this.parent.children.indexOf(this.item);
    }
    do() {
      this.parent.removeChild(this.item);
      selectItem(this.parent);
    }
    undo() {
      this.parent.insertChild(this.item, this.index);
      selectItem(this.item);
    }
  };
  var MoveItem = class extends Action {
    constructor(item, newParent, newIndex, newSide = null) {
      super();
      this.item = item;
      this.newParent = newParent;
      this.newIndex = newIndex;
      this.newSide = newSide;
      this.oldParent = item.parent;
      this.oldIndex = this.oldParent.children.indexOf(item);
      this.oldSide = item.side;
    }
    do() {
      const { item, newParent, newIndex, newSide } = this;
      item.side = newSide;
      if (newIndex === void 0) {
        newParent.insertChild(item);
      } else {
        newParent.insertChild(item, newIndex);
      }
      selectItem(item);
    }
    undo() {
      const { item, oldSide, oldIndex, oldParent, newParent } = this;
      item.side = oldSide;
      oldParent.insertChild(item, oldIndex);
      selectItem(newParent);
    }
  };
  var Swap = class extends Action {
    constructor(item, diff) {
      super();
      this.item = item;
      this.parent = item.parent;
      let children = this.parent.children;
      let sibling = this.parent.resolvedLayout.pickSibling(item, diff);
      this.sourceIndex = children.indexOf(item);
      this.targetIndex = children.indexOf(sibling);
    }
    do() {
      this.parent.insertChild(this.item, this.targetIndex);
    }
    undo() {
      this.parent.insertChild(this.item, this.sourceIndex);
    }
  };
  var SetLayout = class extends Action {
    constructor(item, layout) {
      super();
      this.item = item;
      this.layout = layout;
      this.oldLayout = item.layout;
    }
    do() {
      this.item.layout = this.layout;
    }
    undo() {
      this.item.layout = this.oldLayout;
    }
  };
  var SetShape = class extends Action {
    constructor(item, shape) {
      super();
      this.item = item;
      this.shape = shape;
      this.oldShape = item.shape;
    }
    do() {
      this.item.shape = this.shape;
    }
    undo() {
      this.item.shape = this.oldShape;
    }
  };
  var SetColor = class extends Action {
    constructor(item, color) {
      super();
      this.item = item;
      this.color = color;
      this.oldColor = item.color;
    }
    do() {
      this.item.color = this.color;
    }
    undo() {
      this.item.color = this.oldColor;
    }
  };
  var SetTextColor = class extends Action {
    constructor(item, textColor) {
      super();
      this.item = item;
      this.textColor = textColor;
      this.oldTextColor = item.textColor;
    }
    do() {
      this.item.textColor = this.textColor;
    }
    undo() {
      this.item.textColor = this.oldTextColor;
    }
  };
  var SetText = class extends Action {
    constructor(item, text) {
      super();
      this.item = item;
      this.text = text;
      this.oldText = item.text;
      this.oldValue = item.value;
    }
    do() {
      this.item.text = this.text;
      let numText = Number(this.text);
      if (String(numText) == this.text) {
        this.item.value = numText;
      }
    }
    undo() {
      this.item.text = this.oldText;
      this.item.value = this.oldValue;
    }
  };
  var SetValue = class extends Action {
    constructor(item, value) {
      super();
      this.item = item;
      this.value = value;
      this.oldValue = item.value;
    }
    do() {
      this.item.value = this.value;
    }
    undo() {
      this.item.value = this.oldValue;
    }
  };
  var SetStatus = class extends Action {
    constructor(item, status) {
      super();
      this.item = item;
      this.status = status;
      this.oldStatus = item.status;
    }
    do() {
      this.item.status = this.status;
    }
    undo() {
      this.item.status = this.oldStatus;
    }
  };
  var SetIcon = class extends Action {
    constructor(item, icon) {
      super();
      this.item = item;
      this.icon = icon;
      this.oldIcon = item.icon;
    }
    do() {
      this.item.icon = this.icon;
    }
    undo() {
      this.item.icon = this.oldIcon;
    }
  };
  var SetSide = class extends Action {
    constructor(item, side) {
      super();
      this.item = item;
      this.side = side;
      this.oldSide = item.side;
    }
    do() {
      this.item.side = this.side;
      this.item.update({ children: true });
    }
    undo() {
      this.item.side = this.oldSide;
      this.item.update({ children: true });
    }
  };

  // .js/ui/color.js
  var node5 = document.querySelector("#color");
  function init3() {
    node5.addEventListener("click", onClick);
    [...node5.querySelectorAll("[data-color]")].forEach((item) => {
      item.style.backgroundColor = item.dataset.color;
    });
  }
  function onClick(e) {
    e.preventDefault();
    let color = e.target.dataset.color || "";
    let action2 = new SetColor(currentItem, color);
    action(action2);
  }

  // .js/ui/text-color.js
  var text_color_exports = {};
  __export(text_color_exports, {
    init: () => init4
  });
  var node6 = document.querySelector("#text-color");
  function init4() {
    node6.addEventListener("click", onClick2);
    [...node6.querySelectorAll("[data-color]")].forEach((item) => {
      item.style.backgroundColor = item.dataset.color;
    });
  }
  function onClick2(e) {
    e.preventDefault();
    let color = e.target.dataset.color || "";
    let action2 = new SetTextColor(currentItem, color);
    action(action2);
  }

  // .js/ui/value.js
  var value_exports = {};
  __export(value_exports, {
    init: () => init5,
    update: () => update
  });
  var select = document.querySelector("#value");
  function init5() {
    select.addEventListener("change", onChange);
  }
  function update() {
    let value = currentItem.value;
    if (value === null) {
      value = "";
    }
    if (typeof value == "number") {
      value = "num";
    }
    select.value = value;
  }
  function onChange() {
    let value = select.value;
    if (value == "num") {
      repo.get("value").execute();
    } else {
      let action2 = new SetValue(currentItem, value || null);
      action(action2);
    }
  }

  // .js/ui/layout.js
  var layout_exports = {};
  __export(layout_exports, {
    init: () => init6,
    update: () => update2
  });

  // .js/layout/layout.js
  var OPPOSITE = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top"
  };
  var Layout = class {
    constructor(id, label, childDirection = "right") {
      this.id = id;
      this.label = label;
      this.childDirection = childDirection;
      this.SPACING_CHILD = 4;
      repo2.set(this.id, this);
    }
    get option() {
      return new Option(this.label, this.id);
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
      if (!item.collapsed) {
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
      let childItem = item;
      var parentLayout = childItem.parent.resolvedLayout;
      var thisChildDirection = parentLayout.getChildDirection(item);
      if (thisChildDirection == dir) {
        return childItem;
      } else if (thisChildDirection == OPPOSITE[dir]) {
        return childItem.parent;
      } else {
        return parentLayout.pickSibling(childItem, dir == "left" || dir == "top" ? -1 : 1);
      }
    }
    pickSibling(item, dir) {
      if (item.isRoot) {
        return item;
      }
      var children = item.parent.children;
      var index2 = children.indexOf(item);
      index2 += dir;
      index2 = (index2 + children.length) % children.length;
      return children[index2];
    }
    positionToggle(item, point) {
      item.dom.toggle.setAttribute("transform", `translate(${point.map(Math.round)})`);
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
      let bbox = [0, 0];
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

  // .js/layout/graph.js
  var SPACING_RANK = 16;
  var R = SPACING_RANK / 2;
  var GraphLayout = class extends Layout {
    update(item) {
      let totalHeight = this.layoutItem(item, this.childDirection);
      if (this.childDirection == "left" || this.childDirection == "right") {
        this.drawLinesHorizontal(item, this.childDirection);
      } else {
        this.drawLinesVertical(item, this.childDirection, totalHeight);
      }
    }
    layoutItem(item, rankDirection) {
      const { contentSize, children } = item;
      let rankIndex = rankDirection == "left" || rankDirection == "right" ? 0 : 1;
      let childIndex = (rankIndex + 1) % 2;
      let rankSize = contentSize[rankIndex];
      let childSize = contentSize[childIndex];
      if (!item.collapsed && children.length > 0) {
        let bbox = this.computeChildrenBBox(children, childIndex);
        rankSize += bbox[rankIndex] + SPACING_RANK;
        childSize = Math.max(childSize, bbox[childIndex]);
        let offset = [0, 0];
        if (rankDirection == "right") {
          offset[0] = contentSize[0] + SPACING_RANK;
        }
        if (rankDirection == "bottom") {
          offset[1] = contentSize[1] + SPACING_RANK;
        }
        offset[childIndex] = Math.round((childSize - bbox[childIndex]) / 2);
        this.layoutChildren(children, rankDirection, offset, bbox);
      }
      let labelPos = 0;
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
      return rankIndex == 0 ? childSize : rankSize;
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
      const dirModifier = side == "right" ? 1 : -1;
      let itemAnchor = [
        contentPosition[0] + (side == "right" ? contentSize[0] : 0) + dirModifier * 0.5,
        resolvedShape.getVerticalAnchor(item)
      ];
      let cross = [
        itemAnchor[0] + dirModifier * R,
        itemAnchor[1]
      ];
      this.positionToggle(item, cross);
      if (item.collapsed) {
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
        let midX = (itemAnchor[0] + childAnchor[0]) / 2;
        d.push(`M ${itemAnchor}`, `C ${[midX, itemAnchor[1]]} ${[midX, childAnchor[1]]} ${childAnchor}`);
        let path2 = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
        dom.connectors.append(path2);
        return;
      }
      d.push(`M ${itemAnchor}`, `L ${cross}`);
      const firstChild = children[0];
      const lastChild = children[children.length - 1];
      const cornerEndX = cross[0] + dirModifier * R;
      const sweep = dirModifier > 0 ? 0 : 1;
      let firstAnchor = [
        this.getChildAnchor(firstChild, side),
        firstChild.resolvedShape.getVerticalAnchor(firstChild) + firstChild.position[1]
      ];
      let lastAnchor = [
        this.getChildAnchor(lastChild, side),
        lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1]
      ];
      d.push(`M ${firstAnchor}`, `L ${cornerEndX} ${firstAnchor[1]}`, `A ${R} ${R} 0 0 ${sweep} ${cross[0]} ${firstAnchor[1] + R}`, `L ${cross[0]} ${lastAnchor[1] - R}`, `A ${R} ${R} 0 0 ${sweep} ${cornerEndX} ${lastAnchor[1]}`, `L ${lastAnchor}`);
      for (let i = 1; i < children.length - 1; i++) {
        const c = children[i];
        const y = c.resolvedShape.getVerticalAnchor(c) + c.position[1];
        let lineStart = [cross[0], y];
        let childAnchor = [this.getChildAnchor(c, side), y];
        d.push(`M ${lineStart}`, `L ${childAnchor}`);
      }
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
    drawLinesVertical(item, side, totalHeight) {
      const { contentSize, resolvedShape, resolvedColor, children, dom } = item;
      if (children.length == 0) {
        return;
      }
      const dirModifier = side == "bottom" ? 1 : -1;
      let itemAnchor = [
        resolvedShape.getHorizontalAnchor(item),
        side == "bottom" ? resolvedShape.getVerticalAnchor(item) : totalHeight - contentSize[1]
      ];
      let cross = [
        itemAnchor[0],
        (side == "bottom" ? contentSize[1] : itemAnchor[1]) + (R * dirModifier + 0.5)
      ];
      this.positionToggle(item, cross);
      if (item.collapsed) {
        return;
      }
      let d = [];
      d.push(`M ${itemAnchor}`, `L ${cross}`);
      if (children.length == 1) {
        let child = children[0];
        let childAnchor = [cross[0], this.getChildAnchor(child, side)];
        d.push(`M ${cross}`, `L ${childAnchor}`);
        let path2 = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
        dom.connectors.append(path2);
        return;
      }
      const firstChild = children[0];
      const lastChild = children[children.length - 1];
      const cornerEndY = cross[1] + dirModifier * R;
      const sweep = dirModifier > 0 ? 1 : 0;
      let firstAnchor = [
        firstChild.resolvedShape.getHorizontalAnchor(firstChild) + firstChild.position[0],
        this.getChildAnchor(firstChild, side)
      ];
      let lastAnchor = [
        lastChild.resolvedShape.getHorizontalAnchor(lastChild) + lastChild.position[0],
        this.getChildAnchor(lastChild, side)
      ];
      d.push(`M ${firstAnchor}`, `L ${firstAnchor[0]} ${cornerEndY}`, `A ${R} ${R} 0 0 ${sweep} ${firstAnchor[0] + R} ${cross[1]}`, `L ${lastAnchor[0] - R} ${cross[1]}`, `A ${R} ${R} 0 0 ${sweep} ${lastAnchor[0]} ${cornerEndY}`, `L ${lastAnchor}`);
      for (var i = 1; i < children.length - 1; i++) {
        const c = children[i];
        const x = c.resolvedShape.getHorizontalAnchor(c) + c.position[0];
        let lineStart = [x, cross[1]];
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
      let totalWidth = this.layoutItem(item, this.childDirection);
      this.drawLines(item, this.childDirection, totalWidth);
    }
    layoutItem(item, rankDirection) {
      const { contentSize, children } = item;
      let rankSize = contentSize[0];
      if (!item.collapsed && children.length > 0) {
        let bbox = this.computeChildrenBBox(children, 1);
        rankSize = Math.max(rankSize, bbox[0] + SPACING_RANK2);
        let offset = [SPACING_RANK2, contentSize[1] + this.SPACING_CHILD];
        if (rankDirection == "left") {
          offset[0] = rankSize - bbox[0] - SPACING_RANK2;
        }
        this.layoutChildren(children, rankDirection, offset, bbox);
      }
      let labelPos = 0;
      if (rankDirection == "left") {
        labelPos = rankSize - contentSize[0];
      }
      item.contentPosition = [labelPos, 0];
      return rankSize;
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
    drawLines(item, direction, totalWidth) {
      const { resolvedShape, resolvedColor, children, dom } = item;
      const dirModifier = direction == "right" ? 1 : -1;
      const lineX = (direction == "left" ? totalWidth - LINE_OFFSET : LINE_OFFSET) + 0.5;
      const toggleDistance = TOGGLE_SIZE + 2;
      let pointAnchor = [
        lineX,
        resolvedShape.getVerticalAnchor(item)
      ];
      this.positionToggle(item, [pointAnchor[0], pointAnchor[1] + toggleDistance]);
      if (children.length == 0 || item.collapsed) {
        return;
      }
      let lastChild = children[children.length - 1];
      let lineEnd = [
        lineX,
        lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1] - R2
      ];
      let d = [`M ${pointAnchor}`, `L ${lineEnd}`];
      let sweep = dirModifier > 0 ? 0 : 1;
      children.forEach((child) => {
        const { resolvedShape: resolvedShape2, position } = child;
        const y = resolvedShape2.getVerticalAnchor(child) + position[1];
        d.push(`M ${lineX} ${y - R2}`, `A ${R2} ${R2} 0 0 ${sweep} ${lineX + dirModifier * R2} ${y}`, `L ${this.getChildAnchor(child, direction)} ${y}`);
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
      let side = child.side;
      if (side) {
        return side;
      }
      let counts = { left: 0, right: 0 };
      child.parent.children.forEach((sibling) => {
        let side2 = sibling.side;
        if (!side2) {
          side2 = counts.right > counts.left ? "left" : "right";
          sibling.side = side2;
        }
        counts[side2]++;
      });
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
      var index2 = children.indexOf(item);
      index2 += dir;
      index2 = (index2 + children.length) % children.length;
      return children[index2];
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
      let bboxLeft = this.computeChildrenBBox(childrenLeft, 1);
      let bboxRight = this.computeChildrenBBox(childrenRight, 1);
      let height = Math.max(bboxLeft[1], bboxRight[1], contentSize[1]);
      let left = 0;
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
    drawRootConnectors(item, direction, children) {
      if (children.length == 0 || item.collapsed) {
        return;
      }
      const { contentSize, contentPosition, resolvedShape, dom } = item;
      let x1 = contentPosition[0] + contentSize[0] / 2;
      let y1 = resolvedShape.getVerticalAnchor(item);
      const half = this.LINE_THICKNESS / 2;
      let paths = children.map((child) => {
        const { resolvedColor, resolvedShape: resolvedShape2, position } = child;
        let x2 = this.getChildAnchor(child, direction);
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

  // .js/ui/layout.js
  var select2 = document.querySelector("#layout");
  function init6() {
    let layout = repo2.get("map");
    select2.append(layout.option);
    let label = buildGroup("Graph");
    let graphOptions = ["right", "left", "bottom", "top"].map((name) => {
      return repo2.get(`graph-${name}`).option;
    });
    label.append(...graphOptions);
    label = buildGroup("Tree");
    let treeOptions = ["right", "left"].map((name) => {
      return repo2.get(`tree-${name}`).option;
    });
    label.append(...treeOptions);
    select2.addEventListener("change", onChange2);
  }
  function update2() {
    var value = "";
    var layout = currentItem.layout;
    if (layout) {
      value = layout.id;
    }
    select2.value = value;
    getOption("").disabled = currentItem.isRoot;
    getOption("map").disabled = !currentItem.isRoot;
  }
  function onChange2() {
    let layout = repo2.get(select2.value);
    var action2 = new SetLayout(currentItem, layout);
    action(action2);
  }
  function getOption(value) {
    return select2.querySelector(`option[value="${value}"]`);
  }
  function buildGroup(label) {
    let node11 = document.createElement("optgroup");
    node11.label = label;
    select2.append(node11);
    return node11;
  }

  // .js/ui/icon.js
  var icon_exports = {};
  __export(icon_exports, {
    init: () => init7,
    update: () => update3
  });
  var select3 = document.querySelector("#icons");
  function init7() {
    select3.addEventListener("change", onChange3);
  }
  function update3() {
    select3.value = currentItem.icon || "";
  }
  function onChange3() {
    let action2 = new SetIcon(currentItem, select3.value);
    action(action2);
  }

  // .js/ui/shape.js
  var shape_exports = {};
  __export(shape_exports, {
    init: () => init8,
    update: () => update4
  });

  // .js/shape/shape.js
  var VERTICAL_OFFSET = 0.5;
  var Shape = class {
    constructor(id, label) {
      this.id = id;
      this.label = label;
      repo3.set(this.id, this);
    }
    get option() {
      return new Option(this.label, this.id);
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
  var repo3 = new Map();

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
  var VERTICAL_OFFSET2 = -4;
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

  // .js/ui/shape.js
  var select4 = document.querySelector("#shape");
  function init8() {
    repo3.forEach((shape) => select4.append(shape.option));
    select4.addEventListener("change", onChange4);
  }
  function update4() {
    let value = "";
    let shape = currentItem.shape;
    if (shape) {
      value = shape.id;
    }
    select4.value = value;
  }
  function onChange4() {
    let shape = repo3.get(select4.value);
    let action2 = new SetShape(currentItem, shape);
    action(action2);
  }

  // .js/ui/status.js
  var status_exports = {};
  __export(status_exports, {
    init: () => init9,
    update: () => update5
  });
  var select5 = document.querySelector("#status");
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
    return String(status);
  }
  function stringToStatus(str) {
    return str in STATUS_MAP ? STATUS_MAP[str] : str;
  }
  function init9() {
    select5.addEventListener("change", onChange5);
  }
  function update5() {
    select5.value = statusToString(currentItem.status);
  }
  function onChange5() {
    let status = stringToStatus(select5.value);
    let action2 = new SetStatus(currentItem, status);
    action(action2);
  }

  // .js/ui/tip.js
  var tip_exports = {};
  __export(tip_exports, {
    init: () => init10
  });
  var node7 = document.querySelector("#tip");
  function init10() {
    node7.addEventListener("click", hide);
    subscribe("command-child", hide);
    subscribe("command-sibling", hide);
  }
  function hide() {
    unsubscribe("command-child", hide);
    unsubscribe("command-sibling", hide);
    node7.removeEventListener("click", hide);
    node7.hidden = true;
  }

  // .js/ui/io.js
  var io_exports = {};
  __export(io_exports, {
    hide: () => hide2,
    init: () => init11,
    isActive: () => isActive,
    quickSave: () => quickSave,
    restore: () => restore,
    show: () => show
  });

  // .js/ui/backend/backend.js
  var BackendUI = class {
    constructor(backend, label) {
      this.backend = backend;
      this.label = label;
      this.mode = "load";
      repo4.set(this.id, this);
      this.prefix = `mm.app.${this.id}`;
      const { go, cancel } = this;
      cancel.addEventListener("click", (_) => hide2());
      go.addEventListener("click", (_) => this.submit());
    }
    get id() {
      return this.backend.id;
    }
    get node() {
      return document.querySelector(`#${this.id}`);
    }
    get cancel() {
      return this.node.querySelector(".cancel");
    }
    get go() {
      return this.node.querySelector(".go");
    }
    get option() {
      return new Option(this.label, this.id);
    }
    reset() {
      this.backend.reset();
    }
    setState(_data) {
    }
    getState() {
      return {};
    }
    show(mode2) {
      this.mode = mode2;
      const { go, node: node11 } = this;
      go.textContent = mode2.charAt(0).toUpperCase() + mode2.substring(1);
      [...node11.querySelectorAll("[data-for]")].forEach((node12) => node12.hidden = true);
      [...node11.querySelectorAll(`[data-for~=${mode2}]`)].forEach((node12) => node12.hidden = false);
      go.focus();
    }
    saveDone() {
      setThrobber(false);
      publish("save-done", this);
    }
    loadDone(json) {
      setThrobber(false);
      try {
        showMap(Map2.fromJSON(json));
        publish("load-done", this);
      } catch (e) {
        this.error(e);
      }
    }
    error(e) {
      setThrobber(false);
      let message = e instanceof Error ? e.message : e;
      alert(`IO error: ${message}`);
    }
    submit() {
      switch (this.mode) {
        case "save":
          this.save();
          break;
        case "load":
          this.load();
          break;
      }
    }
  };
  var repo4 = new Map();
  function buildList(list, select7) {
    let data = [];
    for (let id in list) {
      data.push({ id, name: list[id] });
    }
    data.sort((a, b) => a.name.localeCompare(b.name));
    let options = data.map((item) => new Option(item.name, item.id));
    select7.append(...options);
  }

  // .js/backend/backend.js
  var Backend = class {
    constructor(id) {
      this.id = id;
      repo5.set(id, this);
    }
    reset() {
    }
  };
  var repo5 = new Map();

  // .js/backend/local.js
  var Local = class extends Backend {
    constructor() {
      super("local");
      this.prefix = "mm.map";
    }
    save(data, id, name) {
      localStorage.setItem(`${this.prefix}.${id}`, data);
      let names = this.list();
      names[id] = name;
      localStorage.setItem(`${this.prefix}.names`, JSON.stringify(names));
    }
    load(id) {
      let data = localStorage.getItem(`${this.prefix}.${id}`);
      if (!data) {
        throw new Error("There is no such saved map");
      }
      return data;
    }
    remove(id) {
      localStorage.removeItem(`${this.prefix}.${id}`);
      let names = this.list();
      delete names[id];
      localStorage.setItem(`${this.prefix}.names`, JSON.stringify(names));
    }
    list() {
      try {
        let data = localStorage.getItem(`${this.prefix}.names`) || "{}";
        return JSON.parse(data);
      } catch (e) {
        return {};
      }
    }
  };

  // .js/format/format.js
  var Format = class {
    constructor(id, label) {
      this.id = id;
      this.label = label;
      repo6.set(id, this);
    }
    get option() {
      return new Option(this.label, this.id);
    }
  };
  var repo6 = new Map();
  function getByProperty(property, value) {
    let filtered = [...repo6.values()].filter((format) => format[property] == value);
    return filtered[0] || null;
  }
  function getByName(name) {
    let index2 = name.lastIndexOf(".");
    if (index2 == -1) {
      return null;
    }
    let extension = name.substring(index2 + 1).toLowerCase();
    return getByProperty("extension", extension);
  }
  function getByMime(mime) {
    return getByProperty("mime", mime);
  }
  function nl2br(str) {
    return str.replace(/\n/g, "<br/>");
  }
  function br2nl(str) {
    return str.replace(/<br\s*\/?>/g, "\n");
  }

  // .js/ui/backend/local.js
  var LocalUI = class extends BackendUI {
    constructor() {
      super(new Local(), "Browser storage");
      this.remove.addEventListener("click", (_) => {
        var id = this.list.value;
        if (!id) {
          return;
        }
        this.backend.remove(id);
        this.show(this.mode);
      });
    }
    get list() {
      return this.node.querySelector(".list");
    }
    get remove() {
      return this.node.querySelector(".remove");
    }
    show(mode2) {
      super.show(mode2);
      const { go, remove, list } = this;
      go.disabled = false;
      if (mode2 == "load") {
        let stored = this.backend.list();
        list.innerHTML = "";
        if (Object.keys(stored).length) {
          go.disabled = false;
          remove.disabled = false;
          buildList(stored, this.list);
        } else {
          this.go.disabled = true;
          this.remove.disabled = true;
          let o = document.createElement("option");
          o.innerHTML = "(no maps saved)";
          this.list.append(o);
        }
      }
    }
    setState(data) {
      this.load(data.id);
    }
    getState() {
      let data = {
        b: this.id,
        id: currentMap.id
      };
      return data;
    }
    save() {
      let json = currentMap.toJSON();
      let data = repo6.get("native").to(json);
      try {
        this.backend.save(data, currentMap.id, currentMap.name);
        this.saveDone();
      } catch (e) {
        this.error(e);
      }
    }
    load(id = this.list.value) {
      try {
        let data = this.backend.load(id);
        var json = repo6.get("native").from(data);
        this.loadDone(json);
      } catch (e) {
        this.error(e);
      }
    }
  };

  // .js/backend/file.js
  var File = class extends Backend {
    constructor() {
      super("file");
      this.input = document.createElement("input");
    }
    save(data, name) {
      let link = document.createElement("a");
      link.download = name;
      link.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
      document.body.append(link);
      link.click();
      link.remove();
    }
    load() {
      const { input } = this;
      input.type = "file";
      return new Promise((resolve, reject) => {
        input.onchange = (_) => {
          let file = input.files[0];
          if (!file) {
            return;
          }
          var reader = new FileReader();
          reader.onload = function() {
            resolve({ data: reader.result, name: file.name });
          };
          reader.onerror = function() {
            reject(reader.error);
          };
          reader.readAsText(file);
        };
        input.click();
      });
    }
  };

  // .js/format/native.js
  var Native = class extends Format {
    constructor() {
      super("native", "Native (JSON)");
      this.extension = "mymind";
      this.mime = "application/vnd.mymind+json";
    }
    to(data) {
      return JSON.stringify(data, null, "	") + "\n";
    }
    from(data) {
      return JSON.parse(data);
    }
  };

  // .js/format/freemind.js
  var Native2 = class extends Format {
    constructor(id = "freemind", label = "FreeMind") {
      super(id, label);
      this.extension = "mm";
      this.mime = "application/x-freemind";
    }
    to(data) {
      var doc = document.implementation.createDocument(null, null, null);
      var map = doc.createElement("map");
      map.setAttribute("version", "1.0.1");
      map.appendChild(this.serializeItem(doc, data.root));
      doc.appendChild(map);
      var serializer = new XMLSerializer();
      return serializer.serializeToString(doc);
    }
    from(data) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(data, "application/xml");
      if (doc.documentElement.nodeName.toLowerCase() == "parsererror") {
        throw new Error(doc.documentElement.textContent || "");
      }
      var root = doc.documentElement.getElementsByTagName("node")[0];
      if (!root) {
        throw new Error("No root node found");
      }
      var json = {
        root: this.parseNode(root, { shape: "underline" })
      };
      json.root.layout = "map";
      json.root.shape = "ellipse";
      return json;
    }
    serializeItem(doc, json) {
      var elm = this.serializeAttributes(doc, json);
      (json.children || []).forEach((child) => {
        elm.appendChild(this.serializeItem(doc, child));
      });
      return elm;
    }
    serializeAttributes(doc, json) {
      var elm = doc.createElement("node");
      elm.setAttribute("TEXT", br2nl(json.text));
      json.id && elm.setAttribute("ID", json.id);
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
    }
    parseNode(node11, parent) {
      var json = this.parseAttributes(node11, parent);
      for (var i = 0; i < node11.childNodes.length; i++) {
        var child = node11.childNodes[i];
        if (child instanceof Element && child.nodeName.toLowerCase() == "node") {
          json.children.push(this.parseNode(child, json));
        }
      }
      return json;
    }
    parseAttributes(node11, parent) {
      var json = {
        children: [],
        text: nl2br(node11.getAttribute("TEXT") || ""),
        id: node11.getAttribute("ID")
      };
      var position = node11.getAttribute("POSITION");
      if (position) {
        json.side = position;
      }
      var style = node11.getAttribute("STYLE");
      if (style == "bubble") {
        json.shape = "box";
      } else {
        json.shape = parent.shape;
      }
      if (node11.getAttribute("FOLDED") == "true") {
        json.collapsed = 1;
      }
      var children = node11.children;
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
    }
  };

  // .js/format/mma.js
  var MMA = class extends Native2 {
    constructor() {
      super("mma", "Mind Map Architect");
      this.extension = "mma";
      this.serializeAttributes = function(doc, json) {
        var elm = doc.createElement("node");
        elm.setAttribute("title", br2nl(json.text));
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
    }
    parseAttributes(node11, parent) {
      var json = {
        children: [],
        text: nl2br(node11.getAttribute("title") || ""),
        shape: "box"
      };
      if (node11.getAttribute("expand") == "false") {
        json.collapsed = 1;
      }
      var direction = node11.getAttribute("direction");
      if (direction == "0") {
        json.side = "left";
      }
      if (direction == "1") {
        json.side = "right";
      }
      var color = node11.getAttribute("color");
      if (color) {
        var re = color.match(/^#(....)(....)(....)$/);
        if (re) {
          let parts = re.slice(1).map((str) => parseInt(str, 16) >> 8).map((num) => Math.round(num / 17)).map((num) => num.toString(16));
          json.color = "#" + parts.join("");
        }
      }
      json.icon = node11.getAttribute("icon") || "";
      return json;
    }
  };

  // .js/format/mup.js
  var Native3 = class extends Format {
    constructor() {
      super("mup", "MindMup");
      this.extension = "mup";
    }
    to(data) {
      var root = MMtoMup(data.root);
      return JSON.stringify(root, null, 2);
    }
    from(data) {
      var source = JSON.parse(data);
      var root = MupToMM(source);
      root.layout = "map";
      return { root };
    }
  };
  function MupToMM(item) {
    var json = {
      text: nl2br(item.title),
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
        var child = MupToMM(item.ideas[key]);
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
      json.children = data.map((item2) => item2.child);
    }
    return json;
  }
  function MMtoMup(item, side) {
    var result = {
      id: item.id,
      title: br2nl(item.text),
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
        result.ideas[key] = MMtoMup(child, childSide);
      }
    }
    return result;
  }

  // .js/format/plaintext.js
  var Plaintext = class extends Format {
    constructor() {
      super("plaintext", "Plain text");
      this.extension = "txt";
      this.mime = "application/vnd.mymind+txt";
    }
    to(data) {
      return serializeItem("root" in data ? data.root : data);
    }
    from(data) {
      var lines = data.split("\n").filter(function(line) {
        return line.match(/\S/);
      });
      var items = parseItems(lines);
      let result;
      if (items.length == 1) {
        result = {
          root: items[0]
        };
      } else {
        result = {
          root: {
            text: "",
            children: items
          }
        };
      }
      result.root.layout = "map";
      return result;
    }
  };
  function serializeItem(item, depth = 0) {
    var lines = (item.children || []).map((child) => {
      return serializeItem(child, depth + 1);
    });
    var prefix = new Array(depth + 1).join("	");
    lines.unshift(prefix + item.text.replace(/\n/g, ""));
    return lines.join("\n") + (depth ? "" : "\n");
  }
  function parseItems(lines) {
    let items = [];
    if (!lines.length) {
      return items;
    }
    var firstPrefix = parsePrefix(lines[0]);
    let currentItem2 = null;
    let childLines = [];
    var convertChildLinesToChildren = function() {
      if (!currentItem2 || !childLines.length) {
        return;
      }
      var children = parseItems(childLines);
      if (children.length) {
        currentItem2.children = children;
      }
      childLines = [];
    };
    lines.forEach((line) => {
      if (parsePrefix(line) == firstPrefix) {
        convertChildLinesToChildren();
        currentItem2 = { text: line.match(/^\s*(.*)/)[1] };
        items.push(currentItem2);
      } else {
        childLines.push(line);
      }
    });
    convertChildLinesToChildren();
    return items;
  }
  function parsePrefix(line) {
    return line.match(/^\s*/)[0];
  }

  // .js/ui/format-select.js
  var all = [Native, Native2, MMA, Native3, Plaintext].map((ctor) => new ctor());
  function fill(select7) {
    let nodes = all.map((bui) => bui.option);
    select7.append(...nodes);
  }

  // .js/ui/backend/file.js
  var FileUI = class extends BackendUI {
    constructor() {
      super(new File(), "File");
      fill(this.format);
      this.format.value = localStorage.getItem(this.prefix + "format") || "native";
    }
    get format() {
      return this.node.querySelector(".format");
    }
    show(mode2) {
      super.show(mode2);
      this.go.textContent = mode2 == "save" ? "Save" : "Browse";
    }
    save() {
      let format = repo6.get(this.format.value);
      var json = currentMap.toJSON();
      var data = format.to(json);
      var name = currentMap.name + "." + format.extension;
      try {
        this.backend.save(data, name);
        this.saveDone();
      } catch (e) {
        this.error(e);
      }
    }
    async load() {
      try {
        let data = await this.backend.load();
        let format = getByName(data.name) || repo6.get("native");
        let json = format.from(data.data);
        this.loadDone(json);
      } catch (e) {
        this.error(e);
      }
    }
    submit() {
      localStorage.setItem(`${this.prefix}.format`, this.format.value);
      super.submit();
    }
  };

  // .js/backend/webdav.js
  var WebDAV = class extends Backend {
    constructor() {
      super("webdav");
    }
    save(data, url) {
      return this.request("PUT", url, data);
    }
    load(url) {
      return this.request("GET", url);
    }
    async request(method, url, data) {
      let init20 = {
        method,
        credentials: "include"
      };
      if (data) {
        init20.body = data;
      }
      let response = await fetch(url, init20);
      let text = await response.text();
      if (response.status == 200) {
        return text;
      } else {
        throw new Error(`HTTP/${response.status}

${text}`);
      }
    }
  };

  // .js/ui/backend/webdav.js
  var WebDAVUI = class extends BackendUI {
    constructor() {
      super(new WebDAV(), "Generic WebDAV");
      this.current = "";
      this.url.value = localStorage.getItem(`${this.prefix}.url`) || "";
    }
    get url() {
      return this.node.querySelector(".url");
    }
    getState() {
      let data = { url: this.current };
      return data;
    }
    setState(data) {
      this.load(data.url);
    }
    async save() {
      setThrobber(true);
      var map = currentMap;
      var url = this.url.value;
      localStorage.setItem(`${this.prefix}.url`, url);
      if (url.match(/\.mymind$/)) {
      } else {
        if (url.charAt(url.length - 1) != "/") {
          url += "/";
        }
        url += `${map.name}.${repo6.get("native").extension}`;
      }
      this.current = url;
      let json = map.toJSON();
      let data = repo6.get("native").to(json);
      try {
        await this.backend.save(data, url);
        this.saveDone();
      } catch (e) {
        this.error(e);
      }
    }
    async load(url = this.url.value) {
      this.current = url;
      setThrobber(true);
      var lastIndex = url.lastIndexOf("/");
      this.url.value = url.substring(0, lastIndex);
      localStorage.setItem(`${this.prefix}.url`, this.url.value);
      try {
        let data = await this.backend.load(url);
        let json = repo6.get("native").from(data);
        this.loadDone(json);
      } catch (e) {
        this.error(e);
      }
    }
  };

  // .js/backend/image.js
  var ImageBackend = class extends Backend {
    constructor() {
      super("image");
    }
    async save(format) {
      const serializer = new XMLSerializer();
      const encoder = new TextEncoder();
      let xmlStr = serializer.serializeToString(currentMap.node);
      let encoded = encoder.encode(xmlStr);
      let byteString = [...encoded].map((byte) => String.fromCharCode(byte)).join("");
      let base64 = btoa(byteString);
      let svgUrl = `data:image/svg+xml;base64,${base64}`;
      switch (format) {
        case "svg":
          return svgUrl;
        case "png":
          let img = await waitForImageLoad(svgUrl);
          let canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext("2d").drawImage(img, 0, 0);
          return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), "image/png");
          });
          break;
      }
    }
    download(href) {
      let link = document.createElement("a");
      link.download = currentMap.name;
      link.href = href;
      link.click();
    }
  };
  async function waitForImageLoad(src) {
    let img = new Image();
    img.src = src;
    return new Promise((resolve) => {
      img.onload = () => resolve(img);
    });
  }

  // .js/ui/backend/image.js
  var ImageUI = class extends BackendUI {
    constructor() {
      super(new ImageBackend(), "Image");
    }
    get format() {
      return this.node.querySelector(".format");
    }
    async save() {
      let url = await this.backend.save(this.format.value);
      this.backend.download(url);
    }
    load() {
    }
  };

  // .js/backend/gdrive.js
  var SCOPE = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install";
  var CLIENT_ID = "767837575056-h87qmlhmhb3djhaaqta5gv2v3koa9hii.apps.googleusercontent.com";
  var API_KEY = "AIzaSyCzu1qVxlgufneOYpBgDJXN6Z9SNVcHYWM";
  var GDrive = class extends Backend {
    constructor() {
      super("gdrive");
      this.fileId = null;
    }
    reset() {
      this.fileId = null;
    }
    async save(data, name, mime) {
      await connect();
      this.fileId = await this.send(data, name, mime);
    }
    send(data, name, mime) {
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
      return new Promise((resolve, reject) => {
        request.execute((response) => {
          if (!response) {
            reject(new Error("Failed to upload to Google Drive"));
          } else if (response.error) {
            reject(response.error);
          } else {
            resolve(response.id);
          }
        });
      });
    }
    async load(id) {
      await connect();
      this.fileId = id;
      var request = gapi.client.request({
        path: "/drive/v2/files/" + this.fileId,
        method: "GET"
      });
      return new Promise((resolve, reject) => {
        request.execute(async (response) => {
          if (!response || !response.id) {
            return reject(response && response.error || new Error("Failed to download file"));
          }
          let headers = { "Authentication": "Bearer " + gapi.auth.getToken().access_token };
          let r = await fetch(`https://www.googleapis.com/drive/v2/files/${response.id}?alt=media`, { headers });
          let data = await r.text();
          if (r.status != 200) {
            return reject(data);
          }
          resolve({ data, name: response.title, mime: response.mimeType });
        });
      });
    }
    async pick() {
      await connect();
      var token = gapi.auth.getToken();
      var mimeTypes = ["application/json; charset=UTF-8", "application/json"];
      [...repo6.values()].forEach((format) => {
        if (format.mime) {
          mimeTypes.unshift(format.mime);
        }
      });
      var view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(mimeTypes.join(",")).setMode(google.picker.DocsViewMode.LIST);
      return new Promise((resolve) => {
        let picker = new google.picker.PickerBuilder().enableFeature(google.picker.Feature.NAV_HIDDEN).addView(view).setOAuthToken(token.access_token).setDeveloperKey(API_KEY).setCallback((data) => {
          switch (data[google.picker.Response.ACTION]) {
            case google.picker.Action.PICKED:
              var doc = data[google.picker.Response.DOCUMENTS][0];
              resolve(doc.id);
              break;
            case google.picker.Action.CANCEL:
              resolve(null);
              break;
          }
        }).build();
        picker.setVisible(true);
      });
    }
  };
  async function connect() {
    if ("gapi" in window && gapi.auth.getToken()) {
      return;
    } else {
      await loadGapi();
      return auth();
    }
  }
  function loadGapi() {
    if ("gapi" in window) {
      return;
    }
    let script = document.createElement("script");
    let name = ("cb" + Math.random()).replace(".", "");
    script.src = "https://apis.google.com/js/client:picker.js?onload=" + name;
    document.body.append(script);
    return new Promise((resolve) => window[name] = resolve);
  }
  async function auth(forceUI = false) {
    return new Promise((resolve, reject) => {
      gapi.auth.authorize({
        "client_id": CLIENT_ID,
        "scope": SCOPE,
        "immediate": !forceUI
      }, async (token) => {
        if (token && !token.error) {
          resolve();
        } else if (!forceUI) {
          try {
            await auth(true);
            resolve();
          } catch (e) {
            reject(e);
          }
        } else {
          reject(token && token.error || new Error("Failed to authorize with Google"));
        }
      });
    });
  }

  // .js/ui/backend/gdrive.js
  var GDriveUI = class extends BackendUI {
    constructor() {
      super(new GDrive(), "Google Drive");
      fill(this.format);
      this.format.value = localStorage.getItem(`${this.prefix}.format`) || "native";
    }
    get format() {
      return this.node.querySelector(".format");
    }
    async save() {
      setThrobber(true);
      let format = repo6.get(this.format.value);
      let json = currentMap.toJSON();
      let data = format.to(json);
      let name = currentMap.name;
      let mime = "text/plain";
      if (format.mime) {
        mime = format.mime;
      } else {
        name += "." + format.extension;
      }
      try {
        await this.backend.save(data, name, mime);
        this.saveDone();
      } catch (e) {
        this.error(e);
      }
    }
    async load() {
      setThrobber(true);
      try {
        let id = await this.backend.pick();
        this.picked(id);
      } catch (e) {
        this.error(e);
      }
    }
    async picked(id) {
      setThrobber(false);
      if (!id) {
        return;
      }
      setThrobber(true);
      try {
        let data = await this.backend.load(id);
        let format = getByMime(data.mime) || getByName(data.name) || repo6.get("native");
        let json = format.from(data.data);
        this.loadDone(json);
      } catch (e) {
        this.error(e);
      }
    }
    setState(data) {
      this.picked(data.id);
    }
    getState() {
      let data = {
        b: this.id,
        id: this.backend.fileId
      };
      return data;
    }
  };

  // .js/backend/firebase.js
  var Firebase = class extends Backend {
    constructor() {
      super("firebase");
      this.current = {
        id: null,
        name: null,
        data: null
      };
    }
    connect(server, auth2) {
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
      this.ref.child("names").on("value", (snap) => {
        publish("firebase-list", this, snap.val() || {});
      }, this);
      if (auth2) {
        return this.login(auth2);
      }
    }
    save(data, id, name) {
      this.ref.child("names/" + id).set(name);
      return new Promise((resolve, reject) => {
        this.ref.child("data/" + id).set(data, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
            this.listenStart(data, id);
          }
        });
      });
    }
    load(id) {
      return new Promise((resolve, reject) => {
        this.ref.child("data/" + id).once("value", (snap) => {
          var data = snap.val();
          if (data) {
            resolve(data);
            this.listenStart(data, id);
          } else {
            reject(new Error("There is no such saved map"));
          }
        });
      });
    }
    remove(id) {
      this.ref.child("names/" + id).remove();
      return new Promise((resolve, reject) => {
        this.ref.child("data/" + id).remove((err) => {
          err ? reject(err) : resolve();
        });
      });
    }
    reset() {
      this.listenStop();
    }
    mergeWith(data, name) {
      let id = this.current.id;
      if (name != this.current.name) {
        this.current.name = name;
        this.ref.child("names/" + id).set(name);
      }
      var dataRef = this.ref.child("data/" + id);
      var oldData = this.current.data;
      this.listenStop();
      this.recursiveRefMerge(dataRef, oldData, data);
      this.listenStart(data, id);
    }
    recursiveRefMerge(ref, oldData, newData) {
      let updateObject = {};
      if (newData instanceof Array) {
        for (var i = 0; i < newData.length; i++) {
          var newValue = newData[i];
          if (!(i in oldData)) {
            updateObject[i] = newValue;
          } else if (typeof newValue == "object") {
            this.recursiveRefMerge(ref.child(i), oldData[i], newValue);
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
            this.recursiveRefMerge(ref.child(p), oldData[p], newValue);
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
    }
    listenStart(data, id) {
      if (this.current.id && this.current.id == id) {
        return;
      }
      this.listenStop();
      this.current.id = id;
      this.current.data = data;
      this.ref.child("data/" + id).on("value", this.onValueChange, this);
    }
    listenStop() {
      if (!this.current.id) {
        return;
      }
      this.ref.child("data/" + this.current.id).off("value");
      this.current.id = null;
      this.current.name = null;
      this.current.data = null;
    }
    onValueChange(snap) {
      this.current.data = snap.val();
      clearTimeout(this.changeTimeout);
      this.changeTimeout = setTimeout(() => {
        publish("firebase-change", this, this.current.data);
      }, 200);
    }
    async login(type) {
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
      let result = await firebase.auth().signInWithPopup(provider);
      return result.user;
    }
  };

  // .js/ui/backend/firebase.js
  var FirebaseUI = class extends BackendUI {
    constructor() {
      super(new Firebase(), "Firebase");
      this.online = false;
      const { server, auth: auth2, remove, go } = this;
      server.value = localStorage.getItem(`${this.prefix}.server`) || "my-mind";
      auth2.value = localStorage.getItem(`${this.prefix}.auth`) || "";
      go.disabled = false;
      remove.addEventListener("click", async (_) => {
        var id = this.list.value;
        if (!id) {
          return;
        }
        setThrobber(true);
        try {
          await this.backend.remove(id);
          setThrobber(false);
        } catch (e) {
          this.error(e);
        }
      });
      subscribe("firebase-list", this);
      subscribe("firebase-change", this);
    }
    get auth() {
      return this.node.querySelector(".auth");
    }
    get server() {
      return this.node.querySelector(".server");
    }
    get remove() {
      return this.node.querySelector(".remove");
    }
    get list() {
      return this.node.querySelector(".list");
    }
    async setState(data) {
      try {
        await this.connect(data.s, data.a);
        this.load(data.id);
      } catch (e) {
        this.error(e);
      }
    }
    getState() {
      var data = {
        id: currentMap.id,
        b: this.id,
        s: this.server.value
      };
      if (this.auth.value) {
        data.a = this.auth.value;
      }
      return data;
    }
    show(mode2) {
      super.show(mode2);
      this.sync();
    }
    handleMessage(message, _publisher, data) {
      switch (message) {
        case "firebase-list":
          this.list.innerHTML = "";
          if (Object.keys(data).length) {
            buildList(data, this.list);
          } else {
            var o = document.createElement("option");
            o.innerHTML = "(no maps saved)";
            this.list.appendChild(o);
          }
          this.sync();
          break;
        case "firebase-change":
          if (data) {
            unsubscribe("item-change", this);
            currentMap.mergeWith(data);
            subscribe("item-change", this);
          } else {
            console.log("remote data disappeared");
          }
          break;
        case "item-change":
          clearTimeout(this.itemChangeTimeout);
          this.itemChangeTimeout = setTimeout(() => this.onItemChange(), 200);
          break;
      }
    }
    reset() {
      this.backend.reset();
      unsubscribe("item-change", this);
    }
    onItemChange() {
      var map = currentMap;
      this.backend.mergeWith(map.toJSON(), map.name);
    }
    submit() {
      if (!this.online) {
        this.connect(this.server.value, this.auth.value);
        return;
      }
      super.submit();
    }
    async save() {
      setThrobber(true);
      var map = currentMap;
      try {
        await this.backend.save(map.toJSON(), map.id, map.name);
        this.saveDone();
        subscribe("item-change", this);
      } catch (e) {
        this.error(e);
      }
    }
    async load(id = this.list.value) {
      setThrobber(true);
      try {
        let data = await this.backend.load(id);
        this.loadDone(data);
        subscribe("item-change", this);
      } catch (e) {
        this.error(e);
      }
    }
    async connect(server, auth2) {
      this.server.value = server;
      this.auth.value = auth2 || "";
      this.server.disabled = true;
      this.auth.disabled = true;
      localStorage.setItem(`${this.prefix}.server`, server);
      localStorage.setItem(`${this.prefix}.auth`, auth2 || "");
      this.go.disabled = true;
      setThrobber(true);
      await this.backend.connect(server, auth2);
      setThrobber(false);
      this.online = true;
      this.sync();
    }
    sync() {
      if (!this.online) {
        this.go.textContent = "Connect";
        return;
      }
      this.go.disabled = false;
      if (this.mode == "load" && !this.list.value) {
        this.go.disabled = true;
      }
      this.go.textContent = this.mode.charAt(0).toUpperCase() + this.mode.substring(1);
    }
  };

  // .js/ui/io.js
  var currentMode = "load";
  var currentBackend = null;
  var node8 = document.querySelector("#io");
  var select6 = node8.querySelector("#backend");
  var PREFIX = "mm.app";
  function isActive() {
    return node8.contains(document.activeElement);
  }
  function init11() {
    [LocalUI, FirebaseUI, GDriveUI, FileUI, WebDAVUI, ImageUI].forEach((ctor) => {
      let bui = new ctor();
      select6.append(bui.option);
    });
    select6.value = localStorage.getItem(`${PREFIX}.backend`) || "file";
    select6.addEventListener("change", syncBackend);
    subscribe("map-new", (_) => setCurrentBackend(null));
    subscribe("save-done", onDone);
    subscribe("load-done", onDone);
  }
  function onDone(_message, publisher) {
    hide2();
    setCurrentBackend(publisher);
  }
  function restore() {
    let parts = {};
    location.search.substring(1).split("&").forEach((item) => {
      let keyvalue = item.split("=").map(decodeURIComponent);
      parts[keyvalue[0]] = keyvalue[1];
    });
    if ("map" in parts) {
      parts.url = parts.map;
    }
    if ("url" in parts && !("b" in parts)) {
      parts.b = "webdav";
    }
    let backend = repo4.get(parts.b);
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
          repo4.get("gdrive").setState(state);
        } else {
          history.replaceState(null, "", ".");
        }
      } catch (e) {
      }
      return;
    }
    setThrobber(false);
  }
  function show(mode2) {
    currentMode = mode2;
    node8.hidden = false;
    node8.querySelector("h3").textContent = mode2;
    syncBackend();
  }
  function hide2() {
    node8.hidden = true;
  }
  function quickSave() {
    if (currentBackend) {
      currentBackend.save();
    } else {
      show("save");
    }
  }
  function syncBackend() {
    [...node8.querySelectorAll("div[id]")].forEach((node11) => node11.hidden = true);
    node8.querySelector(`#${select6.value}`).hidden = false;
    repo4.get(select6.value).show(currentMode);
  }
  function setCurrentBackend(backend) {
    if (currentBackend && currentBackend != backend) {
      currentBackend.reset();
    }
    if (backend) {
      localStorage.setItem(`${PREFIX}.backend`, backend.id);
    }
    currentBackend = backend;
    try {
      updateURL();
    } catch (e) {
    }
  }
  function updateURL() {
    let data = currentBackend && currentBackend.getState();
    if (!data) {
      history.replaceState(null, "", ".");
    } else {
      let arr = Object.entries(data).map((pair) => pair.map(encodeURIComponent).join("="));
      history.replaceState(null, "", "?" + arr.join("&"));
    }
  }

  // .js/ui/context-menu.js
  var node9 = document.querySelector("#context-menu");
  var port;
  function init12(port_) {
    port = port_;
    [...node9.querySelectorAll("[data-command]")].forEach((button) => {
      let commandName = button.dataset.command;
      button.textContent = repo.get(commandName).label;
    });
    port.addEventListener("mousedown", handleEvent);
    node9.addEventListener("mousedown", handleEvent);
    close3();
  }
  function open(point) {
    node9.hidden = false;
    let w = node9.offsetWidth;
    let h = node9.offsetHeight;
    let left = point[0];
    let top = point[1];
    if (left > port.offsetWidth / 2) {
      left -= w;
    }
    if (top > port.offsetHeight / 2) {
      top -= h;
    }
    node9.style.left = `${left}px`;
    node9.style.top = `${top}px`;
  }
  function handleEvent(e) {
    if (e.currentTarget != node9) {
      close3();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    let commandName = e.target.dataset.command;
    if (!commandName) {
      return;
    }
    let command = repo.get(commandName);
    if (!command.isValid) {
      return;
    }
    command.execute();
    close3();
  }
  function close3() {
    node9.hidden = true;
  }

  // .js/ui/ui.js
  var node10 = document.querySelector("#ui");
  function isActive2() {
    return node10.contains(document.activeElement) || isActive();
  }
  function toggle3() {
    node10.hidden = !node10.hidden;
    publish("ui-change");
  }
  function getWidth() {
    return node10.hidden ? 0 : node10.offsetWidth;
  }
  function update6() {
    [layout_exports, shape_exports, icon_exports, value_exports, status_exports].forEach((ui5) => ui5.update());
  }
  function onClick3(e) {
    let target = e.target;
    if (target == node10.querySelector("#toggle")) {
      toggle3();
      return;
    }
    let current2 = target;
    while (true) {
      let command = current2.dataset.command;
      if (command) {
        repo.get(command).execute();
        return;
      }
      if (current2.parentNode instanceof Element) {
        current2 = current2.parentNode;
      } else {
        return;
      }
    }
  }
  function init13(port4) {
    [
      layout_exports,
      shape_exports,
      icon_exports,
      value_exports,
      status_exports,
      color_exports,
      text_color_exports,
      help_exports,
      tip_exports,
      notes_exports,
      io_exports
    ].forEach((ui5) => ui5.init());
    init12(port4);
    subscribe("item-select", update6);
    subscribe("item-change", (_message, publisher) => {
      if (publisher == currentItem) {
        update6();
      }
    });
    node10.addEventListener("click", onClick3);
    restore();
  }

  // .js/command/command.js
  var PAN_AMOUNT = 15;
  function isMac() {
    return !!navigator.platform.match(/mac/i);
  }
  var repo = new Map();
  var Command = class {
    constructor(id, label) {
      this.label = label;
      this.editMode = false;
      repo.set(id, this);
    }
    get isValid() {
      return this.editMode === null || this.editMode == editing;
    }
  };
  new class Notes extends Command {
    constructor() {
      super("notes", "Notes");
      this.keys = [{ code: "KeyM", ctrlKey: true }];
    }
    execute() {
      toggle2();
    }
  }();
  new class Undo extends Command {
    constructor() {
      super("undo", "Undo");
      this.keys = [{ code: "KeyZ", ctrlKey: true }];
    }
    get isValid() {
      return super.isValid && canBack();
    }
    execute() {
      back();
    }
  }();
  new class Redo extends Command {
    constructor() {
      super("redo", "Redo");
      this.keys = [{ code: "KeyY", ctrlKey: true }];
    }
    get isValid() {
      return super.isValid && canForward();
    }
    execute() {
      forward();
    }
  }();
  new class InsertSibling extends Command {
    constructor() {
      super("insert-sibling", "Insert a sibling");
      this.keys = [{ code: "Enter" }];
    }
    execute() {
      let item = currentItem;
      let action2;
      if (item.isRoot) {
        action2 = new InsertNewItem(item, item.children.length);
      } else {
        let parent = item.parent;
        let index2 = parent.children.indexOf(item);
        action2 = new InsertNewItem(parent, index2 + 1);
      }
      action(action2);
      repo.get("edit").execute();
      publish("command-sibling");
    }
  }();
  new class InsertChild extends Command {
    constructor() {
      super("insert-child", "Insert a child");
      this.keys = [
        { code: "Tab", ctrlKey: false },
        { code: "Insert" }
      ];
    }
    execute() {
      let item = currentItem;
      let action2 = new InsertNewItem(item, item.children.length);
      action(action2);
      repo.get("edit").execute();
      publish("command-child");
    }
  }();
  new class Delete extends Command {
    constructor() {
      super("delete", "Delete an item");
      this.keys = [{ code: isMac() ? "Backspace" : "Delete" }];
    }
    get isValid() {
      return super.isValid && !currentItem.isRoot;
    }
    execute() {
      let action2 = new RemoveItem(currentItem);
      action(action2);
    }
  }();
  new class Swap2 extends Command {
    constructor() {
      super("swap", "Swap sibling");
      this.keys = [
        { code: "ArrowUp", ctrlKey: true },
        { code: "ArrowDown", ctrlKey: true }
      ];
    }
    execute(e) {
      let current2 = currentItem;
      if (current2.isRoot || current2.parent.children.length < 2) {
        return;
      }
      let diff = e.code == "ArrowUp" ? -1 : 1;
      let action2 = new Swap(current2, diff);
      action(action2);
    }
  }();
  new class SetSide2 extends Command {
    constructor() {
      super("side", "Change side");
      this.keys = [
        { code: "ArrowLeft", ctrlKey: true },
        { code: "ArrowRight", ctrlKey: true }
      ];
    }
    execute(e) {
      let current2 = currentItem;
      if (current2.isRoot || !current2.parent.isRoot) {
        return;
      }
      let side = e.code == "ArrowLeft" ? "left" : "right";
      let action2 = new SetSide(currentItem, side);
      action(action2);
    }
  }();
  new class Save extends Command {
    constructor() {
      super("save", "Save map");
      this.keys = [{ code: "KeyS", ctrlKey: true, shiftKey: false }];
    }
    execute() {
      quickSave();
    }
  }();
  new class SaveAs extends Command {
    constructor() {
      super("save-as", "Save as\u2026");
      this.keys = [{ code: "KeyS", ctrlKey: true, shiftKey: true }];
    }
    execute() {
      show("save");
    }
  }();
  new class Load extends Command {
    constructor() {
      super("load", "Load map");
      this.keys = [{ code: "KeyO", ctrlKey: true }];
    }
    execute() {
      show("load");
    }
  }();
  new class Center extends Command {
    constructor() {
      super("center", "Center map");
      this.keys = [{ code: "End" }];
    }
    execute() {
      currentMap.center();
    }
  }();
  new class New extends Command {
    constructor() {
      super("new", "New map");
      this.keys = [{ code: "KeyN", ctrlKey: true }];
    }
    execute() {
      if (!confirm("Throw away your current map and start a new one?")) {
        return;
      }
      showMap(new Map2());
      publish("map-new", this);
    }
  }();
  new class ZoomIn extends Command {
    constructor() {
      super("zoom-in", "Zoom in");
      this.keys = [{ key: "+" }];
    }
    execute() {
      currentMap.adjustFontSize(1);
    }
  }();
  new class ZoomOut extends Command {
    constructor() {
      super("zoom-out", "Zoom out");
      this.keys = [{ key: "-" }];
    }
    execute() {
      currentMap.adjustFontSize(-1);
    }
  }();
  new class Help extends Command {
    constructor() {
      super("help", "Show/hide help");
      this.keys = [{ key: "?" }];
    }
    execute() {
      toggle();
    }
  }();
  new class UI extends Command {
    constructor() {
      super("ui", "Show/hide UI");
      this.keys = [{ key: "*" }];
    }
    execute() {
      toggle3();
    }
  }();
  new class Pan extends Command {
    constructor() {
      super("pan", "Pan the map");
      this.keys = [
        { code: "KeyW", ctrlKey: false, altKey: false, metaKey: false },
        { code: "KeyA", ctrlKey: false, altKey: false, metaKey: false },
        { code: "KeyS", ctrlKey: false, altKey: false, metaKey: false },
        { code: "KeyD", ctrlKey: false, altKey: false, metaKey: false }
      ];
      this.codes = [];
    }
    execute(e) {
      const { code } = e;
      var index2 = this.codes.indexOf(code);
      if (index2 > -1) {
        return;
      }
      if (!this.codes.length) {
        window.addEventListener("keyup", this);
        this.interval = setInterval(() => this.step(), 50);
      }
      this.codes.push(code);
      this.step();
    }
    step() {
      const dirs = {
        "KeyW": [0, 1],
        "KeyA": [1, 0],
        "KeyS": [0, -1],
        "KeyD": [-1, 0]
      };
      let offset = [0, 0];
      this.codes.forEach((code) => {
        offset[0] += dirs[code][0] * PAN_AMOUNT;
        offset[1] += dirs[code][1] * PAN_AMOUNT;
      });
      currentMap.moveBy(offset);
    }
    handleEvent(e) {
      const { code } = e;
      var index2 = this.codes.indexOf(code);
      if (index2 > -1) {
        this.codes.splice(index2, 1);
        if (!this.codes.length) {
          window.removeEventListener("keyup", this);
          clearInterval(this.interval);
        }
      }
    }
  }();
  new class Fold extends Command {
    constructor() {
      super("fold", "Fold/Unfold");
      this.keys = [{ key: "f", ctrlKey: false }];
    }
    execute() {
      let item = currentItem;
      item.collapsed = !item.collapsed;
      currentMap.ensureItemVisibility(item);
    }
  }();

  // .js/item.js
  var TOGGLE_SIZE = 6;
  var UPDATE_OPTIONS = {
    parent: true,
    children: false
  };
  var Item = class {
    constructor() {
      this._id = generateId();
      this._parent = null;
      this._collapsed = false;
      this._icon = "";
      this._notes = "";
      this._color = "";
      this._textColor = "";
      this._value = null;
      this._status = null;
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
        toggle: buildToggle()
      };
      this.children = [];
      const { dom } = this;
      dom.node.classList.add("item");
      dom.content.classList.add("content");
      dom.notes.classList.add("notes");
      dom.status.classList.add("status");
      dom.icon.classList.add("icon");
      dom.value.classList.add("value");
      dom.text.classList.add("text");
      dom.icon.classList.add("icon");
      this.notes = "";
      let fo = foreignObject();
      dom.node.append(dom.connectors, fo);
      fo.append(dom.content);
      dom.content.append(dom.status, dom.value, dom.icon, dom.text, dom.notes);
      dom.toggle.addEventListener("click", (_) => {
        this.collapsed = !this.collapsed;
        selectItem(this);
      });
      this.updateToggle();
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
      const { node: node11 } = this.dom;
      const transform = node11.getAttribute("transform");
      return transform.match(/\d+/g).map(Number);
    }
    set position(position) {
      const { node: node11 } = this.dom;
      const transform = `translate(${position.join(" ")})`;
      node11.setAttribute("transform", transform);
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
      if (this._textColor) {
        data.textColor = this._textColor;
      }
      if (this._icon) {
        data.icon = this._icon;
      }
      if (this._value !== null) {
        data.value = this._value;
      }
      if (this._status !== null) {
        data.status = this._status;
      }
      if (this._layout) {
        data.layout = this._layout.id;
      }
      if (this._shape) {
        data.shape = this._shape.id;
      }
      if (this._collapsed) {
        data.collapsed = true;
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
      if (data.textColor) {
        this._textColor = data.textColor;
      }
      if (data.icon) {
        this._icon = data.icon;
      }
      if (data.value !== void 0) {
        this._value = data.value;
      }
      if (data.status !== void 0) {
        if (data.status == "yes") {
          this._status = true;
        } else if (data.status == "no") {
          this._status = false;
        } else {
          this._status = data.status;
        }
      }
      if (data.collapsed) {
        this.collapsed = !!data.collapsed;
      }
      if (data.layout) {
        this._layout = repo2.get(data.layout);
      }
      if (data.shape) {
        this.shape = repo3.get(data.shape);
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
        this._side = data.side || null;
        dirty = 1;
      }
      if (this._color != data.color) {
        this._color = data.color || "";
        dirty = 2;
      }
      if (this._textColor != data.textColor) {
        this._textColor = data.textColor || "";
        dirty = 2;
      }
      if (this._icon != data.icon) {
        this._icon = data.icon || "";
        dirty = 1;
      }
      if (this._value != data.value) {
        this._value = data.value || null;
        dirty = 1;
      }
      if (this._status != data.status) {
        this._status = data.status;
        dirty = 1;
      }
      if (this._collapsed != !!data.collapsed) {
        this.collapsed = !!data.collapsed;
      }
      let ourShapeId = this._shape ? this._shape.id : null;
      if (ourShapeId != data.shape) {
        this._shape = data.shape ? repo3.get(data.shape) : null;
        dirty = 1;
      }
      let ourLayoutId = this._layout ? this._layout.id : null;
      if (ourLayoutId != data.layout) {
        this._layout = data.layout ? repo2.get(data.layout) : null;
        dirty = 2;
      }
      (data.children || []).forEach((child, index2) => {
        if (index2 >= this.children.length) {
          this.insertChild(Item.fromJSON(child));
        } else {
          var myChild = this.children[index2];
          if (myChild.id == child.id) {
            myChild.mergeWith(child);
          } else {
            this.removeChild(this.children[index2]);
            this.insertChild(Item.fromJSON(child), index2);
          }
        }
      });
      let newLength = (data.children || []).length;
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
      publish("item-select", this);
    }
    deselect() {
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
      const { content, node: node11, connectors } = dom;
      dom.text.style.color = this.resolvedTextColor;
      node11.dataset.shape = resolvedShape.id;
      node11.dataset.align = resolvedLayout.computeAlignment(this);
      let fo = content.parentNode;
      let size = [
        Math.max(content.offsetWidth, content.scrollWidth),
        Math.max(content.offsetHeight, content.scrollHeight)
      ];
      fo.setAttribute("width", String(size[0]));
      fo.setAttribute("height", String(size[1]));
      connectors.innerHTML = "";
      resolvedLayout.update(this);
      resolvedShape.update(this);
      if (options.parent && parent) {
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
    set notes(notes3) {
      this._notes = notes3;
      this.dom.notes.hidden = !notes3;
    }
    get collapsed() {
      return this._collapsed;
    }
    set collapsed(collapsed) {
      this._collapsed = collapsed;
      this.updateToggle();
      let children = !collapsed;
      this.update({ children });
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
    get textColor() {
      return this._textColor;
    }
    set textColor(textColor) {
      this._textColor = textColor;
      this.update({ children: true });
    }
    get resolvedTextColor() {
      if (this._textColor) {
        return this._textColor;
      }
      const { parent } = this;
      if (parent instanceof Item) {
        return parent.resolvedTextColor;
      }
      return "";
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
      let node11 = this;
      while (!node11.isRoot) {
        depth++;
        node11 = node11.parent;
      }
      switch (depth) {
        case 0:
          return repo3.get("ellipse");
        case 1:
          return repo3.get("box");
        default:
          return repo3.get("underline");
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
    insertChild(child, index2) {
      if (!child) {
        child = new Item();
      } else if (child.parent && child.parent instanceof Item) {
        child.parent.removeChild(child);
      }
      if (!this.children.length) {
        this.dom.node.appendChild(this.dom.toggle);
      }
      if (index2 === void 0) {
        index2 = this.children.length;
      }
      var next = null;
      if (index2 < this.children.length) {
        next = this.children[index2].dom.node;
      }
      this.dom.node.insertBefore(child.dom.node, next);
      this.children.splice(index2, 0, child);
      child.parent = this;
    }
    removeChild(child) {
      var index2 = this.children.indexOf(child);
      this.children.splice(index2, 1);
      child.dom.node.remove();
      child.parent = null;
      !this.children.length && this.dom.toggle.remove();
      this.update();
    }
    startEditing() {
      this.originalText = this.text;
      this.dom.text.contentEditable = "true";
      this.dom.text.focus();
      document.execCommand("styleWithCSS", false, "false");
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
      let result = this.dom.text.innerHTML;
      this.dom.text.innerHTML = this.originalText;
      this.originalText = "";
      this.update();
      return result;
    }
    handleEvent(e) {
      switch (e.type) {
        case "input":
          this.update();
          this.map.ensureItemVisibility(this);
          break;
        case "keydown":
          if (e.code == "Tab") {
            e.preventDefault();
          }
          break;
        case "blur":
          repo.get("finish").execute();
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
    updateToggle() {
      const { node: node11, toggle: toggle4 } = this.dom;
      node11.classList.toggle("collapsed", this._collapsed);
      toggle4.querySelector("path").setAttribute("d", this._collapsed ? D_PLUS : D_MINUS);
    }
  };
  function findLinks(node11) {
    let children = [...node11.childNodes];
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      if (child instanceof Element) {
        if (child.nodeName.toLowerCase() == "a") {
          continue;
        }
        findLinks(child);
      }
      if (child instanceof Text) {
        let str = child.nodeValue;
        let result = str.match(RE);
        if (!result) {
          continue;
        }
        let before = str.substring(0, result.index);
        let after = str.substring(result.index + result[0].length);
        var link = document.createElement("a");
        link.innerHTML = link.href = result[0];
        if (before) {
          node11.insertBefore(document.createTextNode(before), child);
        }
        node11.insertBefore(link, child);
        if (after) {
          child.nodeValue = after;
          i--;
        } else {
          child.remove();
        }
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
  var D_MINUS = `M ${-(TOGGLE_SIZE - 2)} 0 L ${TOGGLE_SIZE - 2} 0`;
  var D_PLUS = `${D_MINUS} M 0 ${-(TOGGLE_SIZE - 2)} L 0 ${TOGGLE_SIZE - 2}`;
  function buildToggle() {
    const circleAttrs = { "cx": "0", "cy": "0", "r": String(TOGGLE_SIZE) };
    let g = group();
    g.classList.add("toggle");
    g.append(node2("circle", circleAttrs), node2("path"));
    return g;
  }
  var COLOR = "#999";
  var RE = /\b(([a-z][\w-]+:\/\/\w)|(([\w-]+\.){2,}[a-z][\w-]+)|([\w-]+\.[a-z][\w-]+\/))[^\s]*([^\s,.;:?!<>\(\)\[\]'"])?($|\b)/i;

  // .js/map.js
  var css = "";
  var UPDATE_OPTIONS2 = {
    children: true
  };
  var Map2 = class {
    constructor(options) {
      this.node = node2("svg");
      this.style = node("style");
      this.position = [0, 0];
      this.fontSize = 15;
      let resolvedOptions = Object.assign({
        root: "My Mind Map",
        layout: repo2.get("map")
      }, options);
      this.style.textContent = css;
      this.node.style.fontSize = `${this.fontSize}px`;
      let root = new Item();
      root.text = resolvedOptions.root;
      root.layout = resolvedOptions.layout;
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
      const { node: node11, style } = this;
      this._root = root;
      node11.innerHTML = "";
      node11.append(root.dom.node, style);
      root.parent = this;
    }
    adjustFontSize(diff) {
      this.fontSize = Math.max(8, this.fontSize + 2 * diff);
      this.node.style.fontSize = `${this.fontSize}px`;
      this.update();
      this.ensureItemVisibility(currentItem);
    }
    mergeWith(data) {
      let ids = [];
      var current2 = currentItem;
      var node11 = current2;
      while (true) {
        ids.push(node11.id);
        if (node11.parent == this) {
          break;
        }
        node11 = node11.parent;
      }
      this._root.mergeWith(data.root);
      if (current2.map) {
        let node12 = current2;
        let hidden = false;
        while (true) {
          if (node12.parent == this) {
            break;
          }
          node12 = node12.parent;
          if (node12.collapsed) {
            hidden = true;
          }
        }
        if (!hidden) {
          return;
        }
      }
      editing && stopEditing();
      var idMap = {};
      var scan = function(item) {
        idMap[item.id] = item;
        item.children.forEach(scan);
      };
      scan(this._root);
      while (ids.length) {
        var id = ids.shift();
        if (id in idMap) {
          selectItem(idMap[id]);
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
      const { node: node11 } = this;
      const { size } = this._root;
      node11.setAttribute("width", String(size[0]));
      node11.setAttribute("height", String(size[1]));
    }
    show(where) {
      where.append(this.node);
      this.update();
      this.center();
      selectItem(this._root);
    }
    hide() {
      this.node.remove();
    }
    center() {
      let { size } = this._root;
      let parent = this.node.parentNode;
      let position = [
        (parent.offsetWidth - size[0]) / 2,
        (parent.offsetHeight - size[1]) / 2
      ].map(Math.round);
      this.moveTo(position);
    }
    moveBy(diff) {
      let position = this.position.map((p, i) => p + diff[i]);
      return this.moveTo(position);
    }
    getClosestItem(point) {
      let all2 = [];
      function scan(item) {
        let rect = item.dom.content.getBoundingClientRect();
        let dx = rect.left + rect.width / 2 - point[0];
        let dy = rect.top + rect.height / 2 - point[1];
        let distance = dx * dx + dy * dy;
        all2.push({ dx, dy, item, distance });
        if (!item.collapsed) {
          item.children.forEach(scan);
        }
      }
      scan(this._root);
      all2.sort((a, b) => a.distance - b.distance);
      return all2[0];
    }
    getItemFor(node11) {
      let content = node11.closest(".content");
      if (!content) {
        return;
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
      return br2nl(name).replace(/\n/g, " ").replace(/<.*?>/g, "").trim();
    }
    get id() {
      return this._root.id;
    }
    pick(item, direction) {
      let candidates = [];
      var currentRect = item.dom.content.getBoundingClientRect();
      this.getPickCandidates(currentRect, this._root, direction, candidates);
      if (!candidates.length) {
        return item;
      }
      candidates.sort((a, b) => a.dist - b.dist);
      return candidates[0].item;
    }
    getPickCandidates(currentRect, item, direction, candidates) {
      if (!item.collapsed) {
        item.children.forEach((child) => {
          this.getPickCandidates(currentRect, child, direction, candidates);
        });
      }
      var node11 = item.dom.content;
      var rect = node11.getBoundingClientRect();
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
  async function init14() {
    let response = await fetch("map.css");
    css = await response.text();
  }

  // .js/keyboard.js
  function handleEvent2(e) {
    if (isActive2()) {
      return;
    }
    let command = [...repo.values()].find((command2) => {
      if (!command2.isValid) {
        return false;
      }
      return command2.keys.find((key) => keyOK(key, e));
    });
    if (command) {
      e.preventDefault();
      command.execute(e);
    }
  }
  function init15() {
    window.addEventListener("keydown", handleEvent2);
  }
  function keyOK(key, e) {
    return Object.entries(key).every(([key2, value]) => e[key2] == value);
  }

  // .js/mouse.js
  var TOUCH_DELAY = 500;
  var SHADOW_OFFSET = 5;
  var touchContextTimeout;
  var current = {
    mode: "",
    cursor: [],
    item: null,
    ghost: null,
    ghostPosition: [],
    previousDragState: null
  };
  var port2;
  function init16(port_) {
    port2 = port_;
    port2.addEventListener("touchstart", onDragStart);
    port2.addEventListener("mousedown", onDragStart);
    port2.addEventListener("click", (e) => {
      let item = currentMap.getItemFor(e.target);
      if (editing && item == currentItem) {
        return;
      }
      item && selectItem(item);
    });
    port2.addEventListener("dblclick", (e) => {
      let item = currentMap.getItemFor(e.target);
      item && repo.get("edit").execute();
    });
    port2.addEventListener("wheel", (e) => {
      const { deltaY } = e;
      if (!deltaY) {
        return;
      }
      let dir = deltaY > 0 ? -1 : 1;
      currentMap.adjustFontSize(dir);
    });
    port2.addEventListener("contextmenu", (e) => {
      onDragEnd(e);
      e.preventDefault();
      let item = currentMap.getItemFor(e.target);
      item && selectItem(item);
      open([e.clientX, e.clientY]);
    });
  }
  function onDragStart(e) {
    let point = eventToPoint(e);
    if (!point) {
      return;
    }
    let item = currentMap.getItemFor(e.target);
    if (editing) {
      if (item == currentItem) {
        return;
      }
      repo.get("finish").execute();
    }
    document.activeElement.blur();
    current.cursor = point;
    if (item && !item.isRoot) {
      current.mode = "drag";
      current.item = item;
    } else {
      current.mode = "pan";
      port2.style.cursor = "move";
    }
    if (e.type == "mousedown") {
      e.preventDefault();
      port2.addEventListener("mousemove", onDragMove);
      port2.addEventListener("mouseup", onDragEnd);
    }
    if (e.type == "touchstart") {
      touchContextTimeout = setTimeout(function() {
        item && selectItem(item);
        open(point);
      }, TOUCH_DELAY);
      port2.addEventListener("touchmove", onDragMove);
      port2.addEventListener("touchend", onDragEnd);
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
          port2.style.cursor = "move";
          buildGhost(current.item);
        }
        moveGhost(delta);
        let state = computeDragState();
        visualizeDragState(state);
        break;
      case "pan":
        currentMap.moveBy(delta);
        break;
    }
  }
  function onDragEnd(_e) {
    clearTimeout(touchContextTimeout);
    port2.style.cursor = "";
    port2.removeEventListener("mousemove", onDragMove);
    port2.removeEventListener("mouseup", onDragEnd);
    const { mode: mode2, ghost } = current;
    if (mode2 == "pan") {
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
    port2.append(ghost);
    let rect = content.getBoundingClientRect();
    current.ghost = ghost;
    current.ghostPosition = [rect.left, rect.top];
  }
  function moveGhost(delta) {
    let { ghostPosition } = current;
    let ghost = current.ghost;
    ghostPosition[0] += delta[0];
    ghostPosition[1] += delta[1];
    ghost.style.left = `${ghostPosition[0]}px`;
    ghost.style.top = `${ghostPosition[1]}px`;
  }
  function finishDragDrop(state) {
    visualizeDragState(null);
    const { target, result, direction } = state;
    let action2;
    switch (result) {
      case "append":
        action2 = new MoveItem(current.item, target);
        break;
      case "sibling":
        let targetChildItem = target;
        let index2 = targetChildItem.parent.children.indexOf(targetChildItem);
        let targetIndex = index2 + (direction == "right" || direction == "bottom" ? 1 : 0);
        action2 = new MoveItem(current.item, targetChildItem.parent, targetIndex, targetChildItem.side);
        break;
      default:
        return;
        break;
    }
    action(action2);
  }
  function computeDragState() {
    let rect = current.ghost.getBoundingClientRect();
    let point = [rect.left + rect.width / 2, rect.top + rect.height / 2];
    let closest = currentMap.getClosestItem(point);
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

  // .js/clipboard.js
  var storedItem = null;
  var mode = "";
  function init17() {
    document.body.addEventListener("cut", onCopyCut);
    document.body.addEventListener("copy", onCopyCut);
    document.body.addEventListener("paste", onPaste);
  }
  function onCopyCut(e) {
    if (isActive2() || editing) {
      return;
    }
    e.preventDefault();
    endCut();
    switch (e.type) {
      case "copy":
        storedItem = currentItem.clone();
        break;
      case "cut":
        storedItem = currentItem;
        storedItem.dom.node.classList.add("cut");
        break;
      default:
        return;
    }
    let json = storedItem.toJSON();
    let plaintext = repo6.get("plaintext").to(json);
    e.clipboardData.setData("text/plain", plaintext);
    mode = e.type;
  }
  function onPaste(e) {
    if (isActive2() || editing) {
      return;
    }
    e.preventDefault();
    let pasted = e.clipboardData.getData("text/plain");
    if (!pasted) {
      return;
    }
    if (storedItem && pasted == repo6.get("plaintext").to(storedItem.toJSON())) {
      pasteItem(storedItem, currentItem);
    } else {
      pastePlaintext(pasted, currentItem);
    }
    endCut();
  }
  function pasteItem(sourceItem, targetItem) {
    let action2;
    switch (mode) {
      case "cut":
        if (sourceItem == targetItem || sourceItem.parent == targetItem) {
          return;
        }
        let item = targetItem;
        while (true) {
          if (item == sourceItem) {
            return;
          }
          if (item.parent instanceof Map2) {
            break;
          }
          item = item.parent;
        }
        action2 = new MoveItem(sourceItem, targetItem);
        action(action2);
        break;
      case "copy":
        action2 = new AppendItem(targetItem, sourceItem.clone());
        action(action2);
        break;
    }
  }
  function pastePlaintext(plaintext, targetItem) {
    let json = repo6.get("plaintext").from(plaintext);
    let map = Map2.fromJSON(json);
    let root = map.root;
    if (root.text) {
      let action2 = new AppendItem(targetItem, root);
      action(action2);
    } else {
      let subactions = root.children.map((item) => new AppendItem(targetItem, item));
      let action2 = new Multi(subactions);
      action(action2);
    }
  }
  function endCut() {
    if (mode != "cut") {
      return;
    }
    storedItem.dom.node.classList.remove("cut");
    storedItem = null;
    mode = "";
  }

  // .js/title.js
  function onItemChange(_message, publisher) {
    if (publisher.isRoot && publisher.map == currentMap) {
      document.title = currentMap.name + " :: My Mind";
    }
  }
  function init18() {
    subscribe("item-change", onItemChange);
  }

  // .js/command/select.js
  new class Select extends Command {
    constructor() {
      super("select", "Move selection");
      this.keys = [
        { code: "ArrowLeft", ctrlKey: false },
        { code: "ArrowUp", ctrlKey: false },
        { code: "ArrowRight", ctrlKey: false },
        { code: "ArrowDown", ctrlKey: false }
      ];
    }
    execute(e) {
      let dirs = {
        "ArrowLeft": "left",
        "ArrowUp": "top",
        "ArrowRight": "right",
        "ArrowDown": "bottom"
      };
      let dir = dirs[e.code];
      let layout = currentItem.resolvedLayout;
      let item = layout.pick(currentItem, dir);
      selectItem(item);
    }
  }();
  new class SelectRoot extends Command {
    constructor() {
      super("select-root", "Select root");
      this.keys = [{ code: "Home" }];
    }
    execute() {
      let item = currentItem;
      while (!item.isRoot) {
        item = item.parent;
      }
      selectItem(item);
    }
  }();
  if (!isMac()) {
    new class SelectParent extends Command {
      constructor() {
        super("select-parent", "Select parent");
        this.keys = [{ code: "Backspace" }];
      }
      execute() {
        if (currentItem.isRoot) {
          return;
        }
        selectItem(currentItem.parent);
      }
    }();
  }

  // .js/command/edit.js
  new class Edit extends Command {
    constructor() {
      super("edit", "Edit item");
      this.keys = [
        { code: "Space" },
        { code: "F2" }
      ];
    }
    execute() {
      startEditing();
    }
  }();
  new class Finish extends Command {
    constructor() {
      super("finish", "Finish editing");
      this.keys = [{ code: "Enter", altKey: false, ctrlKey: false, shiftKey: false }];
      this.editMode = true;
    }
    execute() {
      let text = stopEditing();
      let action2;
      if (text) {
        action2 = new SetText(currentItem, text);
      } else {
        action2 = new RemoveItem(currentItem);
      }
      action(action2);
    }
  }();
  new class Newline extends Command {
    constructor() {
      super("newline", "Line break");
      this.keys = [
        { code: "Enter", shiftKey: true },
        { code: "Enter", ctrlKey: true }
      ];
      this.editMode = true;
    }
    execute() {
      let range = getSelection().getRangeAt(0);
      let br = document.createElement("br");
      range.insertNode(br);
      range.setStartAfter(br);
      currentItem.update({ parent: true, children: true });
    }
  }();
  new class Cancel extends Command {
    constructor() {
      super("cancel", "Cancel");
      this.keys = [{ code: "Escape" }];
      this.editMode = null;
    }
    execute() {
      if (editing) {
        stopEditing();
        var oldText = currentItem.text;
        if (!oldText) {
          var action2 = new RemoveItem(currentItem);
          action(action2);
        }
      } else {
        close2();
        close();
        hide2();
      }
    }
  }();
  var Style = class extends Command {
    constructor() {
      super(...arguments);
      this.editMode = null;
    }
    execute() {
      if (editing) {
        document.execCommand(this.command, false);
      } else {
        repo.get("edit").execute();
        let selection = getSelection();
        let range = selection.getRangeAt(0);
        range.selectNodeContents(currentItem.dom.text);
        selection.removeAllRanges();
        selection.addRange(range);
        this.execute();
        repo.get("finish").execute();
      }
    }
  };
  new class Bold extends Style {
    constructor() {
      super("bold", "Bold");
      this.keys = [{ code: "KeyB", ctrlKey: true }];
      this.command = "bold";
    }
  }();
  new class Underline2 extends Style {
    constructor() {
      super("underline", "Underline");
      this.keys = [{ code: "KeyU", ctrlKey: true }];
      this.command = "underline";
    }
  }();
  new class Italic extends Style {
    constructor() {
      super("italic", "Italic");
      this.keys = [{ code: "KeyI", ctrlKey: true }];
      this.command = "italic";
    }
  }();
  new class Strikethrough extends Style {
    constructor() {
      super("strikethrough", "Strike-through");
      this.keys = [{ code: "KeyS", ctrlKey: true }];
      this.command = "strikeThrough";
    }
  }();
  new class Value extends Command {
    constructor() {
      super("value", "Set value");
      this.keys = [{ key: "v", ctrlKey: false, metaKey: false }];
    }
    execute() {
      let item = currentItem;
      let oldValue = item.value;
      let newValue = prompt("Set item value", String(oldValue));
      if (newValue == null) {
        return;
      }
      if (!newValue.length) {
        newValue = null;
      }
      let numValue = Number(newValue);
      let action2 = new SetValue(item, isNaN(numValue) ? newValue : numValue);
      action(action2);
    }
  }();
  new class Yes extends Command {
    constructor() {
      super("yes", "Yes");
      this.keys = [{ key: "y", ctrlKey: false }];
    }
    execute() {
      let item = currentItem;
      let status = item.status === true ? null : true;
      let action2 = new SetStatus(item, status);
      action(action2);
    }
  }();
  new class No extends Command {
    constructor() {
      super("no", "No");
      this.keys = [{ key: "n", ctrlKey: false }];
    }
    execute() {
      let item = currentItem;
      let status = item.status === false ? null : false;
      let action2 = new SetStatus(item, status);
      action(action2);
    }
  }();
  new class Computed extends Command {
    constructor() {
      super("computed", "Computed");
      this.keys = [{ key: "c", ctrlKey: false, metaKey: false }];
    }
    execute() {
      let item = currentItem;
      let status = item.status == "computed" ? null : "computed";
      let action2 = new SetStatus(item, status);
      action(action2);
    }
  }();

  // .js/my-mind.js
  var port3 = document.querySelector("main");
  var throbber = document.querySelector("#throbber");
  var currentMap;
  var currentItem;
  var editing = false;
  function showMap(map) {
    currentMap && currentMap.hide();
    reset();
    currentMap = map;
    currentMap.show(port3);
  }
  function action(action2) {
    push(action2);
    action2.do();
  }
  function selectItem(item) {
    if (currentItem && currentItem != item) {
      if (editing) {
        repo.get("finish").execute();
      }
      currentItem.deselect();
    }
    currentItem = item;
    currentItem.select();
    currentMap.ensureItemVisibility(currentItem);
  }
  function setThrobber(visible) {
    throbber.hidden = !visible;
  }
  function startEditing() {
    editing = true;
    currentItem.startEditing();
  }
  function stopEditing() {
    editing = false;
    return currentItem.stopEditing();
  }
  async function init19() {
    await init14();
    subscribe("ui-change", syncPort);
    window.addEventListener("resize", syncPort);
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      return "";
    });
    init17();
    init15();
    init16(port3);
    init18();
    init13(port3);
    syncPort();
    showMap(new Map2());
  }
  function syncPort() {
    let portSize = [window.innerWidth - getWidth(), window.innerHeight];
    port3.style.width = portSize[0] + "px";
    port3.style.height = portSize[1] + "px";
    currentMap && currentMap.ensureItemVisibility(currentItem);
  }
  init19();
})();

---
title: React原理浅谈
date: 2017-07-17 20:43:30
tags:
  -React
  -ES6
categories: React
author: Jian Wang

---

## 一、React简介

### 1、Virtual DOM
React为此引入了虚拟DOM的机制，在浏览器端用Javascript实现了一套DOM API。基于React进行开发时所有的DOM构造都是通过虚拟DOM进行，每当数据变化时，React都会重新构建整个DOM树，然后React将当前整个DOM树和上一次的DOM树进行对比，得到DOM结构的区别，然后仅仅将需要变化的部分进行实际的浏览器DOM更新。

### 2、组件化
组件是封装起来的具有独立功能的UI部件
<img src="/images/react-component.png">

#### React组件应具有如下特征
- 可组合(Composeable): 一个组件易于和其它组件一起使用，或者嵌套在另一个组件内部;如果一个组件内部创建了另一个组件，那么说父组件拥有（own）它创建的子组件，通过这个特性，一个复杂的UI可以拆分成多个简单的UI组件
- 可重用(Reusable): 每个组件都是具有独立功能的，它可以被使用在多个UI场景
- 可维护(Maintainable): 每个小的组件仅仅包含自身的逻辑，更容易被理解和维护


## 二、React原理分析

#### ReactJs的核心内容主要包括
+ 虚拟dom对象(Virtual DOM)
+ 虚拟dom差异化算法（diff algorithm）
+ 单向数据流渲染（Data Flow）
+ 组件生命周期
+ 事件处理

### 1、ReactJs首次渲染
<img src="/images/react-first-render.png">

虚拟dom元素分为两种，一种是浏览器自带的基本元素比如 div p input form 这种，一种是自定义的元素。
文本节点，不算虚拟dom，但是ReacJs为了保持渲染的一致性, 在文本节点外面包了一层span标记，形成简化版的component（ReactDOMTextComponent）。

#### 文本节点渲染
```js
//component类，用来表示文本在渲染，更新，删除时应该做些什么事情
function ReactDOMTextComponent(text) {
    //存下当前的字符串
    this._currentElement = '' + text;
    //用来标识当前component
    this._rootNodeID = null;
}

//component渲染时生成的dom结构
ReactDOMTextComponent.prototype.mountComponent = function(rootID) {
    this._rootNodeID = rootID;
    return '<span data-reactid="' + rootID + '">' + this._currentElement + '</span>';
}


//component工厂  用来返回一个component实例
function instantiateReactComponent(node){
    if(typeof node === 'string' || typeof node === 'number'){
        return new ReactDOMTextComponent(node)
    }
}


React = {
    nextReactRootIndex:0,
    render:function(element,container){

        var componentInstance = instantiateReactComponent(element);
        var markup = componentInstance.mountComponent(React.nextReactRootIndex++);
        $(container).html(markup);
        //触发完成mount的事件
        $(document).trigger('mountReady');    }
}
```
- React.render 作为入口负责调用渲染
- ReactDOMTextComponent是一个component类定义，定义对于这种文本类型的节点，在渲染，更新，删除时应该做什么操作
- instantiateReactComponent用来根据element的类型（现在只有一种string类型），返回一个component的实例。其实就是个类工厂

#### 基本元素渲染
在React中使用React.createElement来创建一个虚拟dom元素, 例如:
```js
function hello(){
    alert('hello')
}


var element = React.createElement('div',{id:'test',onclick:hello},'click me')

React.render(element,document.getElementById("container"))
```
当render的不是文本而是浏览器的基本元素时，使用另外一种component来处理它渲染时应该返回的内容，由于使用的是工厂方法instantiateReactComponent，不管来了什么类型的node，都可以负责生产出一个负责渲染的component实例。这样render完全不需要做任何修改，只需要再做一种对应的component类型ReactDOMComponent就行了。
虚拟dom的渲染逻辑，本质上还是个递归渲染的东西，reactElement会递归渲染自己的子节点。可以看到我们通过instantiateReactComponent屏蔽了子节点的差异，只需要使用不同的componet类，这样都能保证通过mountComponent最终拿到渲染后的内容。

#### 自定义元素渲染
随着前端技术的发展浏览器的那些基本元素已经满足不了我们的需求了，ReactJs的element.type可以是简单的字符串也可以是个类，而且这个类还有自己的生命周期管理。

>生命周期共提供了10个不同的API
1.getDefaultProps
2.getInitialState
3.componentWillMount
4.render
5.componentDidMount
6.componentWillReceiveProps
7.shouldComponentUpdate
8.componentWillUpdate
9.componentDidUpdate
10.componentWillUnmount

自定义元素,React.createElement接受的不再是字符串，而是一个class
```js
var HelloMessage = React.createClass({
  getInitialState: function() {
    return {type: 'say:'};
  },
  componentWillMount: function() {
    console.log('我就要开始渲染了。。。')
  },
  componentDidMount: function() {
    console.log('我已经渲染好了。。。')
  },
  render: function() {
    return React.createElement("div", null,this.state.type, "Hello ", this.props.name);
  }
});

React.render(React.createElement(HelloMessage, {name: "John"}), document.getElementById("container"));
```
- React.createClass生成一个自定义标记类，带有基本的生命周期：
- getInitialState 获取最初的属性值this.state
- componentWillmount 在组件准备渲染时调用
- componentDidMount 在组件渲染完成后调用

通过上面的两种类型知道，需要未自定义元素也提供一个componet类，在这个类里我们会实例化ReactClass，并且管理生命周期，还有父子组件依赖。

```js
function ReactCompositeComponent(element){
    //存放元素element对象
    this._currentElement = element;
    //存放唯一标识
    this._rootNodeID = null;
    //存放对应的ReactClass的实例
    this._instance = null;
}

//用于返回当前自定义元素渲染时应该返回的内容
ReactCompositeComponent.prototype.mountComponent = function(rootID){
    this._rootNodeID = rootID;
    //拿到当前元素对应的属性值
    var publicProps = this._currentElement.props;
    //拿到对应的ReactClass
    var ReactClass = this._currentElement.type;
    // Initialize the public class
    var inst = new ReactClass(publicProps);
    this._instance = inst;
    //保留对当前comonent的引用，下面更新会用到
    inst._reactInternalInstance = this;

    if (inst.componentWillMount) {
        inst.componentWillMount();
        //这里在原始的reactjs其实还有一层处理，就是  componentWillMount调用setstate，不会触发rerender而是自动提前合并，这里为了保持简单，就略去了
    }
    //调用ReactClass的实例的render方法,返回一个element或者一个文本节点
    var renderedElement = this._instance.render();
    //得到renderedElement对应的component类实例
    var renderedComponentInstance = instantiateReactComponent(renderedElement);
    this._renderedComponent = renderedComponentInstance; //存起来留作后用

    //拿到渲染之后的字符串内容，将当前的_rootNodeID传给render出的节点
    var renderedMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);

    //之前我们在React.render方法最后触发了mountReady事件，所以这里可以监听，在渲染完成后会触发。
    $(document).on('mountReady', function() {
        //调用inst.componentDidMount
        inst.componentDidMount && inst.componentDidMount();
    });

    return renderedMarkup;
}
```
### 2、更新机制
一般在reactjs中我们需要更新时都是调用的setState
```js
//setState
ReactClass.prototype.setState = function(newState) {

    //还记得我们在ReactCompositeComponent里面mount的时候 做了赋值
    //所以这里可以拿到 对应的ReactCompositeComponent的实例_reactInternalInstance
    this._reactInternalInstance.receiveComponent(null, newState);
}
```
- setState主要调用了对应的component的receiveComponent来实现更新。所有的挂载，更新都应该交给对应的component来管理
- 就像所有的component都实现了mountComponent来处理第一次渲染，所有的componet类都应该实现receiveComponent用来处理自己的更新

#### 自定义元素的receiveComponent
```js
//更新
ReactCompositeComponent.prototype.receiveComponent = function(nextElement, newState) {

    //如果接受了新的，就使用最新的element
    this._currentElement = nextElement || this._currentElement

    var inst = this._instance;
    //合并state
    var nextState = $.extend(inst.state, newState);
    var nextProps = this._currentElement.props;


    //改写state
    inst.state = nextState;


    //如果inst有shouldComponentUpdate并且返回false。说明组件本身判断不要更新，就直接返回。
    if (inst.shouldComponentUpdate && (inst.shouldComponentUpdate(nextProps, nextState) === false)) return;

    //生命周期管理，如果有componentWillUpdate，就调用，表示开始要更新了。
    if (inst.componentWillUpdate) inst.componentWillUpdate(nextProps, nextState);


    var prevComponentInstance = this._renderedComponent;
    var prevRenderedElement = prevComponentInstance._currentElement;
    //重新执行render拿到对应的新element;
    var nextRenderedElement = this._instance.render();


    //判断是需要更新还是直接就重新渲染
    //注意这里的_shouldUpdateReactComponent跟上面的不同哦 这个是全局的方法
    if (_shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
        //如果需要更新，就继续调用子节点的receiveComponent的方法，传入新的element更新子节点。
        prevComponentInstance.receiveComponent(nextRenderedElement);
        //调用componentDidUpdate表示更新完成了
        inst.componentDidUpdate && inst.componentDidUpdate();

    } else {
        //如果发现完全是不同的两种element，那就干脆重新渲染了
        var thisID = this._rootNodeID;
        //重新new一个对应的component，
        this._renderedComponent = this._instantiateReactComponent(nextRenderedElement);
        //重新生成对应的元素内容
        var nextMarkup = _renderedComponent.mountComponent(thisID);
        //替换整个节点
        $('[data-reactid="' + this._rootNodeID + '"]').replaceWith(nextMarkup);

    }

}

//用来判定两个element需不需要更新
//这里的key是我们createElement的时候可以选择性的传入的。用来标识这个element，当发现key不同时，我们就可以直接重新渲染，不需要去更新了。
var _shouldUpdateReactComponent ＝ function(prevElement, nextElement){
    if (prevElement != null && nextElement != null) {
    var prevType = typeof prevElement;
    var nextType = typeof nextElement;
    if (prevType === 'string' || prevType === 'number') {
      return nextType === 'string' || nextType === 'number';
    } else {
      return nextType === 'object' && prevElement.type === nextElement.type && prevElement.key === nextElement.key;
    }
  }
  return false;
}
```
- inst.shouldComponentUpdate是实例方法，当我们不希望某次setState后更新，我们就可以重写这个方法，返回false就好了。
- _shouldUpdateReactComponent是一个全局方法，这个是一种reactjs的优化机制。用来决定是直接全部替换，还是使用很细微的改动。当两次render出来的子节点key不同，直接全部重新渲染一遍，替换就好了。否则，我们就得来个递归的更新，保证最小化的更新机制，这样可以不会有太大的闪烁。

首先合并改动，生成最新的state,props然后拿以前的render返回的element跟现在最新调用render生成的element进行对比（_shouldUpdateReactComponent），看看需不需要更新，如果要更新就继续调用对应的component类对应的receiveComponent就好啦，其实就是直接当甩手掌柜，事情直接丢给手下去办了。当然还有种情况是，两次生成的element差别太大，就不是一个类型的，那就直接重新生成一份新的代码重新渲染一次。

- 自定义元素的更新，主要是更新render出的节点，做甩手掌柜交给render出的节点的对应component去管理更新。
- text节点的更新很简单，直接更新文案。
- 浏览器基本元素的更新，分为两块：1.先是更新属性，对比出前后属性的不同，局部更新。并且处理特殊属性，比如事件绑定。2.更新子节点，子节点更新主要是找出差异对象，找差异对象的时候使用_shouldUpdateReactComponent来判断，如果是可以直接更新的就会递归调用子节点的更新，这样也会递归查找差异对象。
                  
#### 更新属性
```js
ReactDOMComponent.prototype._updateDOMProperties = function(lastProps, nextProps) {
    var propKey;
    //遍历，当一个老的属性不在新的属性集合里时，需要删除掉。

    for (propKey in lastProps) {
        //新的属性里有，或者propKey是在原型上的直接跳过。这样剩下的都是不在新属性集合里的。需要删除
        if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey)) {
            continue;
        }
        //对于那种特殊的，比如这里的事件监听的属性我们需要去掉监听
        if (/^on[A-Za-z]/.test(propKey)) {
            var eventType = propKey.replace('on', '');
            //针对当前的节点取消事件代理
            $(document).undelegate('[data-reactid="' + this._rootNodeID + '"]', eventType, lastProps[propKey]);
            continue;
        }

        //从dom上删除不需要的属性
        $('[data-reactid="' + this._rootNodeID + '"]').removeAttr(propKey)
    }

    //对于新的属性，需要写到dom节点上
    for (propKey in nextProps) {
        //对于事件监听的属性我们需要特殊处理
        if (/^on[A-Za-z]/.test(propKey)) {
            var eventType = propKey.replace('on', '');
            //以前如果已经有，说明有了监听，需要先去掉
            lastProps[propKey] && $(document).undelegate('[data-reactid="' + this._rootNodeID + '"]', eventType, lastProps[propKey]);
            //针对当前的节点添加事件代理,以_rootNodeID为命名空间
            $(document).delegate('[data-reactid="' + this._rootNodeID + '"]', eventType + '.' + this._rootNodeID, nextProps[propKey]);
            continue;
        }

        if (propKey == 'children') continue;

        //添加新的属性，或者是更新老的同名属性
        $('[data-reactid="' + this._rootNodeID + '"]').prop(propKey, nextProps[propKey])
    }

}
```                
#### 更新子节点
更新子节点包含两个部分，一个是递归的分析差异，把差异添加到队列中。然后在合适的时机调用_patch把差异应用到dom上
```js
ReactDOMComponent.prototype.receiveComponent = function(nextElement){
    var lastProps = this._currentElement.props;
    var nextProps = nextElement.props;

    this._currentElement = nextElement;
    //需要单独的更新属性
    this._updateDOMProperties(lastProps,nextProps);
    //再更新子节点
    this._updateDOMChildren(nextProps.children);
}

//全局的更新深度标识
var updateDepth = 0;
//全局的更新队列，所有的差异都存在这里
var diffQueue = [];

ReactDOMComponent.prototype._updateDOMChildren = function(nextChildrenElements){
    updateDepth++
    //_diff用来递归找出差别,组装差异对象,添加到更新队列diffQueue。
    this._diff(diffQueue,nextChildrenElements);
    updateDepth--
    if(updateDepth == 0){
        //在需要的时候调用patch，执行具体的dom操作
        this._patch(diffQueue);
        diffQueue = [];
    }
}
```
- _diff用来递归找出差别,组装差异对象,添加到更新队列diffQueue。
- _patch主要就是挨个遍历差异队列，遍历两次，第一次删除掉所有需要变动的节点，然后第二次插入新的节点还有修改的节点。这里为什么可以直接挨个的插入呢？原因就是我们在diff阶段添加差异节点到差异队列时，本身就是有序的，也就是说对于新增节点（包括move和insert的）在队列里的顺序就是最终dom的顺序，所以我们才可以挨个的直接根据index去塞入节点。

#### _diff实现
```js
//差异更新的几种类型
var UPATE_TYPES = {
    MOVE_EXISTING: 1,
    REMOVE_NODE: 2,
    INSERT_MARKUP: 3
}


//普通的children是一个数组，此方法把它转换成一个map,key就是element的key,如果是text节点或者element创建时并没有传入key,就直接用在数组里的index标识
function flattenChildren(componentChildren) {
    var child;
    var name;
    var childrenMap = {};
    for (var i = 0; i < componentChildren.length; i++) {
        child = componentChildren[i];
        name = child && child._currentelement && child._currentelement.key ? child._currentelement.key : i.toString(36);
        childrenMap[name] = child;
    }
    return childrenMap;
}


//主要用来生成子节点elements的component集合
//这边注意，有个判断逻辑，如果发现是更新，就会继续使用以前的componentInstance,调用对应的receiveComponent。
//如果是新的节点，就会重新生成一个新的componentInstance，
function generateComponentChildren(prevChildren, nextChildrenElements) {
    var nextChildren = {};
    nextChildrenElements = nextChildrenElements || [];
    $.each(nextChildrenElements, function(index, element) {
        var name = element.key ? element.key : index;
        var prevChild = prevChildren && prevChildren[name];
        var prevElement = prevChild && prevChild._currentElement;
        var nextElement = element;

        //调用_shouldUpdateReactComponent判断是否是更新
        if (_shouldUpdateReactComponent(prevElement, nextElement)) {
            //更新的话直接递归调用子节点的receiveComponent就好了
            prevChild.receiveComponent(nextElement);
            //然后继续使用老的component
            nextChildren[name] = prevChild;
        } else {
            //对于没有老的，那就重新新增一个，重新生成一个component
            var nextChildInstance = instantiateReactComponent(nextElement, null);
            //使用新的component
            nextChildren[name] = nextChildInstance;
        }
    })

    return nextChildren;
}



//_diff用来递归找出差别,组装差异对象,添加到更新队列diffQueue。
ReactDOMComponent.prototype._diff = function(diffQueue, nextChildrenElements) {
  var self = this;
  //拿到之前的子节点的 component类型对象的集合,这个是在刚开始渲染时赋值的
  //_renderedChildren 本来是数组，我们搞成map
  var prevChildren = flattenChildren(self._renderedChildren);
  //生成新的子节点的component对象集合，这里注意，会复用老的component对象
  var nextChildren = generateComponentChildren(prevChildren, nextChildrenElements);
  //重新赋值_renderedChildren，使用最新的。
  self._renderedChildren = []
  $.each(nextChildren, function(key, instance) {
    self._renderedChildren.push(instance);
  })


  var nextIndex = 0; //代表到达的新的节点的index
  //通过对比两个集合的差异，组装差异节点添加到队列中
  for (name in nextChildren) {
    if (!nextChildren.hasOwnProperty(name)) {
      continue;
    }
    var prevChild = prevChildren && prevChildren[name];
    var nextChild = nextChildren[name];
    //相同的话，说明是使用的同一个component,所以我们需要做移动的操作
    if (prevChild === nextChild) {
      //添加差异对象，类型：MOVE_EXISTING
      diffQueue.push({
        parentId: self._rootNodeID,
        parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
        type: UPATE_TYPES.MOVE_EXISTING,
        fromIndex: prevChild._mountIndex,
        toIndex: nextIndex
      })
    } else { //如果不相同，说明是新增加的节点
      //但是如果老的还存在，就是element不同，但是component一样。我们需要把它对应的老的element删除。
      if (prevChild) {
        //添加差异对象，类型：REMOVE_NODE
        diffQueue.push({
          parentId: self._rootNodeID,
          parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
          type: UPATE_TYPES.REMOVE_NODE,
          fromIndex: prevChild._mountIndex,
          toIndex: null
        })

        //如果以前已经渲染过了，记得先去掉以前所有的事件监听，通过命名空间全部清空
        if (prevChild._rootNodeID) {
            $(document).undelegate('.' + prevChild._rootNodeID);
        }

      }
      //新增加的节点，也组装差异对象放到队列里
      //添加差异对象，类型：INSERT_MARKUP
      diffQueue.push({
        parentId: self._rootNodeID,
        parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
        type: UPATE_TYPES.INSERT_MARKUP,
        fromIndex: null,
        toIndex: nextIndex,
        markup: nextChild.mountComponent() //新增的节点，多一个此属性，表示新节点的dom内容
      })
    }
    //更新mount的index
    nextChild._mountIndex = nextIndex;
    nextIndex++;
  }



  //对于老的节点里有，新的节点里没有的那些，也全都删除掉
  for (name in prevChildren) {
    if (prevChildren.hasOwnProperty(name) && !(nextChildren && nextChildren.hasOwnProperty(name))) {
      //添加差异对象，类型：REMOVE_NODE
      diffQueue.push({
        parentId: self._rootNodeID,
        parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
        type: UPATE_TYPES.REMOVE_NODE,
        fromIndex: prevChild._mountIndex,
        toIndex: null
      })
      //如果以前已经渲染过了，记得先去掉以前所有的事件监听
      if (prevChildren[name]._rootNodeID) {
        $(document).undelegate('.' + prevChildren[name]._rootNodeID);
      }
    }
  }
}
```
#### __patch的实现
```js
//用于将childNode插入到指定位置
function insertChildAt(parentNode, childNode, index) {
    var beforeChild = parentNode.children().get(index);
    beforeChild ? childNode.insertBefore(beforeChild) : childNode.appendTo(parentNode);
}

ReactDOMComponent.prototype._patch = function(updates) {
    var update;
    var initialChildren = {};
    var deleteChildren = [];
    for (var i = 0; i < updates.length; i++) {
        update = updates[i];
        if (update.type === UPATE_TYPES.MOVE_EXISTING || update.type === UPATE_TYPES.REMOVE_NODE) {
            var updatedIndex = update.fromIndex;
            var updatedChild = $(update.parentNode.children().get(updatedIndex));
            var parentID = update.parentID;

            //所有需要更新的节点都保存下来，方便后面使用
            initialChildren[parentID] = initialChildren[parentID] || [];
            //使用parentID作为简易命名空间
            initialChildren[parentID][updatedIndex] = updatedChild;


            //所有需要修改的节点先删除,对于move的，后面再重新插入到正确的位置即可
            deleteChildren.push(updatedChild)
        }

    }

    //删除所有需要先删除的
    $.each(deleteChildren, function(index, child) {
        $(child).remove();
    })


    //再遍历一次，这次处理新增的节点，还有修改的节点这里也要重新插入
    for (var k = 0; k < updates.length; k++) {
        update = updates[k];
        switch (update.type) {
            case UPATE_TYPES.INSERT_MARKUP:
                insertChildAt(update.parentNode, $(update.markup), update.toIndex);
                break;
            case UPATE_TYPES.MOVE_EXISTING:
                insertChildAt(update.parentNode, initialChildren[update.parentID][update.fromIndex], update.toIndex);
                break;
            case UPATE_TYPES.REMOVE_NODE:
                // 什么都不需要做，因为上面已经帮忙删除掉了
                break;
        }
    }
}
```

#### 差异更新类型
- MOVE_EXISTING: 新的component类型在老的集合里也有，并且element是可以更新的类型，在generateComponentChildren我们已经调用了receiveComponent，这种情况下prevChild=nextChild,那我们就需要做出移动的操作，可以复用以前的dom节点。
- INSERT_MARKUP: 新的component类型不在老的集合里，那么就是全新的节点，我们需要插入新的节点
- REMOVE_NODE: 老的component类型，在新的集合里也有，但是对应的element不同了不能直接复用直接更新，那我们也得删除。
- REMOVE_NODE: 老的component不在新的集合里的，我们需要删除。

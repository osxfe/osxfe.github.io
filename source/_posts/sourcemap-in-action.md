---
title: SourceMap In Action | SourceMap 实践
author: GG
---
# SourceMap 解析
## 资料：
- SourceMap文件格式
    - http://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html
    - http://www.alloyteam.com/2014/01/source-map-version-3-introduction/

## 如何映射
- 本地保存文件映射，本地保存文件
- 直接在文件末尾注明位置
    - 以JS为例: `//@ sourceMappingURL=target.js.map`
    - 自己按照URL去映射，对解析工具必须可访问

## JS 异常如何解析
prototype: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/prototype

```
Error.prototype
Error.prototype.columnNumber : 非标准
Error.prototype.fileName : 非标准
Error.prototype.lineNumber: 非标准
Error.prototype.message
Error.prototype.name
Error.prototype.stack
Methods
Error.prototype.toSource(): 非标准
Error.prototype.toString()
```

![](http://ollp6yeja.bkt.clouddn.com/15138389202320.jpg)

stack属性
 ![](http://ollp6yeja.bkt.clouddn.com/15138390172962.jpg)


### 定位位置 = 解析`Error.prototype.stack`
- 构造: new Error(name)
- 默认toString = e.type : e.name
- e.stack = `toString()\n + stack frames`
- 过程：解析stack frames -> 获取sourcemap -> consumeSourceMap -> 获取Mapping

### 结果
```
TypeError: Cannot read property \'toDate\' of undefined    @ Object.onChange (https://osx.dpfile.com/app/overseas-bc-static/static/orderdetails.e91e32130b4a54ea9f01.js:1:722437)    @ t.n.handleChange (https://osx.dpfile.com/app/overseas-bc-static/static/dll.min.d1c4244bfbd687f19b9c4c171fd79de1.js:1:918483)    @ n.clearSelection (https://osx.dpfile.com/app/overseas-bc-static/static/dll.min.d1c4244bfbd687f19b9c4c171fd79de1.js:1:918308)    @ Object.r (https://osx.dpfile.com/app/overseas-bc-static/static/dll.min.d1c4244bfbd687f19b9c4c171fd79de1.js:1:211791)    @ i (https://osx.dpfile.com/app/overseas-bc-static/static/dll.min.d1c4244bfbd687f19b9c4c171fd79de1.js:1:210137)    @ Object.s [as executeDispatchesInOrder] (https://osx.dpfile.com/app/overseas-bc-static/static/dll.min.d1c4244bfbd687f19b9c4c171fd79de1.js:1:210327)    @ p (https://osx.dpfile.com/app/overseas-bc-static/static/dll.min.d1c4244bfbd687f19b9c4c171fd79de1.js:1:175391)    @ m (https://osx.dpfile.com/app/overseas-bc-static/static/dll.min.d1c4244bfbd687f19b9c4c171fd79de1.js:1:175517)
```

![](http://ollp6yeja.bkt.clouddn.com/15138403410332.jpg)






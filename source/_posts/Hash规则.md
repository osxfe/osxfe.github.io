---
title: Hash规则
date: 2017-12-7 10:43:30
tags:
  -Webpack
  -ES6
categories: React
author: luoxiao

---
# Hash规则

## B端hash问题
1、原本主文档引用的文件，hash生成交由CI处理，但是资源路径配置错误，导致CI替换失败，异步脚本正常更新，但是主文档中引用的是老的文件。

2、chunk文件内容未修改，引用的module Id有变更，但是hash值未更新，导致新老版本加载报错。

3、为了解决CDN上缓存了错误的文件版本hash的问题，引入了webpack-md5-hash重新生成了文件hash规则。

4、发现webpack-md5-hash插件本身hash策略有问题：module id改变或者异步chunk改变，都不会更新hash值，导致错误的引用。

## 基础概念
### 1、hash与chunkHash的区别
文件的hash指纹通常作为前端静态资源实现增量更新的方案之一，在Webpack编译输出文件的配置过程中，如果需要为文件加入hash指纹，Webpack提供了两个配置项可供使用：hash和chunkhash。那么两者有何区别呢？其各自典型的应用场景又是什么？

![](https://lh3.googleusercontent.com/-feuxO7i_WpU/WiisDUxOPBI/AAAAAAAAACc/5ENERNx9V4QDEK41xCp8IR8nojsfU5qWQCHMYCw/I/15120231856243.jpg)

首先我们先看一下官方文档对于两者的定义：
> [hash] is replaced by the hash of the compilation.

`hash`代表的是compilation的hash值。

> [chunkhash] is replaced by the hash of the chunk.

`chunkhash`代表的是chunk的hash值。

chunkhash很好理解，chunk在Webpack中的含义我们都清楚，简单讲，chunk就是模块。chunkhash也就是根据模块内容计算出的hash值。

那么该如何理解hash是compilation的hash值这句话呢？首先先讲解一下Webpack中compilation的含义。

#### 1.1、compilation
Webpack官方文档中How to write a plugin章节有对compilation的详解。
> A compilation object represents a single build of versioned assets. While running Webpack development middleware, a new compilation will be created each time a file change is detected, thus generating a new set of compiled assets. A compilation surfaces information about the present state of module resources, compiled assets, changed files, and watched dependencies.

compilation对象代表某个版本的资源对应的编译进程。当使用Webpack的development中间件时，每次检测到项目文件有改动就会创建一个compilation，进而能够针对改动生产全新的编译文件。compilation对象包含当前模块资源、待编译文件、有改动的文件和监听依赖的所有信息。

与compilation对应的有个compiler对象，通过对比，可以帮助大家对compilation有更深入的理解。

#### 1.2、compiler
>The compiler object represents the fully configured Webpack environment. This object is built once upon starting Webpack, and is configured with all operational settings including options, loaders, and plugins.

compiler对象代表的是配置完备的Webpack环境。 compiler对象只在Webpack启动时构建一次，由Webpack组合所有的配置项构建生成。

简单的讲，compiler对象代表的是不变的webpack环境，是针对webpack的；而compilation对象针对的是随时可变的项目文件，只要文件有改动，compilation就会被重新创建。

#### 1.3、使用对比
compilation在项目中任何一个文件改动后就会被重新创建，然后webpack计算新的compilation的hash值，这个hash值便是`hash`。

如果使用hash作为编译输出文件的hash指纹的话，如下：

```javascript
output: {
    filename: '[name].[hash:8].js',
    path: __dirname + '/build'
}
```

hash是compilation对象计算所得，而不是具体的项目文件计算所得。所以以上配置的编译输出文件，所有的文件名都会使用相同的hash指纹。如下：

![](https://lh3.googleusercontent.com/-wlJUDhxMPqU/Wh7zMZjuqfI/AAAAAAAAABk/IhEtsJXAHL0bPovXAgeSV4NB7e-UWXjsQCHMYCw/I/15119373145001.jpg)
这样带来的问题是，三个js文件任何一个改动都会影响另外两个文件的最终文件名。上线后，另外两个文件的浏览器缓存也全部失效。这肯定不是我们想要的结果。

那么如何避免这个问题呢？答案就是chunkhash！

根据chunkhash的定义知道，chunkhash是根据具体模块文件的内容计算所得的hash值，所以某个文件的改动只会影响它本身的hash指纹，不会影响其他文件。配置webpack的output如下：

```javascript
output: {
    filename: '[name].[chunkhash:8].js',
    path: __dirname + '/build'
}
```

编译输出的文件为：

![](https://lh3.googleusercontent.com/-SrxuYiL3LV8/Wh7zM3v49mI/AAAAAAAAABo/empy-1upuAsdOf5JQjUYV0_lfdLKbX5ywCHMYCw/I/15119400009939.jpg)
每个文件的hash指纹都不相同，上线后无改动的文件不会失去缓存。

>不要在开发环境使用 [chunkhash]/[hash]/[contenthash]，因为不需要在开发环境做持久缓存，而且这样会增加编译时间，开发环境用 [name] 就可以了。

### 2、contenthash
webpack将style视为js的一部分，所以在计算chunkhash时，会把所有的js代码和style代码混合在一起计算。比如main.js引用了main.scss:

```
import 'main.scss';
alert('I am main.js');
```

main.scss的内容如下：

```
body{
    color: #000;
}
```
webpack计算chunkhash时，以main.js文件为编译入口，整个chunk的内容会将main.scss的内容也计算在内：

```
body{
    color: #000;
}
alert('I am main.js');
```
所以，不论是修改了js代码还是scss代码，整个chunk的内容都改变了，计算所得的chunkhash自然就不同了。

我们一般会通过`extract-text-webpack-plugin`将样式文件单独抽取出来，但是不管是不是抽取出来了，chunkhash的计算方式还是合在一起算的， js 和 css 输出的文件用的是同一个 chunkhash，所以还是会存在问题。不过，该插件提供了另外一种hash值：`contenthash`。

顾名思义，contenthash代表的是文本文件内容的hash值，也就是只有style文件的hash值。

```
new ExtractTextPlugin('[name].[contenthash].css');
```
这样，编译出来的js和css文件将会有独立的hash指纹。并且如果我们只是修改了js代码，css的hash值也不会变化的。

但是，反过来看，当我们如果修改css文件的时候，会发现js的hash还是会变化，还是因为之前提到的，chunkhash会计算js和css为入口，就算css已经提出去了。那么怎么去解决呢？

### 3、入坑webpack-md5-hash

webpack-md5-hash做了些什么？
这里提到一个概念叫`chunk-hash`，并不是webpack中另一种hash值，而是compilation执行生命周期中的一个钩子。

```
this.applyPlugins("chunk-hash", chunk, chunkHash);
```

chunk-hash是在`chunhash计算完毕之后执行的`，这就意味着如果我们在chunk-hash钩子中可以用新的chunkhash替换已存在的值。webpack-md5-hash便是如此实现的，用了另外一种计算方式，去生成hash值。

看上去一切都很美好，使用了webpack-md5-hash之后，我们去修改css文件的时候，会发现js的hash没有发生变化。那么webpack-md5-hash到底做了些什么？

#### 3.1 webpack-md5-hash做了什么？

![](https://lh3.googleusercontent.com/-FHhesndXOUY/Wh7zNFCIjrI/AAAAAAAAABs/pfTwbRJhcJIVDxYOxWbRAMZqASq52iVXQCHMYCw/I/15119733897082.jpg)

通过模块路径来排序 chunk 的所有依赖模块（仅这个 chunk 中的模块，不含被 CommonsChunkPlugin 剔除的模块），并将这些排序后的模块源代码拼接，最后用 MD5 拼接后内容的 chunkhash。插件这么做的好处是，使 chunkhash 与该 chunk 内代码做直接关联，让 chunk 与其依赖的模块 ID 无关化，无论模块 ID 如何变化，都不会影响父 chunk 的实质内容及 chunkhash。

#### 3.2 存在的问题？
* 当仅有modules id发生改变的时候，hash值不会发生变化（https://github.com/erm0l0v/webpack-md5-hash/issues/7 ）
*  它的计算方法是只计算模块本身的当前内容（包括同步模块），也就是上文的代码。这种计算方式把异步模块的内容忽略掉了。也就是说，`主文件计算hash值时没有把异步模块的内容计算在内`。

 ![](https://lh3.googleusercontent.com/-to9DqvWoUYY/Wh7zNoLxVyI/AAAAAAAAABw/P3PZbCWJBegTFfml526mt5eiq7HMMbesACHMYCw/I/15119741407593.jpg)

#### 3.3 异步模块问题如何导致的?
例如：入口文件main.app.js的代码如下：

```
import '../style/main.app.scss';

console.log('main');
window.onload = function(){
    require.ensure([],(require)=>{
        require('./part.a.js');
    });
}
```

异步模块part.a.js代码如下：

```
console.log('part a');
setTimeout(()=>{
    require.ensure([],(require)=>{
        require('./part.b.js');
    });
},10000);
```

异步模块part.b.js代码如下：

```
import fn_c from './part.c.js';
import fn_d from './part.d.js';

console.log('part b');
```

使用webpack将以上源代码进行编译，输出以下文件：

-------

* main.app.[chunkhash].js：主文件；
* part.a.[chunkhash].js：异步模块a；
* part.b.[chunkhash].js：异步模块b；
* main.app.[chunkhash].css：样式文件。

-------

如果我们修改了part.a.js源码，编译的结果文件哪些文件的hash改变了？ 答案是：只有part.a.[chunkhash].js的hash改变了，其余文件的hash都与修改前一致。那么这种结果是否合理呢？

我们首先了解一下webpack runtime是如何加载异步模块的？

```
var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.charset = 'utf-8';
script.async = true;

script.src = __webpack_require__.p + "js/part/part." + ({
    "1": "a",
    "2": "b"
    }[chunkId] || chunkId) + "." + {
    "1": "f5ea7d95",
    "2": "b93662b0"
}[chunkId] + ".js";

head.appendChild(script);
```

上述代码是编译生成的main.app.[chunkhash].js中实现懒加载的逻辑，原理就是大家熟知的动态生成script标签。但是在对script.src赋值时，webpack有以下三个概念需要知晓：

-------

* chunkId，对应上述代码中的"1"和"2"；
* chunkName，对应上述代码中的"a"和"b"；
* chunkHash，对应上述代码中的"f5ea7d95"和"b93662b0"。

-------


也就是说，part.a.[chunkhash].js和part.b.[chunkhash].js的hash值是写死在main.app.[chunkhash].js中的。按照之前的编译结果，part.a.[chunkhash].js的hash变了，但是main.app.[chunkhash].js的hash没变，那么用户的浏览器仍然缓存着旧版本的main.app.[chunkhash].js，此时异步加载的part.a.[chunkhash].js仍然是旧版本的文件。这显然是不符合需求的。

因此懒加载模块的改动经编译，去引用的主文件的hash值没有变化，影响了版本发布。
所以建议在采用这种插件的时候，一定要搞清楚它的原理和做的事情，否则容易入坑。

### 4、不稳定的chunkhash
计算 chunk MD5 摘要并修改 chunk 资源文件名是不够的，Chunk 的生成还涉及到依赖解析和模块 ID 分配，例如：我们都会在 webpack 里面定义 common chunk 提取公共代码，虽然只修改了 app.js 的代码，但在最终的构建结果中，vendor.js 的 chunkhash 也被修改了，尽管 vendor.js 的内容没有实质变化。这样我们无法提高缓存的利用率。

#### 4.1、编译中会导致缓存失效的因素
在一个 webpack 编译出的分块 (chunk) 文件中，内容分为如下四部分：

* 包含的模块的源代码
* webpack 生成的模块 id (module id) (包括包含的模块 id, 以及该模块引用的依赖模块的 id)
* webpack 用于启动运行的 bootstrap runtime
* Chunk ID

那块这些情况会导致缓存失效：
##### 1、源代码的变更
这个不说了

##### 2、webpack 生成的模块 id变动

```
(function (modules) { // webpackBootstrap
    // ...
})([
/* 0 */
/***/ function(module, exports, __webpack_require__) {
    __webpack_require__(1);
    module.exports = 'entry_1.js';

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {
    __webpack_require__(2);
    module.exports = 'test_1.js';
/***/ },
/* 2 */
/***/ function(module, exports) {
    module.exports = 'test_2.js';
/***/ }
/******/ ])
```

如上，注释中的 /* 0 */ ... /* 1 */ ... 就是该模块对应的 id。
默认，模块的 ID 是 webpack 根据依赖的收集顺序递增的正整数，这种 ID 分配方式不太稳定，。假设新增/删除一个模块引用，或者依赖的顺序变一下，计算结果就可能变化，导致一些模块 id 发生变化，最终导致输出 chunk 变化，缓存失效。这一条几乎会导致所有输出的分块内容都发生变化。

`如何解决这个问题？`

我们需要固定id的计算方式，那么一个模块文件的什么信息是固定的？ -----文件路径
可以使用两个插件来解决这个问题：
* NamedModulesPlugin
* HashedModuleIdsPlugin
他们都已经被添加到了webpack中，可以直接使用：

```
new webpack.HashedModuleIdsPlugin()
```
前者将递增 ID 替换为模块相对路径，可读性强，不过，构建出来的 chunk 会充满各种路径，使文件增大。后者是前者的进阶模块，它在其基础上对模块路径进行 MD5 摘要。到此module id的生成规则稳定下来。

##### 3、webpack bootstrap runtime 变动
上面的代码里 /* 0 */ ... /* 1 */ ... 对应的都是模块定义，要让程序运行起来还需要一小段启动代码，这个就是 webpack bootstrap runtime，它长这样：

```
(function(modules) { // webpackBootstrap
/******/    // The module cache
/******/    var installedModules = {};

/******/    // The require function
/******/    function __webpack_require__(moduleId) {

/******/        // Check if module is in cache
/******/        if(installedModules[moduleId])
/******/            return installedModules[moduleId].exports;

/******/        // Create a new module (and put it into the cache)
/******/        var module = installedModules[moduleId] = {
/******/            exports: {},
/******/            id: moduleId,
/******/            loaded: false
/******/        };

/******/        // Execute the module function
/******/        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/        // Flag the module as loaded
/******/        module.loaded = true;

/******/        // Return the exports of the module
/******/        return module.exports;
/******/    }

/******/    // expose the modules object (__webpack_modules__)
/******/    __webpack_require__.m = modules;

/******/    // expose the module cache
/******/    __webpack_require__.c = installedModules;

/******/    // __webpack_public_path__
/******/    __webpack_require__.p = "/build/";

/******/    // Load entry module and return exports
/******/    return __webpack_require__(0);
/******/ })(/* modules */)
```

其他的都是配置项，启动程序的代码在这一个函数的最后一行：return __webpack_require__(0);，立即执行 id 为0的模块。

这么看好像每次编译的时候这个 runtime 不会有什么变化，然而实际项目中往往为了缓存利用率以及按需加载引入了多个分块 (chunk)，包括公共分块和按需加载的分块。我们可以看到：

```
/******/    // This file contains only the entry chunk.
/******/    // The chunk loading function for additional chunks
/******/    __webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/        // "0" is the signal for "already loaded"
/******/        if(installedChunks[chunkId] === 0)
/******/            return callback.call(null, __webpack_require__);

/******/        // an array means "currently loading".
/******/        if(installedChunks[chunkId] !== undefined) {
/******/            installedChunks[chunkId].push(callback);
/******/        } else {
/******/            // start chunk loading
/******/            installedChunks[chunkId] = [callback];
/******/            var head = document.getElementsByTagName('head')[0];
/******/            var script = document.createElement('script');
/******/            script.type = 'text/javascript';
/******/            script.charset = 'utf-8';
/******/            script.async = true;

/******/            script.src = __webpack_require__.p + "" + chunkId + "." + ({"0":"e_1","1":"e_2"}[chunkId]||chunkId) + "." + {"0":"d0c1831ff024c3aeb47a","1":"50dc9cf2b5e52bc9e61a"}[chunkId] + ".js";
/******/            head.appendChild(script);
/******/        }
/******/    };
```
这个时候我们可以看看到，最后会有一个文件名映射表，它包含chunks ID 及其对应 chunkhash 的对象，那么runtime 中的文件名映射就跟着改了，这个分块也就被修改了。

`如何解决这个问题？`
runtime中变动的就是其中的文件名信息，我们把这总是变动的部分单独拎出来，不要让它影响公共分块或者入口分块。
CommonsChunkPlugin可以帮我们抽取出来：

> CommonsChunkPlugin 可以用于将模块分离到单独的文件中。然而 CommonsChunkPlugin 有一个较少有人知道的功能是，能够在每次修改后的构建结果中，将 webpack 的样板(boilerplate)和 manifest 提取出来。通过指定 entry 配置中未用到的名称，此插件会自动将我们需要的内容提取到单独的包中：

```
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity
    }),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest'
    }),
```
这样就会生成一个特别小（不足 2kb）的 manifest.js解决了 libs 经常被更新的问题。同时我们可以使用[inline-manifest-webpack-plugin](https://github.com/szrenwei/inline-manifest-webpack-plugin)将 manifest 转为内联在 html 内的 inline script

##### 4、Chunk ID变动

```
webpackJsonp([0,1],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

    __webpack_require__(1);
    module.exports = 'entry.js';

/***/ },
/* 1 */
/***/ function(module, exports) {

    module.exports = 'test.js';

/***/ }
]);
```

这里函数调用的第一个参数 [0,1] 就对应了这个分块的 id。
同模块 id 一样, 分块 id 的计算与分块引入顺序有关，官方有提供NamedChunksPlugin插件来根据文件名来稳定你的chunkid。

```
new webpack.NamedChunksPlugin()
```

### 5、总结

```
output: {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js'
},
plugins: [
    // 单独提取 webpack runtime manifest
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest'
    }),

    new HtmlWebpackPlugin({
      template: 'src/pages/index.ejs',
      chunks: ['manifest',  'vendor']
    }),

    //内联manifest
    new InlineManifestWebpackPlugin(),

    // 用文件路径当 id，固定module id
    new webpack.HashedModuleIdsPlugin(),

    // 文件名固定chunk id
    new webpack.NamedChunksPlugin(),

    //css 输出按实际内容计算 hash
    new ExtractTextWebpackPlugin({filename: '[name].[contenthash].css'}),
]
```
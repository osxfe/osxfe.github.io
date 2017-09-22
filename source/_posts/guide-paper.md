---
title: 使用说明
author: System
---
请按以下步骤发表博文:

## 1、全局安装hexo

``` bash
$ npm install hexo -g
```

## 2、Clone 源代码

*master分支存放编译后的代码（html, js, css）,该分支不要改动。*
*source分支存放源代码包含Markdown文件, 需要编写发布博文,请先切换到该分支。*

仓库地址:&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/osxfe/osxfe.github.io


## 3、新建博文

``` bash
$ hexo new "My New Blog"
```

## 4、本地调试

``` bash
$ hexo server
```

## 5、生成静态文件

``` bash
$ hexo generate
```

## 6、发布

``` bash
$ hexo deploy
```

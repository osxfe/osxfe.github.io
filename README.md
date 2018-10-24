## Note:
* 写博客前请clone 该分支
* master 分支 用于发布静态文件
* source 分支 存放源码
* 发布完博文一定不要忘记提交源代码(＾Ｕ＾)ノ~ＹＯ
* 访问地址：https://osxfe.github.io/

## 创作说明

### 请按以下步骤发表博文:

#### 方式一

1、Clone 源代码 （已clone跳过）

* master分支存放编译后的代码（html, js, css）,该分支不要改动。
* source分支存放源代码包含Markdown文件, 需要编写发布博文,请先切换到该分支。
* 仓库地址:&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/osxfe/osxfe.github.io

2、拉取最新代码

``` bash
$ git pull
```

3、新建博文（参考hexo命令）

``` bash
$ hexo new "My New Blog"
```

4、代码合并到source分支

5、发布博文（source分支）

``` bash
$ yarn run publish
```

#### 方式二

[![CircleCI](https://circleci.com/gh/osxfe/osxfe.github.io/tree/source.svg?style=svg)](https://circleci.com/gh/osxfe/osxfe.github.io/tree/source)

本项目使用hexo作为静态代码生成器， 源码及默认分支为`source`分支， 部署分支为`master`。

-如何贡献-

- 写作时直接从`origin`的`source`分支`checkout`一个`pattern`为`blog-${nickname}-${blogTitleEN}`的分支
- 在该分支的`source/_posts/`目录下创建一个`markdown`开始创作
- 完成后创建一个`pr`给小伙伴们review
- 合并之后`circle ci`会自动将最新的代码发布

### 注意事项

1、本地开发
``` bash
$ yarn run dev
```

2、若发现代码不生效可运行以下命令
``` bash
$ yarn run clean
```


### 附： hexo api (参考)

1、全局安装hexo

``` bash
$ npm install hexo -g
```

2、新建博文

``` bash
$ hexo new "My New Blog"
```

3、本地调试

``` bash
$ hexo server
```

4、生成静态文件

``` bash
$ hexo generate
```

5、发布

``` bash
$ hexo deploy
```

var execSync = require('child_process').execSync;
var Print = require('./print');

Print.info('发布前校验...');

// step 1 判断当前分支是否是source
var branchNameWithBuffer = execSync('git rev-parse --abbrev-ref HEAD');
var branchName = String(branchNameWithBuffer).replace('\n', '');

if (branchName !== 'source') {
  Print.error('只能在source分支发布博客！');
  process.exit();
}

// step2 查看 git 当前状态
var status = execSync('git status');
var statusString = String(status).replace('\n', '');

if (statusString.indexOf('nothing to commit') === -1) {
  Print.error('你有未提交的代码, 请先上传代码再发布！');
  rocess.exit();
}

if (statusString.indexOf('up-to-date') === -1) {
  Print.error('你的当前代码不是最新代码, 请先拉取最新代码再发布！');
  rocess.exit();
}

// step3 发布博客
Print.info('校验通过，开始发布...');
execSync('hexo g && hexo deploy');



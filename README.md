# build
## npm
```
npm install -g package --registry=https://registry.npm.taobao.org
npm install gulp --save 或 npm install gulp -S
```

### --save-dev和--save的区别: 

    参考：https://www.cnblogs.com/blackgan/p/7678868.html

#### package.json
```
key: dependencies
dependencies属性被声明在一个简单的对象中，用来控制包名在一定的版本范围内，版本范围是一个字符串，可以被一个或多个空格分割。dependencied也可以被指定为一个压缩包地址或者一个 git URL 地址。

不要把测试工具或transpilers转义器(babel, webpack, gulp, postcss...)写到dependencies中。 （这些应该写到devDependencies）配置中，因为在别的项目中npm install 该包的时候会去下载dependencies中的依赖。

key: devDependencies
如果你的包被别人依赖或者安装时，在对方主项目中进行npm install便不会安装依赖包中的devDependencies中的npm包，所以如果你的项目中依赖的一些包不是在使用该项目时必须进行安装的，那就将包放在devDependencies中。

之后运行npm install --production或者注明NODE_ENV变量值为production时,会忽略devDependencies依赖
```
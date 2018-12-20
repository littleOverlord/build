# build v0.0.01
## 开发心得
    记录从electorn 到babel构建代码的开发心得
### npm
```
npm install -g package --registry=https://registry.npm.taobao.org
npm install gulp --save 或 npm install gulp -S

npm pack 构建二进制包
npm run pack 构建可执行包
```

#### --save-dev和--save的区别: 

    参考：https://www.cnblogs.com/blackgan/p/7678868.html

##### package.json
```
key: dependencies
dependencies属性被声明在一个简单的对象中，用来控制包名在一定的版本范围内，版本范围是一个字符串，可以被一个或多个空格分割。dependencied也可以被指定为一个压缩包地址或者一个 git URL 地址。

不要把测试工具或transpilers转义器(babel, webpack, gulp, postcss...)写到dependencies中。 （这些应该写到devDependencies）配置中，因为在别的项目中npm install 该包的时候会去下载dependencies中的依赖。

key: devDependencies
如果你的包被别人依赖或者安装时，在对方主项目中进行npm install便不会安装依赖包中的devDependencies中的npm包，所以如果你的项目中依赖的一些包不是在使用该项目时必须进行安装的，那就将包放在devDependencies中。

之后运行npm install --production或者注明NODE_ENV变量值为production时,会忽略devDependencies依赖
```

### babel

#### '@babel/preset-typescript'
```
Options必须配置filename，否则会报错
babel.transform(code, {
    filename,
    presets: ['@babel/preset-typescript']
})
```
#### '@babel/preset-env'
```
错误：在调用编译时，指定targets不能正常工作
data.es5 = babel.transform(data.code,{
    presets: ["@babel/preset-env",
        targets: "last 1 version"
    ]
})
正确：
在项目的package.json中配置
"browserslist": [
    "last 1 version",
    "> 1%",
    "maintained node versions",
    "not dead"
  ]
然后直接使用
data.es5 = babel.transform(data.code,{
    presets: ["@babel/preset-env"]
})
```


## 功能
    
### 1.微信构建ts成es6(v0.0.1)
### 2.微信排除没有spritesheet配置的png资源(v0.0.1)

### 3.压缩json文件，生成解析配置(v0.0.2)
### 4.监听文件，动态构建(v0.0.2)

### 5.压缩js(v0.0.3)
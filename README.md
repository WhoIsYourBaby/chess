#大圣棋牌（Pomelo + Cocos Creator）
======
网易pomelo框架 + CocosCreator客户端
安卓+iOS+H5三端通用，同时支持分布式部署
如果了解pomelo框架会发现本项目结构十分简单，希望大家能通过本项目更好的学习和使用pomelo

>十分欢迎大家贡献代码，尤其是ccc客户端，因为一个人又要开发服务器又要开发客户端，还要去搞美术，实在有些忙不过来

#目前已有的功能和开发计划
======
```
1、游客登录
2、百人牛牛
```
该项目的最终形态是包含许多种棋牌游戏基础玩法的、易重构易二次开发的游戏平台，任何人可以在这个基础上丰富自己特色功能

大家也可以把它当做一个学习pomelo和cocos creator的入门项目对待

#环境搭建
======
服务器支持Mac/Linux/Win
服务器搭建教程(以Mac)：
```
1、安装pomelo <https://github.com/NetEase/pomelo/wiki/%E5%AE%89%E8%A3%85pomelo>
2、clone本项目
3、安装nodejs第三方库，执行chess/npm-install.sh
4、安装mysql 5.6+  并设置好用户名和密码，这个mysql官网里面去找到合适的版本安装即可 <https://dev.mysql.com/downloads/>
6、向mysql导入 chess/game-server/app/dao/mysql/chess.sql
7、修改项目中对mysql的连接设置
chess/game-server/config/mysql.json
把该文件中的user  和  password 修改为上一步中mysql设置的用户名和密码
7、运行服务器
cd chess/game-server
pomelo start

到这里，如果不出意外，服务器就安装结束并且启动啦
```
客户端开发环境
```
CocosCreator 1.5+
用ccc打开chess/client_cocos项目，直接运行即可
```



棋牌服务器API
接口方式说明：
request：客户端发起调用并接收返回
push:服务器主动向客户端推数据
notify:客户端主动向服务器发数据，无返回
# 1、登录认证模块
连接39.108.83.192:3101后调用以下接口
##1.1游客登录
接口：
request:gate.gateHandler.guestLogin
参数：
无
返回：
{
  "code": 1,
  "msg": "ok",
  "data": {
    "userinfo": {
      "userid": 10000030,
      "username": null,
      "usernick": "游客",
      "phone": null,
      "password": null,
      "create_time": "2017-08-14T10:55:52.000Z",
      "gold": 3000,
      "roomcard": 0,
      "sex": 0,
      "image": null,
      "room_info": null
    },
    "token": "0a2e2bd2522a5a1950b32076d07a38ac2b17c5ae1176f695f929d62d0c98f98ce12909ae8b5ec28ddb7adf340b008575",
    "localConnector": {
      "host": "127.0.0.1",
      "port": 3103
    },
    "remoteConnector": {
      "host": "39.108.83.192",
      "port": 3103
    }
  }
}

注释：
userinfo：游客用户信息
token：用户凭证，后续接口调用需要
localConnector是本地测试connector地址
remoteConnector是远程测试服务器的connector地址


##1.2刷新token
request:gate.gateHandler.refreshToken
参数：
token，登录成功后返回的token
返回：
同**游客登录**返回

#2、房间模块
##2.1获取房间列表
request:connector.entryHandler.fetchRoomInfo
参数：
rtype，房间类型：jdnn（经典牛牛），zjh（扎金花），bjl（百家乐）
返回：
房间列表数据
##2.2进入房间
request:connector.entryHandler.joinRoom
参数：
userid : 用户id，登录成功后返回,
roomid : 房间id，获取房间列表接口返回,
rtype : ---
token : ---
返回：
{
  "code": 1,
  "msg": "成功加入房间",
  "data": {
    "userList": [
      "10000019",
      "10000039"
    ]
  }
}
注释：
userList，包括自己在内的房间内userid数组
##2.3根据userid获取用户信息
request:connector.entryHandler.fetchUserInfo
参数
userList，userid数组，为json数组格式，
参考
userList: [
      "10000019",
      "10000039"
    ]
返回：
用户信息数组
#3、牛牛游戏模块
进入房间后调用
##3.1准备/取消准备
request:jdnn.jdnnHandler.ready
参数：
roomid
userid
ready，准备true，取消准备false
返回：
房间内所有用户准备状态
##3.2选择分数倍数
request:jdnn.jdnnHandler.chipIn
参数：
userid
roomid
muti，倍数，大于0的整数
返回：
选择倍数成功
##3.3有用户准备/取消准备
push:jdnn.ready
返回：
房间内所有用户准备状态
##3.4准备时间倒计时
push:jdnn.gamePrepare
返回：
state：
//0、准备
//1、产生庄家
//2、非庄家选择分数倍数
//3、发牌开始
//4、开牌 + 结算
//5、空闲时间

time：倒计时间，单位：秒

##3.5产生庄家
push:jdnn.markBanker
返回：
state
banker：庄家的userid
##3.6选择分数倍数的倒计时
push:jdnn.gameChip
返回：
state:
time:
##3.7发牌
push:jdnn.gamePoker
返回：
{
  "code": 1,
  "msg": "发牌",
  "data": {
    "state": 3,
    "poker": {
      "10000019": [
        {
          "color": "A",
          "value": 13
        },
        {
          "color": "D",
          "value": 9
        },
        {
          "color": "A",
          "value": 9
        },
        {
          "color": "D",
          "value": 7
        },
        {
          "color": "B",
          "value": 8
        }
      ],
      "10000040": [
        {
          "color": "A",
          "value": 3
        },
        {
          "color": "C",
          "value": 10
        },
        {
          "color": "C",
          "value": 1
        },
        {
          "color": "C",
          "value": 3
        },
        {
          "color": "C",
          "value": 7
        }
      ]
    }
  }
}

注释：
poker：每个userid对应该用户发到手的牌五张
color：D:方块,C:梅花,B:红桃,A:黑桃,
value：1->A,  13->K
##3.8结算输赢
push:jdnn.gameResult
返回：
{
  "10000019": {
    "nntype": 0,
    "niuN": -1,
    "pIndex1": -1,
    "pIndex2": -1,
    "goldWin": -1
  },
  "10000040": {
    "nntype": 1,
    "niuN": 4,
    "pIndex1": 0,
    "pIndex2": 2,
    "bwin": 1,
    "banker": "10000019",
    "goldWin": 1
  }
}

注释：
goldWin：输赢金币，赢>0，输<0
banker：庄家
bwin：小于1的时候是输，等于1的时候赢
niuN：数值大小，有牛的时候表示牛几，有炸弹的时候表示四个几，其他时候为0
nntype：表示用户牌型
炸弹(6) > 五小(5) > 五花(4) > 四花(3) > 牛牛(2) > 有分(1) > 没分(0)
牌型翻倍情况：
无分和牛1，牛2，牛3，牛4，牛5，牛6： 1倍
牛7，牛8，牛9： 2倍
牛牛： 3倍
四花： 4倍
五花： 5倍
五小： 6倍
炸弹： 8倍



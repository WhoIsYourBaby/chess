//
//  PomeloClient.h
//  Client
//
//  Created by xiaochuan on 13-9-23.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SRWebSocket.h"


typedef void(^PomeloCallback)(id arg);



typedef enum{
    ResCodeOk = 200,
    ResCodeFail = 500,
    ResCodeOldClient = 501,
    ResCodeHeartBeatTimeout = 100000
}ResCode;

@class PomeloClient;

@protocol PomeloClientDelegate <NSObject>

/**
 *  用户自定义的加密
 *
 *  @param reqId requestid
 *  @param route 路由
 *  @param msg   消息
 *
 *  @return 加密后的Data
 */
- (NSData *)pomeloClientEncodeWithReqId:(NSInteger)reqId andRoute:(NSString *)route andMsg:(NSDictionary *)msg;
/**
 *  用户自定义解密
 *
 *  @param data 原始数据
 *
 *  @return 解密后的数据
 */
- (NSData *)pomeloClientDecodeWithData:(NSData *)data;



/**
 *  断开连接
 *
 *  @param pomelo PomeloClinet
 *  @param error  错误信息
 */
- (void)pomeloDisconnect:(PomeloClient *)pomelo withError:(NSError *)error;
@end


@class ProtobufDecoder;
@class ProtobufEncoder;
@interface PomeloClient : NSObject<SRWebSocketDelegate>{
    SRWebSocket *_webSocket;
    
    /**
     *  所有的回调函数都在这个字典里存着
     */
    NSMutableDictionary *_callBacks;
    
    
    /**
     *  连接时客户端发给服务器的参数
     */
    NSDictionary *_connectionParam;
    
    /**
     *  心跳时间间隔
     */
    NSTimeInterval _heartbeatInterval;
    /**
     *  心跳超时时间间隔
     */
    NSTimeInterval _heartbeatTimeout;
    
    /**
     *  心跳超时标识
     */
    BOOL _heartbeatTimeoutId;
    
    /**
     *  心跳标识
     */
    BOOL _heartbeatId;
    
    
    /**
     *  下一个心跳超时的时间
     */
    NSTimeInterval _nextHeartbeatTimeout;
    
    
    /**
     *  heartbeat gap threashold
     */
    NSTimeInterval _gapThreshold;
    
    
    /**
     *  发送的id
     */
    NSInteger _reqId;
    
    
    /**
     *  路由表
     */
    NSMutableDictionary *_routeMap;
    
    /**
     *  客户端Protobuf
     */
    NSDictionary *_clientProtos;
    /**
     *  服务端的Protobuf
     */
    NSDictionary *_serverProtos;
    
    NSDictionary *_dict;    // route string to code
    
    NSNumber *_protoVersion;
    
    NSDictionary *_abbrs;   // code to route string
    
    ProtobufDecoder *_probufDecode;
    
    ProtobufEncoder *_protobufEncode;
    
    
    NSMutableArray *_logs;
}
@property (nonatomic,assign) id delegate;



#pragma mark --  连接

/**
 *  初始化方法
 *
 *  @param delegate 代理
 *
 *  @return PomeloClient
 */
- (id)initWithDelegate:(id)delegate;

/**
 *  连接
 *
 *  @param host 地址
 *  @param port 端口
 */
- (void)connectToHost:(NSString *)host onPort:(NSString *)port;

/**
 *  连接
 *
 *  @param host     地址
 *  @param port     端口
 *  @param callback 完成后的回调
 */
- (void)connectToHost:(NSString *)host onPort:(NSString *)port withCallback:(PomeloCallback)callback;

/**
 *  连接
 *
 *  @param host   地址
 *  @param port   端口
 *  @param params 发出去的参数
 */
- (void)connectToHost:(NSString *)host onPort:(NSString *)port withParams:(NSDictionary *)params;

/**
 *  连接
 *
 *  @param host     地址
 *  @param port     端口
 *  @param params   发出去的参数
 *  @param callback 完成后的回调
 */
- (void)connectToHost:(NSString *)host onPort:(NSString *)port params:(NSDictionary *)params withCallback:(PomeloCallback)callback;

#pragma mark -- 断开

/**
 *  断开连接
 */
- (void)disconnect;

/**
 *  断开连接
 *
 *  @param callback 完成后的回调
 */
- (void)disconnectWithCallback:(PomeloCallback)callback;


#pragma mark -- 通信
/**
 *  发送请求
 *
 *  @param route    路由地址
 *  @param params   发送的参数
 *  @param callback 完成后的回调函数
 */
- (void)requestWithRoute:(NSString *)route andParams:(NSDictionary *)params andCallback:(PomeloCallback)callback;


/**
 *  发送通知
 *
 *  @param route  路由地址
 *  @param params 发送的参数
 */
- (void)notifyWithRoute:(NSString *)route andParams:(NSDictionary *)params;


/**
 *  注册通知回调函数
 *
 *  @param route    路由地址
 *  @param callback 通知出发的回调函数
 */
- (void)onRoute:(NSString *)route withCallback:(PomeloCallback)callback;

/**
 *  注销通知
 *
 *  @param route 路由地址
 */
- (void)offRoute:(NSString *)route;

/**
 *  注销所有通知
 */
- (void)offAllRoute;





+ (id)decodeJSON:(NSData *)data error:(NSError **)error;
+ (NSString *)encodeJSON:(id)object error:(NSError **)error;
@end



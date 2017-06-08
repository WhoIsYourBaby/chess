//
//  ProtobufParse.h
//  Client
//
//  Created by xiaochuan on 13-10-31.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ProtobufParse : NSObject

/**
 *  解析Protobuf定义文件解析
 *
 *  @param protos protobuf 定义Json
 *
 *  @return 解析后的对照表
 */
+ (NSDictionary *)parse:(NSDictionary *)protos;
@end

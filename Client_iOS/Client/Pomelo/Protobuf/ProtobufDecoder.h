//
//  ProtobufDecoder.h
//  Client
//
//  Created by xiaochuan on 13-10-11.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef struct {
    NSUInteger type;
    NSUInteger tag;
}ProtobufHead;

@interface ProtobufDecoder : NSObject
{
    NSDictionary *_protos;
    
    NSUInteger _offset;
    
    NSMutableData *_buffer;
}

/**
 *  初始化
 *
 *  @param dict Protobuf的结构
 *
 *  @return ProtobufDecoder
 */
+ (ProtobufDecoder *)protobufDecodeWhitProtos:(NSDictionary *)dict;


/**
 *  解密
 *
 *  @param route 路由名称
 *  @param buf   数据源
 *
 *  @return 解密后的数据
 */
- (NSDictionary *)decodeWithRoute:(NSString *)route andData:(NSData *)buf;
@end

//
//  ProtobufEncoder.h
//  Client
//
//  Created by xiaochuan on 13-10-12.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ProtobufEncoder : NSObject
{
    NSDictionary *_protos;
    NSUInteger *_offset;
    NSMutableData *_buffer;
}

/**
 *  初始化
 *
 *  @param protos protobuf信息
 *
 *  @return ProtobufEncoder
 */
+ (ProtobufEncoder *)protobufEncoderWithProtos:(NSDictionary *)protos;

/**
 *  加密
 *
 *  @param route route名称
 *  @param msg   参数
 *
 *  @return 加密后的数据
 */
- (NSData *)encodeWithRoute:(NSString *)route andMessage:(NSDictionary *)msg;
@end

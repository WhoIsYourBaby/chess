//
//  PBCodec.h
//  Client
//
//  Created by xiaochuan on 13-10-11.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ProtobufCodec : NSObject

/**
 *  把无符号数字转换成Data
 *
 *  @param num 数字
 *
 *  @return Data
 */
+ (NSMutableData *)encodeUInt32:(uint64_t)num;


/**
 *  把Data转成无符号数字
 *
 *  @param data Data
 *
 *  @return 数字
 */
+ (uint64_t)decodeUInt32:(NSData *)data;


/**
 *  把有符号的数字转化成Data
 *
 *  @param num 数字
 *
 *  @return Data
 */
+ (NSMutableData *)encodeSInt32:(int64_t)num;


/**
 *  把Data转换成有符号的数字
 *
 *  @param data Data
 *
 *  @return 数字
 */
+ (int64_t)decodeSInt32:(NSData *)data;
@end

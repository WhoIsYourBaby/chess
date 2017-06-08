//
//  ProtobufUtil.h
//  Client
//
//  Created by xiaochuan on 13-10-11.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ProtobufConstant.h"
@interface ProtobufUtil : NSObject

/**
 *  检测类型是否是简单类型
 *
 *  @param type 类型的字符串
 *
 *  @return 结果
 */
+ (BOOL)isSimpleType:(NSString *)type;


/**
 *  把类型的字符串转换成枚举类型
 *
 *  @param str 类型
 *
 *  @return 枚举值
 */
+ (ProtobufType)stringToType:(NSString *)str;

@end

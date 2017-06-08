//
//  ProtobufUtil.m
//  Client
//
//  Created by xiaochuan on 13-10-11.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import "ProtobufUtil.h"

@implementation ProtobufUtil


+ (BOOL)isSimpleType:(NSString *)type{
    ProtobufType t = [ProtobufUtil stringToType:type];
    return (t == ProtobufTypeSint32 ||
            t == ProtobufTypeInt32  ||
            t == ProtobufTypeSint32 ||
            t == ProtobufTypeDouble ||
            t == ProtobufTypeFloat);
}


+ (ProtobufType)stringToType:(NSString *)str{
    if ([str isEqualToString:@"uInt32"]) {
        return ProtobufTypeUInt32;
    }
    if ([str isEqualToString:@"int32"]) {
        return ProtobufTypeSint32;
    }
    if ([str isEqualToString:@"sInt32"]) {
        return ProtobufTypeSint32;
    }
    if ([str isEqualToString:@"float"]) {
        return ProtobufTypeFloat;
    }
    if ([str isEqualToString:@"double"]) {
        return ProtobufTypeDouble;
    }
    if ([str isEqualToString:@"string"]) {
        return ProtobufTypeString;
    }
    if ([str isEqualToString:@"sInt64"]) {
        return ProtobufTypeSint32;
    }
    if ([str isEqualToString:@"uInt64"]) {
        return ProtobufTypeUInt32;
    }
    return ProtobufTypeUnknow;
}
@end

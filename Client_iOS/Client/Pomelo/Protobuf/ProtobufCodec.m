//
//  PBCodec.m
//  Client
//
//  Created by xiaochuan on 13-10-11.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import "ProtobufCodec.h"

@implementation ProtobufCodec


+ (NSMutableData *)encodeUInt32:(uint64_t)num{
    NSMutableData *result = [[NSMutableData alloc] init];
    
    
    do {
        uint64_t tmp = num % 128;
        uint64_t next = num / 128;
        if (next != 0) {
            tmp += 128;
        }
        
        [result appendBytes:&tmp length:1];
        num = next;
    } while (num != 0);
    
    return  result;
}


+ (uint64_t)decodeUInt32:(NSData *)data{
    uint64_t n = 0;
    
    unsigned char *bytes = (unsigned char *)[data bytes];
    
    uint64_t length = data.length;
    for (uint64_t i = 0; i < length; i++) {
        unsigned int m = bytes[i];
        
        n = n + ((m & 0x7f)  * pow(2, 7 * i));
        
        if (m < 128) {
            return  n;
        }
    }
    return n;
}



+ (NSMutableData *)encodeSInt32:(int64_t)num{
    num = num < 0 ? (llabs(num) * 2 -1) : num * 2;
    
    return [ProtobufCodec encodeUInt32:num];
}


+ (int64_t)decodeSInt32:(NSData *)data{
    int64_t n = [ProtobufCodec decodeUInt32:data];
    
    int flag = (n % 2) == 1 ? -1 : 1;
    
    n = ((n %2 + n) / 2) * flag;
    
    return n;
}

@end

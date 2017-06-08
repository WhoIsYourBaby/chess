//
//  ProtobufParse.m
//  Client
//
//  Created by xiaochuan on 13-10-31.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import "ProtobufParse.h"

@implementation ProtobufParse


+ (NSDictionary *)parse:(NSDictionary *)protos{
    NSMutableDictionary *maps = [NSMutableDictionary dictionary];
    
    NSArray *keys = [protos allKeys];
    
    for (NSString *key in keys) {
        [maps setObject:[ProtobufParse parseObject:[protos objectForKey:key]] forKey:key];
    }
    
    return maps;
    
}


+ (NSDictionary *)parseObject:(NSDictionary *)obj{
    
    NSMutableDictionary *proto = [NSMutableDictionary dictionary];
    NSMutableDictionary *nextProtos = [NSMutableDictionary dictionary];
    NSMutableDictionary *tags = [NSMutableDictionary dictionary];
    
    [obj enumerateKeysAndObjectsUsingBlock:^(NSString *key, id tag, BOOL *stop) {
        NSArray *params = [key componentsSeparatedByString:@" "];
        if ([tag isKindOfClass:[NSNumber class]]) {
            tag = [NSString stringWithFormat:@"%@",tag];
        }
        
        NSString *typeStr = [params objectAtIndex:0];
        if ([typeStr isEqualToString:@"message"]) {
            if ([params count] != 2) {
                return ;
            }
            [nextProtos setObject:[ProtobufParse parseObject:tag] forKey:[params objectAtIndex:1]];
            return;
        }else if ([typeStr isEqualToString:@"required"] || [typeStr isEqualToString:@"optional"] || [typeStr isEqualToString:@"repeated"]){
            //params length should be 3 and tag can't be duplicated
            if ([params count] != 3 || [tags objectForKey:tag]) {
                return;
            }
            NSMutableDictionary *temp = [NSMutableDictionary dictionaryWithObjectsAndKeys:typeStr,@"option",
                                         [params objectAtIndex:1],@"type",tag,@"tag", nil];
            [proto setObject:temp forKey:[params objectAtIndex:2]];
            [tags setObject:[params objectAtIndex:2] forKey:tag];
        }
        
        
    }];
    
    [proto setObject:nextProtos forKey:@"__messages"];
    [proto setObject:tags forKey:@"__tags"];
    
    return proto;
}
@end

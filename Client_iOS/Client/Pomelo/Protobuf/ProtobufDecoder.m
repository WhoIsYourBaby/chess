//
//  ProtobufDecoder.m
//  Client
//
//  Created by xiaochuan on 13-10-11.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import "ProtobufDecoder.h"
#import "ProtobufCodec.h"
#import "ProtobufUtil.h"

@interface ProtobufDecoder (PrivateMethod)

/**
 *  Get tag head without move the offset
 *
 *  @return Data
 */
- (NSMutableData *)peekBytes;

- (NSMutableData *)getBytes:(BOOL)flag;


- (NSDictionary *)decodeMsg:(NSMutableDictionary *)msg andProto:(NSDictionary *)proto andLength:(NSUInteger)length ;

/**
 *  Get property head from protobuf
 *
 *  @return Head
 */
- (ProtobufHead)getHead;

- (id)decodeProp:(NSString *)type andProtos:(NSDictionary *)proto;


- (void)decodeArray:(NSMutableArray *)array andType:(NSString *)type andProtos:(NSDictionary *)proto;
@end


@implementation ProtobufDecoder

+ (ProtobufDecoder *)protobufDecodeWhitProtos:(NSDictionary *)dict{
    return [[self alloc] initWithProtos:dict];
}

- (id)initWithProtos:(NSDictionary *)dict{
    if (self = [super init]) {
        _protos = dict;
        _offset = 0;
    }
    return self;
}


- (NSDictionary *)decodeWithRoute:(NSString *)route andData:(NSData *)buf{
    
    _buffer = [NSMutableData dataWithData:buf];
    
    _offset = 0;
    
    NSDictionary *tProtos = [_protos objectForKey:route];
    
    if (tProtos) {
        NSMutableDictionary *result = [NSMutableDictionary dictionary];
        return [self decodeMsg:result andProto:tProtos andLength:_buffer.length];
    }
    return nil;
}

#pragma mark -
#pragma mark private mothod

- (NSDictionary *)decodeMsg:(NSMutableDictionary *)msg andProto:(NSDictionary *)proto andLength:(NSUInteger)length{


    while (_offset < length) {
        ProtobufHead head = [self getHead];
        NSUInteger tag = head.tag;

        
        NSString *name = [[proto objectForKey:@"__tags"] objectForKey:[NSString stringWithFormat:@"%d",tag]];
        
        
        NSString *option = proto[name][@"option"];
        
        if ([option isEqualToString:@"optional"] || [option isEqualToString:@"required"]) {
            
            id temp = [self decodeProp:proto[name][@"type"] andProtos:proto];
            
            [msg setObject:temp  forKey:name];
            
        }else if ([option isEqualToString:@"repeated"]){
            
            if (!msg[name]) {
                
                [msg setObject:[NSMutableArray array] forKey:name];
                
            }
            
            [self decodeArray:msg[name] andType:proto[name][@"type"] andProtos:proto];
            
        }
        
    }
    
    
    return msg;
    
    
}



- (id)decodeProp:(NSString *)type andProtos:(NSDictionary *)proto{
    if ([type isEqualToString:@"uInt32"]) {
        
        return [NSNumber numberWithLongLong:[ProtobufCodec decodeUInt32:[self getBytes:NO]]];
        
    }else if ([type isEqualToString:@"int32"] || [type isEqualToString:@"sInt32"]){
        
        return [NSNumber numberWithLongLong:[ProtobufCodec decodeSInt32:[self getBytes:NO]]];
        
    }else if ([type isEqualToString:@"float"]){
        
        NSData *tData = [_buffer subdataWithRange:NSMakeRange(_offset, 4)];
        
        float *flo = (float *)[tData bytes];
        
        _offset += 4;
        
        return [NSNumber numberWithFloat:*flo];
        
    }else if([type isEqualToString:@"double"]){
        
        NSData *tData = [_buffer subdataWithRange:NSMakeRange(_offset, 8)];
        
        double *dou = (double *)[tData bytes];
        
        _offset += 8;
        
        return [NSNumber numberWithDouble:*dou];
        
    }else if ( [type isEqualToString:@"string"]){
        
        NSUInteger length = (NSUInteger)[ProtobufCodec decodeUInt32:[self getBytes:NO]];
        
        NSData *tData = [_buffer subdataWithRange:NSMakeRange(_offset, length)];
        
        NSString *str = [[NSString alloc] initWithData:tData encoding:NSUTF8StringEncoding];
        
        _offset += length;
        
        return str;
        
    }else{
        
        if (proto) {
            NSDictionary *message = proto[@"__messages"][type];
            if (!message) {
                message = [_protos objectForKey:[NSString stringWithFormat:@"message %@",type]];
            }
            
            if (message) {
                NSUInteger length = (NSUInteger)[ProtobufCodec decodeUInt32:[self getBytes:NO]];
                
                NSMutableDictionary *msg = [NSMutableDictionary dictionary];
                
                [self decodeMsg:msg andProto:message andLength:_offset+length];
                
                return msg;
            }
        }
        
    }
    
    return nil;
}



- (void)decodeArray:(NSMutableArray *)array andType:(NSString *)type andProtos:(NSDictionary *)proto{
    if ([ProtobufUtil isSimpleType:type]) {
        
        NSUInteger length = (NSUInteger)[ProtobufCodec decodeUInt32:[self getBytes:NO]];
        
        for (NSUInteger i = 0; i < length; i++) {
            [array addObject:[self decodeProp:type andProtos:nil]];
        }
        
    }else{
        
        [array addObject:[self decodeProp:type andProtos:proto]];
        
    }
}


- (ProtobufHead)getHead{
    NSUInteger tag = (NSUInteger)[ProtobufCodec decodeUInt32:[self getBytes:NO]];
    
    ProtobufHead head;
    head.type = tag & 0x7;
    head.tag = tag >> 3;
    
    return head;
}

- (NSMutableData *)peekBytes
{
    return [self getBytes:NO];
}

- (NSMutableData *)getBytes:(BOOL)flag{
    NSMutableData *bytes = [[NSMutableData alloc] init];
    
    NSUInteger pos = _offset;
    unsigned char b;
    unsigned char *buff = (unsigned char *)[_buffer bytes];
    do {
        b = buff[pos];
        [bytes appendBytes:&b length:1];
        pos ++;
    } while (b >= 128);
    
    
    if (!flag) {
        _offset = pos;
    }
    
    return bytes;
    
}

@end

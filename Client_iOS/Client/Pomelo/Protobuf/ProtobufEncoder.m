//
//  ProtobufEncoder.m
//  Client
//
//  Created by xiaochuan on 13-10-12.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import "ProtobufEncoder.h"
#import "ProtobufUtil.h"
#import "ProtobufCodec.h"
@interface ProtobufEncoder (PrivateMethod)

- (BOOL)checkMsg:(NSDictionary *)msg andProtos:(NSDictionary *)protos;

- (NSData *)encodeTagWithType:(NSString *)type andTag:(NSInteger)tag;

- (NSUInteger)writeBytesWithData:(NSMutableData *)buff
                       andOffset:(NSUInteger)offset
                         andData:(NSData *)bytes;

- (NSUInteger)encodePropWithValue:(id)value
                          andType:(NSString *)type
                        andOffset:(NSUInteger)offset
                        andBuffer:(NSMutableData *)buffer
                        andProtos:(NSDictionary *)proto;

- (NSUInteger)encodeMsgWithBuffer:(NSMutableData *)buffer
                        andOffset:(NSUInteger)offset
                        andProtos:(NSDictionary *)proto
                           andMsg:(NSDictionary *)msg;

- (NSUInteger)encodeArray:(NSArray *)array
                 andProto:(NSDictionary *)proto
                andOffset:(NSUInteger)offset
                andBuffer:(NSMutableData *)buffer
                andProtos:(NSDictionary *)protos;

@end

@implementation ProtobufEncoder

+ (ProtobufEncoder *)protobufEncoderWithProtos:(NSDictionary *)protos{
    return [[self alloc] initWithProtos:protos];
}


- (id)initWithProtos:(NSDictionary *)protos{
    if (self = [super init]) {
        _protos = protos;
    }
    return self;
}


- (NSData *)encodeWithRoute:(NSString *)route andMessage:(NSDictionary *)msg{
    if (!route || !msg) {
        NSLog(@"Route or msg can not be null! route : %@, msg %@",route,msg);
        return nil;
    }
    
    
    NSDictionary *protos = _protos[route];
    
    if (![self checkMsg:msg andProtos:protos]) {
        
        NSLog(@"check msg failed! msg : %@, proto : %@", msg, protos);
        return nil;
        
    }
    
    
    NSMutableData *buffer = [[NSMutableData alloc] init];
    NSUInteger offset = 0;
    
    if (protos) {
        offset = [self encodeMsgWithBuffer:buffer andOffset:offset andProtos:protos andMsg:msg];
        return buffer;
    }
    
    return nil;
}




#pragma mark --
#pragma mark private method


- (BOOL)checkMsg:(NSDictionary *)msg andProtos:(NSDictionary *)protos{
    if (!protos || !msg) {
        return NO;
    }
    BOOL __block result = YES;
    [protos enumerateKeysAndObjectsUsingBlock:^(NSString *name, NSDictionary *proto, BOOL *stop) {
        
        NSString *option = proto[@"option"];
        
        if ([option isEqualToString:@"required"]) {
            
            if (!name) {
                NSLog(@"no property exist for required! name: %@, proto: %@, msg: %@", name, proto, msg);

                result = NO;
                *stop = YES;
                
            }
            
        }else if ([option isEqualToString:@"optional"]){
            
//            NSDictionary *message = protos[@"__messages"][proto[@"type"]];
//            if (!message) {
//
//                message = _protos[[NSString stringWithFormat:@"message %@",proto[@"type"]]];
//                
//            }
//            NSLog(@"%@",name);
//            if (message && ![self checkMsg:msg[name] andProtos:message]) {
//                NSLog(@"inner proto error! name: %@, proto: %@, msg: %@", name, proto, msg);
//                
//                result = NO;
//                *stop = YES;
//                
//            }
        }else if ([option isEqualToString:@"repeated"]){
            
            NSDictionary *message = protos[@"__messages"][proto[@"type"]];
            if (!message) {
                
                message = _protos[[NSString stringWithFormat:@"message %@",proto[@"type"]]];
                
            }
            
            NSArray *arra = msg[name];
            if (arra  && message) {
                for (int i = 0; i < [arra count]; i++) {
                    if (![self checkMsg:[arra objectAtIndex:i] andProtos:message]) {
                        
                        result = NO;
                        *stop = YES;
                        break;
                    }
                }
            }
        }
        
    }];
    
    return result;
}


- (NSUInteger)encodeMsgWithBuffer:(NSMutableData *)buffer
                        andOffset:(NSUInteger)offset
                        andProtos:(NSDictionary *)proto
                           andMsg:(NSDictionary *)msg{
    
    NSUInteger __block tOffset = offset;
    
    [msg enumerateKeysAndObjectsUsingBlock:^(NSString *name, id obj, BOOL *stop) {
        NSDictionary *tProto = proto[name];

            NSString *option = tProto[@"option"];
            if ( [option isEqualToString:@"required"] || [option isEqualToString:@"optional"]) {
                
                tOffset = [self writeBytesWithData:buffer andOffset:tOffset andData:[self encodeTagWithType:tProto[@"type"] andTag:[tProto[@"tag"] integerValue]]];
                
                tOffset = [self encodePropWithValue:obj andType:tProto[@"type"] andOffset:tOffset andBuffer:buffer andProtos:proto];
                
            }else if ([option isEqualToString:@"repeated"]){
                
                NSArray *tArr = obj;
                if (tArr.count > 0) {
                    
                    tOffset = [self encodeArray:tArr andProto:tProto andOffset:tOffset andBuffer:buffer andProtos:proto];
                    
                }
                
            }
            
            
        
    }];
    
    return tOffset;
}

- (NSUInteger)encodePropWithValue:(id)value
                          andType:(NSString *)type
                        andOffset:(NSUInteger)offset
                        andBuffer:(NSMutableData *)buffer
                        andProtos:(NSDictionary *)proto{
    NSUInteger length  = 0;
    
    if ([type isEqualToString:@"uInt32"]) {
        
        offset = [self writeBytesWithData:buffer andOffset:offset andData:[ProtobufCodec encodeUInt32:[value unsignedIntValue]]];
        
    }else if ([type isEqualToString:@"int32"] || [type isEqualToString:@"sInt32"]){
        
        offset = [self writeBytesWithData:buffer andOffset:offset andData:[ProtobufCodec encodeSInt32:[value integerValue]]];
        
    }else if ([type isEqualToString:@"float"]){
        
        NSNumber *num = value;
        float fl = [num floatValue];
        [buffer appendBytes:&fl length:4];
        offset +=4;
    }else if ([type isEqualToString:@"double"]){
        
        NSNumber *num = value;
        double dou = [num doubleValue];
        [buffer appendBytes:&dou length:8];
        offset+=8;
        
    }else if ([type isEqualToString:@"string"]){
        NSData *data = [value dataUsingEncoding:NSUTF8StringEncoding];
        length = data.length;
        
        offset = [self writeBytesWithData:buffer andOffset:offset andData:[ProtobufCodec encodeUInt32:length]];

        [buffer appendData:data];
        
        offset += length;
        
    }else{
        
        NSDictionary *message = proto[@"__messages"][type];
        if ( !message ) {
            
            message = [_protos objectForKey:[NSString stringWithFormat:@"message %@",type]];
            
        }
        
        if (message) {
            NSData *data = [NSJSONSerialization dataWithJSONObject:value
                                                           options:0
                                                             error:nil];
            length = 0;
            
            NSMutableData *tmpBUffer = [[NSMutableData alloc] initWithCapacity:data.length];
            
            length = [self encodeMsgWithBuffer:tmpBUffer andOffset:length andProtos:message andMsg:value];
            
            offset = [self writeBytesWithData:buffer andOffset:offset andData:[ProtobufCodec encodeUInt32:length]];
            
            [buffer appendData:tmpBUffer];
            
            offset += length;
        }
        
        
    }
    
    return offset;
}

- (NSUInteger)encodeArray:(NSArray *)array
                 andProto:(NSDictionary *)proto
                andOffset:(NSUInteger)offset
                andBuffer:(NSMutableData *)buffer
                andProtos:(NSDictionary *)protos{
    
    NSString *type = proto[@"type"];
    NSInteger tag = [proto[@"tag"] integerValue];
    if ([ProtobufUtil isSimpleType:type]) {
        
        offset = [self writeBytesWithData:buffer andOffset:offset andData:[self encodeTagWithType:type andTag:tag]];
        
        offset = [self writeBytesWithData:buffer andOffset:offset andData:[ProtobufCodec encodeUInt32:array.count]];
        
        for (int i = 0; i<array.count; i++) {
        
            offset = [self encodePropWithValue:[array objectAtIndex:i] andType:type andOffset:offset andBuffer:buffer andProtos:nil];
        }
    }else{
        
        for (int i = 0; i<array.count; i++) {
            offset = [self writeBytesWithData:buffer andOffset:offset andData:[self encodeTagWithType:type andTag:tag]];
            offset = [self encodePropWithValue:[array objectAtIndex:i] andType:type andOffset:offset andBuffer:buffer andProtos:protos];
        }
    }
    
    return offset;
}

- (NSUInteger)writeBytesWithData:(NSMutableData *)buff andOffset:(NSUInteger)offset andData:(NSData *)bytes{
    [buff appendBytes:bytes.bytes length:bytes.length];
    offset += bytes.length;
    return offset;
}

- (NSData *)encodeTagWithType:(NSString *)type andTag:(NSInteger)tag{
    ProtobufType value = [ProtobufUtil stringToType:type];
    if (value == ProtobufTypeUnknow) {
        value = ProtobufTypeString;
    }
    
    return [ProtobufCodec encodeUInt32:(tag<<3)| value];
    
}
@end

//
//  PomeloProtocol.m
//  Client
//
//  Created by xiaochuan on 13-9-23.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import "PomeloProtocol.h"
@interface PomeloProtocol(PrivateMethod)
/**
 *  从目标Data中的指定位置和长度替换数据
 *
 *  @param dest          要替换的Data
 *  @param dest_offset   偏移量
 *  @param source        目标数据
 *  @param source_offset 目标数据的偏移量
 *  @param length        copy的长度
 */
+ (void)copyData:(NSMutableData *)dest
       destOffset:(NSUInteger)dest_offset
             src:(NSData *)source
       srcOffset:(NSUInteger)source_offset
             len:(NSUInteger)length;

/**
 *  检测Message中是否有MegId
 *
 *  @param type Message的Type
 *
 *  @return 是否含有
 */
+ (BOOL)msgHasId:(MessageType)type;

/**
 *  计算MsgId 的长度
 *
 *  @param msgId MsgId 的数
 *
 *  @return Msg占用的位数
 */
+ (NSUInteger)caculateMsgIdBytes:(NSInteger)msgId;

/**
 *  检测Message中是否还有Rote
 *
 *  @param type MessageType
 *
 *  @return 是否含有
 */
+ (BOOL)msgHasRoute:(MessageType)type;

/**
 *  拼装Message的Flag位
 *
 *  @param type          Message Type
 *  @param compressRoute 是否压缩Route
 *  @param buffer        Data
 *  @param offset        偏移量
 *
 *  @return 返回新的偏移量
 */
+ (NSUInteger)encodeMsgFlagWithType:(MessageType)type
                   andCompressRoute:(BOOL)compressRoute
                          andBuffer:(NSMutableData *)buffer
                          andOffset:(NSUInteger)offset;

/**
 *  拼装Message的MsgId位
 *
 *  @param msgid   MessageId
 *  @param buffer Data
 *  @param offset 偏移量
 *
 *  @return 新的偏移量
 */
+ (NSUInteger)encodeMsgIdWithMsgid:(NSInteger)msgid
                        andBuffer:(NSMutableData *)buffer
                        andOffset:(NSUInteger)offset;


/**
 *  拼装Message的Route
 *
 *  @param compressRoute 是否压缩Route
 *  @param route         Route
 *  @param buffer        Data
 *  @param offset        偏移量
 *
 *  @return 新的偏移量
 */
+ (NSUInteger)encodeMsgRouteWithCompressRoute:(BOOL)compressRoute
                                     andRoute:(id)route
                                    andBuffer:(NSMutableData *)buffer
                                    andOffset:(NSUInteger)offset;


/**
 *  拼装Message的Body
 *
 *  @param msg    发送的信息
 *  @param buffer Data
 *  @param offset 偏移量
 *
 *  @return 新的偏移量
 */
+ (NSUInteger)encodeMsgBodyWithMsg:(NSData *)msg
                         andBuffer:(NSMutableData *)buffer
                         andOffset:(NSUInteger)offset;
@end
@implementation PomeloProtocol


+ (NSData *)strEncode:(NSString *)str{
    return [str dataUsingEncoding:NSUTF8StringEncoding];
}

+ (NSString *)strDecode:(NSData *)data{
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

+ (NSData *)packageEncodeWithType:(PackageType)type andBody:(NSData *)body{
    NSUInteger length = body == nil ? 0 : body.length;
    NSMutableData *buffer = [[NSMutableData alloc] initWithLength:(PKG_HEAD_BYTES + length)];
    
    unsigned char iTmp = 0;
    
    iTmp = type & 0xff;
    [buffer replaceBytesInRange:NSMakeRange(0, 1) withBytes:&iTmp length:1];
    
    iTmp = (unsigned char)(length >> 16) & 0xff;
    [buffer replaceBytesInRange:NSMakeRange(1, 1) withBytes:&iTmp length:1];
    
    iTmp = (unsigned char)(length >> 8) & 0xff;
    [buffer replaceBytesInRange:NSMakeRange(2, 1) withBytes:&iTmp length:1];
    
    iTmp = (unsigned char)length & 0xff;
    [buffer replaceBytesInRange:NSMakeRange(3, 1) withBytes:&iTmp length:1];
    //上面似乎可以优化成 直接 length & 0xffffff
    
    if (body) {
        [[self class] copyData:buffer destOffset:4 src:body srcOffset:0 len:length];
    }
    return buffer;
}
   
+ (PomeloPackage *)packageDecode:(NSData *)buffer{
    unsigned char * bytes  = (unsigned char *)[buffer bytes];
    PackageType type = (PackageType) bytes[0];
    unsigned int length = ((bytes[1]) << 16 | (bytes[2]) << 8 | bytes[3]) >> 0;
    NSData *body= [NSData dataWithBytes:&(bytes[4]) length:length];
    
    return MakePomeloPackage(type, body);
}


+ (NSData *)messageEncodeWithId:(NSInteger)msgId
                        andType:(MessageType)type
               andCompressRoute:(BOOL)compressRoute
                       andRoute:(id)route
                        andBody:(NSData *)body{
    NSUInteger idBytes = [[self class] msgHasId:type] ? [PomeloProtocol caculateMsgIdBytes:msgId] : 0;
    
    NSUInteger msgLen = MSG_FLAG_BYTES + idBytes;
    
    
    if ([PomeloProtocol msgHasRoute:type]) {
        if (compressRoute) {
            NSAssert([route isKindOfClass:[NSNumber class]], @"error flag for number route!");
            msgLen += MSG_ROUTE_CODE_BYTES;
        }else{
            msgLen += MSG_ROUTE_LEN_BYTES;
            if (route) {
                NSData *routeData = [PomeloProtocol strEncode:route];
                NSAssert(routeData.length<=255, @"route maxlength is overflow");
                msgLen += routeData.length;
            }
        }
    }
    
    if (body) {
        msgLen += body.length;
    }
    
    
    NSMutableData *result = [[NSMutableData alloc] initWithLength:msgLen];
    NSUInteger offset = 0;
    
    //add flg
    offset = [PomeloProtocol encodeMsgFlagWithType:type
                                  andCompressRoute:compressRoute
                                         andBuffer:result
                                         andOffset:offset];
    
    
    //add message id
    if ([PomeloProtocol msgHasId:type]) {
        offset = [PomeloProtocol encodeMsgIdWithMsgid:msgId
                                            andBuffer:result
                                            andOffset:offset];
    }
    
    //add route
    if ([PomeloProtocol msgHasRoute:type]) {
        offset = [PomeloProtocol encodeMsgRouteWithCompressRoute:compressRoute
                                                        andRoute:route
                                                       andBuffer:result
                                                       andOffset:offset];
    }
    
    // add body
    if (body) {
        [PomeloProtocol encodeMsgBodyWithMsg:body andBuffer:result andOffset:offset];
    }
    
    return result;
}


+ (PomeloMessage *)messageDecode:(NSData *)buffer{
    unsigned char *bytes = (unsigned char *)buffer.bytes;
    unsigned long bytesLen = buffer.length;
    unsigned long offset = 0;
    unsigned long msgId = 0;
    
    unsigned char flag = bytes[offset++];
    BOOL compressRoute = (flag & MSG_COMPRESS_ROUTE_MASK) == 1 ? YES :NO;
    MessageType type = (flag >> 1) & MSG_TYPE_MASK;
    
    
    // parse route
    if ([PomeloProtocol msgHasId:type]) {
        NSInteger m = bytes[offset];
        NSUInteger i = 0;
        do {
            m = bytes[offset];
            msgId = msgId + ((m &0x7f) * pow(2, (7 *i)));
            offset ++;
            i++;
        } while (m >= 128);
    }
    
    
    // parse route
    NSNumber *routeNum = nil;
    NSString *routeStr = @"";
    if ([PomeloProtocol msgHasRoute:type]) {
        if (compressRoute) {
            unsigned long temp =(bytes[offset++]) << 8;
            routeNum = [NSNumber numberWithUnsignedLong:(temp | (bytes[offset++]))];
        }else{
            unsigned long routeLen = bytes[offset++];
            if (routeLen) {
                NSMutableData *route = [[NSMutableData alloc] initWithLength:routeLen];
                [PomeloProtocol copyData:route destOffset:0 src:buffer srcOffset:offset len:routeLen];
                routeStr = [PomeloProtocol strDecode:route];
            }
            offset += routeLen;
        }
    }
    
    unsigned long bodyLen = bytesLen - offset;
    NSMutableData *body = [[NSMutableData alloc] initWithLength:bodyLen];
    
    [PomeloProtocol copyData:body destOffset:0 src:buffer srcOffset:offset len:bodyLen];
    
    
    
    return MakePomeloMessage(msgId, type, compressRoute, routeNum ? routeNum : routeStr, body);
}
#pragma mark -
#pragma mark PrivateMethod

+ (void)copyData:(NSMutableData *)dest
       destOffset:(NSUInteger)dest_offset
             src:(NSData *)source
       srcOffset:(NSUInteger)source_offset
             len:(NSUInteger)length {
    unsigned char *ptr_tmp = (unsigned char *) source.bytes;
       
    [dest replaceBytesInRange:NSMakeRange(dest_offset, length)
                       withBytes:&(ptr_tmp[source_offset])
                          length:length];
}


+ (BOOL)msgHasId:(MessageType)type{
    return  (type == MessageTypeRequest || type == MessageTypeResponse);
}


+ (NSUInteger)caculateMsgIdBytes:(NSInteger)msgId{
    NSUInteger len = 0;
    NSInteger temp = msgId;
    do {
        len++;
        temp >>= 7;
    } while (temp > 0);
    return len;
}


+ (BOOL)msgHasRoute:(MessageType)type{
    return type == MessageTypeRequest || type == MessageTypeNotify || type == MessageTypePush;
}

+ (NSUInteger)encodeMsgFlagWithType:(MessageType)type
                   andCompressRoute:(BOOL)compressRoute
                          andBuffer:(NSMutableData *)buffer
                          andOffset:(NSUInteger)offset{
    NSAssert((type == MessageTypeRequest || type == MessageTypeNotify || type == MessageTypeResponse || type == MessageTypePush), @"unkonw message type:%d",type);
    char temp = (type << 1) | (compressRoute? 1:0);
    [buffer replaceBytesInRange:NSMakeRange(offset, 1) withBytes:&temp length:1];
    return  offset + MSG_FLAG_BYTES;
}

+ (NSUInteger)encodeMsgIdWithMsgid:(NSInteger)msgid
                        andBuffer:(NSMutableData *)buffer
                        andOffset:(NSUInteger)offset{
    do {
        NSUInteger tmp = msgid % 128;
        NSUInteger next = msgid / 128;
        
        if (next != 0) {
            tmp += 128;
        }
        
        [buffer replaceBytesInRange:NSMakeRange(offset++, 1) withBytes:&tmp length:1];
        msgid = next;
    } while (msgid != 0);
    
    return offset;
}

+ (NSUInteger)encodeMsgRouteWithCompressRoute:(BOOL)compressRoute
                                     andRoute:(id)route
                                    andBuffer:(NSMutableData *)buffer
                                    andOffset:(NSUInteger)offset{
    if (compressRoute) {
        NSInteger tempRoute = [route integerValue];
        NSAssert(tempRoute <= MSG_ROUTE_CODE_MAX, @"route number is overflow");
        
        char temp = (tempRoute >> 8) & 0xff;
        [buffer replaceBytesInRange:NSMakeRange(offset++, 1) withBytes:&temp length:1];
        temp = tempRoute & 0xff;
        [buffer replaceBytesInRange:NSMakeRange(offset++, 1) withBytes:&temp length:1];
    }else{
        
        if (route) {
            NSString *routeStr = route;
            NSData *routeData = [PomeloProtocol strEncode:routeStr];
            char temp = routeData.length & 0xff;
            [buffer replaceBytesInRange:NSMakeRange(offset++, 1) withBytes:&temp length:1];
            
            [PomeloProtocol copyData:buffer destOffset:offset src:routeData srcOffset:0 len:routeData.length];
            
            offset += routeData.length;
            
        }else{
            char temp = 0;
            [buffer replaceBytesInRange:NSMakeRange(offset++, 1) withBytes:&temp   length:1];
        }
    }
    return offset;
}

+ (NSUInteger)encodeMsgBodyWithMsg:(NSData *)msg
                         andBuffer:(NSMutableData *)buffer
                         andOffset:(NSUInteger)offset{
    [PomeloProtocol copyData:buffer destOffset:offset src:msg srcOffset:0 len:msg.length];
    return offset + msg.length;
}
@end

//
//  PomeloProtocolTest.m
//  Client
//
//  Created by xiaochuan on 13-10-31.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "PomeloProtocol.h"
@interface PomeloProtocolTest : XCTestCase

@end

@implementation PomeloProtocolTest

- (void)setUp
{
    [super setUp];
    // Put setup code here; it will be run once, before the first test case.
}

- (void)tearDown
{
    // Put teardown code here; it will be run once, after the last test case.
    [super tearDown];
}

- (void)testStringEncodeAndDecode{
    NSString *str = @"你好,abc~~~~~~";
    NSData *buf = [PomeloProtocol strEncode:str];
    XCTAssertNotNil(buf, @"Buf 应该不为空");
    XCTAssertEqualObjects(str, [PomeloProtocol strDecode:buf], @"加密解密字符串应该相同");
}

- (void)testPackageEncodeAndDecode{
    NSString *msg = @"hello world";
    NSData *buf = [PomeloProtocol packageEncodeWithType:PackageTypeData andBody:[PomeloProtocol strEncode:msg]];
    XCTAssertNotNil(buf, @"生成的Package 不能为nil");
    
    NSDictionary *res = [PomeloProtocol packageDecode:buf];
    XCTAssertNotNil(res, @"解密出的数据不能为空");
    
    XCTAssertEqual(PackageTypeData, [[res objectForKey:@"type"] intValue], @"加密解密后的Package Type 应该相同");
    
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解密后的body应该存在");
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解密后的数据应该和msg相同");
}


- (void)testPackageEncodeAndDecodeWithoutBody{
    
    NSData *buf = [PomeloProtocol packageEncodeWithType:PackageTypeHandshake andBody:nil];
    XCTAssertNotNil(buf, @"编码后的数据不能为空");
    
    NSDictionary *res = [PomeloProtocol packageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据不能为空");
    
    XCTAssertEqual(PackageTypeHandshake, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertNil([res objectForKey:@"body"], @"解码后的数据body 应该是空");
    
}


- (void)testMessageEncodeAndDecodeForRequest{
    NSInteger msgId = 128;
    BOOL compress = NO;
    NSString *route = @"connector.entryHandler.entry";
    NSString *msg = @"hello world~";
    NSData *buf = [PomeloProtocol messageEncodeWithId:msgId andType:MessageTypeRequest andCompressRoute:compress andRoute:route andBody:[PomeloProtocol strEncode:msg]];
    XCTAssertNotNil(buf, @"编码后的Message 不能为空");
    
    NSDictionary *res = [PomeloProtocol messageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据必须存在");
    
    XCTAssertEqual(msgId, [[res objectForKey:@"id"] integerValue], @"解码后的Msgid应该相同");
    
    XCTAssertEqual(MessageTypeRequest, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertEqual(compress, [[res objectForKey:@"compressRoute"] boolValue], @"解码后的是否压缩应该相同");
    
    XCTAssertEqualObjects(route, [res objectForKey:@"route"], @"解码后的rote 信息应该相同");
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解码后body 应该存在");
    
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解码后的body应该相同");
    
    
    
    
}


- (void)testMessageEncodeAndDecodeWhitEmptyRoute{
    
    NSInteger msgid = 256;
    BOOL compress = NO;
    NSString *route = @"";
    NSString *msg = @"hello world~";
    NSData *buf = [PomeloProtocol messageEncodeWithId:msgid andType:MessageTypeRequest andCompressRoute:compress andRoute:route andBody:[PomeloProtocol strEncode:msg]];
    
    XCTAssertNotNil(buf, @"编码后的Message 不能为空");
    
    NSDictionary *res = [PomeloProtocol messageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据必须存在");
    
    XCTAssertEqual(msgid, [[res objectForKey:@"id"] integerValue], @"解码后的Msgid应该相同");
    
    XCTAssertEqual(MessageTypeRequest, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertEqual(compress, [[res objectForKey:@"compressRoute"] boolValue], @"解码后的是否压缩应该相同");
    
    XCTAssertEqualObjects(route, [res objectForKey:@"route"], @"解码后的rote 信息应该相同");
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解码后body 应该存在");
    
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解码后的body应该相同");

    
}

- (void)testMessageEncdoeAndDecodeWithNullRoute{
    
    NSInteger n = arc4random()%10000;
    NSInteger msgid = 128 * n;
    BOOL compress = NO;
    NSString *route = nil;
    NSString *msg = @"hello world~";
    NSData *buf = [PomeloProtocol messageEncodeWithId:msgid andType:MessageTypeRequest andCompressRoute:compress andRoute:route andBody:[PomeloProtocol strEncode:msg]];
    
    XCTAssertNotNil(buf, @"编码后的Message 不能为空");
    
    NSDictionary *res = [PomeloProtocol messageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据必须存在");
    
    XCTAssertEqual(msgid, [[res objectForKey:@"id"] integerValue], @"解码后的Msgid应该相同");
    
    XCTAssertEqual(MessageTypeRequest, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertEqual(compress, [[res objectForKey:@"compressRoute"] boolValue], @"解码后的是否压缩应该相同");
    
    XCTAssertEqualObjects(@"", [res objectForKey:@"route"], @"解码后的rote 为空串");
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解码后body 应该存在");
    
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解码后的body应该相同");
    
    
}


- (void)testMessageEncodeAndDecodeWithCompressRoute{
    
    NSInteger msgid = 256;
    BOOL compress = YES;
    NSNumber *route = @3;
    NSString *msg =@"hello world~";
    
    NSData *buf = [PomeloProtocol messageEncodeWithId:msgid andType:MessageTypeRequest andCompressRoute:compress andRoute:route andBody:[PomeloProtocol strEncode:msg]];
    
    XCTAssertNotNil(buf, @"编码后的Message 不能为空");
    
    NSDictionary *res = [PomeloProtocol messageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据必须存在");
    
    XCTAssertEqual(msgid, [[res objectForKey:@"id"] integerValue], @"解码后的Msgid应该相同");
    
    XCTAssertEqual(MessageTypeRequest, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertEqual(compress, [[res objectForKey:@"compressRoute"] boolValue], @"解码后的是否压缩应该相同");
    
    XCTAssertEqualObjects(route, [res objectForKey:@"route"], @"解码后的rote 为空串");
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解码后body 应该存在");
    
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解码后的body应该相同");

    
}

- (void)testMessageEncodeAndDecodeWithMutilbytesId{
    
    NSInteger msgid = pow(2, 30);
    
    BOOL compress = YES;
    NSNumber *route = @3;
    NSString *msg =@"hello world~";
    
    NSData *buf = [PomeloProtocol messageEncodeWithId:msgid andType:MessageTypeRequest andCompressRoute:compress andRoute:route andBody:[PomeloProtocol strEncode:msg]];
    
    XCTAssertNotNil(buf, @"编码后的Message 不能为空");
    
    NSDictionary *res = [PomeloProtocol messageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据必须存在");
    
    XCTAssertEqual(msgid, [[res objectForKey:@"id"] integerValue], @"解码后的Msgid应该相同");
    
    XCTAssertEqual(MessageTypeRequest, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertEqual(compress, [[res objectForKey:@"compressRoute"] boolValue], @"解码后的是否压缩应该相同");
    
    XCTAssertEqualObjects(route, [res objectForKey:@"route"], @"解码后的rote 为空串");
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解码后body 应该存在");
    
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解码后的body应该相同");
}


- (void)testMessageEncodeAndDecodeForNotify{
    
    BOOL compress =NO;
    NSString *route = @"connector.entryHandler.entry";
    NSString *msg = @"hello world~";
    
    
    NSData *buf = [PomeloProtocol messageEncodeWithId:0 andType:MessageTypeNotify andCompressRoute:compress andRoute:route andBody:[PomeloProtocol strEncode:msg]];
    
    XCTAssertNotNil(buf, @"编码后的Message 不能为空");
    
    NSDictionary *res = [PomeloProtocol messageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据必须存在");
    
    XCTAssertEqual(0, [[res objectForKey:@"id"] integerValue], @"解码后的Msgid应该相同");
    
    XCTAssertEqual(MessageTypeNotify, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertEqual(compress, [[res objectForKey:@"compressRoute"] boolValue], @"解码后的是否压缩应该相同");
    
    XCTAssertEqualObjects(route, [res objectForKey:@"route"], @"解码后的rote 为空串");
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解码后body 应该存在");
    
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解码后的body应该相同");
    
}

- (void)testMessageEncodeAndDecodeForResponse{
    
    NSInteger msgid = 1;
    BOOL compress = NO;
    NSString *msg = @"hello world";
    
    
    NSData *buf = [PomeloProtocol messageEncodeWithId:msgid andType:MessageTypeResponse andCompressRoute:compress andRoute:nil andBody:[PomeloProtocol strEncode:msg]];
    
    XCTAssertNotNil(buf, @"编码后的Message 不能为空");
    
    NSDictionary *res = [PomeloProtocol messageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据必须存在");
    
    XCTAssertEqual(msgid, [[res objectForKey:@"id"] integerValue], @"解码后的Msgid应该相同");
    
    XCTAssertEqual(MessageTypeResponse, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertEqual(compress, [[res objectForKey:@"compressRoute"] boolValue], @"解码后的是否压缩应该相同");
    
    XCTAssertEqualObjects(@"", [res objectForKey:@"route"], @"解码后的rote 为空串");
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解码后body 应该存在");
    
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解码后的body应该相同");

}


- (void)testMessageEncodeAndDecodeForPush{
    
    BOOL compress = NO;
    NSString *route = @"connector.entryHandler.entry";
    NSString *msg = @"hello world";
    
    NSData *buf = [PomeloProtocol messageEncodeWithId:0 andType:MessageTypePush andCompressRoute:compress andRoute:route andBody:[PomeloProtocol strEncode:msg]];
    
    XCTAssertNotNil(buf, @"编码后的Message 不能为空");
    
    NSDictionary *res = [PomeloProtocol messageDecode:buf];
    XCTAssertNotNil(res, @"解码后的数据必须存在");
    
    XCTAssertEqual(0, [[res objectForKey:@"id"] integerValue], @"解码后的Msgid应该相同");
    
    XCTAssertEqual(MessageTypePush, [[res objectForKey:@"type"] intValue], @"解码后的类型应该相同");
    
    XCTAssertEqual(compress, [[res objectForKey:@"compressRoute"] boolValue], @"解码后的是否压缩应该相同");
    
    XCTAssertEqualObjects(route, [res objectForKey:@"route"], @"解码后的rote 为空串");
    
    XCTAssertNotNil([res objectForKey:@"body"], @"解码后body 应该存在");
    
    
    XCTAssertEqualObjects(msg, [PomeloProtocol strDecode:[res objectForKey:@"body"]], @"解码后的body应该相同");
    

    
}


@end

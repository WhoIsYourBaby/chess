//
//  ProtobufTest.m
//  Client
//
//  Created by xiaochuan on 13-10-30.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <XCTest/XCTest.h>
#include "ProtobufEncoder.h"
#include "ProtobufDecoder.h"
#include "ProtobufParse.h"
@interface ProtobufTest : XCTestCase

@end

@implementation ProtobufTest

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

- (void)testEncoder{
    NSBundle *thisBundle = [NSBundle bundleForClass:[self class]];
    NSString *path =  [thisBundle pathForResource:@"example" ofType:@"json"];
    NSData *data = [[NSData alloc] initWithContentsOfFile:path];
    NSDictionary *protosTemp =  [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    NSDictionary *protos = [ProtobufParse parse:protosTemp];
    ProtobufEncoder *encoder = [ProtobufEncoder protobufEncoderWithProtos:protos];
    ProtobufDecoder *decoder = [ProtobufDecoder protobufDecodeWhitProtos:protos];
    NSString *msgPath = [thisBundle pathForResource:@"testMsg" ofType:@"json"];
    NSData *msgData = [[NSData alloc] initWithContentsOfFile:msgPath];
    NSDictionary *msgDict =  [NSJSONSerialization JSONObjectWithData:msgData options:0 error:nil];
    for (NSString *route in [msgDict allKeys]) {
        NSDictionary *msg = [msgDict objectForKey:route];
        NSData *buffer = [encoder encodeWithRoute:route andMessage:msg];
        NSDictionary *decodeMsg = [decoder decodeWithRoute:route andData:buffer];
        
        XCTAssertEqualObjects(msg, decodeMsg, @"encode decode must euqual");
        
    }
}

@end

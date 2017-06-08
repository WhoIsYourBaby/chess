//
//  ProtobufCoderTest.m
//  Client
//
//  Created by xiaochuan on 13-10-30.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "ProtobufCodec.h"
@interface ProtobufCoderTest : XCTestCase

@end

@implementation ProtobufCoderTest

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

- (void)testUInt32andUInt64test{
    long long limit = 0x7fffffffffffffff;
    int count = 10000;
    for (int i = 0; i < count; i++) {
        long long number = arc4random()%limit;
        long long result = [ProtobufCodec decodeUInt32:[ProtobufCodec encodeUInt32:number]];
        XCTAssertEqual(number, result, @"decode and encode must equal");
    }
    
}



- (void)testInt32andInt64test{
    long long limit = 0x7fffffffffffffff;
    int count = 10000;
    for (int i = 0; i < count; i++) {
        int flag = ((arc4random() % 10) >4 )? 1: -1;
        long long number = (arc4random()%limit) *flag;
        long long result = [ProtobufCodec decodeSInt32:[ProtobufCodec encodeSInt32:number]];
        XCTAssertEqual(number, result, @"decode and encode must equal");
    }
    
}

@end

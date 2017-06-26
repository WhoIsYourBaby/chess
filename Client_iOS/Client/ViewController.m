//
//  ViewController.m
//  Client
//
//  Created by xiaochuan on 13-9-23.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#import "ViewController.h"

@interface ViewController ()

@property (nonatomic, copy) NSString *connectorIP;
@property (nonatomic, copy) NSString *connectorPort;

@property (nonatomic, copy) NSString *token;
@property (nonatomic, strong) NSString *userid;

@end

@implementation ViewController

- (void)viewDidLoad
{
    [super viewDidLoad];
    

    
//    NSDictionary *d1 = [NSDictionary dictionaryWithObjectsAndKeys:@"1",@"1", nil];
//    NSDictionary *d2 = [NSDictionary dictionaryWithObjectsAndKeys:@"2",@"2", nil];
    

//    return;
	// Do any additional setup after loading the view, typically from a nib.
   
    client = [[PomeloClient alloc] initWithDelegate:self];
    
    

    
    UIButton *btn0 = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, 200, 90)];
    btn0.backgroundColor = [UIColor redColor];
    [btn0 setTitle:@"gate" forState:UIControlStateNormal];
    [btn0 addTarget:self action:@selector(connectGate) forControlEvents:UIControlEventTouchUpInside];
    
    [self.view addSubview:btn0];
    
    
    UIButton *btn = [[UIButton alloc] initWithFrame:CGRectMake(100, 100, 200, 90)];
    btn.backgroundColor = [UIColor redColor];
    [btn setTitle:@"connector" forState:UIControlStateNormal];
    [btn addTarget:self action:@selector(enterConnector) forControlEvents:UIControlEventTouchUpInside];
    
    [self.view addSubview:btn];

    [client onRoute:@"onRoomStand" withCallback:^(id arg) {
        
        NSLog(@"%@",arg);
        
    }];

    UIButton *btn1 = [[UIButton alloc] initWithFrame:CGRectMake(100, 200, 200, 90)];
    btn1.backgroundColor = [UIColor redColor];
    [btn1 addTarget:self action:@selector(enterRoom) forControlEvents:UIControlEventTouchUpInside];
    [btn1 setTitle:@"enterRoom" forState:UIControlStateNormal];
    [self.view addSubview:btn1];
    
    
    
    
    UIButton *btn2 = [[UIButton alloc] initWithFrame:CGRectMake(100, 300, 200, 90)];
    btn2.backgroundColor = [UIColor redColor];
    [btn2 addTarget:self action:@selector(sendProto) forControlEvents:UIControlEventTouchUpInside];
    [btn2 setTitle:@"sendProto" forState:UIControlStateNormal];
    [self.view addSubview:btn2];

    
    
    UIButton *btn3 = [[UIButton alloc] initWithFrame:CGRectMake(100, 400, 200, 90)];
    btn3.backgroundColor = [UIColor redColor];
    [btn3 addTarget:self action:@selector(dissconnect) forControlEvents:UIControlEventTouchUpInside];
    [btn3 setTitle:@"dissconnect" forState:UIControlStateNormal];
    [self.view addSubview:btn3];

}

//1、连接gate服务器，返回connector服务器地址
- (void)connectGate{
    [client connectToHost:@"127.0.0.1" onPort:@"3101" params:nil withCallback:^(id arg) {
        [client requestWithRoute:@"gate.gateHandler.guestLogin" andParams:@{@"userid" : @"ligun123"} andCallback:^(id arg) {
            self.connectorIP = arg[@"data"][@"connector"][@"host"];
            self.connectorPort = [arg[@"data"][@"connector"][@"port"] stringValue];
            self.token = arg[@"data"][@"token"];
            [client disconnect];
        }];
    }];
}

//2、连接connector服务器
- (void)enterConnector{
    [client connectToHost:self.connectorIP onPort:self.connectorPort withCallback:^(id arg) {
        NSLog(@"%s -> %@", __FUNCTION__, arg);
    }];
}

//3、request——> connector.entryHandler.enter进入房间
- (void)enterRoom{
    [client requestWithRoute:@"connector.entryHandler.enterRoom" andParams:@{@"token" : self.token,
                                                                         @"rtype" : @"brnn"} andCallback:^(id arg) {
                                                                             NSLog(@"%s -> %@", __FUNCTION__, arg);
                                                                         }];
}

//废弃的方法
- (void)sendProto{
    //pkindex,gold,userid
    [client requestWithRoute:@"connector.brnnHandler.chipIn"
                   andParams:@{@"pkindex" : @(1),
                               @"userid" : self.userid,
                               @"gold" : @(1000)}
                 andCallback:^(id arg) {
                       NSLog(@"%s -> %@", __FUNCTION__, arg);
                   }];
}


//4、离开房间/断开连接
- (void)dissconnect{
//    [client requestWithRoute:@"connector.entryHandler.exit" andParams:@{@"userid" : @"ligun",
//                                                                      @"rid" : @"111"} andCallback:^(id arg) {
//                                                                          NSLog(@"%s -> %@", __FUNCTION__, arg);
//                                                                      }];
    [client disconnectWithCallback:^(id arg) {
        NSLog(@"断线了");
    }];
}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
@end

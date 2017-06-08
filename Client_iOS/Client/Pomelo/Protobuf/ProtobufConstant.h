//
//  ProtobufConstant.h
//  Client
//
//  Created by xiaochuan on 13-10-11.
//  Copyright (c) 2013年 xiaochuan. All rights reserved.
//

#ifndef Client_ProtobufConstant_h
#define Client_ProtobufConstant_h

typedef enum{
    ProtobufTypeUnknow = -1,
    ProtobufTypeUInt32 = 0,
    ProtobufTypeSint32 = 0,
    ProtobufTypeInt32  = 0,
    ProtobufTypeDouble = 1,
    ProtobufTypeString = 2,
    ProtobufTypeMessage = 2,
    ProtobufTypeFloat  = 5
}ProtobufType;

#endif

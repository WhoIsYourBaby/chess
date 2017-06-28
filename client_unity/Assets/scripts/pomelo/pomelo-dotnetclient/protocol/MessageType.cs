using System;

namespace Pomelo.DotNetClient
{
    public enum MessageType
    {
        MSG_REQUEST = 0,
        MSG_NOTIFY = 1,
        MSG_RESPONSE = 2,
        MSG_PUSH = 3,

        MSG_LOCAL_CALLBACK = 999,
    }
}


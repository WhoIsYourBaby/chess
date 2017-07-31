using System;
using System.ComponentModel;

namespace Pomelo.DotNetClient
{
    public enum ClientProtocolType
    {
        [Description("normal")]
        NORMAL,

        [Description("TLS")]
        TLS
    }

    public enum ProtocolState
    {
        ready = 1,          // Just open, need to send handshaking
        handshaking = 2,    // on handshaking process
        working = 3,		// can receive and send data 
        closed = 4,		    // on read body
    }
}


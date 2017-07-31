using System;


namespace Pomelo.DotNetClient
{
    public interface ITransporter
    {
        void receive();
        void send(byte[] buffer);
        void onReceive(Action<byte[]> messageProcessor);
        void close();
        void Connect(System.Net.IPEndPoint ep, int nTimeout = 5000);
        void setOnStateChanged(Action cb);
        NetWorkState NetworkState();
    }
}
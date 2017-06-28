using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Timers;
using UnityEngine;

namespace Pomelo.DotNetClient
{
    class TransporterTCP : ITransporter
    {
        public const int HeadLength = 4;

        protected NetWorkState netWorkState = NetWorkState.CLOSED;   //current network state
        protected Socket socket;
        protected event Action networkEventCB;
        protected event Action<byte[]> messageProcesserCB;

        
        protected int timeoutMSec = 8000;


        protected StateObject stateObject = new StateObject();
        protected IAsyncResult asyncReceive;
        protected IAsyncResult asyncSend;
        protected IAsyncResult asyncConnect;

        protected TransportState transportState;
        protected byte[] headBuffer = new byte[4];
        protected byte[] buffer;
        protected int bufferOffset = 0;
        protected int pkgLength = 0;

        private System.Timers.Timer timer;

        public TransporterTCP()
        {
            this.socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            this.transportState = TransportState.readHead;
        }

        protected void NetWorkChanged(NetWorkState state)
        {
            if (netWorkState != state)
            {
                netWorkState = state;

                if (networkEventCB != null)
                {
                    networkEventCB();
                }
            }
        }
        public virtual void close()
        {
            this.transportState = TransportState.closed;

            if (this.socket != null)
            {
                if (this.socket.Connected)
                {
                    this.socket.Shutdown(SocketShutdown.Both);
                }

                this.socket.Close();
                this.socket = null;
            }

            NetWorkChanged(NetWorkState.CLOSED);
        }

        protected void CheckTimeOutEvent()
        {
            timer.Stop();
            timer.Enabled = false;
            timer.Dispose();
            timer = null;

            if (netWorkState != NetWorkState.CONNECTED && netWorkState != NetWorkState.ERROR)
            {
                NetWorkChanged(NetWorkState.TIMEOUT);
            }

            if (netWorkState == NetWorkState.ERROR)
            {

            }
        }

        public virtual void Connect(IPEndPoint ep, int nTimeout)
        {
            Debug.Log("Transport connect " + ep.Address.ToString() + " with timeout:"+nTimeout);
            if (nTimeout != 0)
            {
                timeoutMSec = nTimeout;
            }

            this.timer = new System.Timers.Timer();
            timer.Interval = timeoutMSec;
            timer.Elapsed += new ElapsedEventHandler(ConnectTimeout);
            timer.Enabled = true;

            asyncConnect = socket.BeginConnect(ep, new AsyncCallback(OnConnected), this.socket);

        }

        virtual protected void OnConnected(IAsyncResult result)
            {
                try
                {
                    this.socket.EndConnect(result);
                    NetWorkChanged(NetWorkState.CONNECTED);
                }
                catch (SocketException e)
                {
                    if (netWorkState != NetWorkState.TIMEOUT)
                    {
                        NetWorkChanged(NetWorkState.ERROR);
                    }

                    Debug.Log(e);
                }
                finally
                {
                    this.CheckTimeOutEvent();
                }
        }

        public void ConnectTimeout(object source, ElapsedEventArgs e)
        {
            Debug.Log("ConnectTimeout");
            this.CheckTimeOutEvent(); 
        }

        public NetWorkState NetworkState()
        {
            return netWorkState;
        }
        protected bool readHead(byte[] bytes, int offset, int limit)
        {
            int length = limit - offset;
            int headNum = HeadLength - bufferOffset;

            if (length >= headNum)
            {
                //Write head buffer
                writeBytes(bytes, offset, headNum, bufferOffset, headBuffer);
                //Get package length
                pkgLength = (headBuffer[1] << 16) + (headBuffer[2] << 8) + headBuffer[3];

                //Init message buffer
                buffer = new byte[HeadLength + pkgLength];
                writeBytes(headBuffer, 0, HeadLength, buffer);
                offset += headNum;
                bufferOffset = HeadLength;
                this.transportState = TransportState.readBody;

                if (offset <= limit) processBytes(bytes, offset, limit);
                return true;
            }
            else
            {
                writeBytes(bytes, offset, length, bufferOffset, headBuffer);
                bufferOffset += length;
                return false;
            }
        }
        protected void readBody(byte[] bytes, int offset, int limit)
        {
            int length = pkgLength + HeadLength - bufferOffset;
            if ((offset + length) <= limit)
            {
                writeBytes(bytes, offset, length, bufferOffset, buffer);
                offset += length;

                //Invoke the protocol api to handle the message
                this.messageProcesserCB.Invoke(buffer);
                this.bufferOffset = 0;
                this.pkgLength = 0;

                if (this.transportState != TransportState.closed)
                    this.transportState = TransportState.readHead;
                if (offset < limit)
                    processBytes(bytes, offset, limit);
            }
            else
            {
                writeBytes(bytes, offset, limit - offset, bufferOffset, buffer);
                bufferOffset += limit - offset;
                this.transportState = TransportState.readBody;
            }
        }
        protected void writeBytes(byte[] source, int start, int length, byte[] target)
        {
            writeBytes(source, start, length, 0, target);
        }
        protected void writeBytes(byte[] source, int start, int length, int offset, byte[] target)
        {
            for (int i = 0; i < length; i++)
            {
                target[offset + i] = source[start + i];
            }
        }
        protected void processBytes(byte[] bytes, int offset, int limit)
        {
            if (this.transportState == TransportState.readHead)
            {
                readHead(bytes, offset, limit);
            }
            else if (this.transportState == TransportState.readBody)
            {
                readBody(bytes, offset, limit);
            }
        }
        protected virtual void endReceive(IAsyncResult asyncReceive)
        {
            StateObject state = (StateObject)asyncReceive.AsyncState;
            Socket socket = this.socket;

            try
            {
                int length = socket.EndReceive(asyncReceive);
                if (length > 0)
                {
                    processBytes(state.buffer, 0, length);

                    //Receive next message
                    if (this.transportState != TransportState.closed) receive();
                }
                else
                {
                    this.close();
                }

            }
            catch (SocketException e)
            {
                Debug.Log(e);

                this.close();
            }
        }
        public virtual void receive()
        {
            try
            {
                this.asyncReceive = socket.BeginReceive(stateObject.buffer, 0, stateObject.buffer.Length, SocketFlags.None, new AsyncCallback(endReceive), stateObject);
            }
            catch (Exception e)
            {
                Debug.Log(e);
                this.close();
            }
        }
        public virtual void send(byte[] buffer)
        {
            if (this.transportState != TransportState.closed)
            {
                try
                {
                    this.asyncSend = socket.BeginSend(buffer, 0, buffer.Length, SocketFlags.None, new AsyncCallback(sendCallback), socket);
                }
                catch (Exception e)
                {
                    Debug.Log(e);
                    this.close();
                }
            }
        }
        protected virtual void sendCallback(IAsyncResult asyncSend)
        {
            try
            {
                socket.EndSend(asyncSend);
            }
            catch (Exception e)
            {
                Debug.Log(e);
            }
        }

        public void setOnStateChanged(Action cb)
        {
            networkEventCB += cb;
        }
        public void onReceive(Action<byte[]> messageProcessor)
        {
            this.messageProcesserCB += messageProcessor;
        }
    }
}

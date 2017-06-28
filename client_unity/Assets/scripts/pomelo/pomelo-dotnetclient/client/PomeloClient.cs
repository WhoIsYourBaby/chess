using LitJson;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using UnityEngine;

namespace Pomelo.DotNetClient
{
    public enum NetWorkState
    {
        [Description("initial state")]
        CLOSED,

        [Description("connecting server")]
        CONNECTING,

        [Description("server connected")]
        CONNECTED,

        [Description("disconnected with server")]
        DISCONNECTED,

        [Description("connect timeout")]
        TIMEOUT,

        [Description("network error")]
        ERROR
    }
    public class PomeloClient
    {
        private ITransporter transport;
        private Protocol protocol;

        EventManager eventManager;

        private List<Message> msgQueue = new List<Message>();
       
        private ClientProtocolType client_type;

        private event Action connectCB;
        private event Action disconnectCB;
        private event Action<JsonData> handShakeCallBack;

        private object guard = new object();
        private JsonData handShakeCallBackData;

        private bool handShakeCallBackCanCall;
        private bool bDisconnCallBack;
        private bool bConnectCallBack;

        public PomeloClient(ClientProtocolType type = ClientProtocolType.NORMAL,
            byte[] clientcert = null, string clientpwd = "", string cathumbprint = null)
        {
            this.client_type = type;

            switch (this.client_type)
            {
                case ClientProtocolType.TLS:
                    {
                        transport = new TransporterSSL(clientcert, clientpwd, cathumbprint);
                    }
                    break;
                case ClientProtocolType.NORMAL:
                    {
                        transport = new TransporterTCP();
                    }
                    break;
                default:
                    break;
            }

            this.protocol = new Protocol(transport, processMessage, OnProtocolClose);
            this.transport.setOnStateChanged(OnTransportStateChange);

            eventManager = new EventManager();
        }

        void OnTransportStateChange()
        {
            NetWorkState state = this.transport.NetworkState();
            switch (state)
            {
                case NetWorkState.CLOSED:
                    bDisconnCallBack = true;
                    break;
                case NetWorkState.CONNECTING:
                    break;
                case NetWorkState.CONNECTED:
                    bConnectCallBack = true;
                    break;
                case NetWorkState.DISCONNECTED:
                    bDisconnCallBack = true;
                    break;
                case NetWorkState.TIMEOUT:
                    bDisconnCallBack = true;
                    break;
                case NetWorkState.ERROR:
                    bDisconnCallBack = true;
                    break;
                default:
                    break;
            }
        }

        void OnProtocolClose()
        {
            if(this.IsConnected)
            {
                this.transport.close();
            }            
        }

        void processMessage(Message msg)
        {
            lock (guard)
            {
                msgQueue.Add(msg);
            }
        }

        public void poll()
        {
            lock (guard)
            {
                foreach (var msg in msgQueue)
                {
                    if (msg.type == MessageType.MSG_RESPONSE)
                    {   
                        eventManager.InvokeCallBack(msg.id, msg.data);
                    }
                    else if (msg.type == MessageType.MSG_PUSH)
                    {
                        eventManager.InvokeOnEvent(msg.route, msg.data);
                    }
                }
                msgQueue.Clear();

                if (this.bConnectCallBack == true)
                {
                    if (connectCB != null) connectCB();
                    this.bConnectCallBack = false;

                }

                if (this.handShakeCallBackCanCall == true)
                {
                    this.handShakeCallBack(this.handShakeCallBackData);
                    this.handShakeCallBackCanCall = false;
                }

                if (this.bDisconnCallBack == true)
                {
                    if (disconnectCB != null) disconnectCB();
                    this.bDisconnCallBack = false;
                }
            }
        }

        public void close()
        {
            //cycle call
            this.protocol.close();
            this.transport.close();           
        }

        public bool IsConnected
        {
            get { return this.transport.NetworkState() == NetWorkState.CONNECTED; }
        }

        public string HandShakeCache
        {
            get { return this.protocol.HandShakeCache; }
        }

        public bool Connect(
            string host, int port, string handshake = "",
            Action callback = null, Action disconnCallBack = null, int nTimeoutMS = 5000
            )
        {
            this.protocol.HandShakeCache = handshake;
            this.connectCB = callback;
            this.disconnectCB = disconnCallBack;

            IPAddress ipAddress = new IPAddress(0);
            if (!IPAddress.TryParse(host, out ipAddress))
            {
                ipAddress = null;
            }

            if (ipAddress == null)
            {
                try
                {
                    IPAddress[] addresses = Dns.GetHostEntry(host).AddressList;
                    foreach (var item in addresses)
                    {
                        if (item.AddressFamily == AddressFamily.InterNetwork)
                        {
                            ipAddress = item;
                            break;
                        }
                    }
                }
                catch (Exception e)
                {
                    Debug.Log(e);
                    return false;
                }
            }

            if (ipAddress == null)
            {
                throw new Exception("can not parse host : " + host);
            }

            IPEndPoint ie = new IPEndPoint(ipAddress, port);

            this.transport.Connect(ie, nTimeoutMS);

            return true;

        }

        public bool HandShake(JsonData user, Action<JsonData> handshakeCallback)
        {
            try
            {
                this.handShakeCallBack = handshakeCallback;
                protocol.start(user, delegate (JsonData data)
                {
                    lock (guard)
                    {
                        this.handShakeCallBackData = new JsonData();
                        this.handShakeCallBackData = data;
                        this.handShakeCallBackCanCall = true;
                    }
                });
                return true;
            }
            catch (Exception e)
            {
                Debug.Log(e);
                return false;
            }
        }

        private JsonData emptyMsg = new JsonData();
        private uint reqId = 1;

        public void request(string route, Action<JsonData> action)
        {
            this.request(route, emptyMsg, action);
        }

        public void request(string route, JsonData msg, Action<JsonData> action)
        {
            this.eventManager.AddCallBack(reqId, action);
            protocol.send(route, reqId, msg);

            reqId++;
        }

        public void notify(string route, JsonData msg)
        {
            protocol.send(route, msg);
        }

        public void on(string eventName, Action<JsonData> action)
        {
            eventManager.AddOnEvent(eventName, action);
        }
    }
}
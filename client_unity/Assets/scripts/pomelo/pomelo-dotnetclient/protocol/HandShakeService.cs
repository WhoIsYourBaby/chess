using System;
using System.Text;
using LitJson;
using System.Net;
using System.Net.Sockets;

namespace Pomelo.DotNetClient
{
    public class HandShakeService
    {
        private Protocol protocol;
		private Action<JsonData> callback;

        public const string Version = "0.3.0";
        public const string Type = "unity-socket";
        //private ProtocolNew protocolNew;

        //public HandShakeService(Protocol protocol)
        //{
        //    this.protocol = protocol;
        //}

        public HandShakeService(Protocol protocolNew)
        {
            this.protocol = protocolNew;
        }

        public void request(JsonData user, Action<JsonData> callback){
			byte[] body = Encoding.UTF8.GetBytes(JsonMapper.ToJson(buildMsg(user)));

            protocol.send(PackageType.PKG_HANDSHAKE, body);

            this.callback = callback;
        }

		internal void invokeCallback(JsonData data){
            //Invoke the handshake callback
            if (callback != null) callback.Invoke(data);
        }

		public void ack(){
            protocol.send(PackageType.PKG_HANDSHAKE_ACK, new byte[0]);
        }

		private JsonData buildMsg(JsonData user) {
            if (user == null) user = new JsonData();

			JsonData msg = new JsonData();

            //Build sys option
			JsonData sys = new JsonData();
            sys["version"] = Version;
            sys["type"] = Type;
            sys["dictVersion"] = protocol.getDictVersion();
            sys["protoVersion"] = protocol.getProtoVersion();
            //sys["handshakeVersion"] = protocol.HandShakeVersion;

            //Build handshake message
            msg["sys"] = sys;
            msg["user"] = user;

            return msg;
        }
    }
}


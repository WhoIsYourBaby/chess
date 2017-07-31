using System;
using System.Text;
using System.Collections.Generic;
using LitJson;
using Pomelo.Protobuf;
using UnityEngine;

namespace Pomelo.DotNetClient
{
    public class MessageProtocol
    {
        public Dictionary<string, ushort> dict = new Dictionary<string, ushort>();
        public Dictionary<ushort, string> abbrs = new Dictionary<ushort, string>();
        public JsonData encodeProtos = new JsonData();
        public JsonData decodeProtos = new JsonData();
        private Dictionary<uint, string> reqMap;
        private Protobuf.Protobuf protobuf;
        public string protoVersion = "";
        public string dictVersion = "";

        public const int MSG_Route_Limit = 255;
        public const int MSG_Route_Mask = 0x01;
        public const int MSG_Type_Mask = 0x07;

		public MessageProtocol(JsonData dict, JsonData serverProtos, JsonData clientProtos, string dictVersion, string protoVersion)
        {
            ICollection<string> keys = dict.Keys;

			foreach(string key in keys){
                ushort value = Convert.ToUInt16(dict[key].ToString());
                this.dict[key] = value;
                this.abbrs[value] = key;
            }

            protobuf = new Protobuf.Protobuf(clientProtos, serverProtos);
            this.encodeProtos = clientProtos;
            this.decodeProtos = serverProtos;

            this.protoVersion = protoVersion;
            this.dictVersion = dictVersion;

            this.reqMap = new Dictionary<uint, string>();
        }

		public byte[] encode(string route, JsonData msg){
            return encode(route, 0, msg);
        }

		public byte[] encode(string route, uint id, JsonData msg){
            int routeLength = byteLength(route);
			if (routeLength > MSG_Route_Limit) {
                throw new Exception("Route is too long!");
            }

            //Encode head
            //The maximus length of head is 1 byte flag + 4 bytes message id + route string length + 1byte
            byte[] head = new byte[routeLength + 6];
            int offset = 1;
            byte flag = 0;

			if (id > 0) {
                byte[] bytes = Protobuf.Encoder.encodeUInt32(id);

                writeBytes(bytes, offset, head);
                flag |= ((byte)MessageType.MSG_REQUEST) << 1;
                offset += bytes.Length;
			} else {
                flag |= ((byte)MessageType.MSG_NOTIFY) << 1;
            }

            //Compress head
			if (dict.ContainsKey(route)) { 		
                ushort cmpRoute = dict[route];
                writeShort(offset, cmpRoute, head);
                flag |= MSG_Route_Mask;
                offset += 2;
			} else {
                //Write route length
                head[offset++] = (byte)routeLength;

                //Write route
                writeBytes(Encoding.UTF8.GetBytes(route), offset, head);
                offset += routeLength;
            }

            head[0] = flag;

            //Encode body
            byte[] body;
			if (encodeProtos.ContainsKey (route)) {
                body = protobuf.encode(route, msg);
			} else {
                body = Encoding.UTF8.GetBytes(JsonMapper.ToJson(msg));
            }

            //Construct the result
            byte[] result = new byte[offset + body.Length];
			for (int i = 0; i < offset; i++) {
                result[i] = head[i];
            }

			for (int i = 0; i < body.Length; i++) {
                result[offset + i] = body[i];
            }

            //Add id to route map
            if (id > 0) reqMap.Add(id, route);

            return result;
        }

		public Message decode(byte[] buffer){
            //Decode head
            //Get flag
            byte flag = buffer[0];
            //Set offset to 1, for the 1st byte will always be the flag
            int offset = 1;

            //Get type from flag;
            MessageType type = (MessageType)((flag >> 1) & MSG_Type_Mask);
            uint id = 0;
            string route;

			if (type == MessageType.MSG_RESPONSE) {
                int length;
                id = (uint)Protobuf.Decoder.decodeUInt32(offset, buffer, out length);
				if(id <= 0 || !reqMap.ContainsKey(id)){
                    return null;
				}else{
                    route = reqMap[id];
                    reqMap.Remove(id);
                }

                offset += length;
            } else if (type == MessageType.MSG_PUSH) {
                //Get route
				if((flag & 0x01) == 1){
                    ushort routeId = readShort(offset, buffer);
                    if(!abbrs.ContainsKey(routeId))
                    {
                        offset += 2;
                        Debug.LogError("error route id " + routeId);
                        return null;
                        //throw new System.Exception("error router id " + routeId);
                    }
                    route = abbrs[routeId];

                    offset += 2;
				}else{
                    byte length = buffer[offset];
                    offset += 1;

                    route = Encoding.UTF8.GetString(buffer, offset, length);
                    offset += length;
                }
			} else {
                return null;
            }

            //Decode body
            byte[] body = new byte[buffer.Length - offset];
			for (int i = 0; i < body.Length; i++) {
                body[i] = buffer[i + offset];
            }

			JsonData msg;
			if (decodeProtos.ContainsKey(route)) {
                msg = protobuf.decode(route, body);
			} else {
                msg = LitJson.JsonMapper.ToObject(Encoding.UTF8.GetString(body));
                //msg = (JsonData)SimpleJson.SimpleJson.DeserializeObject(Encoding.UTF8.GetString(body));
            }

            //Construct the message
            return new Message(type, id, route, msg);
        }

		private void writeInt(int offset, uint value, byte[] bytes){
            bytes[offset] = (byte)(value >> 24 & 0xff);
            bytes[offset + 1] = (byte)(value >> 16 & 0xff);
            bytes[offset + 2] = (byte)(value >> 8 & 0xff);
            bytes[offset + 3] = (byte)(value & 0xff);
        }

		private void writeShort(int offset, ushort value, byte[] bytes){
            bytes[offset] = (byte)(value >> 8 & 0xff);
            bytes[offset + 1] = (byte)(value & 0xff);
        }

		private ushort readShort(int offset, byte[] bytes){
            ushort result = 0;

            result += (ushort)(bytes[offset] << 8);
            result += (ushort)(bytes[offset + 1]);

            return result;
        }

		private int byteLength(string msg){
            return Encoding.UTF8.GetBytes(msg).Length;
        }

		private void writeBytes(byte [] source, int offset, byte [] target){
			for(int i = 0; i < source.Length; i++){
                target[offset + i] = source[i];
            }
        }
    }
}


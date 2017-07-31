using System;
using LitJson;

namespace Pomelo.Protobuf
{
    public class Protobuf
    {
        private MsgDecoder decoder;
        private MsgEncoder encoder;

		public Protobuf (JsonData encodeProtos, JsonData decodeProtos)
        {
            this.encoder = new MsgEncoder(encodeProtos);
            this.decoder = new MsgDecoder(decodeProtos);
        }

		public byte[] encode(string route, JsonData msg){
            return encoder.encode(route, msg);
        }

		public JsonData decode(string route, byte[] buffer){
            return decoder.decode(route, buffer);
        }
    }
}


using System;

namespace Pomelo.DotNetClient
{
    public class PackageProtocol
    {
        public const int HEADER_LENGTH = 4;

		public static byte[] encode(PackageType type){
            return new byte[] { Convert.ToByte(type), 0, 0, 0 };
        }

		public static byte[] encode(PackageType type, byte[] body){
            int length = HEADER_LENGTH;

            if (body != null) length += body.Length;

            byte[] buf = new byte[length];

            int index = 0;

            buf[index++] = Convert.ToByte(type);
            buf[index++] = Convert.ToByte(body.Length >> 16 & 0xFF);
            buf[index++] = Convert.ToByte(body.Length >> 8 & 0xFF);
            buf[index++] = Convert.ToByte(body.Length & 0xFF);

			while(index < length) {
                buf[index] = body[index - HEADER_LENGTH];
                index++;
            }

            return buf;
        }

		public static Package decode(byte[] buf){
            PackageType type = (PackageType)buf[0];

            byte[] body = new byte[buf.Length - HEADER_LENGTH];

			for(int i = 0; i < body.Length; i++) {
                body[i] = buf[i + HEADER_LENGTH];
            }

            return new Package(type, body);
        }
    }
}


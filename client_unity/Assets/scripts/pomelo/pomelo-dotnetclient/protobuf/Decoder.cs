using System;

namespace Pomelo.Protobuf
{
    public class Decoder
    {
        /// <summary>
        /// Decodes the UInt32.
        /// </summary>
		public static uint decodeUInt32(int offset, byte[] bytes, out int length){
            uint n = 0;
            length = 0;

			for(int i = offset; i < bytes.Length; i++) {
                length++;
                uint m = Convert.ToUInt32(bytes[i]);
                n = n + Convert.ToUInt32((m & 0x7f) * Math.Pow(2, (7 * (i - offset))));
				if(m < 128) {
                    break;
                }
            }

            return n;
        }

		public static uint decodeUInt32(byte[] bytes){
            int length;
            return decodeUInt32(0, bytes, out length);
        }

        /// <summary>
        /// Decodes the SInt32.
        /// </summary>
		public static int decodeSInt32(byte[] bytes){
            uint n = decodeUInt32(bytes);
            int flag = ((n % 2) == 1) ? -1 : 1;

            int result = Convert.ToInt32(((n % 2 + n) / 2) * flag);
            return result;
        }
    }
}


using System.Collections;
using System.Collections.Generic;
using System;
using Pomelo.DotNetClient;
using LitJson;

namespace pp {
	namespace connector {
		class entryHandler {
			public static void enterRoom(string token, string rtype, string rid, Action<JsonData> callback) {
				JsonData data = new JsonData ();
				data ["token"] = token;
				data ["rtype"] = rtype;
				if (rid!= null) {
					data ["rid"] = rid;
				}
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.request ("connector.entryHandler.enterRoom", data, callback);
			}

			public static void exit(Action callback) {
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.request ("connector.entryHandler.exit", callback);
			}
		}
	}
}
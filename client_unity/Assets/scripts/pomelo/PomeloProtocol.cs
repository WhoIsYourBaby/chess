using System.Collections;
using System.Collections.Generic;
using System;
using Pomelo.DotNetClient;
using LitJson;
using UnityEngine;

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

			public static void exit(Action<JsonData> callback) {
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.request ("connector.entryHandler.exit", callback);
			}
		}
	}

	namespace brnn {
		class brnnHandler {
			public static void chipIn(int userid, int gold, int pkindex, Action<JsonData> callback) {
				JsonData data = new JsonData ();
				data ["userid"] = userid;
				data ["gold"] = gold;
				data ["pkindex"] = pkindex;
				Debug.Log (data.ToJson());
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.request ("brnn.brnnHandler.chipIn", data, callback);
			}
		}
	}

	namespace observer {
		class brnn {
			//有用户离开房间
			public static void onLeave (Action<JsonData> callback) {
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.on ("brnn.onLeave", callback);
			}

			//有用户加入房间
			public static void onAdd (Action<JsonData> callback) {
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.on ("brnn.onAdd", callback);
			}

			//即将发牌的下注时期
			public static void onWillStart (Action<JsonData> callback) {
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.on ("brnn.onWillStart", callback);
			}

			//发牌
			public static void onDealPoker (Action<JsonData> callback) {
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.on ("brnn.onDealPoker", callback);
			}

			//计算输赢结果
			public static void onGoldResult (Action<JsonData> callback) {
				PomeloClient pml = PomeloSingleton.CreateInstance ().getPomeloClient ();
				pml.on ("brnn.onGoldResult", callback);
			}
		}
	}
}
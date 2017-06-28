using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Pomelo.DotNetClient;
using LitJson;

public class PomeloSingleton {

	PomeloClient pmlClient;

	private volatile static PomeloSingleton _instance = null;
	private static readonly object lockHelper = new object();

	public static PomeloSingleton CreateInstance()
	{
		if(_instance == null)
		{
			lock(lockHelper)
			{
				if(_instance == null)
					_instance = new PomeloSingleton();
			}
		}
		return _instance;
	}

	private PomeloSingleton(){
		pmlClient = new PomeloClient (ClientProtocolType.NORMAL, null, "", null);
	}

	public void connectGate() {
		pmlClient.Connect ("127.0.0.1", 3101, "", 
			delegate {
				//必须要handshake之后才能正常通信
				pmlClient.HandShake(null, delegate(JsonData obj) {
					onConnectToGate();
				});
			}, 
			delegate () {
				Debug.Log("disconnect gate");
		});
	}


	public void updatePerFrame () {
		if (pmlClient != null) {
			pmlClient.poll ();
		}
	}

	public void onConnectToGate() {
		JsonData data = new JsonData();
		data["userid"] = "abc";
		pmlClient.request ("gate.gateHandler.guestLogin", data, onGuestLogin);
	}


	public void onGuestLogin(JsonData obj) {
		Debug.Log(obj.ToJson());
	}
}

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Pomelo.DotNetClient;
using LitJson;
using System;

public class PomeloSingleton {

	PomeloClient pmlClient;

	MUserInfo userinfoModel;

	string connectorHost;
	int connectorPort;

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
		resetPomeloClient ();
	}

	private void resetPomeloClient () {
		pmlClient = new PomeloClient (ClientProtocolType.NORMAL, null, "", null);
	}

	public string getToken() {
		return PlayerPrefs.GetString ("token");
	}

	//连接到gate之后会主动断开连接，届时会调用callback
	public void guestLogin(Action callback) {
		pmlClient.Connect ("127.0.0.1", 3101, "", 
			delegate {
				//必须要handshake之后才能正常通信
				pmlClient.HandShake(null, delegate(JsonData obj) {
					requestGuestLogin();
				});
			}, 
			callback);
	}


	public void updatePerFrame () {
		if (pmlClient != null) {
			pmlClient.poll ();
		}
	}

	//游客登录、刷新token成功后回调方法
	public void onLoginSeccuss(JsonData obj) {
		handleLoginResponse (obj);

		pmlClient.close ();
		pmlClient = null;
		resetPomeloClient ();
	}

	//刷新token
	public void refreshToken (Action callback) {
		if (getToken() == null) {
			return;
		}
		pmlClient.Connect ("127.0.0.1", 3101, "", 
			delegate {
				//必须要handshake之后才能正常通信
				pmlClient.HandShake(null, delegate(JsonData obj) {
					requestRefreshToken();
				});
			}, 
			callback);
	}

	private void handleLoginResponse (JsonData obj) {
		int code = (int)obj ["code"];
		if (code < 0) {
			Debug.Log (obj["msg"]);
			return;
		}
		string token = (string)obj ["data"] ["token"];
		PlayerPrefs.SetString ("token", token);

		connectorHost = (string)obj ["data"] ["connector"] ["host"];
		connectorPort = (int)obj ["data"] ["connector"] ["port"];

		string userinfoJson = obj ["data"] ["userinfo"].ToJson();
		userinfoModel = JsonMapper.ToObject<MUserInfo> (userinfoJson);
	}

	public void requestGuestLogin() {
		JsonData data = new JsonData();
		data["userid"] = "abc";
		pmlClient.request ("gate.gateHandler.guestLogin", data, onLoginSeccuss);
	}

	public void requestRefreshToken() {
		JsonData data = new JsonData();
		data["token"] = getToken();
		pmlClient.request ("gate.gateHandler.refreshToken", data, onLoginSeccuss);
	}
}

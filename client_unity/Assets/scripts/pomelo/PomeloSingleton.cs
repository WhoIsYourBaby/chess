using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Pomelo.DotNetClient;
using LitJson;
using System;

public class PomeloSingleton {

	PomeloClient pmlClient;

	public MUserInfo userinfoModel;

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

	public void setToken (string token) {
		PlayerPrefs.SetString ("token", token);
	}

	public PomeloClient getPomeloClient() {
		return pmlClient;
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

	//连接到gate返回的connector
	public void connectToConnector(Action callback){
		pmlClient.Connect (connectorHost, connectorPort, "", 
			delegate {
				//必须要handshake之后才能正常通信
				pmlClient.HandShake(null, delegate(JsonData obj) {
					callback();
				});
			}, 
			delegate {
				pmlClient.close();
				pmlClient = null;
				resetPomeloClient();
			});
	}

	public void updatePerFrame () {
		if (pmlClient != null) {
			pmlClient.poll ();
		}
	}

	//游客登录、刷新token成功后回调方法
	void onLoginSeccuss(JsonData obj) {
		handleLoginResponse (obj);

		pmlClient.close ();
		pmlClient = null;
		resetPomeloClient ();
	}



	void handleLoginResponse (JsonData obj) {
		int code = (int)obj ["code"];
		if (code < 0) {
			Debug.Log (obj["msg"]);
			return;
		}
		string token = (string)obj ["data"] ["token"];
		setToken (token);

		connectorHost = (string)obj ["data"] ["connector"] ["host"];
		connectorPort = (int)obj ["data"] ["connector"] ["port"];

		string userinfoJson = obj ["data"] ["userinfo"].ToJson();
		userinfoModel = JsonMapper.ToObject<MUserInfo> (userinfoJson);
	}

	void requestGuestLogin() {
		JsonData data = new JsonData();
		data["userid"] = "abc";
		pmlClient.request ("gate.gateHandler.guestLogin", data, onLoginSeccuss);
	}

	void requestRefreshToken() {
		JsonData data = new JsonData();
		data["token"] = getToken();
		pmlClient.request ("gate.gateHandler.refreshToken", data, onLoginSeccuss);
	}
}
